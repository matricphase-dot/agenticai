import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';
import { EmailService } from '../services/email.service';
import { 
  rateLimitLogin as rateLimitLoginOld, 
  rateLimitSignup as rateLimitSignupOld,
  rateLimitForgotPassword as rateLimitForgotPasswordOld 
} from '../middleware/rateLimitAuth.middleware';
import { 
  authRateLimit as rateLimitLogin,
  publicRateLimit as rateLimitSignup,
  publicRateLimit as rateLimitForgotPassword
} from '../middleware/rate-limit.middleware';
import { signupSchema, loginSchema } from '../lib/schemas';

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// POST /auth/signup
router.post('/signup', rateLimitSignup, async (req, res) => {
  try {
    const { email, password, name } = z.object({
      email: z.string().email(),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      name: z.string().min(2, 'Name must be at least 2 characters'),
    }).parse(req.body);

    const { user, verifyToken } = await AuthService.signup({
      email, password, name
    });

    // Send verification email
    try {
      await EmailService.sendVerification(user.email, user.name, verifyToken);
    } catch (emailError) {
      logger.error('Failed to send verification email', { emailError });
    }

    return res.status(201).json({
      success: true,
      message: 'Account created! Please check your email to verify your account.',
      data: {
        userId: user.id,
        // In development return token directly so testing works
        ...(process.env.NODE_ENV === 'development' && {
          devVerifyToken: verifyToken,
          devVerifyUrl: `${process.env.FRONTEND_URL}/auth/verify-email?token=${verifyToken}`,
        }),
      },
    });
  } catch (error: any) {
    if (error.message === 'EMAIL_EXISTS') {
      return res.status(409).json({
        success: false,
        code: 'EMAIL_EXISTS',
        message: 'An account with this email already exists. Please log in.',
      });
    }
    if (error.name === 'ZodError') {
      return res.status(422).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: error.errors[0]?.message || 'Invalid input',
        details: error.errors,
      });
    }
    logger.error('Signup failed', { error });
    return res.status(500).json({
      success: false,
      code: 'SIGNUP_FAILED',
      message: 'Signup failed. Please try again.',
    });
  }
});

// POST /api/auth/login
router.post('/login', rateLimitLogin, async (req, res) => {
  try {
    const { email, password } = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }).parse(req.body);

    const result = await AuthService.login(email, password);

    if ('requires2FA' in result && result.requires2FA) {
      return res.json({
        success: true,
        requires2FA: true,
        partialToken: result.partialToken,
      });
    }

    // Set cookie for same-domain (backup)
    res.cookie('jwt_token', result.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none', // CRITICAL for cross-domain
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    // ALSO return token in body for cross-domain localStorage auth
    return res.json({
      success: true,
      data: {
        token: result.token, // Frontend stores this in localStorage
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        },
      },
    });
  } catch (error: any) {
    if (error.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }
    if (error.message === 'EMAIL_NOT_VERIFIED') {
      return res.status(401).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email. Check your inbox or use a demo account.',
      });
    }
    logger.error('Login failed', { error });
    return res.status(500).json({
      success: false,
      code: 'LOGIN_FAILED',
      message: 'Login failed. Please try again.',
      debug: error.message,
    });
  }
});

// POST /auth/logout
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  await AuthService.revokeAllRefreshTokens(req.user!.id);
  res.clearCookie('jwt_token', { 
    httpOnly: true, 
    secure: true,
    sameSite: 'none',
  });
  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/api/auth/refresh',
  });
  res.json({ success: true, message: 'Logged out' });
});

// GET /api/auth/verify-email?token=xxx
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/verify-email?error=missing_token`
      );
    }

    const user = await AuthService.verifyEmail(token);

    // Auto-login after verification
    const jwtToken = AuthService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role ?? 'USER',
    });

    // Redirect to frontend with token so user is auto-logged in
    return res.redirect(
      `${process.env.FRONTEND_URL}/auth/verify-email?token=${jwtToken}&verified=true`
    );
  } catch (error: any) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/auth/verify-email?error=invalid_token`
    );
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
      secure: true,
      sameSite: 'none',
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
      await EmailService.sendPasswordReset(
        result.user.email,
        result.user.name, 
        result.resetToken
      );
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
