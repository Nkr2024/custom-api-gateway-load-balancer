export function logRequest(details) {
  const {
    method,
    path,
    statusCode,
    responseTime,
    target,
    cacheStatus,
    clientIp
  } = details;

  console.log(
    `[${new Date().toISOString()}] ` +
    `${method} ${path} ` +
    `| status: ${statusCode} ` +
    `| target: ${target} ` +
    `| cache: ${cacheStatus} ` +
    `| time: ${responseTime}ms ` +
    `| ip: ${clientIp}`
  );
}

export function logGatewayStart(config) {
  console.log(`API Gateway running on port ${config.gatewayPort}`);
  console.log(`Load-balancing algorithm: ${config.loadBalancerAlgorithm}`);
  console.log(`Cache capacity: ${config.cache.capacity}`);
  console.log(`Cache TTL: ${config.cache.ttlMs}ms`);
  console.log(`Health check interval: ${config.healthCheck.intervalMs}ms`);
  console.log(`Rate limit: ${config.rateLimit.maxRequests}/${config.rateLimit.windowMs}ms`);
}