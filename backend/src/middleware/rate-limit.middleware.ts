import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redis } from '../lib/redis';
import { logger } from '../lib/logger';

// Marketplace limiter — 60 per minute per IP
const marketplaceLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:marketplace',
  points: 60,
  duration: 60,
});

// Stats limiter — 30 per minute per IP
const statsLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:stats',
  points: 30,
  duration: 60,
});

// Invocation limiter — 10 per minute per API key (handled in the route usually, but we can make a middleware)
const invocationLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:invocation',
  points: 10,
  duration: 60,
});

function getIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() 
    || req.socket.remoteAddress 
    || 'unknown'
  );
}

export const marketplaceRateLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await marketplaceLimiter.consume(getIp(req));
    next();
  } catch (rejRes: any) {
    res.status(429).json({
      success: false,
      error: 'Too many requests to marketplace'
    });
  }
};

export const statsRateLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await statsLimiter.consume(getIp(req));
    next();
  } catch (rejRes: any) {
    res.status(429).json({
      success: false,
      error: 'Too many requests to stats'
    });
  }
};

export const invocationRateLimit = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) return next(); // Let the auth middleware handle missing API key

  try {
    await invocationLimiter.consume(apiKey);
    next();
  } catch (rejRes: any) {
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded for this API key (10/min)'
    });
  }
};
