"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_validator_1 = require("express-validator");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Admin_1 = __importDefault(require("../models/Admin"));
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// ── Rate limiters ─────────────────────────────────────────────────────────────
// Very strict for admin login: 5 attempts per 15 minutes per IP
const adminLoginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
});
// Moderate for user auth: 10 attempts per 15 minutes per IP
const userAuthLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
});
// ── Validation helpers ────────────────────────────────────────────────────────
const handleValidation = (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
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
router.post('/admin/login', adminLoginLimiter, [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password required'),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!handleValidation(req, res))
        return;
    const { email, password } = req.body;
    try {
        // Select password (excluded by default) and refreshToken
        const admin = yield Admin_1.default.findOne({ email }).select('+password +refreshToken');
        if (!admin) {
            // Constant-time response to prevent user enumeration
            yield new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 200));
            res.status(401).json({ error: AUTH_FAILED_MSG });
            return;
        }
        // Check account lockout
        if (admin.isLocked()) {
            const lockRemaining = Math.ceil((((_b = (_a = admin.lockUntil) === null || _a === void 0 ? void 0 : _a.getTime()) !== null && _b !== void 0 ? _b : 0) - Date.now()) / 60000);
            res.status(423).json({
                error: `Account temporarily locked due to too many failed attempts. Try again in ${lockRemaining} minute(s).`,
            });
            return;
        }
        const isMatch = yield admin.comparePassword(password);
        if (!isMatch) {
            yield admin.incrementLoginAttempts();
            const attemptsLeft = Math.max(0, 5 - (admin.loginAttempts + 1));
            res.status(401).json({
                error: AUTH_FAILED_MSG,
                attemptsRemaining: attemptsLeft,
            });
            return;
        }
        // Successful login
        yield admin.resetLoginAttempts();
        const { accessToken, refreshToken } = (0, auth_1.generateAdminTokens)({
            id: admin._id.toString(),
            email: admin.email,
            role: admin.role,
            name: admin.name,
        });
        // Store hashed refresh token in DB
        admin.refreshToken = refreshToken;
        yield admin.save({ validateBeforeSave: false });
        // Refresh token in HttpOnly cookie only
        res.cookie('admin_refresh_token', refreshToken, auth_1.ADMIN_COOKIE_OPTIONS);
        res.json({
            accessToken,
            admin: {
                id: admin._id,
                email: admin.email,
                name: admin.name,
                role: admin.role,
            },
        });
    }
    catch (err) {
        console.error('[Admin Login Error]', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/auth/admin/refresh
router.post('/admin/refresh', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.admin_refresh_token;
    if (!token) {
        res.status(401).json({ error: 'No refresh token' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ADMIN_JWT_SECRET);
        if (decoded.type !== 'refresh') {
            res.status(401).json({ error: 'Invalid token type' });
            return;
        }
        const admin = yield Admin_1.default.findById(decoded.id).select('+refreshToken');
        if (!admin || admin.refreshToken !== token) {
            // Token reuse detected — clear all tokens
            if (admin) {
                admin.refreshToken = undefined;
                yield admin.save({ validateBeforeSave: false });
            }
            res.clearCookie('admin_refresh_token', { path: '/api/auth/admin' });
            res.status(401).json({ error: 'Invalid refresh token' });
            return;
        }
        const { accessToken, refreshToken: newRefreshToken } = (0, auth_1.generateAdminTokens)({
            id: admin._id.toString(),
            email: admin.email,
            role: admin.role,
            name: admin.name,
        });
        // Rotate refresh token
        admin.refreshToken = newRefreshToken;
        yield admin.save({ validateBeforeSave: false });
        res.cookie('admin_refresh_token', newRefreshToken, auth_1.ADMIN_COOKIE_OPTIONS);
        res.json({ accessToken });
    }
    catch (err) {
        res.clearCookie('admin_refresh_token', { path: '/api/auth/admin' });
        res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
}));
// POST /api/auth/admin/logout
router.post('/admin/logout', auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const admin = yield Admin_1.default.findById((_a = req.admin) === null || _a === void 0 ? void 0 : _a.id).select('+refreshToken');
        if (admin) {
            admin.refreshToken = undefined;
            yield admin.save({ validateBeforeSave: false });
        }
    }
    catch (_) {
        // Silently fail — always clear the cookie
    }
    res.clearCookie('admin_refresh_token', { path: '/api/auth/admin' });
    res.json({ message: 'Logged out successfully' });
}));
// GET /api/auth/admin/me — verify token and return current admin info
router.get('/admin/me', auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const admin = yield Admin_1.default.findById((_a = req.admin) === null || _a === void 0 ? void 0 : _a.id);
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
    }
    catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// ── CUSTOMER / USER ROUTES ────────────────────────────────────────────────────
