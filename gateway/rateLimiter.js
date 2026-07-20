export class RateLimiter {
  constructor(options) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.clients = new Map();

    this.blockedRequests = 0;
  }

  isAllowed(clientId) {
    const now = Date.now();

    if (!this.clients.has(clientId)) {
      this.clients.set(clientId, {
        count: 1,
        windowStart: now
      });

      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        retryAfterMs: 0
      };
    }

    const client = this.clients.get(clientId);
    const elapsedTime = now - client.windowStart;

    if (elapsedTime > this.windowMs) {
      client.count = 1;
      client.windowStart = now;

      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        retryAfterMs: 0
      };
    }

    if (client.count >= this.maxRequests) {
      this.blockedRequests++;

      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: this.windowMs - elapsedTime
      };
    }

    client.count++;

    return {
      allowed: true,
      remaining: this.maxRequests - client.count,
      retryAfterMs: 0
    };
  }

  cleanupExpiredClients() {
    const now = Date.now();

    for (const [clientId, client] of this.clients.entries()) {
      if (now - client.windowStart > this.windowMs) {
        this.clients.delete(clientId);
      }
    }
  }

  getStats() {
    return {
      activeClients: this.clients.size,
      blockedRequests: this.blockedRequests,
      windowMs: this.windowMs,
      maxRequests: this.maxRequests
    };
  }
}