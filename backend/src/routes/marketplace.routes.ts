import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, optionalAuth } from '../middleware/auth.middleware';
import { z } from 'zod';
import { logger } from '../lib/logger';

import { marketplaceRateLimit } from '../middleware/rate-limit.middleware';

const router = Router();

// GET /marketplace — list public agents
router.get('/', marketplaceRateLimit, async (req: Request, res: Response) => {
  try {
    const {
      search,
      category,
      pricingModel,
      gpuRequired,
      minRating,
      sort = 'newest',
      page = '1',
      limit = '20',
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { 
      isPublic: true, 
      status: 'PUBLISHED' 
    };

    if (category) where.category = category;
    if (pricingModel) where.pricingModel = pricingModel;
    if (gpuRequired === 'true') where.gpuRequired = true;
    if (minRating) {
      where.analytics = { 
        avgRating: { gte: Number(minRating) } 
      };
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search.toLowerCase() } },
      ];
    }

    const orderBy: any = {};
    switch (sort) {
      case 'rating':
        orderBy.analytics = { avgRating: 'desc' };
        break;
      case 'staked':
        orderBy.analytics = { totalStaked: 'desc' };
        break;
      case 'invocations':
        orderBy.analytics = { totalInvocations: 'desc' };
        break;
      default: // newest
        orderBy.createdAt = 'desc';
    }

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        include: {
          user: { 
            select: { id: true, name: true, avatar: true } 
          },
          analytics: true,
          _count: { select: { reviews: true } },
        },
        orderBy,
        take: Number(limit),
        skip,
      }),
      prisma.agent.count({ where }),
    ]);

    // Curated sections (top picks)
    const featured = agents
      .filter(a => (a.analytics?.avgRating || 0) >= 4.5)
      .slice(0, 4);

    return res.json({
      success: true,
      data: {
        agents,
        featured,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Marketplace list failed', { error });
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch marketplace' 
    });
  }
});

// GET /marketplace/:id — public agent detail
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const agent = await prisma.agent.findFirst({
      where: { 
        id: req.params.id,
        isPublic: true,
        status: 'PUBLISHED',
      },
      include: {
        user: { 
          select: { id: true, name: true, avatar: true, bio: true } 
        },
        analytics: true,
        reviews: {
          include: {
            user: { 
              select: { id: true, name: true, avatar: true } 
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: { 
          select: { reviews: true, stakes: true } 
        },
      },
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Agent not found',
      });
    }

    // Check if requesting user has purchased/deployed this agent
    let hasAccess = false;
    if (req.user) {
      const purchase = await prisma.purchase.findUnique({
        where: {
          agentId_userId: { 
            agentId: agent.id, 
            userId: req.user.id 
          },
        },
      });
      hasAccess = !!purchase || agent.userId === req.user.id;
    }

    return res.json({ 
      success: true, 
      data: { ...agent, hasAccess } 
    });
  } catch (error) {
    logger.error('Agent detail failed', { error });
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch agent' 
    });
  }
});

// POST /marketplace/:id/review — add review
router.post(
  '/:id/review',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { rating, comment } = z.object({
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(1000).optional(),
      }).parse(req.body);

      const review = await prisma.review.upsert({
        where: {
          agentId_userId: { 
            agentId: req.params.id, 
            userId: req.user!.id 
          },
        },
        create: {
          agentId: req.params.id,
          userId: req.user!.id,
          rating,
          comment,
        },
        update: { rating, comment },
      });

      // Update average rating
      const stats = await prisma.review.aggregate({
        where: { agentId: req.params.id },
        _avg: { rating: true },
        _count: true,
      });

      await prisma.agentAnalytics.upsert({
        where: { agentId: req.params.id },
        create: {
          agentId: req.params.id,
          avgRating: stats._avg.rating || 0,
          reviewCount: stats._count,
        },
        update: {
          avgRating: stats._avg.rating || 0,
          reviewCount: stats._count,
        },
      });

      return res.status(201).json({ 
        success: true, 
        data: review 
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(422).json({ 
          success: false, 
          message: 'Invalid review data' 
        });
      }
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to submit review' 
      });
    }
  }
);

// POST /marketplace/:id/purchase — deploy/purchase agent
router.post(
  '/:id/purchase',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const agent = await prisma.agent.findFirst({
        where: { 
          id: req.params.id, 
          isPublic: true, 
          status: 'PUBLISHED' 
        },
      });

      if (!agent) {
        return res.status(404).json({
          success: false,
          message: 'Agent not found',
        });
      }

      // Check if already purchased
      const existing = await prisma.purchase.findUnique({
        where: {
          agentId_userId: { 
            agentId: agent.id, 
            userId: req.user!.id 
          },
        },
      });

      if (existing) {
        return res.json({ 
          success: true, 
          data: existing,
          message: 'Already deployed' 
        });
      }

      const cost = agent.pricingModel === 'FREE' 
        ? 0 
        : agent.pricePerCall || 0;

      if (cost > 0) {
        // Check credits
        const balance = await prisma.balance.findUnique({
          where: { userId: req.user!.id },
        });
        if (!balance || balance.credits < cost) {
          return res.status(402).json({
            success: false,
            code: 'INSUFFICIENT_CREDITS',
            message: 'Insufficient credits',
          });
        }
      }

      const purchase = await prisma.$transaction(async (tx) => {
        const p = await tx.purchase.create({
          data: {
            agentId: agent.id,
            userId: req.user!.id,
            amount: cost,
          },
        });

        if (cost > 0) {
          await tx.balance.update({
            where: { userId: req.user!.id },
            data: { credits: { decrement: cost } },
          });
        }

        return p;
      });

      return res.status(201).json({ 
        success: true, 
        data: purchase,
        message: 'Agent deployed successfully',
      });
    } catch (error) {
      logger.error('Purchase failed', { error });
      return res.status(500).json({ 
        success: false, 
        message: 'Purchase failed' 
      });
    }
  }
);

export default router;
