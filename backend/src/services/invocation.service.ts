import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { LLMService } from './llm.service';
import { SecretsService } from './secrets.service';
import { logger } from '../lib/logger';
import { RAGService } from './rag.service';

const PLATFORM_FEE = Number(process.env.PLATFORM_FEE_PERCENT || 20) / 100;
const STAKER_REWARD = Number(process.env.STAKER_REWARD_PERCENT || 30) / 100;
const NODE_REWARD_BASE = 0.001; // AGNT per task

export interface InvokeInput {
  agentId: string;
  callerId: string;         // userId making the call
  callerApiKeyId?: string;
  input: Record<string, unknown>;
  ipAddress?: string;
}

export interface InvokeResult {
  success: boolean;
  invocationId: string;
  output?: string | any;
  errorMessage?: string;
  tokensUsed: number;
  cost: number;
  status: string;
  latencyMs: number;
  provider?: string;
}

export const InvocationService = {

  invoke: async (params: InvokeInput): Promise<InvokeResult> => {
    const { agentId, callerId, callerApiKeyId, input, ipAddress } = params;

    // 1. Resolve agent
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { analytics: true },
    });

    if (!agent) {
      throw Object.assign(new Error('Agent not found'), { code: 'AGENT_NOT_FOUND', status: 404 });
    }
    if (agent.status !== 'PUBLISHED') {
      throw Object.assign(new Error('Agent is not available'), { code: 'AGENT_UNAVAILABLE', status: 400 });
    }

    // 2. Check caller credits
    const balance = await prisma.balance.findUnique({
      where: { userId: callerId },
    });

    const estimatedCost = agent.pricingModel === 'FREE' 
      ? 0 
      : agent.pricePerCall || 0;

    if (balance && balance.credits < estimatedCost) {
      throw Object.assign(
        new Error('Insufficient credits'), 
        { code: 'INSUFFICIENT_CREDITS', status: 402 }
      );
    }

    // 3. Find best compute node
    const node = await InvocationService.selectNode(agent);

    // 4. Create invocation record (PENDING)
    const invocation = await prisma.invocation.create({
      data: {
        agentId,
        userId: callerId,
        apiKeyId: callerApiKeyId || null,
        nodeId: node?.id || null,
        input: input as any,
        status: 'RUNNING',
        ipAddress: ipAddress || null,
      },
    });

    // Create NodeTask if node selected
    if (node) {
      await prisma.nodeTask.create({
        data: {
          nodeId: node.id,
          invocationId: invocation.id,
          agentId,
          input: input as any,
          status: 'RUNNING',
        },
      });
    }

    // 5. Get agent's bound secrets
    const secrets = await SecretsService.getAgentSecrets(agentId);

    // 6. Build input string from the input object
    const userInput = typeof input === 'string'
      ? input
      : JSON.stringify(input);

    // Inject secrets into system prompt as env var references
    let systemPrompt = agent.systemPrompt;
    for (const [key, value] of Object.entries(secrets)) {
      systemPrompt = systemPrompt.replace(
        new RegExp(`{{secret\\.${key}}}`, 'g'),
        value
      );
    }

    if (agent.ragEnabled) {
      const ragContext = await RAGService.buildContext(agent.id, userInput);
      if (ragContext) {
        systemPrompt = systemPrompt + ragContext;
        logger.info('RAG context added', { agentId: agent.id, contextLength: ragContext.length });
      }
    }

    let llmResult;
    let finalStatus: 'SUCCESS' | 'FAILED' = 'SUCCESS';
    let errorMessage: string | undefined;

    try {
      const startMs = Date.now();
      
      // 7. Call LLM Service (which handles fallbacks and circuit breakers)
      const result = await LLMService.call({
        systemPrompt,
        userInput,
        provider: agent.modelProvider,
        model: agent.modelName,
        customKeys: secrets,
        requireCustomKey: true,
      });

      llmResult = {
        output: result.output,
        tokensUsed: result.tokensUsed || 0,
        provider: result.provider,
        model: result.model,
        latencyMs: Date.now() - startMs,
      };
    } catch (error: any) {
      finalStatus = 'FAILED';
      errorMessage = error.message || 'LLM call failed';
      logger.error('LLM call failed during invocation', {
        invocationId: invocation.id,
        agentId,
        error,
      });
    }

    // 8. Calculate cost
    const cost = InvocationService.calculateCost(
      agent,
      llmResult?.tokensUsed || 0
    );

    // 9. Update invocation record
    await prisma.invocation.update({
      where: { id: invocation.id },
      data: {
        output: llmResult ? { text: llmResult.output } : Prisma.JsonNull,
        status: finalStatus,
        latencyMs: llmResult?.latencyMs || null,
        tokensUsed: llmResult?.tokensUsed || null,
        promptTokens: null, // New service doesn't split these currently, but tokensUsed is total
        completionTokens: null,
        cost,
        errorMessage: errorMessage || null,
      },
    });

    if (finalStatus === 'SUCCESS' && llmResult) {
      // 10. Billing — deduct + distribute (atomic)
      await InvocationService.processBilling({
        callerId,
        agentOwnerId: agent.userId,
        nodeOwnerId: node?.userId,
        invocationId: invocation.id,
        agentId,
        cost,
      });

      // 11. Update node task
      if (node) {
        await prisma.nodeTask.update({
          where: { invocationId: invocation.id },
          data: {
            output: { text: llmResult.output } as any,
            status: 'COMPLETED',
            completedAt: new Date(),
            reward: NODE_REWARD_BASE,
          },
        });

        // Update node stats
        await prisma.node.update({
          where: { id: node.id },
          data: {
            totalTasks: { increment: 1 },
            successfulTasks: { increment: 1 },
            totalEarned: { increment: NODE_REWARD_BASE },
            status: 'ONLINE',
          },
        });
      }

      // 12. Update agent analytics
      await InvocationService.updateAnalytics(
        agentId,
        true,
        llmResult.latencyMs,
        cost
      );

    } else {
      // Failed — update node task and agent analytics
      if (node) {
        await prisma.nodeTask.update({
          where: { invocationId: invocation.id },
          data: { status: 'FAILED', completedAt: new Date() },
        }).catch(() => {});

        await prisma.node.update({
          where: { id: node.id },
          data: {
            totalTasks: { increment: 1 },
            failedTasks: { increment: 1 },
            status: 'ONLINE',
          },
        });
      }

      await InvocationService.updateAnalytics(agentId, false, 0, 0);
    }

    return {
      success: finalStatus === 'SUCCESS',
      invocationId: invocation.id,
      output: llmResult?.output,
      errorMessage,
      tokensUsed: llmResult?.tokensUsed || 0,
      cost,
      status: finalStatus,
      latencyMs: llmResult?.latencyMs || 0,
      provider: llmResult?.provider,
    };
  },

  // Select best available compute node
  selectNode: async (agent: any) => {
    const nodes = await prisma.node.findMany({
      where: {
        status: 'ONLINE',
        ...(agent.gpuRequired ? { gpuType: { not: null } } : {}),
      },
      orderBy: [
        { reputation: 'desc' },
        { pricePerTask: 'asc' },
      ],
      take: 1,
    });

    return nodes[0] || null;
  },

  // Calculate cost based on pricing model
  calculateCost: (agent: any, tokensUsed: number): number => {
    switch (agent.pricingModel) {
      case 'FREE':
        return 0;
      case 'PER_INVOCATION':
        return Number(agent.pricePerCall || 0);
      case 'PER_TOKEN':
        return Number(agent.pricePerToken || 0) * tokensUsed;
      default:
        return 0;
    }
  },

  // Process billing atomically
  processBilling: async (params: {
    callerId: string;
    agentOwnerId: string;
    nodeOwnerId?: string;
    invocationId: string;
    agentId: string;
    cost: number;
  }) => {
    if (params.cost === 0) return;

    const platformFee = params.cost * PLATFORM_FEE;
    const creatorShare = params.cost - platformFee;

    await prisma.$transaction(async (tx) => {
      // Deduct from caller
      await tx.balance.update({
        where: { userId: params.callerId },
        data: { credits: { decrement: params.cost } },
      });

      // Log deduction
      await tx.transaction.create({
        data: {
          userId: params.callerId,
          type: 'INVOCATION_CHARGE',
          amount: -params.cost,
          description: `Agent invocation`,
          metadata: { 
            invocationId: params.invocationId,
            agentId: params.agentId 
          },
        },
      });

      // Credit agent creator (80% of fee)
      if (params.agentOwnerId !== params.callerId) {
        await tx.balance.upsert({
          where: { userId: params.agentOwnerId },
          create: { userId: params.agentOwnerId, earnedCredits: creatorShare },
          update: { earnedCredits: { increment: creatorShare } },
        });

        await tx.transaction.create({
          data: {
            userId: params.agentOwnerId,
            type: 'AGENT_EARNING',
            amount: creatorShare,
            description: `Agent usage revenue`,
            metadata: { 
              invocationId: params.invocationId,
              agentId: params.agentId 
            },
          },
        });
      }

      // Credit node operator
      if (params.nodeOwnerId) {
        await tx.balance.upsert({
          where: { userId: params.nodeOwnerId },
          create: { 
            userId: params.nodeOwnerId, 
            earnedCredits: NODE_REWARD_BASE 
          },
          update: { earnedCredits: { increment: NODE_REWARD_BASE } },
        });

        await tx.transaction.create({
          data: {
            userId: params.nodeOwnerId,
            type: 'NODE_REWARD',
            amount: NODE_REWARD_BASE,
            description: `Node task reward`,
            metadata: { 
              invocationId: params.invocationId 
            },
          },
        });
      }
    });
  },

  // Update agent analytics after invocation
  updateAnalytics: async (
    agentId: string,
    success: boolean,
    latencyMs: number,
    earnings: number
  ) => {
    const analytics = await prisma.agentAnalytics.findUnique({
      where: { agentId },
    });

    if (!analytics) {
      await prisma.agentAnalytics.create({
        data: {
          agentId,
          totalInvocations: 1,
          successCount: success ? 1 : 0,
          failureCount: success ? 0 : 1,
          avgLatencyMs: latencyMs,
          totalEarnings: earnings,
        },
      });
      return;
    }

    const newTotal = analytics.totalInvocations + 1;
    const newAvgLatency = success
      ? Math.round(
          (analytics.avgLatencyMs * analytics.totalInvocations + latencyMs) 
          / newTotal
        )
      : analytics.avgLatencyMs;

    await prisma.agentAnalytics.update({
      where: { agentId },
      data: {
        totalInvocations: { increment: 1 },
        successCount: success ? { increment: 1 } : undefined,
        failureCount: !success ? { increment: 1 } : undefined,
        avgLatencyMs: newAvgLatency,
        totalEarnings: { increment: earnings },
      },
    });
  },
};
