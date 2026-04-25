import { Request, Response, NextFunction } from "express";
import { rateLimitCheck } from "../lib/redis";

export const rateLimitMiddleware = (limit: number, windowSeconds: number = 60) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.userId;
    const identifier = userId ? `user:${userId}` : `ip:${req.ip}`;
    const key = `rl:${req.path}:${identifier}`;

    try {
      const rlStatus = await rateLimitCheck(key, limit, windowSeconds);

      if (!rlStatus.allowed) {
        res.set("Retry-After", rlStatus.resetIn.toString());
        return res.status(429).json({
          success: false,
          error: "Too many requests",
          details: { resetIn: rlStatus.resetIn }
        });
      }

      next();
    } catch (err) {
      next(); // Don't block on Redis failure
    }
  };
};
