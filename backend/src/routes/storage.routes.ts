import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth.middleware";
import { encryptionService } from "../services/encryption.service";

const router = Router();

router.use(authMiddleware);

router.get("/:agentId", async (req, res, next) => {
  try {
    const storage = await prisma.agentStorage.findMany({
      where: { agentId: req.params.agentId }
    });
    res.json({ success: true, data: storage });
  } catch (err) {
    next(err);
  }
});

router.post("/:agentId", async (req, res, next) => {
  try {
    const { key, value } = req.body;
    const { encrypted, iv } = encryptionService.encrypt(value);
    
    const item = await prisma.agentStorage.upsert({
      where: { agentId_key: { agentId: req.params.agentId, key } },
      update: { value: encrypted, iv },
      create: { agentId: req.params.agentId, key, value: encrypted, iv }
    });
    
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

export default router;
