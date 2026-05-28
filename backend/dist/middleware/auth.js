"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_COOKIE_OPTIONS = exports.ADMIN_COOKIE_OPTIONS = exports.generateUserTokens = exports.generateAdminTokens = exports.requireUser = exports.requireAdmin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// ── Admin auth middleware ──────────────────────────────────────────────────────
const requireAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }
    const token = authHeader.slice(7);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ADMIN_JWT_SECRET);
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
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        else {
            res.status(401).json({ error: 'Invalid token' });
        }
    }
};
exports.requireAdmin = requireAdmin;
// ── Customer auth middleware ───────────────────────────────────────────────────
const requireUser = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }
    const token = authHeader.slice(7);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.USER_JWT_SECRET);
        if (decoded.type !== 'access') {
            res.status(401).json({ error: 'Invalid token type' });
            return;
        }
        req.currentUser = decoded;
        next();
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        else {
            res.status(401).json({ error: 'Invalid token' });
        }
    }
};
exports.requireUser = requireUser;
// ── Token helpers ─────────────────────────────────────────────────────────────
const generateAdminTokens = (payload) => {
    const accessToken = jsonwebtoken_1.default.sign(Object.assign(Object.assign({}, payload), { type: 'access' }), process.env.ADMIN_JWT_SECRET, { expiresIn: (process.env.ADMIN_ACCESS_TOKEN_EXPIRY || '15m') });
    const refreshToken = jsonwebtoken_1.default.sign({ id: payload.id, type: 'refresh', role: payload.role }, process.env.ADMIN_JWT_SECRET, { expiresIn: (process.env.ADMIN_REFRESH_TOKEN_EXPIRY || '7d') });
    return { accessToken, refreshToken };
};
exports.generateAdminTokens = generateAdminTokens;
const generateUserTokens = (payload) => {
    const accessToken = jsonwebtoken_1.default.sign(Object.assign(Object.assign({}, payload), { type: 'access' }), process.env.USER_JWT_SECRET, { expiresIn: (process.env.USER_ACCESS_TOKEN_EXPIRY || '30m') });
    const refreshToken = jsonwebtoken_1.default.sign({ id: payload.id, type: 'refresh', role: payload.role }, process.env.USER_JWT_SECRET, { expiresIn: (process.env.USER_REFRESH_TOKEN_EXPIRY || '30d') });
    return { accessToken, refreshToken };
};
exports.generateUserTokens = generateUserTokens;
// Cookie options — HttpOnly prevents JS access (XSS protection)
exports.ADMIN_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth/admin',
};
exports.USER_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/api/auth/user',
};
