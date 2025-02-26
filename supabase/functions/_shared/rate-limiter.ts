
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private tokensPerInterval: number;
  private interval: number;

  constructor({ tokensPerInterval, interval }: { tokensPerInterval: number, interval: string }) {
    this.tokens = tokensPerInterval;
    this.lastRefill = Date.now();
    this.tokensPerInterval = tokensPerInterval;
    this.interval = interval === 'minute' ? 60000 : 3600000;
  }

  async check(request: Request): Promise<boolean> {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    
    if (timePassed > this.interval) {
      this.tokens = this.tokensPerInterval;
      this.lastRefill = now;
    } else {
      const tokensToAdd = Math.floor(timePassed * (this.tokensPerInterval / this.interval));
      this.tokens = Math.min(this.tokensPerInterval, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }

    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }

    return false;
  }
}
