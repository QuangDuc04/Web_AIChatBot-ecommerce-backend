import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import redis from '../config/redis';

/**
 * Redis-backed sliding window limiter. Persists across restarts and
 * works correctly behind multiple backend instances. Used for high-cost
 * endpoints (AI chatbot) where in-memory limits are insufficient.
 */
function redisIpLimiter(opts: { key: string; windowSec: number; max: number; message: string }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || 'unknown';
      const k = `rl:${opts.key}:${ip}`;
      const count = await redis.incr(k);
      if (count === 1) await redis.expire(k, opts.windowSec);
      if (count > opts.max) {
        res.status(429).json({ success: false, message: opts.message });
        return;
      }
      next();
    } catch {
      // If Redis is down, fail open — don't block legitimate traffic.
      next();
    }
  };
}

/** Per-minute burst cap for chatbot messages, keyed by IP (can't be spoofed by rotating session). */
export const chatbotBurstLimiter = redisIpLimiter({
  key: 'chatbot:burst',
  windowSec: 60,
  max: 15,
  message: 'Bạn gửi quá nhanh. Vui lòng chờ chút rồi thử lại nhé.',
});

/** Daily cap to prevent sustained quota burn from a single IP. */
export const chatbotDailyLimiter = redisIpLimiter({
  key: 'chatbot:daily',
  windowSec: 24 * 60 * 60,
  max: 200,
  message: 'Bạn đã đạt giới hạn tư vấn trong ngày. Vui lòng liên hệ hotline 0347.366.345 để được hỗ trợ trực tiếp.',
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5,
  message: {
    success: false,
    message: 'Quá nhiều lần đăng nhập, vui lòng thử lại sau 15 phút',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 3,
  message: {
    success: false,
    message: 'Quá nhiều lần đăng ký, vui lòng thử lại sau',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Quá nhiều requests, vui lòng thử lại sau',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limit for authenticated admin/staff requests
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ') && req.path.startsWith('/admin')) {
      return true;
    }
    return false;
  },
});
