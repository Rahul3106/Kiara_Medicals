import rateLimit from 'express-rate-limit';
import { ENV } from '../config/env.js';

export const authRateLimiter = rateLimit({
  windowMs: ENV.RATE_LIMIT_WINDOW_MS, // 15 minutes
  // In production: strict limit (10 attempts). In dev/test: relaxed (100 attempts)
  max: ENV.IS_PRODUCTION ? ENV.RATE_LIMIT_MAX_LOGIN_ATTEMPTS : 100,
  standardHeaders: true, // Return standard RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  skipSuccessfulRequests: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
    },
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: ENV.IS_PRODUCTION ? 300 : 1000, // 300 requests/min in prod
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many API requests. Please slow down.',
    },
  },
});
