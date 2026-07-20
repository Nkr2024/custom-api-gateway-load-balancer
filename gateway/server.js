import express from "express";
import { config } from "./config.js";
import { LoadBalancer } from "./loadBalancer.js";
import { LRUCache } from "./cache.js";
import { HealthChecker } from "./healthCheck.js";
import { RateLimiter } from "./rateLimiter.js";
import { logGatewayStart, logRequest } from "./logger.js";
import { Metrics } from "./metrics.js";

const app = express();



app.use(express.json());

const metrics = new Metrics();

const loadBalancer = new LoadBalancer(
  config.backendServers,
  config.loadBalancerAlgorithm
);

const cache = new LRUCache(
  config.cache.capacity,
  config.cache.ttlMs
);

const healthChecker = new HealthChecker(
  config.backendServers,
  config.healthCheck
);

const rateLimiter = new RateLimiter(config.rateLimit);

healthChecker.start();

setInterval(() => {
  rateLimiter.cleanupExpiredClients();
}, config.rateLimit.windowMs);

app.get("/cache/stats", (req, res) => {
  res.status(200).json({
    success: true,
    cache: cache.getStats()
  });
});

app.delete("/cache", (req, res) => {
  cache.clear();

  res.status(200).json({
    success: true,
    message: "Cache cleared successfully"
  });
});

app.get("/metrics", (req, res) => {
  const healthyServers = config.backendServers.filter(
    (server) => server.healthy
  );

  const unhealthyServers = config.backendServers.filter(
    (server) => !server.healthy
  );

  res.status(200).json({
    gateway: {
      name: "Custom API Gateway",
      uptimeSeconds: Number(process.uptime().toFixed(2)),
      algorithm: config.loadBalancerAlgorithm
    },

    requests: metrics.getStats(),

    cache: cache.getStats(),

    rateLimiter: rateLimiter.getStats(),

    loadBalancer: {
      algorithm: config.loadBalancerAlgorithm,
      healthyServers: healthyServers.length,
      unhealthyServers: unhealthyServers.length,
      servers: config.backendServers.map((server) => {
        return {
          name: server.name,
          url: server.url,
          healthy: server.healthy,
          activeRequests: server.activeRequests,
          totalForwarded: server.totalForwarded,
          failedRequests: server.failedRequests,
          lastHealthCheck: server.lastHealthCheck
        };
      })
    }
  });
});

app.use(async (req, res) => {
  metrics.recordRequest();
  const requestStartedAt = Date.now();
  const clientIp = getClientIp(req);

  const rateLimitResult = rateLimiter.isAllowed(clientIp);

  res.setHeader(
    "X-RateLimit-Limit",
    config.rateLimit.maxRequests
  );

  res.setHeader(
    "X-RateLimit-Remaining",
    rateLimitResult.remaining
  );

  if (!rateLimitResult.allowed) {
    const responseTime = Date.now() - requestStartedAt;

    res.setHeader(
      "Retry-After",
      Math.ceil(rateLimitResult.retryAfterMs / 1000)
    );

    logRequest({
      method: req.method,
      path: req.originalUrl,
      statusCode: 429,
      responseTime,
      target: "BLOCKED",
      cacheStatus: "SKIPPED",
      clientIp
    });

    return res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later."
    });
  }

  if (isCacheableRequest(req)) {
    const cacheKey = createCacheKey(req);
    const cachedResponse = cache.get(cacheKey);

    if (cachedResponse !== null) {
      const responseTime = Date.now() - requestStartedAt;

      metrics.recordSuccess(responseTime);

      res.setHeader("X-Cache", "HIT");

      logRequest({
        method: req.method,
        path: req.originalUrl,
        statusCode: cachedResponse.status,
        responseTime,
        target: "CACHE",
        cacheStatus: "HIT",
        clientIp
      });

      return res
        .status(cachedResponse.status)
        .json(cachedResponse.body);
    }
  }

  const targetServer = loadBalancer.getNextServer();

  if (!targetServer) {
    const responseTime = Date.now() - requestStartedAt;

    logRequest({
      method: req.method,
      path: req.originalUrl,
      statusCode: 503,
      responseTime,
      target: "NONE",
      cacheStatus: "MISS",
      clientIp
    });

    return res.status(503).json({
      success: false,
      message: "No healthy backend server is available"
    });
  }

  const targetUrl = `${targetServer.url}${req.originalUrl}`;

  loadBalancer.startRequest(targetServer);

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: createForwardHeaders(req),
      body: shouldHaveBody(req.method)
        ? JSON.stringify(req.body)
        : undefined
    });

    const responseBody = await readResponseBody(response);

    const gatewayResponse = {
      gateway: "Custom API Gateway",
      algorithm: config.loadBalancerAlgorithm,
      forwardedTo: targetServer.name,
      backendResponse: responseBody
    };

    if (
      isCacheableRequest(req) &&
      isSuccessfulResponse(response.status)
    ) {
      const cacheKey = createCacheKey(req);

      cache.set(cacheKey, {
        status: response.status,
        body: gatewayResponse
      });
    }

    if (isWriteRequest(req.method)) {
      invalidateRelatedCache(req);
    }

    const responseTime = Date.now() - requestStartedAt;

    res.setHeader("X-Cache", "MISS");

    logRequest({
      method: req.method,
      path: req.originalUrl,
      statusCode: response.status,
      responseTime,
      target: targetServer.name,
      cacheStatus: "MISS",
      clientIp
    });

    return res
      .status(response.status)
      .json(gatewayResponse);
  } catch (error) {
    targetServer.failedRequests++;

    const responseTime = Date.now() - requestStartedAt;

    logRequest({
      method: req.method,
      path: req.originalUrl,
      statusCode: 502,
      responseTime,
      target: targetServer.name,
      cacheStatus: "MISS",
      clientIp
    });

    return res.status(502).json({
      success: false,
      message: "Backend request failed",
      forwardedTo: targetServer.name,
      error: error.message
    });
  } finally {
    loadBalancer.completeRequest(targetServer);
  }
});

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

function isCacheableRequest(req) {
  return req.method === "GET";
}

function createCacheKey(req) {
  return `${req.method}:${req.originalUrl}`;
}

function isSuccessfulResponse(statusCode) {
  return statusCode >= 200 && statusCode < 300;
}

function isWriteRequest(method) {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method);
}

function invalidateRelatedCache(req) {
  const pathWithoutQuery = req.path;

  cache.deleteByPath(pathWithoutQuery);
}

function shouldHaveBody(method) {
  return !["GET", "HEAD"].includes(method);
}

function createForwardHeaders(req) {
  const headers = {};

  if (req.headers["content-type"]) {
    headers["content-type"] = req.headers["content-type"];
  }

  if (req.headers.authorization) {
    headers.authorization = req.headers.authorization;
  }

  return headers;
}

async function readResponseBody(response) {
  const contentType =
    response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

process.on("SIGINT", () => {
  healthChecker.stop();
  process.exit(0);
});

app.listen(config.gatewayPort, () => {
  logGatewayStart(config);
});