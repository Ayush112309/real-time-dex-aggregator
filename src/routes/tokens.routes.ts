import { Router, Request, Response } from 'express';
import { AggregatorService } from '../services/aggregator.service';
import { FilterParams, PaginationParams } from '../types/token.types';

export function createTokenRoutes(aggregator: AggregatorService): Router {
  const router = Router();

  router.get('/tokens', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 30;
      const cursor = req.query.cursor as string;
      const filters: FilterParams = {
        timePeriod: (req.query.timePeriod as any) || '24h',
        sortBy: (req.query.sortBy as any) || 'volume',
        sortOrder: (req.query.sortOrder as any) || 'desc',
        minVolume: req.query.minVolume 
          ? parseFloat(req.query.minVolume as string) 
          : undefined,
        minMarketCap: req.query.minMarketCap
          ? parseFloat(req.query.minMarketCap as string)
          : undefined
      };

      const tokens = await aggregator.aggregateTokens(true);
      const filtered = aggregator.filterAndSort(tokens, filters);

      const startIndex = cursor ? parseInt(cursor) : 0;
      const endIndex = startIndex + limit;
      const paginatedTokens = filtered.slice(startIndex, endIndex);
      const nextCursor = endIndex < filtered.length ? endIndex.toString() : undefined;

      res.json({
        data: paginatedTokens,
        pagination: {
          total: filtered.length,
          limit,
          nextCursor
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/tokens/:address', async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const tokens = await aggregator.aggregateTokens(true);
      const token = tokens.find(t => t.token_address === address);

      if (!token) {
        return res.status(404).json({ error: 'Token not found' });
      }

      res.json({ data: token });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/cache/clear', async (req: Request, res: Response) => {
    try {
      await aggregator.clearCache();
      res.json({ message: 'Cache cleared successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'healthy', timestamp: Date.now() });
  });

  return router;
}
