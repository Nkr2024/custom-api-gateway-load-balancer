export class HealthChecker {
  constructor(servers, options) {
    this.servers = servers;
    this.intervalMs = options.intervalMs;
    this.timeoutMs = options.timeoutMs;
    this.timerId = null;
  }

  start() {
    this.checkAllServers();

    this.timerId = setInterval(() => {
      this.checkAllServers();
    }, this.intervalMs);
  }

  stop() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
    }
  }

  async checkAllServers() {
    const checks = this.servers.map((server) => {
      return this.checkServer(server);
    });

    await Promise.all(checks);
  }

  async checkServer(server) {
    const healthUrl = `${server.url}/health`;
    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);

    try {
      const response = await fetch(healthUrl, {
        method: "GET",
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status >= 200 && response.status < 300) {
        if (!server.healthy) {
          console.log(`${server.name} is healthy again`);
        }

        server.healthy = true;
        server.lastHealthCheck = new Date().toISOString();
        return;
      }

      this.markUnhealthy(server, `status ${response.status}`);
    } catch (error) {
      clearTimeout(timeoutId);

      this.markUnhealthy(server, error.message);
    }
  }

  markUnhealthy(server, reason) {
    if (server.healthy) {
      console.log(`${server.name} marked unhealthy: ${reason}`);
    }

    server.healthy = false;
    server.lastHealthCheck = new Date().toISOString();
  }
}