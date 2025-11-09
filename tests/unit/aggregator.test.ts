import { AggregatorService } from '../../src/services/aggregator.service';
import { TokenData } from '../../src/types/token.types';

describe('AggregatorService', () => {
  let service: AggregatorService;

  beforeEach(() => {
    service = new AggregatorService(30);
  });

  test('should merge duplicate tokens correctly', () => {
    const tokens: TokenData[] = [
      {
        token_address: 'ABC123',
        token_name: 'Test Token',
        token_ticker: 'TEST',
        price_sol: 0.001,
        market_cap_sol: 1000,
        volume_sol: 500,
        liquidity_sol: 200,
        transaction_count: 100,
        price_1hr_change: 5.5,
        protocol: 'Raydium',
        source: 'dexscreener',
        last_updated: Date.now()
      },
      {
        token_address: 'ABC123',
        token_name: 'Test Token',
        token_ticker: 'TEST',
        price_sol: 0.0011,
        market_cap_sol: 1100,
        volume_sol: 600,
        liquidity_sol: 250,
        transaction_count: 120,
        price_1hr_change: 6.0,
        protocol: 'Orca',
        source: 'geckoterminal',
        last_updated: Date.now()
      }
    ];

    const merged = service['mergeTokens'](tokens);
    
    expect(merged).toHaveLength(1);
    expect(merged[0].sources).toContain('dexscreener');
    expect(merged[0].sources).toContain('geckoterminal');
    expect(merged[0].volume_sol).toBe(600);
  });

  test('should filter tokens by minimum volume', () => {
    const tokens = [
      { volume_sol: 100 },
      { volume_sol: 500 },
      { volume_sol: 1000 }
    ] as any[];

    const filtered = service.filterAndSort(tokens, { minVolume: 400 });
    
    expect(filtered).toHaveLength(2);
    expect(filtered[0].volume_sol).toBeGreaterThanOrEqual(400);
  });

  test('should sort tokens by volume descending', () => {
    const tokens = [
      { volume_sol: 100 },
      { volume_sol: 1000 },
      { volume_sol: 500 }
    ] as any[];

    const sorted = service.filterAndSort(tokens, {
      sortBy: 'volume',
      sortOrder: 'desc'
    });

    expect(sorted[0].volume_sol).toBe(1000);
    expect(sorted[2].volume_sol).toBe(100);
  });
});
