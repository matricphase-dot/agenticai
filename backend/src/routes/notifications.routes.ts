import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();
router.use(authMiddleware);

// GET /notifications
router.get('/', async (req: Request, res: Response) => {
  try {
    const { read, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId: req.user!.id };
    if (read === 'true') where.read = true;
    if (read === 'false') where.read = false;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip,
      }),
      prisma.notification.count({
        where: { userId: req.user!.id, read: false },
      }),
    ]);

    return res.json({ 
      success: true, 
      data: { notifications, unreadCount } 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch notifications' 
    });
  }
});

// PUT /notifications/:id/read
router.put('/:id/read', async (req: Request, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.id },
      data: { read: true },
    });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false });
  }
});

// PUT /notifications/read-all
router.put('/read-all', async (req: Request, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, read: false },
      data: { read: true },
    });
    return res.json({ success: true, message: 'All marked as read' });
  } catch (error) {
    return res.status(500).json({ success: false });
  }
});

export default router;
