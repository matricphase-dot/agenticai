import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

const LOCK_PERIOD_DAYS = 7;
const STAKER_REWARD_PERCENT = 
  Number(process.env.STAKER_REWARD_PERCENT || 30) / 100;
const MIN_STAKE = 10; // minimum AGNT tokens

export const StakingService = {

  // Stake tokens on an agent
  stake: async (
    userId: string,
    agentId: string,
    amount: number
  ) => {
    if (amount < MIN_STAKE) {
      throw Object.assign(
        new Error(`Minimum stake is ${MIN_STAKE} AGNT`),
        { code: 'BELOW_MINIMUM', status: 400 }
      );
    }

    // Verify agent exists and is published
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });
    if (!agent || agent.status !== 'PUBLISHED') {
      throw Object.assign(
        new Error('Agent not found or not published'),
        { code: 'AGENT_NOT_FOUND', status: 404 }
      );
    }

    // Check user token balance
    const balance = await prisma.balance.findUnique({
      where: { userId },
    });
    if (!balance || balance.tokenBalance < amount) {
      throw Object.assign(
        new Error('Insufficient token balance'),
        { code: 'INSUFFICIENT_TOKENS', status: 402 }
      );
    }

    const lockedUntil = new Date(
      Date.now() + LOCK_PERIOD_DAYS * 24 * 60 * 60 * 1000
    );

    // Atomic: lock tokens + create/update stake
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from available, add to locked
      await tx.balance.update({
        where: { userId },
        data: {
          tokenBalance: { decrement: amount },
          lockedTokens: { increment: amount },
        },
      });

      // Upsert stake — if user already staking on this agent,
      // add to existing position
      const existingStake = await tx.stake.findUnique({
        where: { userId_agentId: { userId, agentId } },
      });

      let stake;
      if (existingStake && existingStake.status === 'ACTIVE') {
        stake = await tx.stake.update({
          where: { id: existingStake.id },
          data: {
            amount: { increment: amount },
            lockedUntil, // reset lock on top-up
          },
        });
      } else {
        stake = await tx.stake.create({
          data: {
            userId,
            agentId,
            amount,
            lockedUntil,
            status: 'ACTIVE',
          },
        });
      }

      // Record transaction
      await tx.transaction.create({
        data: {
          userId,
          type: 'STAKE',
          amount: -amount,
          description: `Staked ${amount} AGNT on agent`,
          metadata: { agentId, stakeId: stake.id },
        },
      });

      return stake;
    });

    // Update agent analytics (outside transaction for non-critical)
    const allStakes = await prisma.stake.aggregate({
      where: { agentId, status: 'ACTIVE' },
      _sum: { amount: true },
      _count: true,
    });

    await prisma.agentAnalytics.upsert({
      where: { agentId },
      create: {
        agentId,
        stakerCount: allStakes._count,
        totalStaked: allStakes._sum.amount || 0,
      },
      update: {
        stakerCount: allStakes._count,
        totalStaked: allStakes._sum.amount || 0,
      },
    });

    logger.info('Stake created', { userId, agentId, amount });
    return result;
  },

  // Request to unstake (starts 7-day countdown)
  requestUnstake: async (userId: string, stakeId: string) => {
    const stake = await prisma.stake.findUnique({
      where: { id: stakeId },
    });

    if (!stake || stake.userId !== userId) {
      throw Object.assign(
        new Error('Stake not found'),
        { code: 'STAKE_NOT_FOUND', status: 404 }
      );
    }

    if (stake.status !== 'ACTIVE') {
      throw Object.assign(
        new Error('Stake is not active'),
        { code: 'STAKE_NOT_ACTIVE', status: 400 }
      );
    }

    // Check no unclaimed rewards (must claim before unstaking)
    const unclaimedRewards = await prisma.reward.count({
      where: { stakeId, claimed: false },
    });
    if (unclaimedRewards > 0) {
      throw Object.assign(
        new Error('Claim pending rewards before unstaking'),
        { code: 'PENDING_REWARDS', status: 400 }
      );
    }

    // Set lockedUntil to 7 days from now for unstaking period
    const unstakeAvailableAt = new Date(
      Date.now() + LOCK_PERIOD_DAYS * 24 * 60 * 60 * 1000
    );

    const updated = await prisma.stake.update({
      where: { id: stakeId },
      data: {
        status: 'UNSTAKING',
        lockedUntil: unstakeAvailableAt,
      },
    });

    logger.info('Unstake requested', { userId, stakeId });
    return updated;
  },

  // Process unstakes where lock period has expired
  // Called by BullMQ cron job every hour
  processMaturedUnstakes: async () => {
    const matured = await prisma.stake.findMany({
      where: {
        status: 'UNSTAKING',
        lockedUntil: { lt: new Date() },
      },
      include: { agent: true },
    });

    let processed = 0;
    const errors: string[] = [];

    for (const stake of matured) {
      try {
        await prisma.$transaction(async (tx) => {
          // Return tokens to user
          await tx.balance.update({
            where: { userId: stake.userId },
            data: {
              tokenBalance: { increment: stake.amount },
              lockedTokens: { decrement: stake.amount },
            },
          });

          // Mark stake completed
          await tx.stake.update({
            where: { id: stake.id },
            data: { status: 'COMPLETED' },
          });

          // Record transaction
          await tx.transaction.create({
            data: {
              userId: stake.userId,
              type: 'UNSTAKE',
              amount: stake.amount,
              description: `Unstaked ${stake.amount} AGNT`,
              metadata: { 
                agentId: stake.agentId, 
                stakeId: stake.id 
              },
            },
          });
        });

        // Create notification
        await prisma.notification.create({
          data: {
            userId: stake.userId,
            type: 'unstake_complete',
            title: 'Unstake Complete',
            message: `${stake.amount} AGNT has been returned to your wallet`,
            link: '/dashboard/staking',
          },
        }).catch(() => {}); // non-critical

        processed++;
      } catch (error) {
        errors.push(`Stake ${stake.id}: ${error}`);
        logger.error('Failed to process unstake', { 
          stakeId: stake.id, error 
        });
      }
    }

    return { processed, errors };
  },

  // Daily reward distribution — called by BullMQ cron
  distributeRewards: async () => {
    const startTime = Date.now();
    logger.info('Starting daily reward distribution');

    // Find all agents that earned revenue in the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const agentEarnings = await prisma.transaction.groupBy({
      by: ['metadata'],
      where: {
        type: 'AGENT_EARNING',
        createdAt: { gte: yesterday },
      },
      _sum: { amount: true },
    });

    // Extract agentId from metadata
    type AgentEarning = { agentId: string; totalEarnings: number };
    const earningsByAgent: AgentEarning[] = agentEarnings
      .filter(e => e.metadata && typeof e.metadata === 'object')
      .map(e => ({
        agentId: (e.metadata as any).agentId as string,
        totalEarnings: e._sum.amount || 0,
      }))
      .filter(e => e.agentId && e.totalEarnings > 0);

    let totalDistributed = 0;
    let agentsProcessed = 0;
    const errors: string[] = [];

    for (const { agentId, totalEarnings } of earningsByAgent) {
      try {
        const rewardPool = totalEarnings * STAKER_REWARD_PERCENT;
        if (rewardPool <= 0) continue;

        // Find all active stakes on this agent
        const stakes = await prisma.stake.findMany({
          where: { agentId, status: 'ACTIVE' },
        });

        if (stakes.length === 0) continue;

        const totalStaked = stakes.reduce((sum, s) => sum + s.amount, 0);

        // Distribute proportionally
        await prisma.$transaction(async (tx) => {
          for (const stake of stakes) {
            const proportion = stake.amount / totalStaked;
            const rewardAmount = Math.floor(
              rewardPool * proportion * 10000
            ) / 10000; // 4 decimal places

            if (rewardAmount <= 0) continue;

            await tx.reward.create({
              data: {
                stakeId: stake.id,
                userId: stake.userId,
                agentId,
                amount: rewardAmount,
                claimed: false,
              },
            });

            totalDistributed += rewardAmount;
          }
        });

        // Notify stakers
        for (const stake of stakes) {
          await prisma.notification.create({
            data: {
              userId: stake.userId,
              type: 'reward',
              title: 'Staking Reward Earned',
              message: `You earned AGNT from staking on an agent`,
              link: '/dashboard/staking',
            },
          }).catch(() => {});
        }

        agentsProcessed++;
      } catch (error) {
        errors.push(`Agent ${agentId}: ${error}`);
        logger.error('Reward distribution failed for agent', {
          agentId, error
        });
      }
    }

    const duration = Date.now() - startTime;
    logger.info('Reward distribution complete', {
      agentsProcessed,
      totalDistributed,
      duration,
    });

    // Log to cron_logs if model exists
    try {
      await (prisma as any).cronLog?.create({
        data: {
          cronName: 'reward-distribution',
          status: errors.length === 0 ? 'success' : 'partial',
          metadata: { agentsProcessed, totalDistributed, errors },
          durationMs: duration,
        },
      });
    } catch {}

    return { agentsProcessed, totalDistributed, errors, duration };
  },

  // Claim all pending rewards for a user
  claimRewards: async (userId: string) => {
    const unclaimed = await prisma.reward.findMany({
      where: { userId, claimed: false },
    });

    if (unclaimed.length === 0) {
      return { claimed: 0, totalAmount: 0 };
    }

    const totalAmount = unclaimed.reduce(
      (sum, r) => sum + r.amount, 0
    );

    await prisma.$transaction(async (tx) => {
      // Mark all rewards as claimed
      await tx.reward.updateMany({
        where: { userId, claimed: false },
        data: { claimed: true },
      });

      // Add to user's token balance
      await tx.balance.upsert({
        where: { userId },
        create: { userId, tokenBalance: totalAmount },
        update: { tokenBalance: { increment: totalAmount } },
      });

      // Record transaction
      await tx.transaction.create({
        data: {
          userId,
          type: 'REWARD_CLAIM',
          amount: totalAmount,
          description: `Claimed ${unclaimed.length} staking rewards`,
          metadata: { rewardCount: unclaimed.length },
        },
      });
    });

    logger.info('Rewards claimed', { userId, totalAmount });
    return { claimed: unclaimed.length, totalAmount };
  },

  // Get user's staking portfolio summary
  getPortfolio: async (userId: string) => {
    const [stakes, pendingRewards, balance] = await Promise.all([
      prisma.stake.findMany({
        where: { userId },
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              slug: true,
              category: true,
              analytics: {
                select: { avgRating: true, totalInvocations: true }
              },
            },
          },
          rewards: {
            where: { claimed: false },
            select: { amount: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.reward.aggregate({
        where: { userId, claimed: false },
        _sum: { amount: true },
      }),
      prisma.balance.findUnique({ where: { userId } }),
    ]);

    const totalStaked = stakes
      .filter(s => s.status === 'ACTIVE')
      .reduce((sum, s) => sum + s.amount, 0);

    const claimableRewards = pendingRewards._sum.amount || 0;

    return {
      stakes,
      totalStaked,
      claimableRewards,
      tokenBalance: balance?.tokenBalance || 0,
      lockedTokens: balance?.lockedTokens || 0,
    };
  },
};
