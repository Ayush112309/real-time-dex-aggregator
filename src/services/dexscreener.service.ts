import axios, { AxiosInstance } from 'axios';
import { TokenData } from '../types/token.types';
import { ExponentialBackoff } from '../utils/exponentialBackoff';
import { RateLimiter } from '../utils/rateLimiter';

export class DexScreenerService {
  private api: AxiosInstance;
  private backoff: ExponentialBackoff;
  private rateLimiter: RateLimiter;

  constructor() {
    this.api = axios.create({
      baseURL: 'https://api.dexscreener.com/latest/dex',
      timeout: 10000
    });
    this.backoff = new ExponentialBackoff();
    this.rateLimiter = new RateLimiter(250, 60000);
  }

  async searchTokens(query: string = 'SOL'): Promise<TokenData[]> {
    await this.rateLimiter.acquire();

    return this.backoff.execute(async () => {
      const response = await this.api.get(`/search?q=${query}`);
      return this.transformData(response.data.pairs || []);
    });
  }

  async getTokenByAddress(address: string): Promise<TokenData | null> {
    await this.rateLimiter.acquire();

    return this.backoff.execute(async () => {
      const response = await this.api.get(`/tokens/${address}`);
      const pairs = response.data.pairs || [];
      return pairs.length > 0 ? this.transformData([pairs[0]])[0] : null;
    });
  }

  private transformData(pairs: any[]): TokenData[] {
    return pairs
      .filter(pair => pair.chainId === 'solana')
      .map(pair => ({
        token_address: pair.baseToken.address,
        token_name: pair.baseToken.name,
        token_ticker: pair.baseToken.symbol,
        price_sol: parseFloat(pair.priceNative) || 0,
        market_cap_sol: parseFloat(pair.fdv) / (parseFloat(pair.priceUsd) || 1) || 0,
        volume_sol: parseFloat(pair.volume?.h24) / (parseFloat(pair.priceUsd) || 1) || 0,
        liquidity_sol: parseFloat(pair.liquidity?.usd) / 150 || 0,
        transaction_count: (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0),
        price_1hr_change: parseFloat(pair.priceChange?.h1) || 0,
        price_24hr_change: parseFloat(pair.priceChange?.h24) || 0,
        price_7d_change: parseFloat(pair.priceChange?.h7) || 0,
        protocol: pair.dexId || 'Unknown',
        source: 'dexscreener',
        last_updated: Date.now()
      }));
  }
}
