import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { getCache, setCache } from '../lib/redis';
import { getProviderHealth } from '../services/llm.service';

import { statsRateLimit } from '../middleware/rate-limit.middleware';

const router = Router();

router.get('/health/providers', async (req, res) => {
  try {
    const health = getProviderHealth();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get provider health' });
  }
});

router.get('/', statsRateLimit, async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  try {
    // Try to get from cache first
    const cachedStats = await getCache('platform_stats');
    if (cachedStats) {
      return res.json({
        success: true,
        data: cachedStats
      });
    }

    // If not in cache, query DB
    const [agents, nodes, invocations, staked, users] = await Promise.all([
      prisma.agent.count({ 
        where: { status: 'PUBLISHED', isPublic: true } 
      }),
      prisma.node.count({ where: { status: 'ONLINE' } }),
      prisma.invocation.count(),
      prisma.balance.aggregate({ 
        _sum: { lockedTokens: true } 
      }),
      prisma.user.count(),
    ]);

    const stats = {
      totalAgents: agents,
      activeNodes: nodes,
      totalInvocations: invocations,
      totalStaked: Number(staked._sum.lockedTokens || 0),
      totalUsers: users,
    };

    // Store in cache for 60 seconds
    await setCache('platform_stats', stats, 60);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.json({ 
      success: false, 
      error: 'Failed to fetch platform stats' 
    });
  }
});

export default router;
