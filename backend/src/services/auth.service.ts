import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { EmailService } from './email.service';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = 12;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters. Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const AuthService = {

  // Hash password
  hashPassword: async (password: string): Promise<string> => {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  },

  // Compare password
  comparePassword: async (
    password: string, 
    hash: string
  ): Promise<boolean> => {
    return bcrypt.compare(password, hash);
  },

  // Generate JWT
  generateToken: (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
    return jwt.sign(payload as object, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES_IN as any,
      algorithm: 'HS256'
    });
  },

  // Verify JWT
  verifyToken: (token: string): JwtPayload => {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as JwtPayload;
  },

  // Generate email verification token
  generateVerifyToken: (): { token: string; hash: string } => {
    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    return { token, hash };
  },

  // Signup
  signup: async (data: {
    email: string;
    password: string;
    name: string;
  }) => {
    const existing = await prisma.user.findUnique({ 
      where: { email: data.email } 
    });
    if (existing) {
      throw new Error('EMAIL_EXISTS');
    }

    const passwordHash = await AuthService.hashPassword(data.password);
    const { token: verifyToken, hash: verifyHash } = 
      AuthService.generateVerifyToken();

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          emailVerifyToken: verifyHash,
          emailVerified: true, // Auto-verified on signup to remove inbox block
        },
      });

      // Create starting balance record
      try {
        await tx.balance.create({
          data: {
            userId: newUser.id,
            credits: 0,
            tokenBalance: 0,
          },
        });
      } catch (e) {
        logger.warn('Could not create balance', { userId: newUser.id });
      }

      // Create default API Key for playground/agent testing
      try {
        const rawKey = 'sk-agnt-' + crypto.randomBytes(32).toString('hex');
        const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
        const keyPrefix = rawKey.substring(0, 14) + '...';
        await tx.apiKey.create({
          data: {
            userId: newUser.id,
            name: 'Default Playground Key',
            keyHash,
            keyPrefix,
            rateLimit: 100,
            isActive: true,
          },
        });
      } catch (e) {
        logger.warn('Could not create default API key', { userId: newUser.id });
      }

      return newUser;
    });

    logger.info('User signed up', { userId: user.id, email: user.email });
    
    return { user, verifyToken };
  },

  // Login
  login: async (email: string, password: string) => {
    const user = await prisma.user.findUnique({ 
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        name: true,
        role: true,
        emailVerified: true,
        twoFactorEnabled: true,
      }
    });

    if (!user || !user.passwordHash) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const valid = await AuthService.comparePassword(
      password, 
      user.passwordHash
    );
    if (!valid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    if (!user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      }).catch(() => {});
      user.emailVerified = true;
    }

    if (user.twoFactorEnabled) {
      // Return partial token requiring 2FA
      const partialToken = jwt.sign(
        { userId: user.id, email: user.email, pending2FA: true } as object,
        JWT_SECRET,
        { expiresIn: '10m' }
      );
      return { requires2FA: true, partialToken };
    }

    const token = AuthService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role ?? 'USER',
    });

    logger.info('User logged in', { userId: user.id });
    
    return { 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        role: user.role 
      } 
    };
  },

  // Verify email
  verifyEmail: async (token: string) => {
    const hash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: hash },
    });

    if (!user) {
      throw new Error('INVALID_TOKEN');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        emailVerified: true, 
        emailVerifyToken: null 
      },
    });


    return user;
  },

  // Forgot password
  forgotPassword: async (email: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null; // Silent — don't reveal if email exists

    const { token, hash } = AuthService.generateVerifyToken();
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        passwordResetToken: hash,
        passwordResetExpiry: expiry,
      },
    });

    return { user, resetToken: token };
  },

  // Reset password
  resetPassword: async (token: string, newPassword: string) => {
    const hash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await prisma.user.findFirst({
      where: { 
        passwordResetToken: hash,
        passwordResetExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new Error('INVALID_OR_EXPIRED_TOKEN');
    }

    const passwordHash = await AuthService.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });

    return user;
  },

  // Generate refresh token
  generateRefreshToken: async (userId: string): Promise<string> => {
    const token = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return token;
  },

  // Rotate refresh token — invalidate old, issue new
  rotateRefreshToken: async (token: string) => {
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored) throw new Error('INVALID_REFRESH_TOKEN');
    if (stored.revokedAt) {
      // Token reuse detected — revoke entire user's tokens
      await prisma.refreshToken.updateMany({
        where: { userId: stored.userId },
        data: { revokedAt: new Date() },
      });
      throw new Error('REFRESH_TOKEN_REUSE');
    }
    if (stored.expiresAt < new Date()) {
      throw new Error('REFRESH_TOKEN_EXPIRED');
    }

    // Revoke old token
    const newToken = crypto.randomBytes(40).toString('hex');
    const newHash = crypto
      .createHash('sha256')
      .update(newToken)
      .digest('hex');

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date(), replacedBy: newHash },
      }),
      prisma.refreshToken.create({
        data: {
          userId: stored.userId,
          tokenHash: newHash,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    // Issue new access token
    const accessToken = AuthService.generateToken({
      userId: stored.user.id,
      email: stored.user.email,
      role: stored.user.role ?? 'USER',
    });

    return { accessToken, refreshToken: newToken };
  },

  // Revoke all refresh tokens for user (logout)
  revokeAllRefreshTokens: async (userId: string): Promise<void> => {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
};
