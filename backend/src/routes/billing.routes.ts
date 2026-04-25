import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

const router = Router();
router.use(authMiddleware);

// GET /billing/balance
router.get('/balance', async (req: Request, res: Response) => {
  try {
    const balance = await prisma.balance.findUnique({
      where: { userId: req.user!.id },
    });
    return res.json({ success: true, data: balance || {
      credits: 0, lockedCredits: 0, tokenBalance: 0, lockedTokens: 0
    }});
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch balance' 
    });
  }
});

// POST /billing/topup — add credits (mock payment)
router.post('/topup', async (req: Request, res: Response) => {
  try {
    const { amount } = z.object({
      amount: z.number().min(1).max(10000),
    }).parse(req.body);

    const balance = await prisma.$transaction(async (tx) => {
      const updated = await tx.balance.upsert({
        where: { userId: req.user!.id },
        create: { userId: req.user!.id, credits: amount },
        update: { credits: { increment: amount } },
      });

      await tx.transaction.create({
        data: {
          userId: req.user!.id,
          type: 'TOPUP',
          amount,
          description: `Credit top-up: $${amount}`,
          metadata: { source: 'mock_payment' },
        },
      });

      return updated;
    });

    return res.json({
      success: true,
      data: balance,
      message: `${amount} credits added`,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(422).json({ 
        success: false, 
        message: 'Invalid amount' 
      });
    }
    return res.status(500).json({ 
      success: false, 
      message: 'Top-up failed' 
    });
  }
});

// GET /billing/transactions
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const { type, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId: req.user!.id };
    if (type) where.type = type;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip,
      }),
      prisma.transaction.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch transactions' 
    });
  }
});

export default router;
