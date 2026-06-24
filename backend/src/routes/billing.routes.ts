import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

const router = Router();
router.use(authMiddleware);

// GET /billing/config
router.get('/config', async (req: Request, res: Response) => {
  return res.json({
    success: true,
    data: {
      paypalClientId: process.env.PAYPAL_CLIENT_ID || 'ATzN4HypBBqHLV-gTUdguwwmoeejltZ8dmm-SJN-HrGymtsKdul2oaoYF8z8fOkdDkYHap-DQy00qUt1',
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_live_SlC9oFgIO6E4iy'
    }
  });
});

// GET /billing/balance
router.get('/balance', async (req: Request, res: Response) => {
  try {
    const balance = await prisma.balance.findUnique({
      where: { userId: req.user!.id },
    });
    return res.json({ success: true, data: balance || {
      credits: 0, lockedCredits: 0, tokenBalance: 0, lockedTokens: 0
    }});
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch balance' 
    });
  }
});

// POST /billing/topup — add credits (mock payment)
router.post('/topup', async (req: Request, res: Response) => {
  try {
    const { amount } = z.object({
      amount: z.number().min(1).max(10000),
    }).parse(req.body);

    const balance = await prisma.$transaction(async (tx) => {
      const updated = await tx.balance.upsert({
        where: { userId: req.user!.id },
        create: { userId: req.user!.id, credits: amount },
        update: { credits: { increment: amount } },
      });

      await tx.transaction.create({
        data: {
          userId: req.user!.id,
          type: 'TOPUP',
          amount,
          description: `Credit top-up: $${amount}`,
          metadata: { source: 'mock_payment' },
        },
      });

      return updated;
    });

    return res.json({
      success: true,
      data: balance,
      message: `${amount} credits added`,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(422).json({ 
        success: false, 
        message: 'Invalid amount' 
      });
    }
    return res.status(500).json({ 
      success: false, 
      message: 'Top-up failed' 
    });
  }
});

// GET /billing/transactions
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const { type, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId: req.user!.id };
    if (type) where.type = type;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip,
      }),
      prisma.transaction.count({ where }),
    ]);

    return res.json({
      success: true,
      data: transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch transactions' 
    });
  }
});

// POST /billing/payout
router.post('/payout', async (req: Request, res: Response) => {
  try {
    const { amount, payoutMethod, payoutDetails } = z.object({
      amount: z.number().min(5000), // $50 minimum
      payoutMethod: z.string().min(1),
      payoutDetails: z.string().min(1),
    }).parse(req.body);

    const balance = await prisma.balance.findUnique({
      where: { userId: req.user!.id },
    });

    if (!balance || balance.earnedCredits.lessThan(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient earned credits for payout',
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Deduct from earnedCredits
      await tx.balance.update({
        where: { userId: req.user!.id },
        data: { earnedCredits: { decrement: amount } },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId: req.user!.id,
          type: 'PAYOUT',
          amount: -amount,
          description: `Payout request via ${payoutMethod}`,
        },
      });

      // Create PayoutRequest
      const payoutReq = await tx.payoutRequest.create({
        data: {
          userId: req.user!.id,
          amount,
          payoutMethod,
          payoutDetails,
          status: 'PENDING',
        },
      });

      return payoutReq;
    });

    return res.json({
      success: true,
      data: result,
      message: 'Payout requested successfully',
    });
  } catch (error: any) {
    logger.error('Payout request failed', { error });
    if (error.name === 'ZodError') {
      return res.status(422).json({ success: false, message: 'Invalid payout details or amount (minimum 5000)' });
    }
    return res.status(500).json({ success: false, message: 'Payout request failed' });
  }
});

// GET /billing/payout
router.get('/payout', async (req: Request, res: Response) => {
  try {
    const payouts = await prisma.payoutRequest.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: payouts });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch payouts' });
  }
});


// --- Razorpay Routes ---

// POST /billing/razorpay/create-order
router.post('/razorpay/create-order', async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'INR' } = z.object({
      amount: z.number().min(1),
      currency: z.string().optional(),
    }).parse(req.body);

    const { RazorpayService } = await import('../services/razorpay.service');
    const orderData = await RazorpayService.createOrder(amount, req.user!.id, currency);

    return res.json({ success: true, data: orderData });
  } catch (error: any) {
    logger.error('Razorpay order route failed', { error: error.message });
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to create payment order'
    });
  }
});

// POST /billing/razorpay/verify
router.post('/razorpay/verify', async (req: Request, res: Response) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, amount, currency = 'INR' } = z.object({
      razorpayOrderId: z.string(),
      razorpayPaymentId: z.string(),
      razorpaySignature: z.string(),
      amount: z.number(),
      currency: z.string().optional(),
    }).parse(req.body);

    const { RazorpayService } = await import('../services/razorpay.service');
    const isValid = RazorpayService.verifyPayment(
      razorpayOrderId, 
      razorpayPaymentId, 
      razorpaySignature
    );

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'PAYMENT_TAMPERED' });
    }

    const balance = await RazorpayService.addCreditsAfterPayment(
      req.user!.id, 
      amount, 
      razorpayPaymentId,
      currency
    );

    return res.json({ 
      success: true, 
      data: { 
        balance: balance.credits, 
        creditsAdded: amount 
      } 
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// --- PayPal Routes ---

// POST /billing/paypal/create-order
router.post('/paypal/create-order', async (req: Request, res: Response) => {
  try {
    const { amountUSD } = z.object({
      amountUSD: z.number().min(1),
    }).parse(req.body);

    const { PaypalService } = await import('../services/paypal.service');
    const order = await PaypalService.createOrder(amountUSD, req.user!.id);

    return res.json({ success: true, data: order });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /billing/paypal/capture
router.post('/paypal/capture', async (req: Request, res: Response) => {
  try {
    const { orderId } = z.object({
      orderId: z.string(),
    }).parse(req.body);

    const { PaypalService } = await import('../services/paypal.service');
    const result = await PaypalService.captureOrder(orderId, req.user!.id);

    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
