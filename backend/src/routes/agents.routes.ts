import { Router } from "express";
import { AgentService } from "../services/agent.service";
import { InvocationService } from "../services/invocation.service";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateMiddleware } from "../middleware/validate.middleware";
import { createAgentSchema } from "../lib/schemas";
import { auditMiddleware } from "../middleware/audit.middleware";
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { LLMService } from '../services/llm.service';
import logger from '../lib/logger';

const router = Router();

router.use(authMiddleware);

/**
 * @openapi
 * /api/agents:
 *   get:
 *     tags: [Agents]
 *     summary: List user agents
 */
router.get("/", async (req, res, next) => {
  try {
    const agents = await AgentService.listAgents({ userId: (req as any).user.id });
    res.json({ success: true, data: agents });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/agents:
 *   post:
 *     tags: [Agents]
 *     summary: Create a new agent
 */
router.post("/", auditMiddleware, validateMiddleware(createAgentSchema), async (req, res, next) => {
  try {
    const agent = await AgentService.createAgent((req as any).user.id, req.body);
    res.status(201).json({ success: true, data: agent });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/agents/{id}:
 *   get:
 *     tags: [Agents]
 *     summary: Get agent details
 */
router.get("/:id", async (req, res, next) => {
  try {
    const agent = await AgentService.getAgentById(req.params.id);
    if (!agent) {
      return res.status(404).json({ success: false, message: "Agent not found" });
    }
    res.json({ success: true, data: agent });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/agents/{id}/chat:
 *   post:
 *     tags: [Agents]
 *     summary: Chat with an agent in sandbox mode
 */
// POST /agents/:id/chat — sandbox test (cookie auth only)
router.post('/:id/chat', authMiddleware, async (req, res) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: req.params.id },
    });

    if (!agent || agent.userId !== req.user!.id) {
      return res.status(404).json({
        success: false,
        code: 'AGENT_NOT_FOUND',
        message: 'Agent not found',
      });
    }

    const { message } = z.object({ 
      message: z.string().min(1) 
    }).parse(req.body);

    // Sandbox: use platform API keys, no billing
    const result = await LLMService.call({
      provider: agent.modelProvider,
      model: agent.modelName,
      systemPrompt: agent.systemPrompt,
      userInput: message,
    });

    return res.json({
      success: true,
      data: {
        output: result.output,
        latencyMs: result.latencyMs,
        tokensUsed: result.totalTokens,
      },
    });
  } catch (error: any) {
    logger.error('Sandbox chat failed', { error });
    return res.status(500).json({ 
      success: false,
      code: 'CHAT_FAILED',
      message: 'Chat failed: ' + error.message
    });
  }
});

/**
 * @openapi
 * /api/agents/{id}:
 *   patch:
 *     tags: [Agents]
 *     summary: Update agent configuration
 */
router.patch("/:id", auditMiddleware, async (req, res, next) => {
  try {
    const agent = await AgentService.updateAgent(req.params.id, (req as any).user.id, req.body);
    res.json({ success: true, data: agent });
  } catch (err) {
    next(err);
  }
});

export default router;
