import { Router } from 'express';
import { logger } from '../lib/logger';

const router = Router();

// Middleware: verify cron secret
const verifyCronSecret = (req: any, res: any, next: any) => {
  const secret = req.headers['x-cron-secret'];
  if (secret !== process.env.INTERNAL_CRON_SECRET) {
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized' 
    });
  }
  next();
};

router.use(verifyCronSecret);

// POST /cron/distribute-rewards — manual trigger
router.post('/distribute-rewards', async (req, res) => {
  try {
    const { StakingService } = await import('../services/staking.service');
    const result = await StakingService.distributeRewards();
    return res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Manual reward distribution failed', { error });
    return res.status(500).json({ success: false, error });
  }
});

// POST /cron/process-unstakes — manual trigger
router.post('/process-unstakes', async (req, res) => {
  try {
    const { StakingService } = await import('../services/staking.service');
    const result = await StakingService.processMaturedUnstakes();
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
});

// POST /cron/node-health — manual trigger
router.post('/node-health', async (req, res) => {
  try {
    const { NodeService } = await import('../services/node.service');
    const result = await NodeService.markOfflineNodes();
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
});

export { router as cronRouter };
