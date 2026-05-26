import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin';
import User from '../models/User';
import {
  generateAdminTokens,
  generateUserTokens,
  ADMIN_COOKIE_OPTIONS,
  USER_COOKIE_OPTIONS,
  requireAdmin,
  AuthRequest,
} from '../middleware/auth';

const router = Router();

// ── Rate limiters ─────────────────────────────────────────────────────────────

// Very strict for admin login: 5 attempts per 15 minutes per IP
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Moderate for user auth: 10 attempts per 15 minutes per IP
const userAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// ── Validation helpers ────────────────────────────────────────────────────────
const handleValidation = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: 'Validation failed', details: errors.array() });
    return false;
  }
  return true;
};

// Generic error message for auth failures (no info leakage)
const AUTH_FAILED_MSG = 'Invalid credentials';

// ── ADMIN ROUTES ──────────────────────────────────────────────────────────────

// POST /api/auth/admin/login
router.post(
  '/admin/login',
  adminLoginLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  async (req: Request, res: Response) => {
    if (!handleValidation(req, res)) return;

    const { email, password } = req.body;

    try {
      // Select password (excluded by default) and refreshToken
      const admin = await Admin.findOne({ email }).select('+password +refreshToken');

      if (!admin) {
        // Constant-time response to prevent user enumeration
        await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 200));
        res.status(401).json({ error: AUTH_FAILED_MSG });
        return;
      }

      // Check account lockout
      if (admin.isLocked()) {
        const lockRemaining = Math.ceil(
          ((admin.lockUntil?.getTime() ?? 0) - Date.now()) / 60000
        );
        res.status(423).json({
          error: `Account temporarily locked due to too many failed attempts. Try again in ${lockRemaining} minute(s).`,
        });
        return;
      }

      const isMatch = await admin.comparePassword(password);

      if (!isMatch) {
        await admin.incrementLoginAttempts();
        const attemptsLeft = Math.max(0, 5 - (admin.loginAttempts + 1));
        res.status(401).json({
          error: AUTH_FAILED_MSG,
          attemptsRemaining: attemptsLeft,
        });
        return;
      }

      // Successful login
      await admin.resetLoginAttempts();

      const { accessToken, refreshToken } = generateAdminTokens({
        id: admin._id.toString(),
        email: admin.email,
        role: admin.role,
        name: admin.name,
      });

      // Store hashed refresh token in DB
      admin.refreshToken = refreshToken;
      await admin.save({ validateBeforeSave: false });

      // Refresh token in HttpOnly cookie only
      res.cookie('admin_refresh_token', refreshToken, ADMIN_COOKIE_OPTIONS);

      res.json({
        accessToken,
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      });
    } catch (err) {
      console.error('[Admin Login Error]', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/auth/admin/refresh
router.post('/admin/refresh', async (req: Request, res: Response) => {
  const token = req.cookies?.admin_refresh_token;

  if (!token) {
    res.status(401).json({ error: 'No refresh token' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET!) as any;

    if (decoded.type !== 'refresh') {
      res.status(401).json({ error: 'Invalid token type' });
      return;
    }

    const admin = await Admin.findById(decoded.id).select('+refreshToken');

    if (!admin || admin.refreshToken !== token) {
      // Token reuse detected — clear all tokens
      if (admin) {
        admin.refreshToken = undefined as any;
        await admin.save({ validateBeforeSave: false });
      }
      res.clearCookie('admin_refresh_token', { path: '/api/auth/admin' });
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const { accessToken, refreshToken: newRefreshToken } = generateAdminTokens({
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role,
      name: admin.name,
    });

    // Rotate refresh token
    admin.refreshToken = newRefreshToken;
    await admin.save({ validateBeforeSave: false });

    res.cookie('admin_refresh_token', newRefreshToken, ADMIN_COOKIE_OPTIONS);
    res.json({ accessToken });
  } catch (err) {
    res.clearCookie('admin_refresh_token', { path: '/api/auth/admin' });
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// POST /api/auth/admin/logout
router.post('/admin/logout', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const admin = await Admin.findById(req.admin?.id).select('+refreshToken');
    if (admin) {
      admin.refreshToken = undefined as any;
      await admin.save({ validateBeforeSave: false });
    }
  } catch (_) {
    // Silently fail — always clear the cookie
  }

  res.clearCookie('admin_refresh_token', { path: '/api/auth/admin' });
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/admin/me — verify token and return current admin info
router.get('/admin/me', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const admin = await Admin.findById(req.admin?.id);
    if (!admin) {
      res.status(404).json({ error: 'Admin not found' });
      return;
    }
    res.json({
      id: admin._id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      lastLogin: admin.lastLogin,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── CUSTOMER / USER ROUTES ────────────────────────────────────────────────────

// POST /api/auth/user/register
router.post(
  '/user/register',
  userAuthLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and a number'),
    body('firstName').trim().notEmpty().isLength({ max: 50 }).withMessage('First name required'),
    body('lastName').trim().notEmpty().isLength({ max: 50 }).withMessage('Last name required'),
    body('country').optional().trim(),
    body('phone').optional().trim(),
  ],
  async (req: Request, res: Response) => {
    if (!handleValidation(req, res)) return;

    const { email, password, firstName, lastName, country, phone } = req.body;

    try {
      const existing = await User.findOne({ email });
      if (existing) {
        // Don't reveal if email exists (enumeration protection)
        res.status(400).json({ error: 'Registration failed. Please check your details.' });
        return;
      }

      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        country,
        phone,
      });

      const { accessToken, refreshToken } = generateUserTokens({
        id: user._id.toString(),
        email: user.email,
        role: 'customer',
      });

      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });

      res.cookie('user_refresh_token', refreshToken, USER_COOKIE_OPTIONS);

      res.status(201).json({
        accessToken,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: 'customer',
        },
      });
    } catch (err) {
      console.error('[User Register Error]', err);
      res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  }
);

// POST /api/auth/user/login
router.post(
  '/user/login',
  userAuthLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  async (req: Request, res: Response) => {
    if (!handleValidation(req, res)) return;

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email }).select('+password +refreshToken');

      if (!user) {
        await new Promise((r) => setTimeout(r, 400 + Math.random() * 200));
        res.status(401).json({ error: AUTH_FAILED_MSG });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ error: 'Account suspended. Contact support.' });
        return;
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(401).json({ error: AUTH_FAILED_MSG });
        return;
      }

      const { accessToken, refreshToken } = generateUserTokens({
        id: user._id.toString(),
        email: user.email,
        role: 'customer',
      });

      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });

      res.cookie('user_refresh_token', refreshToken, USER_COOKIE_OPTIONS);

      res.json({
        accessToken,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: 'customer',
        },
      });
    } catch (err) {
      console.error('[User Login Error]', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/auth/user/refresh
router.post('/user/refresh', async (req: Request, res: Response) => {
  const token = req.cookies?.user_refresh_token;

  if (!token) {
    res.status(401).json({ error: 'No refresh token' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.USER_JWT_SECRET!) as any;

    if (decoded.type !== 'refresh') {
      res.status(401).json({ error: 'Invalid token type' });
      return;
    }

    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      if (user) {
        user.refreshToken = undefined as any;
        await user.save({ validateBeforeSave: false });
      }
      res.clearCookie('user_refresh_token', { path: '/api/auth/user' });
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const { accessToken, refreshToken: newRefreshToken } = generateUserTokens({
      id: user._id.toString(),
      email: user.email,
      role: 'customer',
    });

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie('user_refresh_token', newRefreshToken, USER_COOKIE_OPTIONS);
    res.json({ accessToken });
  } catch (_) {
    res.clearCookie('user_refresh_token', { path: '/api/auth/user' });
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// POST /api/auth/user/logout
router.post('/user/logout', async (req: Request, res: Response) => {
  const token = req.cookies?.user_refresh_token;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.USER_JWT_SECRET!) as any;
      const user = await User.findById(decoded.id).select('+refreshToken');
      if (user) {
        user.refreshToken = undefined as any;
        await user.save({ validateBeforeSave: false });
      }
    } catch (_) {
      // Silently fail
    }
  }

  res.clearCookie('user_refresh_token', { path: '/api/auth/user' });
  res.json({ message: 'Logged out successfully' });
});

export default router;