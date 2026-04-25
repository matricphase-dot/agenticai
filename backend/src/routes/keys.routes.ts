import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

const router = Router();
router.use(authMiddleware);

// GET /keys — list user's API keys (never return full key)
router.get('/', async (req, res) => {
  const keys = await prisma.apiKey.findMany({
    where: { userId: req.user!.id },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      rateLimit: true,
      lastUsedAt: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: keys });
});

// POST /keys — create new API key
router.post('/', async (req, res) => {
  try {
    const { name } = z.object({ 
      name: z.string().min(1).max(100) 
    }).parse(req.body);

    // Generate key: sk-agnt- + 32 random bytes
    const rawKey = 'sk-agnt-' + crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256')
      .update(rawKey)
      .digest('hex');
    const keyPrefix = rawKey.substring(0, 14) + '...';

    const key = await prisma.apiKey.create({
      data: {
        userId: req.user!.id,
        name,
        keyHash,
        keyPrefix,
        rateLimit: 100,
        isActive: true,
      },
    });

    // Return the FULL key only once
    return res.status(201).json({
      success: true,
      data: {
        id: key.id,
        name: key.name,
        key: rawKey, // shown only this once
        keyPrefix,
        createdAt: key.createdAt,
      },
    });
  } catch (error) {
    logger.error('Create API key failed', { error });
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to create key' 
    });
  }
});

// DELETE /keys/:id — revoke key
router.delete('/:id', async (req, res) => {
  await prisma.apiKey.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data: { isActive: false },
  });
  res.json({ success: true, message: 'API key revoked' });
});

export { router as keysRouter };
