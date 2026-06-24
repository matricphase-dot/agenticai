import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { NotificationService } from './notification.service';

const MIN_STAKE_TO_PROPOSE = 100; // AGNT

export const GovernanceService = {

  // Get user's current voting power (= total active staked tokens)
  getVotingPower: async (userId: string): Promise<number> => {
    const result = await prisma.stake.aggregate({
      where: { userId, status: 'ACTIVE' },
      _sum: { amount: true },
    });
    return Number(result._sum.amount || 0);
  },

  // Get delegated voting power (power delegated TO this user)
  getDelegatedPower: async (userId: string): Promise<number> => {
    // Find active delegations to this user
    const delegators = await prisma.delegation.findMany({
      where: {
        toUserId: userId,
        revokedAt: null,
      },
      select: { fromUserId: true },
    });

    if (delegators.length === 0) return 0;

    const result = await prisma.stake.aggregate({
      where: {
        userId: { in: delegators.map(d => d.fromUserId) },
        status: 'ACTIVE',
      },
      _sum: { amount: true },
    });

    return Number(result._sum.amount || 0);
  },

  // Total effective voting power (own + delegated)
  getEffectiveVotingPower: async (userId: string): Promise<number> => {
    // Check if this user has delegated their power away
    const delegation = await prisma.delegation.findFirst({
      where: { fromUserId: userId, revokedAt: null },
    });

    // If user delegated their power, they can't vote with it
    const ownPower = delegation 
      ? 0 
      : await GovernanceService.getVotingPower(userId);

    const delegatedPower = 
      await GovernanceService.getDelegatedPower(userId);

    return ownPower + delegatedPower;
  },

  // Create a proposal
  createProposal: async (params: {
    proposerId: string;
    title: string;
    description: string;
    type: string;
    executionData?: Record<string, unknown>;
  }) => {
    // Verify proposer has minimum stake
    const votingPower = await GovernanceService.getVotingPower(
      params.proposerId
    );

    if (votingPower < MIN_STAKE_TO_PROPOSE) {
      throw Object.assign(
        new Error(
          `Minimum ${MIN_STAKE_TO_PROPOSE} AGNT staked required to create proposals. ` +
          `You have ${votingPower} AGNT staked.`
        ),
        { code: 'INSUFFICIENT_STAKE', status: 403 }
      );
    }

    const startDate = new Date();
    const endDate = new Date(
      startDate.getTime() + 7 * 24 * 60 * 60 * 1000 // 7 days
    );

    const proposal = await prisma.proposal.create({
      data: {
        title: params.title,
        description: params.description,
        type: params.type as any,
        proposerId: params.proposerId,
        status: 'ACTIVE',
        startDate,
        endDate,
        executionData: (params.executionData as any) || {},
        quorum: 0.10,
        forVotes: 0,
        againstVotes: 0,
        abstainVotes: 0,
      },
      include: {
        proposer: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    logger.info('Proposal created', { 
      proposalId: proposal.id, 
      proposerId: params.proposerId 
    });

    return proposal;
  },

  // Cast a vote
  castVote: async (params: {
    proposalId: string;
    userId: string;
    choice: 'FOR' | 'AGAINST' | 'ABSTAIN';
  }) => {
    const { proposalId, userId, choice } = params;

    // Check proposal is active
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) {
      throw Object.assign(
        new Error('Proposal not found'),
        { code: 'PROPOSAL_NOT_FOUND', status: 404 }
      );
    }
    if (proposal.status !== 'ACTIVE') {
      throw Object.assign(
        new Error('Proposal is not active'),
        { code: 'PROPOSAL_NOT_ACTIVE', status: 400 }
      );
    }
    if (proposal.endDate < new Date()) {
      throw Object.assign(
        new Error('Voting period has ended'),
        { code: 'VOTING_ENDED', status: 400 }
      );
    }

    // Check user hasn't already voted
    const existing = await prisma.vote.findUnique({
      where: { proposalId_userId: { proposalId, userId } },
    });
    if (existing) {
      throw Object.assign(
        new Error('You have already voted on this proposal'),
        { code: 'ALREADY_VOTED', status: 409 }
      );
    }

    // Get effective voting power at time of vote
    const weight = await GovernanceService.getEffectiveVotingPower(userId);

    if (weight <= 0) {
      throw Object.assign(
        new Error('No voting power. Stake AGNT tokens to participate.'),
        { code: 'NO_VOTING_POWER', status: 403 }
      );
    }

    // Create vote + update proposal tallies atomically
    const vote = await prisma.$transaction(async (tx) => {
      const newVote = await tx.vote.create({
        data: {
          proposalId,
          userId,
          choice: choice as any,
          weight,
        },
      });

      // Update tally on proposal
      const tallyUpdate: any = {};
      if (choice === 'FOR') tallyUpdate.forVotes = { increment: weight };
      if (choice === 'AGAINST') tallyUpdate.againstVotes = { increment: weight };
      if (choice === 'ABSTAIN') tallyUpdate.abstainVotes = { increment: weight };

      await tx.proposal.update({
        where: { id: proposalId },
        data: tallyUpdate,
      });

      return newVote;
    });

    logger.info('Vote cast', { proposalId, userId, choice, weight });
    return vote;
  },

  // Delegate voting power to another user
  delegate: async (fromUserId: string, toUserId: string) => {
    if (fromUserId === toUserId) {
      throw Object.assign(
        new Error('Cannot delegate to yourself'),
        { code: 'SELF_DELEGATION', status: 400 }
      );
    }

    // Revoke any existing delegation from this user
    await prisma.delegation.updateMany({
      where: { fromUserId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // Create new delegation
    const delegation = await prisma.delegation.create({
      data: { fromUserId, toUserId },
      include: {
        toUser: { select: { id: true, name: true, email: true } },
      },
    });

    logger.info('Voting power delegated', { fromUserId, toUserId });
    return delegation;
  },

  // Revoke delegation
  revokeDelegate: async (userId: string) => {
    const result = await prisma.delegation.updateMany({
      where: { fromUserId: userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { revoked: result.count };
  },

  // Get proposal details with vote breakdown
  getProposalDetail: async (
    proposalId: string, 
    requestingUserId?: string
  ) => {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        proposer: {
          select: { id: true, name: true, avatar: true },
        },
        votes: {
          include: {
            user: { 
              select: { id: true, name: true, avatar: true } 
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!proposal) {
      throw Object.assign(
        new Error('Proposal not found'),
        { code: 'PROPOSAL_NOT_FOUND', status: 404 }
      );
    }

    const totalVotes = 
      Number(proposal.forVotes) + 
      Number(proposal.againstVotes) + 
      Number(proposal.abstainVotes);

    // Get total staked for quorum calculation
    const totalStakedResult = await prisma.balance.aggregate({
      _sum: { lockedTokens: true },
    });
    const totalStaked = Number(totalStakedResult._sum.lockedTokens || 1);

    const quorumReached = (totalVotes / totalStaked) >= Number(proposal.quorum);

    // Check if requesting user has voted
    let myVote: any = null;
    if (requestingUserId) {
      myVote = await prisma.vote.findUnique({
        where: { 
          proposalId_userId: { 
            proposalId, 
            userId: requestingUserId 
          } 
        },
      });
    }

    return {
      ...proposal,
      totalVotes,
      quorumReached,
      quorumRequired: Math.floor(totalStaked * Number(proposal.quorum)),
      myVote,
    };
  },

  // List proposals with filters
  listProposals: async (params: {
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) => {
    const { status, type, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        include: {
          proposer: {
            select: { id: true, name: true, avatar: true },
          },
          _count: { select: { votes: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.proposal.count({ where }),
    ]);

    return {
      proposals,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  },

  // Keep existing finalizeExpiredProposals method unchanged
  finalizeExpiredProposals: async () => {
    const now = new Date();

    const expired = await prisma.proposal.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { lt: now },
      },
    });

    let finalized = 0;
    const errors: string[] = [];

    for (const proposal of expired) {
      try {
        const totalVotes = 
          Number(proposal.forVotes) + 
          Number(proposal.againstVotes) + 
          Number(proposal.abstainVotes);

        // Get total active staked tokens for quorum check
        const totalStakedResult = await prisma.balance.aggregate({
          _sum: { lockedTokens: true },
        });
        const totalStaked = 
          Number(totalStakedResult._sum.lockedTokens || 1);

        const quorumReached = 
          (totalVotes / totalStaked) >= Number(proposal.quorum);

        const passed = quorumReached && 
          Number(proposal.forVotes) > Number(proposal.againstVotes);

        await prisma.proposal.update({
          where: { id: proposal.id },
          data: { 
            status: passed ? 'PASSED' : 'REJECTED' 
          },
        });

        // Notify all voters of result
        const votes = await prisma.vote.findMany({
          where: { proposalId: proposal.id },
          select: { userId: true }
        });

        for (const vote of votes) {
          await NotificationService.proposalResult(
            vote.userId,
            proposal.title,
            passed
          );
        }

        // Notify proposer
        await NotificationService.proposalResult(
          proposal.proposerId,
          proposal.title,
          passed
        );

        finalized++;
      } catch (error) {
        errors.push(`Proposal ${proposal.id}: ${error}`);
        logger.error('Failed to finalize proposal', { 
          proposalId: proposal.id, error 
        });
      }
    }

    return { finalized, errors };
  },
};
