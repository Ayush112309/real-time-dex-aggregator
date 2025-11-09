import request from 'supertest';
import express from 'express';
import { createTokenRoutes } from '../../src/routes/tokens.routes';
import { AggregatorService } from '../../src/services/aggregator.service';

describe('API Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    const aggregator = new AggregatorService(30);
    app.use('/api', createTokenRoutes(aggregator));
  });

  test('GET /api/tokens should return token list', async () => {
    const response = await request(app)
      .get('/api/tokens')
      .query({ limit: 10 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('pagination');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('GET /api/tokens with filters should work', async () => {
    const response = await request(app)
      .get('/api/tokens')
      .query({
        sortBy: 'volume',
        sortOrder: 'desc',
        limit: 5
      });

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeLessThanOrEqual(5);
  });

  test('GET /api/health should return healthy status', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
  });
});