// POST /api/auth/user/register
router.post('/user/register', userAuthLimiter, [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain uppercase, lowercase, and a number'),
    (0, express_validator_1.body)('firstName').trim().notEmpty().isLength({ max: 50 }).withMessage('First name required'),
    (0, express_validator_1.body)('lastName').trim().notEmpty().isLength({ max: 50 }).withMessage('Last name required'),
    (0, express_validator_1.body)('country').optional().trim(),
    (0, express_validator_1.body)('phone').optional().trim(),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!handleValidation(req, res))
        return;
    const { email, password, firstName, lastName, country, phone } = req.body;
    try {
        const existing = yield User_1.default.findOne({ email });
        if (existing) {
            // Don't reveal if email exists (enumeration protection)
            res.status(400).json({ error: 'Registration failed. Please check your details.' });
            return;
        }
        const user = yield User_1.default.create({
            email,
            password,
            firstName,
            lastName,
            country,
            phone,
        });
        const { accessToken, refreshToken } = (0, auth_1.generateUserTokens)({
            id: user._id.toString(),
            email: user.email,
            role: 'customer',
        });
        user.refreshToken = refreshToken;
        yield user.save({ validateBeforeSave: false });
        res.cookie('user_refresh_token', refreshToken, auth_1.USER_COOKIE_OPTIONS);
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
    }
    catch (err) {
        console.error('[User Register Error]', err);
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
}));
// POST /api/auth/user/login
router.post('/user/login', userAuthLimiter, [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password required'),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!handleValidation(req, res))
        return;
    const { email, password } = req.body;
    try {
        const user = yield User_1.default.findOne({ email }).select('+password +refreshToken');
        if (!user) {
            yield new Promise((r) => setTimeout(r, 400 + Math.random() * 200));
            res.status(401).json({ error: AUTH_FAILED_MSG });
            return;
        }
        if (!user.isActive) {
            res.status(403).json({ error: 'Account suspended. Contact support.' });
            return;
        }
        const isMatch = yield user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ error: AUTH_FAILED_MSG });
            return;
        }
        const { accessToken, refreshToken } = (0, auth_1.generateUserTokens)({
            id: user._id.toString(),
            email: user.email,
            role: 'customer',
        });
        user.refreshToken = refreshToken;
        yield user.save({ validateBeforeSave: false });
        res.cookie('user_refresh_token', refreshToken, auth_1.USER_COOKIE_OPTIONS);
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
    }
    catch (err) {
        console.error('[User Login Error]', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/auth/user/refresh
router.post('/user/refresh', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.user_refresh_token;
    if (!token) {
        res.status(401).json({ error: 'No refresh token' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.USER_JWT_SECRET);
        if (decoded.type !== 'refresh') {
            res.status(401).json({ error: 'Invalid token type' });
            return;
        }
        const user = yield User_1.default.findById(decoded.id).select('+refreshToken');
        if (!user || user.refreshToken !== token) {
            if (user) {
                user.refreshToken = undefined;
                yield user.save({ validateBeforeSave: false });
            }
            res.clearCookie('user_refresh_token', { path: '/api/auth/user' });
            res.status(401).json({ error: 'Invalid refresh token' });
            return;
        }
        const { accessToken, refreshToken: newRefreshToken } = (0, auth_1.generateUserTokens)({
            id: user._id.toString(),
            email: user.email,
            role: 'customer',
        });
        user.refreshToken = newRefreshToken;
        yield user.save({ validateBeforeSave: false });
        res.cookie('user_refresh_token', newRefreshToken, auth_1.USER_COOKIE_OPTIONS);
        res.json({ accessToken });
    }
    catch (_) {
        res.clearCookie('user_refresh_token', { path: '/api/auth/user' });
        res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
}));
// POST /api/auth/user/logout
router.post('/user/logout', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.user_refresh_token;
    if (token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.USER_JWT_SECRET);
            const user = yield User_1.default.findById(decoded.id).select('+refreshToken');
            if (user) {
                user.refreshToken = undefined;
                yield user.save({ validateBeforeSave: false });
            }
        }
        catch (_) {
            // Silently fail
        }
    }
    res.clearCookie('user_refresh_token', { path: '/api/auth/user' });
    res.json({ message: 'Logged out successfully' });
}));
exports.default = router;
