import { getRedisClient, isRedisHealthy } from '../config/redis.js';
import { ApiError } from '../core/apiError.js';

// Fixed window rate limiter using Redis INCR + EX
export function rateLimiter({ keyPrefix, limit, windowSec }) {
  return async (req, _res, next) => {
    if (!isRedisHealthy()) return next(); // graceful degradation
    try {
      const client = getRedisClient();
      const key = `${keyPrefix}:${req.ip}`;
      const count = await client.incr(key);
      if (count === 1) await client.expire(key, windowSec);
      if (count > limit) {
        return next(ApiError.tooMany('Rate limit exceeded'));
      }
      next();
    } catch (e) { next(); }
  };
}
