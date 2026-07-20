export class LoadBalancer {
  constructor(servers, algorithm = "round-robin") {
    this.servers = servers;
    this.algorithm = algorithm;
    this.currentIndex = 0;
  }

  getHealthyServers() {
    return this.servers.filter((server) => server.healthy);
  }

  getNextServer() {
    const healthyServers = this.getHealthyServers();

    if (healthyServers.length === 0) {
      return null;
    }

    if (this.algorithm === "least-connections") {
      return this.getLeastConnectionsServer(healthyServers);
    }

    return this.getRoundRobinServer(healthyServers);
  }

  getRoundRobinServer(healthyServers) {
    if (this.currentIndex >= healthyServers.length) {
      this.currentIndex = 0;
    }

    const selectedServer = healthyServers[this.currentIndex];

    this.currentIndex =
      (this.currentIndex + 1) % healthyServers.length;

    return selectedServer;
  }

getLeastConnectionsServer(healthyServers) {
  let minimumConnections =
    healthyServers[0].activeRequests;

  for (const server of healthyServers) {
    if (server.activeRequests < minimumConnections) {
      minimumConnections = server.activeRequests;
    }
  }

  const leastBusyServers = healthyServers.filter(
    (server) =>
      server.activeRequests === minimumConnections
  );

  if (this.currentIndex >= leastBusyServers.length) {
    this.currentIndex = 0;
  }

  const selectedServer =
    leastBusyServers[this.currentIndex];

  this.currentIndex =
    (this.currentIndex + 1) % leastBusyServers.length;

  return selectedServer;
}

  startRequest(server) {
    server.activeRequests++;
    server.totalForwarded++;
  }

  completeRequest(server) {
    if (server.activeRequests > 0) {
      server.activeRequests--;
    }
  }
}