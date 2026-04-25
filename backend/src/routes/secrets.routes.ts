import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.middleware';
import { SecretsService } from '../services/secrets.service';
import { prisma } from '../lib/prisma';

const router = Router();
router.use(authMiddleware);

// GET /secrets — list names only (never values)
router.get('/', async (req: Request, res: Response) => {
  const secrets = await prisma.secret.findMany({
    where: { userId: req.user!.id },
    select: {
      id: true,
      name: true,
      createdAt: true,
      bindings: {
        select: {
          agent: { select: { id: true, name: true } },
          envVar: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ success: true, data: secrets });
});

// POST /secrets — store encrypted secret
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, value } = z.object({
      name: z.string()
        .min(1)
        .max(100)
        .regex(/^[A-Z][A-Z0-9_]*$/, 
          'Name must be UPPER_SNAKE_CASE'
        ),
      value: z.string().min(1),
    }).parse(req.body);

    const secret = await SecretsService.storeSecret(
      req.user!.id, 
      name, 
      value
    );

    return res.status(201).json({
      success: true,
      data: { id: secret.id, name: secret.name },
      message: 'Secret stored securely',
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(422).json({
        success: false,
        message: error.errors[0]?.message || 'Invalid secret',
      });
    }
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to store secret' 
    });
  }
});

// DELETE /secrets/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.secret.deleteMany({
      where: { id: req.params.id, userId: req.user!.id },
    });
    return res.json({ success: true, message: 'Secret deleted' });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Delete failed' 
    });
  }
});

export default router;
