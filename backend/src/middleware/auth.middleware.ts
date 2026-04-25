import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

// JWT auth middleware — reads from httpOnly cookie OR Authorization header
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Try cookie first (web app)
    let token = req.cookies?.jwt_token;

    // Fall back to Authorization header (API/mobile)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      res.status(401).json({ 
        success: false, 
        code: 'NO_TOKEN', 
        message: 'Authentication required' 
      });
      return;
    }

    const payload = AuthService.verifyToken(token);
    
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      code: 'INVALID_TOKEN', 
      message: 'Invalid or expired token' 
    });
  }
};

// Optional auth — attaches user if token present, doesn't block
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.cookies?.jwt_token;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    if (token) {
      const payload = AuthService.verifyToken(token);
      req.user = { 
        id: payload.userId, 
        email: payload.email,
        role: payload.role 
      };
    }
  } catch {
    // Ignore — optional auth
  }
  next();
};

// API Key middleware — for /invoke endpoint
export const apiKeyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      res.status(401).json({ 
        success: false, 
        code: 'NO_API_KEY',
        message: 'API key required' 
      });
      return;
    }

    // Hash the provided key and look it up
    const keyHash = crypto
      .createHash('sha256')
      .update(apiKey)
      .digest('hex');

    const key = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { user: true },
    });

    if (!key || !key.isActive) {
      res.status(401).json({ 
        success: false, 
        code: 'INVALID_API_KEY',
        message: 'Invalid or revoked API key' 
      });
      return;
    }

    // Update last used
    await prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    });

    req.user = {
      id: key.user.id,
      email: key.user.email,
      role: key.user.role ?? 'USER',
    };

    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      code: 'API_KEY_ERROR',
      message: 'API key validation failed' 
    });
  }
};

// Admin only middleware
export const adminOnly = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ 
      success: false, 
      code: 'FORBIDDEN',
      message: 'Admin access required' 
    });
    return;
  }
  next();
};
