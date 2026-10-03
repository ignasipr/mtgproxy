/**
 * Rate limiter for API calls
 * Respects Scryfall's rate limit: ~10-20 requests per second
 * Implements exponential backoff for 429 (Too Many Requests) errors
 */

class ApiRateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private minDelay = 150; // ms between requests (starting at ~6-7 req/sec)
  private maxDelay = 5000; // max delay before giving up
  private backoffMultiplier = 1.5;
  private consecutiveErrors = 0;

  async throttle<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    return new Promise((resolve, reject) => {
      const attempt = async () => {
        try {
          const result = await fn();
          // Reset error count on success
          this.consecutiveErrors = 0;
          resolve(result);
        } catch (error) {
          if (error instanceof Error && error.message.includes('429')) {
            this.consecutiveErrors++;
            // Increase delay exponentially on 429 errors
            const newDelay = Math.min(
              this.minDelay * Math.pow(this.backoffMultiplier, this.consecutiveErrors),
              this.maxDelay
            );
            this.minDelay = newDelay;
            console.warn(
              `[RateLimiter] 429 error (attempt ${this.consecutiveErrors}), increasing delay to ${Math.round(this.minDelay)}ms`
            );

            if (this.consecutiveErrors < retries) {
              // Retry after increased delay
              await new Promise(r => setTimeout(r, this.minDelay));
              attempt();
            } else {
              reject(error);
            }
          } else {
            reject(error);
          }
        }
      };

      this.queue.push(attempt);
      this.process();
    });
  }

  private async process() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const fn = this.queue.shift();
      if (fn) {
        await fn();
        await new Promise(resolve => setTimeout(resolve, this.minDelay));
      }
    }

    this.isProcessing = false;
  }

  setMinDelay(ms: number) {
    this.minDelay = Math.max(50, ms);
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  resetBackoff() {
    this.consecutiveErrors = 0;
    this.minDelay = 150;
  }
}

export const apiRateLimiter = new ApiRateLimiter();

