import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.middleware';
import { StakingService } from '../services/staking.service';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

const router = Router();
router.use(authMiddleware);

// GET /staking/portfolio — full staking overview
router.get('/portfolio', async (req: Request, res: Response) => {
  try {
    const portfolio = await StakingService.getPortfolio(req.user!.id);
    return res.json({ success: true, data: portfolio });
  } catch (error) {
    logger.error('Get portfolio failed', { 
      userId: req.user?.id, error 
    });
    return res.status(500).json({ 
      success: false, 
      code: 'FETCH_FAILED',
      message: 'Failed to fetch portfolio' 
    });
  }
});

// GET /staking/positions — list all stakes
router.get('/positions', async (req: Request, res: Response) => {
  try {
    const stakes = await prisma.stake.findMany({
      where: { userId: req.user!.id },
      include: {
        agent: {
          select: { 
            id: true, name: true, slug: true, category: true 
          },
        },
        rewards: {
          where: { claimed: false },
          select: { amount: true, distributedAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: stakes });
  } catch (error) {
    logger.error('Get positions failed', { error });
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch positions' 
    });
  }
});

// GET /staking/rewards — reward history
router.get('/rewards', async (req: Request, res: Response) => {
  try {
    const { claimed, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId: req.user!.id };
    if (claimed === 'true') where.claimed = true;
    if (claimed === 'false') where.claimed = false;

    const [rewards, total] = await Promise.all([
      prisma.reward.findMany({
        where,
        include: {
          stake: {
            include: {
              agent: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { distributedAt: 'desc' },
        take: Number(limit),
        skip,
      }),
      prisma.reward.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        rewards,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get rewards failed', { error });
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch rewards' 
    });
  }
});

// POST /staking/stake — stake on an agent
router.post('/stake', async (req: Request, res: Response) => {
  try {
    const { agentId, amount } = z.object({
      agentId: z.string().cuid(),
      amount: z.number().positive(),
    }).parse(req.body);

    const stake = await StakingService.stake(
      req.user!.id, 
      agentId, 
      amount
    );

    return res.status(201).json({ 
      success: true, 
      data: stake,
      message: `Successfully staked ${amount} AGNT` 
    });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'STAKE_FAILED';
    logger.error('Stake failed', { 
      userId: req.user?.id, error 
    });
    return res.status(status).json({ 
      success: false, 
      code,
      message: error.message || 'Stake failed' 
    });
  }
});

// POST /staking/unstake — request to unstake
router.post('/unstake', async (req: Request, res: Response) => {
  try {
    const { stakeId } = z.object({
      stakeId: z.string().cuid(),
    }).parse(req.body);

    const stake = await StakingService.requestUnstake(
      req.user!.id, 
      stakeId
    );

    return res.json({
      success: true,
      data: stake,
      message: `Unstaking initiated. Tokens available in 7 days.`,
    });
  } catch (error: any) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      code: error.code || 'UNSTAKE_FAILED',
      message: error.message || 'Unstake failed',
    });
  }
});

// POST /staking/claim — claim all pending rewards
router.post('/claim', async (req: Request, res: Response) => {
  try {
    const result = await StakingService.claimRewards(req.user!.id);
    
    if (result.claimed === 0) {
      return res.json({
        success: true,
        data: result,
        message: 'No pending rewards to claim',
      });
    }

    return res.json({
      success: true,
      data: result,
      message: `Claimed ${result.totalAmount.toFixed(4)} AGNT`,
    });
  } catch (error: any) {
    logger.error('Claim rewards failed', { 
      userId: req.user?.id, error 
    });
    return res.status(500).json({
      success: false,
      code: 'CLAIM_FAILED',
      message: 'Failed to claim rewards',
    });
  }
});

// GET /staking/agent/:agentId — staking stats for one agent
// (used on marketplace agent detail page)
router.get('/agent/:agentId', async (req: Request, res: Response) => {
  try {
    const agentId = req.params.agentId;

    const [myStake, agentStats] = await Promise.all([
      // User's position on this agent
      prisma.stake.findUnique({
        where: {
          userId_agentId: { 
            userId: req.user!.id, 
            agentId 
          },
        },
        include: {
          rewards: {
            where: { claimed: false },
            select: { amount: true },
          },
        },
      }),
      // All staking stats for this agent
      prisma.stake.aggregate({
        where: { agentId, status: 'ACTIVE' },
        _sum: { amount: true },
        _count: true,
        _avg: { amount: true },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        myStake,
        totalStaked: agentStats._sum.amount || 0,
        stakerCount: agentStats._count,
        avgStake: agentStats._avg.amount || 0,
      },
    });
  } catch (error) {
    logger.error('Get agent staking stats failed', { error });
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch staking stats' 
    });
  }
});

// GET /staking/token-balance — faucet info + balance
router.get('/token-balance', async (req: Request, res: Response) => {
  try {
    const balance = await prisma.balance.findUnique({
      where: { userId: req.user!.id },
      select: { tokenBalance: true, lockedTokens: true },
    });
    return res.json({ success: true, data: balance });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch balance' 
    });
  }
});

// POST /staking/faucet — claim demo tokens (once per user)
router.post('/faucet', async (req: Request, res: Response) => {
  try {
    const FAUCET_AMOUNT = 1000;
    const FAUCET_KEY = `faucet:${req.user!.id}`;

    // Check if already claimed (Redis)
    const { redis } = await import('../lib/redis');
    const claimed = await redis.get(FAUCET_KEY);
    
    if (claimed) {
      return res.status(400).json({
        success: false,
        code: 'ALREADY_CLAIMED',
        message: 'You have already claimed your demo tokens',
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.balance.upsert({
        where: { userId: req.user!.id },
        create: { 
          userId: req.user!.id, 
          tokenBalance: FAUCET_AMOUNT 
        },
        update: { 
          tokenBalance: { increment: FAUCET_AMOUNT } 
        },
      });

      await tx.transaction.create({
        data: {
          userId: req.user!.id,
          type: 'TOPUP',
          amount: FAUCET_AMOUNT,
          description: 'Demo token faucet claim',
          metadata: { source: 'faucet' },
        },
      });
    });

    // Mark as claimed (permanent)
    await redis.set(FAUCET_KEY, '1');

    return res.json({
      success: true,
      message: `${FAUCET_AMOUNT} AGNT added to your wallet`,
      data: { amount: FAUCET_AMOUNT },
    });
  } catch (error) {
    logger.error('Faucet claim failed', { error });
    return res.status(500).json({ 
      success: false, 
      message: 'Faucet claim failed' 
    });
  }
});

export { router as stakingRouter };
