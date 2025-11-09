Here’s a **shortened, clean, professional version** of your `README.md` — perfect for quick submission or GitHub display.
It keeps all the **essential details** (setup, run, API, and purpose) but is concise and readable.

---

# Real-time DEX Data Aggregation Service

A backend service that aggregates real-time cryptocurrency token data from multiple DEX APIs (DexScreener, GeckoTerminal) with Redis caching and WebSocket support.
Built using Node.js, TypeScript, and Express.

---

## Key Features

* Aggregates live token data from multiple DEX sources
* Real-time WebSocket updates for price and volume
* Redis caching for performance optimization
* Rate limit handling with exponential backoff
* Filtering, sorting, and pagination support
* REST API + WebSocket architecture
* Tested with Jest and Supertest

---

## Tech Stack

Node.js · TypeScript · Express · Socket.io · Redis (ioredis) · Axios · Jest · Winston

---

## Setup (Windows)

### Prerequisites

* Install Node.js ≥ 18
* Install Redis and start it:

  ```
  cd C:\Redis
  redis-server --service-start
  redis-cli ping   # returns PONG
  ```

### Install & Run

```bash
git clone <repo_url>
cd real-time-dex-aggregator
npm install
npm run dev
```

Server runs on **[http://localhost:3000](http://localhost:3000)**

---

## Environment Variables (`.env`)

```
PORT=3000
REDIS_HOST=localhost
REDIS_PORT=6379
CACHE_TTL=30
UPDATE_INTERVAL=10000
RATE_LIMIT_PER_MIN=250
```

---

## Main API Endpoints

| Endpoint               | Method | Description                   |
| ---------------------- | ------ | ----------------------------- |
| `/api/health`          | GET    | Server health check           |
| `/api/tokens`          | GET    | Get aggregated token data     |
| `/api/tokens/:address` | GET    | Get data for a specific token |
| `/api/cache/clear`     | POST   | Clear Redis cache             |

Example:

```
GET /api/tokens?limit=20&sortBy=volume&sortOrder=desc
```

---

## WebSocket Usage

```js
const socket = io("http://localhost:3000");
socket.emit("subscribe");

socket.on("initial_data", console.log);
socket.on("price_updates", console.log);
```

---

## Run Tests

```bash
npm run build
npm test
```

---

## Deployment

Deploy easily to Railway, Render, or Heroku (with Redis add-on).

---

## License

MIT © 2025 — Real-time DEX Aggregation Backend

---
## 🚀 Live Deployment

Production URL: https://real-time-dex-aggregator-production.up.railway.app

API Endpoints:
- Health Check: https://real-time-dex-aggregator-production.up.railway.app/api/health
- Get All Tokens: https://real-time-dex-aggregator-production.up.railway.app/api/tokens
- WebSocket: wss://real-time-dex-aggregator-production.up.railway.app

Try it now! The API is live and aggregating real-time data from multiple DEX sources.

## 🎥 Video Demo

Watch the live demonstration: https://youtu.be/nCisVWjv84k

The video demonstrates:
- Health check and API endpoints in action
- Multiple rapid API requests in Postman (showcasing Redis caching speed)
- Real-time cryptocurrency token data aggregation
- Live deployment on Railway with Redis
- System architecture and key features
