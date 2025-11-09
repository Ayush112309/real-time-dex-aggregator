export class ExponentialBackoff {
  private baseDelay: number;
  private maxDelay: number;
  private maxRetries: number;

  constructor(
    baseDelay: number = 1000,
    maxDelay: number = 10000,
    maxRetries: number = 5
  ) {
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
    this.maxRetries = maxRetries;
  }

  async execute<T>(
    operation: () => Promise<T>,
    attempt: number = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      if (attempt >= this.maxRetries) {
        throw new Error(`Max retries (${this.maxRetries}) exceeded`);
      }

      if (this.isRateLimitError(error)) {
        const delay = Math.min(
          this.baseDelay * Math.pow(2, attempt),
          this.maxDelay
        );
        
        console.log(`Rate limit hit. Retrying in ${delay}ms (attempt ${attempt + 1})`);
        
        await this.sleep(delay);
        return this.execute(operation, attempt + 1);
      }

      throw error;
    }
  }

  private isRateLimitError(error: any): boolean {
    return (
      error.response?.status === 429 ||
      error.message?.toLowerCase().includes('rate limit')
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
