import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redis } from '../lib/redis';
import { logger } from '../lib/logger';

// Strict limiter for login — 5 attempts per 15 minutes per IP
const loginLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:login',
  points: 5,           // 5 attempts
  duration: 15 * 60,   // per 15 minutes
  blockDuration: 15 * 60, // block for 15 min after exceeded
});

// Strict limiter per email — 5 attempts per hour per email
const loginEmailLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:login:email',
  points: 5,
  duration: 60 * 60,   // per 1 hour
  blockDuration: 60 * 60,
});

// Signup limiter — 3 per hour per IP
const signupLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:signup',
  points: 3,
  duration: 60 * 60,
  blockDuration: 60 * 60,
});

// Forgot password — 3 per hour per IP
const forgotPasswordLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:forgot',
  points: 3,
  duration: 60 * 60,
  blockDuration: 60 * 60,
});

function getIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() 
    || req.socket.remoteAddress 
    || 'unknown'
  );
}

export const rateLimitLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const ip = getIp(req);
  const email = req.body?.email?.toLowerCase() || 'unknown';

  try {
    await Promise.all([
      loginLimiter.consume(ip),
      loginEmailLimiter.consume(email),
    ]);
    next();
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 60;
    logger.warn('Login rate limit exceeded', { ip, email });
    res.set('Retry-After', String(secs));
    res.status(429).json({
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Too many login attempts. Try again in ${secs} seconds.`,
      retryAfter: secs,
    });
  }
};

export const rateLimitSignup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const ip = getIp(req);
  try {
    await signupLimiter.consume(ip);
    next();
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 3600;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Too many signups from this IP. Try again in ${secs} seconds.`,
      retryAfter: secs,
    });
  }
};

export const rateLimitForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const ip = getIp(req);
  try {
    await forgotPasswordLimiter.consume(ip);
    next();
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 3600;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Too many requests. Try again in ${secs} seconds.`,
      retryAfter: secs,
    });
  }
};
