import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request to carry decoded token payloads
export interface AuthRequest extends Request {
  admin?: {
    id: string;
    email: string;
    role: 'admin' | 'superadmin';
    name: string;
  };
  currentUser?: {
    id: string;
    email: string;
    role: 'customer';
  };
}

interface AdminTokenPayload {
  id: string;
  email: string;
  role: 'admin' | 'superadmin';
  name: string;
  type: 'access';
}

interface UserTokenPayload {
  id: string;
  email: string;
  role: 'customer';
  type: 'access';
}

// ── Admin auth middleware ──────────────────────────────────────────────────────
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(
      token,
      process.env.ADMIN_JWT_SECRET!
    ) as AdminTokenPayload;

    if (decoded.type !== 'access') {
      res.status(401).json({ error: 'Invalid token type' });
      return;
    }

    if (decoded.role !== 'admin' && decoded.role !== 'superadmin') {
      res.status(403).json({ error: 'Insufficient privileges' });
      return;
    }

    req.admin = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  }
};

// ── Customer auth middleware ───────────────────────────────────────────────────
export const requireUser = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(
      token,
      process.env.USER_JWT_SECRET!
    ) as UserTokenPayload;

    if (decoded.type !== 'access') {
      res.status(401).json({ error: 'Invalid token type' });
      return;
    }

    req.currentUser = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  }
};

// ── Token helpers ─────────────────────────────────────────────────────────────
export const generateAdminTokens = (payload: {
  id: string;
  email: string;
  role: 'admin' | 'superadmin';
  name: string;
}) => {
  const accessToken = jwt.sign(
    { ...payload, type: 'access' },
    process.env.ADMIN_JWT_SECRET!,
    { expiresIn: (process.env.ADMIN_ACCESS_TOKEN_EXPIRY || '15m') as any }
  );

  const refreshToken = jwt.sign(
    { id: payload.id, type: 'refresh', role: payload.role },
    process.env.ADMIN_JWT_SECRET!,
    { expiresIn: (process.env.ADMIN_REFRESH_TOKEN_EXPIRY || '7d') as any }
  );

  return { accessToken, refreshToken };
};

export const generateUserTokens = (payload: {
  id: string;
  email: string;
  role: 'customer';
}) => {
  const accessToken = jwt.sign(
    { ...payload, type: 'access' },
    process.env.USER_JWT_SECRET!,
    { expiresIn: (process.env.USER_ACCESS_TOKEN_EXPIRY || '30m') as any }
  );

  const refreshToken = jwt.sign(
    { id: payload.id, type: 'refresh', role: payload.role },
    process.env.USER_JWT_SECRET!,
    { expiresIn: (process.env.USER_REFRESH_TOKEN_EXPIRY || '30d') as any }
  );

  return { accessToken, refreshToken };
};

// Cookie options — HttpOnly prevents JS access (XSS protection)
export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth/admin',
};

export const USER_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/api/auth/user',
};