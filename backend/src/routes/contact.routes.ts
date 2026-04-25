import { Router } from 'express';
import { logger } from '../lib/logger';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    // Log to console for now as requested
    logger.info('Contact Form Submission:', { name, email, message });
    
    res.json({
      success: true,
      message: 'Message received successfully'
    });
  } catch (error) {
    logger.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process message'
    });
  }
});

export default router;
