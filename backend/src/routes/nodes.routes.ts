import { Router } from "express";
import { NodeService } from "../services/node.service";
import { authMiddleware } from "../middleware/auth.middleware";
import { auditMiddleware } from "../middleware/audit.middleware";

const router = Router();

router.get("/", authMiddleware, async (req: any, res, next) => {
  try {
    const nodes = await NodeService.listNodes({ userId: req.user.id });
    res.json({ success: true, data: nodes });
  } catch (err) {
    next(err);
  }
});

router.post("/register", authMiddleware, auditMiddleware, async (req: any, res, next) => {
  try {
    const result = await NodeService.registerNode(req.user.id, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post("/heartbeat", async (req, res, next) => {
  try {
    await NodeService.heartbeat(req.body.nodeApiKey);
    res.json({ success: true, message: "Heartbeat recorded" });
  } catch (err) {
    next(err);
  }
});

export default router;
