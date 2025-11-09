import { TokenData, AggregatedToken, FilterParams } from '../types/token.types';
import { DexScreenerService } from './dexscreener.service';
import { GeckoTerminalService } from './geckoterminal.service';
import { CacheService } from './cache.service';

export class AggregatorService {
  private dexScreener: DexScreenerService;
  private geckoTerminal: GeckoTerminalService;
  private cache: CacheService;

  constructor(cacheTTL: number = 30) {
    this.dexScreener = new DexScreenerService();
    this.geckoTerminal = new GeckoTerminalService();
    this.cache = new CacheService(cacheTTL);
  }

  async aggregateTokens(useCache: boolean = true): Promise<AggregatedToken[]> {
    const cacheKey = 'aggregated_tokens';

    if (useCache) {
      const cached = await this.cache.get<AggregatedToken[]>(cacheKey);
      if (cached) {
        console.log('Returning cached data');
        return cached;
      }
    }

    console.log('Fetching fresh data from APIs');
    const [dexTokens, geckoTokens] = await Promise.allSettled([
      this.dexScreener.searchTokens('SOL'),
      this.geckoTerminal.getTrendingTokens()
    ]);

    const allTokens: TokenData[] = [
      ...(dexTokens.status === 'fulfilled' ? dexTokens.value : []),
      ...(geckoTokens.status === 'fulfilled' ? geckoTokens.value : [])
    ];

    const aggregated = this.mergeTokens(allTokens);
    await this.cache.set(cacheKey, aggregated);

    return aggregated;
  }

  private mergeTokens(tokens: TokenData[]): AggregatedToken[] {
    const tokenMap = new Map<string, AggregatedToken>();

    tokens.forEach(token => {
      const existing = tokenMap.get(token.token_address);

      if (existing) {
        existing.sources.push(token.source);
        existing.volume_sol = Math.max(existing.volume_sol, token.volume_sol);
        existing.liquidity_sol = Math.max(existing.liquidity_sol, token.liquidity_sol);
        existing.transaction_count += token.transaction_count;
        existing.last_updated = Math.max(existing.last_updated, token.last_updated);
      } else {
        tokenMap.set(token.token_address, {
          ...token,
          sources: [token.source]
        });
      }
    });

    return Array.from(tokenMap.values());
  }

  filterAndSort(
    tokens: AggregatedToken[],
    filters: FilterParams
  ): AggregatedToken[] {
    let filtered = [...tokens];

    if (filters.minVolume) {
      filtered = filtered.filter(t => t.volume_sol >= filters.minVolume!);
    }

    if (filters.minMarketCap) {
      filtered = filtered.filter(t => t.market_cap_sol >= filters.minMarketCap!);
    }

    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let aVal: number, bVal: number;

        switch (filters.sortBy) {
          case 'volume':
            aVal = a.volume_sol;
            bVal = b.volume_sol;
            break;
          case 'price_change':
            aVal = filters.timePeriod === '24h' 
              ? (a.price_24hr_change || 0)
              : filters.timePeriod === '7d'
              ? (a.price_7d_change || 0)
              : a.price_1hr_change;
            bVal = filters.timePeriod === '24h'
              ? (b.price_24hr_change || 0)
              : filters.timePeriod === '7d'
              ? (b.price_7d_change || 0)
              : b.price_1hr_change;
            break;
          case 'market_cap':
            aVal = a.market_cap_sol;
            bVal = b.market_cap_sol;
            break;
          case 'liquidity':
            aVal = a.liquidity_sol;
            bVal = b.liquidity_sol;
            break;
          default:
            return 0;
        }

        return filters.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }

    return filtered;
  }

  async clearCache(): Promise<void> {
    await this.cache.clear();
  }
}
