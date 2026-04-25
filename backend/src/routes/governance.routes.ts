import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.middleware';
import { GovernanceService } from '../services/governance.service';
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';

const router = Router();

// Public: list proposals (no auth required)
router.get('/proposals', async (req: Request, res: Response) => {
  try {
    const { status, type, page, limit } = req.query;
    const result = await GovernanceService.listProposals({
      status: status as string,
      type: type as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    return res.json({ success: true, data: result });
  } catch (error) {
    logger.error('List proposals failed', { error });
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch proposals' 
    });
  }
});

// Public: get proposal detail
router.get(
  '/proposals/:id',
  async (req: Request, res: Response) => {
    try {
      // Try to get auth (optional)
      let userId: string | undefined;
      const token = req.cookies?.jwt_token;
      if (token) {
        try {
          const { AuthService } = await import('../services/auth.service');
          const payload = AuthService.verifyToken(token);
          userId = payload.userId;
        } catch {}
      }

      const detail = await GovernanceService.getProposalDetail(
        req.params.id,
        userId
      );
      return res.json({ success: true, data: detail });
    } catch (error: any) {
      const status = error.status || 500;
      return res.status(status).json({
        success: false,
        code: error.code || 'FETCH_FAILED',
        message: error.message || 'Failed to fetch proposal',
      });
    }
  }
);

// Protected: create proposal
router.post(
  '/proposals',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        title: z.string().min(10).max(200),
        description: z.string().min(50),
        type: z.enum([
          'FEE_CHANGE', 
          'TREASURY', 
          'FEATURE', 
          'SLASH', 
          'OTHER'
        ]),
        executionData: z.record(z.unknown()).optional(),
      });

      const data = schema.parse(req.body);

      const proposal = await GovernanceService.createProposal({
        proposerId: req.user!.id,
        ...data,
      });

      return res.status(201).json({ 
        success: true, 
        data: proposal 
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(422).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Invalid proposal data',
          details: error.errors,
        });
      }
      const status = error.status || 500;
      logger.error('Create proposal failed', { 
        userId: req.user?.id, error 
      });
      return res.status(status).json({
        success: false,
        code: error.code || 'CREATE_FAILED',
        message: error.message || 'Failed to create proposal',
      });
    }
  }
);

// Protected: cast vote
router.post(
  '/proposals/:id/vote',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { choice } = z.object({
        choice: z.enum(['FOR', 'AGAINST', 'ABSTAIN']),
      }).parse(req.body);

      const vote = await GovernanceService.castVote({
        proposalId: req.params.id,
        userId: req.user!.id,
        choice,
      });

      return res.json({ 
        success: true, 
        data: vote,
        message: `Vote cast: ${choice}`,
      });
    } catch (error: any) {
      const status = error.status || 500;
      return res.status(status).json({
        success: false,
        code: error.code || 'VOTE_FAILED',
        message: error.message || 'Vote failed',
      });
    }
  }
);

// Protected: delegate voting power
router.post(
  '/delegate',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { toUserId } = z.object({
        toUserId: z.string().cuid(),
      }).parse(req.body);

      const delegation = await GovernanceService.delegate(
        req.user!.id,
        toUserId
      );

      return res.json({ 
        success: true, 
        data: delegation,
        message: 'Voting power delegated',
      });
    } catch (error: any) {
      const status = error.status || 500;
      return res.status(status).json({
        success: false,
        code: error.code || 'DELEGATION_FAILED',
        message: error.message || 'Delegation failed',
      });
    }
  }
);

// Protected: revoke delegation
router.delete(
  '/delegate',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const result = await GovernanceService.revokeDelegate(
        req.user!.id
      );
      return res.json({ 
        success: true, 
        data: result,
        message: 'Delegation revoked',
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to revoke delegation' 
      });
    }
  }
);

// Protected: get my voting power
router.get(
  '/voting-power',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const [ownPower, delegatedPower, effectivePower, myDelegation] = 
        await Promise.all([
          GovernanceService.getVotingPower(req.user!.id),
          GovernanceService.getDelegatedPower(req.user!.id),
          GovernanceService.getEffectiveVotingPower(req.user!.id),
          prisma.delegation.findFirst({
            where: { 
              fromUserId: req.user!.id, 
              revokedAt: null 
            },
            include: {
              toUser: { 
                select: { id: true, name: true, email: true } 
              },
            },
          }),
        ]);

      return res.json({
        success: true,
        data: {
          ownPower,
          delegatedPower,
          effectivePower,
          delegatedTo: myDelegation?.toUser || null,
          canPropose: effectivePower >= 100,
        },
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch voting power' 
      });
    }
  }
);

export { router as governanceRouter };
