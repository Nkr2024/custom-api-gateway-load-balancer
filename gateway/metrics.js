export class Metrics {
  constructor() {
    this.totalRequests = 0;
    this.successfulRequests = 0;
    this.failedRequests = 0;

    this.totalResponseTime = 0;
    this.lastResponseTime = 0;
  }

  recordRequest() {
    this.totalRequests++;
  }

  recordSuccess(responseTime) {
    this.successfulRequests++;
    this.recordResponseTime(responseTime);
  }

  recordFailure(responseTime) {
    this.failedRequests++;
    this.recordResponseTime(responseTime);
  }

  recordResponseTime(responseTime) {
    this.totalResponseTime += responseTime;
    this.lastResponseTime = responseTime;
  }

  getAverageResponseTime() {
    if (this.successfulRequests + this.failedRequests === 0) {
      return 0;
    }

    return (
      this.totalResponseTime /
      (this.successfulRequests + this.failedRequests)
    );
  }

  getStats() {
    return {
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      averageResponseTimeMs: Number(
        this.getAverageResponseTime().toFixed(2)
      ),
      lastResponseTimeMs: this.lastResponseTime
    };
  }
}