import { Router, Request, Response } from 'express';
import { authMiddleware, adminOnly } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { AgentStatus } from '@prisma/client';

const router = Router();
router.use(authMiddleware);

// GET /audit
router.get('/', async (req: Request, res: Response) => {
  try {
    const { action, from, to, page = '1', limit = '50' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId: req.user!.id };
    if (action) where.action = { contains: action as string };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from as string);
      if (to) where.createdAt.lte = new Date(to as string);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip,
      }),
      prisma.auditLog.count({ where }),
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
      message: 'Failed to fetch audit logs' 
    });
  }
});

// POST /audit/run-secrets-audit (TEMPORARY)
router.post('/run-secrets-audit', adminOnly, async (req: Request, res: Response) => {
  try {
    const isFixMode = req.query.fix === 'true';
    const RESERVED_PROVIDER_KEYS = [
      'GROQ_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY',
      'GEMINI_API_KEY', 'HF_API_KEY', 'HF_TOKEN'
    ];

    const agents = await prisma.agent.findMany({
      where: { status: AgentStatus.PUBLISHED }
    });

    let affectedCount = 0;
    const results = [];

    for (const agent of agents) {
      let leakedKeys: string[] = [];
      for (const key of RESERVED_PROVIDER_KEYS) {
        if (agent.systemPrompt && agent.systemPrompt.includes(`{{secret.${key}}}`)) {
          leakedKeys.push(key);
        }
      }

      if (leakedKeys.length > 0) {
        affectedCount++;
        const keysStr = leakedKeys.join(', ');
        
        if (isFixMode) {
          await prisma.agent.update({
            where: { id: agent.id },
            data: { status: AgentStatus.DRAFT, isPublic: false }
          });
          await prisma.notification.create({
            data: {
              userId: agent.userId,
              title: 'Agent Automatically Unpublished',
              message: `Your agent '${agent.name}' was automatically unpublished because its system prompt referenced a reserved provider key (${keysStr}), which could leak your API key. Please remove the reference and republish.`,
              type: 'SECURITY_ALERT',
              isRead: false
            }
          });
          results.push(`[FIXED] Agent ID: ${agent.id} | Slug: ${agent.slug} | Leaked Keys: ${keysStr} -> Unpublished & Notified`);
        } else {
          results.push(`[REPORT] Agent ID: ${agent.id} | Slug: ${agent.slug} | Leaked Keys: ${keysStr}`);
        }
      }
    }

    return res.json({
      success: true,
      mode: isFixMode ? 'FIX' : 'REPORT',
      affectedCount,
      results
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
