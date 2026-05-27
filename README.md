# Fibonacci Project

This project presents a simple React UI for calculating Fibonacci numbers, as well as...

* Redis for caching previously calculated values
* Postgres for storing previously encountered indices
* A dedicated Express backend service
* An asynchronous Node.js worker process for calculating numbers

> [!NOTE]
> This is an incredibly contrived and over-complicated implementation of this use case. I have created this project primarily as a teaching tool for Docker and containerization.

## Get Started

Run the following command:
```
docker-compose up
```

## Architecture

- Docker Compose listens for traffic on port 3050, routes to `NGINX` port 80
- `NGINX` service routes traffic and serves content
  - Listens on port 80
  - Routes / traffic to `Client`
  - Routes /api traffic to `API`
- `Client` is a React application that serves the UI
  - Listens on port 3000
  - Makes API requests to the `API`
  - Receives Server-Side Events from the `API` to update the page
- `API` is a NodeJS Express application that processes API requests
  - Listens on port 5000
  - stores new indices in `Redis`
  - publishes "insert" events to `Redis`
  - subscribes to "result" events from `Redis`, and publishes result to the frontend
  - stores seen indices in `Postgres`
- `Redis` key-value store used for caching and pub/sub
- `Postgres` database used for simple storage
- `Worker` is a simple NodeJS application that calculates fibonacci numbers
  - subscribes to "insert" events from `Redis`
  - retrieves inserted indices, caluclates fib numbers, and adds to `Redis`
  - publishes a "result" event to `Redis`
