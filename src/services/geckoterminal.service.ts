import axios, { AxiosInstance } from 'axios';
import { TokenData } from '../types/token.types';
import { ExponentialBackoff } from '../utils/exponentialBackoff';
import { RateLimiter } from '../utils/rateLimiter';

export class GeckoTerminalService {
  private api: AxiosInstance;
  private backoff: ExponentialBackoff;
  private rateLimiter: RateLimiter;

  constructor() {
    this.api = axios.create({
      baseURL: 'https://api.geckoterminal.com/api/v2',
      timeout: 10000
    });
    this.backoff = new ExponentialBackoff();
    this.rateLimiter = new RateLimiter(250, 60000);
  }

  async getTrendingTokens(): Promise<TokenData[]> {
    await this.rateLimiter.acquire();

    return this.backoff.execute(async () => {
      const response = await this.api.get('/networks/solana/trending_pools');
      return this.transformData(response.data.data || []);
    });
  }

  async getTokenPools(address: string): Promise<TokenData[]> {
    await this.rateLimiter.acquire();

    return this.backoff.execute(async () => {
      const response = await this.api.get(
        `/networks/solana/tokens/${address}/pools`
      );
      return this.transformData(response.data.data || []);
    });
  }

  private transformData(pools: any[]): TokenData[] {
    return pools.map(pool => {
      const attributes = pool.attributes;
      return {
        token_address: attributes.base_token_address || pool.id,
        token_name: attributes.name,
        token_ticker: attributes.base_token_symbol,
        price_sol: parseFloat(attributes.base_token_price_native_currency) || 0,
        market_cap_sol: parseFloat(attributes.market_cap_usd) / 150 || 0,
        volume_sol: parseFloat(attributes.volume_usd?.h24) / 150 || 0,
        liquidity_sol: parseFloat(attributes.reserve_in_usd) / 150 || 0,
        transaction_count: attributes.transactions?.h24?.buys + attributes.transactions?.h24?.sells || 0,
        price_1hr_change: parseFloat(attributes.price_change_percentage?.h1) || 0,
        price_24hr_change: parseFloat(attributes.price_change_percentage?.h24) || 0,
        price_7d_change: parseFloat(attributes.price_change_percentage?.h7) || 0,
        protocol: attributes.dex_id || 'Unknown',
        source: 'geckoterminal',
        last_updated: Date.now()
      };
    });
  }
}
