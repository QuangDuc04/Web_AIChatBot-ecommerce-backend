import redis from '../config/redis';

export class CacheUtil {
  static async set(key: string, value: unknown, ttl = 3600): Promise<void> {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  }

  static async get<T = unknown>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    if (!data) return null;
    try { return JSON.parse(data) as T; } catch { return null; }
  }

  static async del(key: string): Promise<void> {
    await redis.del(key);
  }

  static async delPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  }

  static async exists(key: string): Promise<boolean> {
    return (await redis.exists(key)) === 1;
  }

  static async increment(key: string): Promise<number> {
    return redis.incr(key);
  }
}
