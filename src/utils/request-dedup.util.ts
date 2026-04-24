/**
 * Singleflight / Promise coalescing for deduplicating concurrent identical requests.
 *
 * When multiple callers invoke dedup() with the same key simultaneously,
 * only the first call executes fn(). Subsequent calls receive the same Promise.
 * After resolve/reject, the key is removed so the next call executes fresh.
 */
class RequestDedup {
  private pending = new Map<string, Promise<any>>();

  /**
   * Execute fn() only once per unique key at a time.
   * Concurrent calls with the same key share the same Promise.
   *
   * @param key - Dedup key (e.g., normalized question text)
   * @param fn - The async function to execute (only called once per key)
   * @param ttl - Safety TTL in ms to auto-cleanup hung promises (default: 30000)
   * @returns The result of fn()
   */
  async dedup<T>(key: string, fn: () => Promise<T>, ttl = 30_000): Promise<T> {
    // If there's already an in-flight request for this key, return the same promise
    const existing = this.pending.get(key);
    if (existing) return existing as Promise<T>;

    // Create the promise and store it
    const promise = fn().finally(() => {
      // Clean up after resolve or reject
      this.pending.delete(key);
    });

    this.pending.set(key, promise);

    // Safety TTL: auto-remove key if promise hangs
    const timer = setTimeout(() => {
      this.pending.delete(key);
    }, ttl);

    // Clear the timer when promise settles (to avoid memory leak from timers)
    promise.finally(() => clearTimeout(timer));

    return promise;
  }

  /** Check if a key is currently in-flight (for logging/monitoring) */
  has(key: string): boolean {
    return this.pending.has(key);
  }

  /** Number of in-flight requests (for monitoring) */
  get size(): number {
    return this.pending.size;
  }
}

/** Singleton instance for chatbot request deduplication */
export const requestDedup = new RequestDedup();
