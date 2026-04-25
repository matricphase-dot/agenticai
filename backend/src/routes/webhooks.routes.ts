import { Router } from "express";
import { WebhookService } from "../services/webhook.service";
import { authMiddleware } from "../middleware/auth.middleware";
import { auditMiddleware } from "../middleware/audit.middleware";
import { prisma } from "../lib/prisma";


const router = Router();

router.use(authMiddleware);

router.get("/", async (req: any, res, next) => {
  try {
    const webhooks = await prisma.webhook.findMany({ where: { userId: req.user.id } });
    res.json({ success: true, data: webhooks });
  } catch (err) {
    next(err);
  }
});

router.post("/", auditMiddleware, async (req: any, res, next) => {
  try {
    const webhook = await WebhookService.createWebhook(req.user.id, req.body);
    res.status(201).json({ success: true, data: webhook });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/deliveries", async (req: any, res, next) => {
  try {
    const deliveries = await prisma.webhookDelivery.findMany({
      where: { webhookId: req.params.id },
      orderBy: { deliveredAt: 'desc' },
      take: 50
    });
    res.json({ success: true, data: deliveries });
  } catch (err) {
    next(err);
  }
});

export default router;
