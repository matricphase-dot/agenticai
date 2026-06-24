import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, adminOnly } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { NotificationService } from '../services/notification.service';

const router = Router();

// POST /api/reports — any authenticated user reports an agent
router.post('/', authMiddleware, async (req, res) => {
  try {
    const schema = z.object({
      agentId: z.string(),
      reason: z.enum([
        'HARMFUL_OUTPUT', 'ILLEGAL_CONTENT', 'DECEPTIVE_PRACTICE',
        'PRIVACY_VIOLATION', 'MISINFORMATION', 'SPAM', 'OTHER'
      ]),
      details: z.string().min(10).max(2000),
    });
    const { agentId, reason, details } = schema.parse(req.body);

    const agent = await prisma.agent.findUnique({ 
      where: { id: agentId },
      select: { id: true, name: true, isPublic: true, userId: true }
    });
    
    if (!agent) {
      return res.status(404).json({ 
        success: false, code: 'AGENT_NOT_FOUND', 
        message: 'Agent not found' 
      });
    }

    // Prevent duplicate spam reports from same user on same agent
    const existing = await prisma.agentReport.findFirst({
      where: { 
        agentId, 
        reporterId: req.user!.id, 
        status: { in: ['PENDING', 'UNDER_REVIEW'] } 
      }
    });
    if (existing) {
      return res.status(409).json({ 
        success: false, code: 'ALREADY_REPORTED',
        message: 'You have already reported this agent. It is pending review.' 
      });
    }

    const report = await prisma.agentReport.create({
      data: { agentId, reporterId: req.user!.id, reason, details },
    });

    logger.info('Agent reported', { 
      route: '/api/reports', agentId, reportId: report.id, reason 
    });

    // Notify admin(s) — find users with role ADMIN
    const admins = await prisma.user.findMany({ 
      where: { role: 'ADMIN' }, select: { id: true } 
    });
    for (const admin of admins) {
      await NotificationService.create(admin.id, {
        type: 'agent_report',
        title: 'New agent report submitted',
        message: `Agent "${agent.name}" was reported for ${reason}`,
        link: `/dashboard/admin/reports`,
      });
    }

    return res.status(201).json({ 
      success: true, 
      message: 'Report submitted. Our team will review it shortly.',
      data: { reportId: report.id } 
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(422).json({ 
        success: false, code: 'VALIDATION_ERROR', 
        details: error.errors 
      });
    }
    logger.error('Report submission failed', { 
      route: '/api/reports', error 
    });
    return res.status(500).json({ 
      success: false, code: 'REPORT_FAILED' 
    });
  }
});

// GET /api/reports — admin only, list all reports
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const reports = await prisma.agentReport.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        agent: { select: { id: true, name: true, isPublic: true, status: true } },
        reporter: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: reports });
  } catch (error) {
    logger.error('Fetch reports failed', { route: 'GET /api/reports', error });
    return res.status(500).json({ success: false, code: 'FETCH_FAILED' });
  }
});

// PATCH /api/reports/:id — admin only, resolve a report
router.patch('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const schema = z.object({
      status: z.enum([
        'UNDER_REVIEW', 'RESOLVED_NO_ACTION', 
        'RESOLVED_UNPUBLISHED', 'RESOLVED_WARNING_ISSUED'
      ]),
      adminNotes: z.string().optional(),
    });
    const { status, adminNotes } = schema.parse(req.body);
    const { id } = req.params;

    const report = await prisma.agentReport.findUnique({ 
      where: { id }, 
      include: { agent: true } 
    });
    if (!report) {
      return res.status(404).json({ success: false, code: 'REPORT_NOT_FOUND' });
    }

    const isResolved = status.startsWith('RESOLVED');

    await prisma.$transaction(async (tx) => {
      await tx.agentReport.update({
        where: { id },
        data: {
          status,
          adminNotes,
          resolvedAt: isResolved ? new Date() : null,
          resolvedById: isResolved ? req.user!.id : null,
        },
      });

      // If unpublishing, actually unpublish the agent
      if (status === 'RESOLVED_UNPUBLISHED') {
        await tx.agent.update({
          where: { id: report.agentId },
          data: { isPublic: false, status: 'DRAFT' },
        });
      }
    });

    // Notify the creator if action was taken
    if (status === 'RESOLVED_UNPUBLISHED' || status === 'RESOLVED_WARNING_ISSUED') {
      await NotificationService.create(report.agent.userId, {
        type: 'moderation_action',
        title: status === 'RESOLVED_UNPUBLISHED' 
          ? 'Your agent was unpublished' 
          : 'Warning issued on your agent',
        message: status === 'RESOLVED_UNPUBLISHED'
          ? `Your agent "${report.agent.name}" was unpublished following a content report. ${adminNotes || 'Please review our Acceptable Use Policy.'}`
          : `Your agent "${report.agent.name}" received a warning following a content report. ${adminNotes || ''}`,
        link: `/dashboard/agents/${report.agentId}`,
      });
    }

    logger.info('Report resolved', { 
      reportId: id, status, adminId: req.user!.id 
    });

    return res.json({ success: true, message: 'Report updated' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(422).json({ success: false, code: 'VALIDATION_ERROR' });
    }
    logger.error('Report resolution failed', { route: 'PATCH /api/reports/:id', error });
    return res.status(500).json({ success: false, code: 'UPDATE_FAILED' });
  }
});

export { router as reportsRouter };
