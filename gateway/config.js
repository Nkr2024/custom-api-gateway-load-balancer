import "dotenv/config";

export const config = {
  gatewayPort: Number(process.env.GATEWAY_PORT) || 8000,

  loadBalancerAlgorithm:
    process.env.LOAD_BALANCER_ALGORITHM || "round-robin",

  cache: {
    capacity: Number(process.env.CACHE_CAPACITY) || 10,
    ttlMs: Number(process.env.CACHE_TTL_MS) || 30000
  },

  healthCheck: {
    intervalMs:
      Number(process.env.HEALTH_CHECK_INTERVAL_MS) || 5000,

    timeoutMs:
      Number(process.env.HEALTH_CHECK_TIMEOUT_MS) || 2000
  },

  rateLimit: {
    windowMs:
      Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,

    maxRequests:
      Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  backendServers: [
    {
      name: "Server 1",
      url: process.env.SERVER_1_URL || "http://localhost:5001",
      healthy: true,
      activeRequests: 0,
      totalForwarded: 0,
      failedRequests: 0,
      lastHealthCheck: null
    },
    {
      name: "Server 2",
      url: process.env.SERVER_2_URL || "http://localhost:5002",
      healthy: true,
      activeRequests: 0,
      totalForwarded: 0,
      failedRequests: 0,
      lastHealthCheck: null
    },
    {
      name: "Server 3",
      url: process.env.SERVER_3_URL || "http://localhost:5003",
      healthy: true,
      activeRequests: 0,
      totalForwarded: 0,
      failedRequests: 0,
      lastHealthCheck: null
    }
  ]
};