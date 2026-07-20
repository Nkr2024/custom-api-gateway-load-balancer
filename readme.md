# Custom API Gateway and Load Balancer

A backend infrastructure project built using Node.js and Express.js that acts as a single entry point for client requests and distributes traffic across multiple backend servers.

The project demonstrates core concepts such as load balancing, health checks, caching, rate limiting, request forwarding, logging, and metrics.

## How It Works

```text
Client
   |
   v
API Gateway
   |
   v
Load Balancer
   |
   +--------+--------+
   |        |        |
   v        v        v
Server 1  Server 2  Server 3
```

The client sends requests to the API Gateway. The gateway checks the rate limit and cache, selects a healthy backend server, forwards the request, and returns the server response to the client.

## Features

* Custom API Gateway for routing client requests
* Round-robin load balancing
* Least-connections load balancing
* Active request tracking for backend servers
* Periodic health checks
* Automatic avoidance of unhealthy servers
* In-memory caching with TTL
* Custom in-memory rate limiter
* Request timeout and error handling
* Request logging
* Metrics tracking for requests, latency, cache activity, and server usage

## Load Balancing

The project supports two load-balancing strategies:

### Round-Robin

Requests are distributed sequentially across healthy backend servers.

```text
Request 1 -> Server 1
Request 2 -> Server 2
Request 3 -> Server 3
```

### Least Connections

The request is forwarded to the healthy backend server with the lowest number of active requests.

This helps distribute traffic more effectively when requests take different amounts of time to complete.

## Health Checks

The gateway periodically calls the `/health` endpoint of each backend server.

If a server does not respond successfully, it is marked as unhealthy and temporarily removed from request selection. Once it becomes available again, it can receive requests normally.

## Caching

GET responses can be stored in an in-memory cache for a configured period.

Repeated requests can be served directly from the cache, reducing unnecessary backend processing. After the TTL expires, fresh data is requested from a backend server.

## Rate Limiting

The custom rate limiter tracks requests using the client IP address.

If a client exceeds the configured request limit within a time window, the gateway returns:

```text
429 Too Many Requests
```

## Project Structure

```text
Project_API_Gateway/
├── backend/
│   ├── createServer.js
│   ├── server1.js
│   ├── server2.js
│   └── server3.js
├── gateway/
│   ├── cache.js
│   ├── config.js
│   ├── healthCheck.js
│   ├── loadBalancer.js
│   ├── logger.js
│   ├── metrics.js
│   ├── rateLimiter.js
│   └── server.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Installation

Clone the repository:

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd Project_API_Gateway
```

Install dependencies:

```bash
npm install
```

Create the environment file:

```powershell
Copy-Item .env.example .env
```

## Running the Project

Start the backend servers in separate terminals:

```bash
node backend/server1.js
node backend/server2.js
node backend/server3.js
```

Start the API Gateway:

```bash
node gateway/server.js
```

## Technologies Used

* Node.js
* Express.js
* JavaScript
* REST APIs
* Git and GitHub

## Current Limitations

* Cache and rate-limit data are stored in memory
* Data resets when the gateway restarts
* Metrics screenshots and detailed validation will be added later

## Future Improvements

* Redis-based caching and rate limiting
* Circuit breaker and retry mechanism
* Docker support
* Automated testing
* Interactive metrics dashboard

## Author

Nilesh Kumar
