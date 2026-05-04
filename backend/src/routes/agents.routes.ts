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
import { AgentStatus } from "@prisma/client";
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
        tokensUsed: result.tokensUsed,
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
  } catch (err: any) {
    if (err.message.includes("unauthorized")) {
      return res.status(403).json({ success: false, message: err.message });
    }
    if (err.message.includes("not found")) {
      return res.status(404).json({ success: false, message: err.message });
    }
    next(err);
  }
});

/**
 * @openapi
 * /api/agents/{id}:
 *   put:
 *     tags: [Agents]
 *     summary: Update agent configuration
 */
router.put("/:id", auditMiddleware, async (req, res, next) => {
  try {
    const agent = await AgentService.updateAgent(req.params.id, (req as any).user.id, req.body);
    res.json({ success: true, data: agent });
  } catch (err: any) {
    if (err.message.includes("unauthorized")) {
      return res.status(403).json({ success: false, message: err.message });
    }
    if (err.message.includes("not found")) {
      return res.status(404).json({ success: false, message: err.message });
    }
    next(err);
  }
});

/**
 * @openapi
 * /api/agents/{id}/publish:
 *   post:
 *     tags: [Agents]
 *     summary: Publish an agent
 */
router.post("/:id/publish", auditMiddleware, async (req, res, next) => {
  try {
    const agent = await prisma.agent.findUnique({ where: { id: req.params.id } });
    if (!agent || agent.userId !== (req as any).user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized or agent not found" });
    }

    const updated = await prisma.agent.update({
      where: { id: req.params.id },
      data: { status: AgentStatus.PUBLISHED, isPublic: true }
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", auditMiddleware, async (req, res, next) => {
  try {
    await AgentService.deleteAgent(req.params.id, (req as any).user.id);
    res.json({ success: true, message: "Agent deleted" });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/analytics", async (req, res, next) => {
  try {
    const analytics = await AgentService.getAnalytics(req.params.id);
    res.json({ success: true, data: analytics });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/versions", async (req, res, next) => {
  try {
    const versions = await AgentService.getVersions(req.params.id);
    res.json({ success: true, data: versions });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/versions", auditMiddleware, async (req, res, next) => {
  try {
    const version = await AgentService.createVersion(req.params.id, (req as any).user.id, req.body);
    res.json({ success: true, data: version });
  } catch (err) {
    next(err);
  }
});

export default router;
