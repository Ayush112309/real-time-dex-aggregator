import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000'),
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '30'),
  },
  websocket: {
    updateInterval: parseInt(process.env.UPDATE_INTERVAL || '10000'),
  },
  rateLimiting: {
    maxRequestsPerMin: parseInt(process.env.RATE_LIMIT_PER_MIN || '250'),
  },
};
