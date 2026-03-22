export class RateLimiter {
  private counters: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly maxPerMinute = 10;
  private readonly windowMs = 60000; // 1 minute

  checkLimit(workspaceId: string): boolean {
    const now = Date.now();
    const key = workspaceId;

    let counter = this.counters.get(key);

    if (!counter || now > counter.resetTime) {
      counter = { count: 0, resetTime: now + this.windowMs };
      this.counters.set(key, counter);
    }

    if (counter.count >= this.maxPerMinute) {
      return false;
    }

    counter.count++;
    return true;
  }

  reset(workspaceId: string): void {
    this.counters.delete(workspaceId);
  }
}

export const rateLimiter = new RateLimiter();
