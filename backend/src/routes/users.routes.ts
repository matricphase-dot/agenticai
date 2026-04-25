import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();
router.use(authMiddleware);

// GET /users/me
router.get('/me', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, email: true, name: true,
        avatar: true, bio: true, role: true,
        emailVerified: true, walletAddress: true,
        twoFactorEnabled: true, createdAt: true,
      },
    });
    return res.json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user' 
    });
  }
});

// PUT /users/me
router.put('/me', async (req: Request, res: Response) => {
  try {
    const { name, bio, avatar, walletAddress } = z.object({
      name: z.string().min(2).max(100).optional(),
      bio: z.string().max(500).optional(),
      avatar: z.string().url().optional(),
      walletAddress: z.string().optional(),
    }).parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { 
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(avatar && { avatar }),
        ...(walletAddress !== undefined && { walletAddress }),
      },
      select: {
        id: true, email: true, name: true,
        avatar: true, bio: true, walletAddress: true,
      },
    });

    return res.json({ success: true, data: user });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(422).json({ 
        success: false, 
        message: 'Invalid data' 
      });
    }
    return res.status(500).json({ 
      success: false, 
      message: 'Update failed' 
    });
  }
});

// GET /users/stats — dashboard stats for current user
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      agentCount,
      invocationsToday,
      balance,
      activeStakes,
      unreadNotifications,
    ] = await Promise.all([
      prisma.agent.count({ 
        where: { userId, status: 'PUBLISHED' } 
      }),
      prisma.invocation.count({ 
        where: { userId, createdAt: { gte: yesterday } } 
      }),
      prisma.balance.findUnique({ where: { userId } }),
      prisma.stake.aggregate({
        where: { userId, status: 'ACTIVE' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.notification.count({ 
        where: { userId, read: false } 
      }),
    ]);

    return res.json({
      success: true,
      data: {
        agentCount,
        invocationsToday,
        credits: balance?.credits || 0,
        tokenBalance: balance?.tokenBalance || 0,
        totalStaked: activeStakes._sum.amount || 0,
        activeStakesCount: activeStakes._count,
        unreadNotifications,
      },
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch stats' 
    });
  }
});

export default router;
