import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { apiKeyMiddleware, authMiddleware } from '../middleware/auth.middleware';
import { InvocationService } from '../services/invocation.service';
import { logger } from '../lib/logger';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';

const router = Router();

// Rate limit invocations: 60 per minute per API key
const invokeLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:invoke',
  points: 60,
  duration: 60,
});

// POST /invoke/:agentId
// Accepts both cookie auth (sandbox) AND API key auth (programmatic)
router.post('/:agentId', async (req: Request, res: Response) => {
  const agentId = req.params.agentId;

  // Determine auth method
  const hasApiKey = !!req.headers['x-api-key'];
  const hasCookie = !!req.cookies?.jwt_token;

  if (!hasApiKey && !hasCookie) {
    return res.status(401).json({
      success: false,
      code: 'AUTH_REQUIRED',
      message: 'API key (X-API-Key header) or session required',
    });
  }

  // Apply appropriate auth
  const authFn = hasApiKey ? apiKeyMiddleware : authMiddleware;

  return new Promise<void>((resolve) => {
    authFn(req, res, async () => {
      try {
        // Rate limit by user ID
        const limitKey = req.user!.id;
        try {
          await invokeLimiter.consume(limitKey);
        } catch {
          res.status(429).json({
            success: false,
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many invocations. Limit: 60/minute.',
          });
          resolve();
          return;
        }

        // Validate input
        const inputSchema = z.object({}).passthrough();
        let input: Record<string, unknown>;
        
        try {
          input = inputSchema.parse(req.body);
        } catch {
          input = { message: req.body };
        }

        const result = await InvocationService.invoke({
          agentId,
          callerId: req.user!.id,
          callerApiKeyId: (req as any).apiKeyId,
          input,
          ipAddress: req.ip,
        });

        res.json({
          success: true,
          data: {
            invocationId: result.invocationId,
            output: result.output,
            latencyMs: result.latencyMs,
            tokensUsed: result.tokensUsed,
            cost: result.cost,
            status: result.status,
          },
        });

        resolve();
      } catch (error: any) {
        logger.error('Invocation failed', {
          route: `/invoke/${agentId}`,
          userId: req.user?.id,
          error,
        });

        const status = error.status || 500;
        const code = error.code || 'INVOCATION_FAILED';
        
        res.status(status).json({
          success: false,
          code,
          message: error.message || 'Invocation failed',
        });
        resolve();
      }
    });
  });
});

// GET /invoke/:agentId/logs — list recent invocations for this agent
router.get('/:agentId/logs', authMiddleware, async (req, res) => {
  try {
    const { page = '1', limit = '20', status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      agentId: req.params.agentId,
      userId: req.user!.id,
    };
    if (status) where.status = status;

    const [invocations, total] = await Promise.all([
      prisma.invocation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip,
        select: {
          id: true,
          status: true,
          latencyMs: true,
          tokensUsed: true,
          cost: true,
          errorMessage: true,
          createdAt: true,
          input: true,
          output: true,
        },
      }),
      prisma.invocation.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        invocations,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get invocation logs failed', { error });
    return res.status(500).json({ 
      success: false, 
      code: 'FETCH_FAILED',
      message: 'Failed to fetch logs' 
    });
  }
});

export { router as invokeRouter };
