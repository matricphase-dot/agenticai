import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();
router.use(authMiddleware);

// GET /monitoring/logs — invocation logs
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const { 
      agentId, 
      status, 
      page = '1', 
      limit = '50',
      from,
      to,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId: req.user!.id };
    if (agentId) where.agentId = agentId;
    if (status) where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from as string);
      if (to) where.createdAt.lte = new Date(to as string);
    }

    const [logs, total] = await Promise.all([
      prisma.invocation.findMany({
        where,
        include: {
          agent: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip,
      }),
      prisma.invocation.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        logs,
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
      message: 'Failed to fetch logs' 
    });
  }
});

// GET /monitoring/metrics/:agentId
router.get('/metrics/:agentId', async (req: Request, res: Response) => {
  try {
    const agentId = req.params.agentId;
    const { from, to } = req.query;

    const where: any = { agentId, userId: req.user!.id };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from as string);
      if (to) where.createdAt.lte = new Date(to as string);
    }

    const [analytics, dailyStats] = await Promise.all([
      prisma.agentAnalytics.findUnique({ where: { agentId } }),
      // Last 7 days daily breakdown
      prisma.invocation.groupBy({
        by: ['status'],
        where: {
          agentId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        _count: true,
        _avg: { latencyMs: true, cost: true },
      }),
    ]);

    return res.json({
      success: true,
      data: { analytics, dailyStats },
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch metrics' 
    });
  }
});

// GET /monitoring/alerts + POST /monitoring/alerts
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const alerts = await prisma.alert.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: alerts });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch alerts' 
    });
  }
});

router.post('/alerts', async (req: Request, res: Response) => {
  try {
    const alert = await prisma.alert.create({
      data: {
        userId: req.user!.id,
        agentId: req.body.agentId || null,
        name: req.body.name,
        metric: req.body.metric,
        threshold: Number(req.body.threshold),
        condition: req.body.condition,
        webhookUrl: req.body.webhookUrl || null,
        emailNotify: req.body.emailNotify ?? true,
      },
    });
    return res.status(201).json({ success: true, data: alert });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to create alert' 
    });
  }
});

router.delete('/alerts/:id', async (req: Request, res: Response) => {
  try {
    await prisma.alert.deleteMany({
      where: { id: req.params.id, userId: req.user!.id },
    });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to delete alert' 
    });
  }
});

export default router;
