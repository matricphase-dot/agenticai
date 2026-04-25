import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';
import { EmailService } from '../services/email.service';
import { 
  rateLimitLogin, 
  rateLimitSignup,
  rateLimitForgotPassword 
} from '../middleware/rateLimitAuth.middleware';

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// POST /auth/signup
router.post('/signup', rateLimitSignup, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(2).max(100),
    });
    
    const { email, password, name } = schema.parse(req.body);
    const { user, verifyToken } = await AuthService.signup({ 
      email, password, name 
    });

    // TODO: Send verification email with verifyToken
    // EmailService.sendVerification(email, verifyToken)
    // For development: return token directly
    const devToken = process.env.NODE_ENV === 'development' 
      ? verifyToken 
      : undefined;

    res.status(201).json({
      success: true,
      message: 'Account created. Please verify your email.',
      data: { 
        userId: user.id,
        ...(devToken && { devVerifyToken: devToken })
      },
    });
  } catch (error: any) {
    if (error.message === 'EMAIL_EXISTS') {
      return res.status(409).json({ 
        success: false, 
        code: 'EMAIL_EXISTS',
        message: 'An account with this email already exists' 
      });
    }
    if (error.name === 'ZodError') {
      return res.status(422).json({ 
        success: false, 
        code: 'VALIDATION_ERROR',
        message: 'Invalid input', 
        details: error.errors 
      });
    }
    logger.error('Signup failed', { route: '/auth/signup', error });
    return res.status(500).json({ 
      success: false, 
      code: 'SIGNUP_FAILED',
      message: 'Signup failed' 
    });
  }
});

// POST /auth/login
router.post('/login', rateLimitLogin, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string(),
    });
    
    const { email, password } = schema.parse(req.body);
    const result = await AuthService.login(email, password);

    if ('requires2FA' in result && result.requires2FA) {
      return res.json({ 
        success: true, 
        requires2FA: true,
        partialToken: (result as any).partialToken 
      });
    }

    // Set httpOnly cookie
    const { token, user } = result as { token: string; user: any };
    res.cookie('jwt_token', token, COOKIE_OPTIONS);

    const refreshToken = await AuthService.generateRefreshToken(
      user.id
    );

    // Set refresh token as separate httpOnly cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/api/auth/refresh', // Only sent to refresh endpoint
    });

    return res.json({
      success: true,
      data: { 
        user,
        token // Also return for mobile/API clients
      },
    });
  } catch (error: any) {
    if (error.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ 
        success: false, 
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password' 
      });
    }
    if (error.message === 'EMAIL_NOT_VERIFIED') {
      return res.status(401).json({ 
        success: false, 
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email before logging in' 
      });
    }
    logger.error('Login failed', { route: '/auth/login', error });
    return res.status(500).json({ 
      success: false, 
      code: 'LOGIN_FAILED',
      message: 'Login failed' 
    });
  }
});

// POST /auth/logout
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  await AuthService.revokeAllRefreshTokens(req.user!.id);
  res.clearCookie('jwt_token', { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth/refresh',
  });
  res.json({ success: true, message: 'Logged out' });
});

// GET /auth/verify-email?token=xxx
router.get('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ 
        success: false, 
        code: 'MISSING_TOKEN',
        message: 'Verification token required' 
      });
    }

    await AuthService.verifyEmail(token);
    
    // Redirect to login with success message
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/auth/login?verified=true`);
  } catch (error: any) {
    logger.error('Email verification failed', { 
      route: '/auth/verify-email', error 
    });
    return res.status(400).json({ 
      success: false, 
      code: 'INVALID_TOKEN',
      message: 'Invalid or expired verification token' 
    });
  }
});

// POST /auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        code: 'NO_REFRESH_TOKEN',
        message: 'Refresh token required',
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = 
      await AuthService.rotateRefreshToken(refreshToken);

    // Set new tokens
    res.cookie('jwt_token', accessToken, COOKIE_OPTIONS);
    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/api/auth/refresh',
    });

    return res.json({ success: true, message: 'Token refreshed' });
  } catch (error: any) {
    res.clearCookie('jwt_token');
    res.clearCookie('refresh_token', { path: '/api/auth/refresh' });

    const code = error.message === 'REFRESH_TOKEN_REUSE'
      ? 'TOKEN_REUSE_DETECTED'
      : 'INVALID_REFRESH_TOKEN';

    return res.status(401).json({ success: false, code });
  }
});

// POST /auth/resend-verification
router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    
    const user = await prisma.user.findFirst({
      where: { email, emailVerified: false }
    });

    if (user) {
      const { token, hash } = AuthService.generateVerifyToken();
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerifyToken: hash }
      });
      await EmailService.sendVerification(user.email, user.name, token);
    }

    return res.json({ 
      success: true, 
      message: 'If that account is unverified, a new link has been sent' 
    });
  } catch (error) {
    logger.error('Resend verification failed', { error });
    return res.status(500).json({ success: false, message: 'Request failed' });
  }
});

// POST /auth/forgot-password
router.post('/forgot-password', rateLimitForgotPassword, async (req: Request, res: Response) => {
  try {
    const { email } = z.object({ 
      email: z.string().email() 
    }).parse(req.body);
    
    const result = await AuthService.forgotPassword(email);
    
    if (result) {
      // TODO: Send reset email
      // EmailService.sendPasswordReset(email, result.resetToken)
      logger.info('Password reset requested', { email });
    }

    // Always return success (don't reveal if email exists)
    return res.json({ 
      success: true, 
      message: 'If that email exists, a reset link has been sent' 
    });
  } catch (error) {
    logger.error('Forgot password failed', { 
      route: '/auth/forgot-password', error 
    });
    return res.status(500).json({ 
      success: false, 
      code: 'REQUEST_FAILED',
      message: 'Request failed' 
    });
  }
});

// POST /auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      token: z.string(),
      password: z.string().min(8),
    });
    const { token, password } = schema.parse(req.body);
    
    await AuthService.resetPassword(token, password);
    
    return res.json({ 
      success: true, 
      message: 'Password reset successfully' 
    });
  } catch (error: any) {
    if (error.message === 'INVALID_OR_EXPIRED_TOKEN') {
      return res.status(400).json({ 
        success: false, 
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired reset token' 
      });
    }
    logger.error('Reset password failed', { 
      route: '/auth/reset-password', error 
    });
    return res.status(500).json({ 
      success: false, 
      code: 'RESET_FAILED',
      message: 'Password reset failed' 
    });
  }
});

// GET /auth/me — get current user
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        code: 'USER_NOT_FOUND',
        message: 'User not found' 
      });
    }

    return res.json({ success: true, data: user });
  } catch (error) {
    logger.error('Get me failed', { 
      route: '/auth/me', 
      userId: req.user?.id, 
      error 
    });
    return res.status(500).json({ 
      success: false, 
      code: 'FETCH_FAILED',
      message: 'Failed to fetch user' 
    });
  }
});

export default router;
