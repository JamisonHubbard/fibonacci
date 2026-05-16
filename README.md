# Fibonacci Project

This project presents a simple React UI for calculating Fibonacci numbers, as well as...

* Redis for caching previously calculated values
* Postgres for storing previously encountered indices
* A dedicated Express backend service
* An asynchronous Node.js worker process for calculating numbers

> [!NOTE]
> This is an incredibly contrived and over-complicated implementation of this use case. I have created this project primarily as a learning tool for Docker and containerization.

## Architecture

- `NGINX` container receives traffic, and routes it to either the `React App` for frontend requests, or the `Express Server` for backend/API requests
- `React App` provides frontend content to users, and generates backend requests that are sent to the `Express Server`
- `Express Server` receives requests and interacts with `Redis` to make requests for new Fibonacci values as well as retrieve and return calculated values, and also stores encountered indices in `Postgres`
- `Redis` is a simple key-value store that emits **INSERT** events that are detected by the `Worker` service
- `Worker` is a NodeJS service that detects **INSERT** events, pulls unprocessed values from `Redis`, calculates the Fibonacci numbers, then inserts the result into `Redis`
- `Postgres` is a database where the `Express Server` records previously encountered indices
