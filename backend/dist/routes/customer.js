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
const express_validator_1 = require("express-validator");
const User_1 = __importDefault(require("../models/User"));
const Order_1 = __importDefault(require("../models/Order"));
const Message_1 = __importDefault(require("../models/Message"));
const Listing_1 = __importDefault(require("../models/Listing"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// ── Validation helper ─────────────────────────────────────────────────────────
const handleValidation = (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
        return false;
    }
    return true;
};
// ── GET /api/user/profile ─────────────────────────────────────────────────────
// Retrieve authenticated user's profile details
router.get('/profile', auth_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = yield User_1.default.findById((_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id)
            .select('-password -refreshToken')
            .populate('savedVehicles', 'make modelName year price images');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            country: user.country,
            role: user.role,
            isActive: user.isActive,
            savedVehicles: user.savedVehicles,
            createdAt: user.createdAt,
        });
    }
    catch (err) {
        console.error('[Get Profile Error]', err);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
}));
// ── PUT /api/user/profile ─────────────────────────────────────────────────────
// Update user profile (firstName, lastName, phone, country)
router.put('/profile', auth_1.requireUser, [
    (0, express_validator_1.body)('firstName').optional().trim().isLength({ max: 50 }),
    (0, express_validator_1.body)('lastName').optional().trim().isLength({ max: 50 }),
    (0, express_validator_1.body)('phone').optional().trim(),
    (0, express_validator_1.body)('country').optional().trim(),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!handleValidation(req, res))
        return;
    try {
        const { firstName, lastName, phone, country } = req.body;
        const user = yield User_1.default.findById((_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (firstName)
            user.firstName = firstName;
        if (lastName)
            user.lastName = lastName;
        if (phone !== undefined)
            user.phone = phone;
        if (country !== undefined)
            user.country = country;
        yield user.save();
        res.json({
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            country: user.country,
            role: user.role,
        });
    }
    catch (err) {
        console.error('[Update Profile Error]', err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
}));
// ── PUT /api/user/password ────────────────────────────────────────────────────
// Change password
router.put('/password', auth_1.requireUser, [
    (0, express_validator_1.body)('currentPassword').notEmpty().withMessage('Current password required'),
    (0, express_validator_1.body)('newPassword')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain uppercase, lowercase, and a number'),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!handleValidation(req, res))
        return;
    try {
        const { currentPassword, newPassword } = req.body;
        const user = yield User_1.default.findById((_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id).select('+password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isMatch = yield user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        user.password = newPassword;
        yield user.save();
        res.json({ message: 'Password changed successfully' });
    }
    catch (err) {
        console.error('[Change Password Error]', err);
        res.status(500).json({ error: 'Failed to change password' });
    }
}));
// ── GET /api/user/orders ──────────────────────────────────────────────────────
// Fetch all orders for authenticated user
router.get('/orders', auth_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const orders = yield Order_1.default.find({ userId: (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id })
            .populate('vehicleId', 'make modelName year price images grade')
            .sort({ createdAt: -1 });
        res.json(orders);
    }
    catch (err) {
        console.error('[Get Orders Error]', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
}));
// ── GET /api/user/orders/:orderId ─────────────────────────────────────────────
// Fetch a specific order with documents
router.get('/orders/:orderId', auth_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const order = yield Order_1.default.findOne({
            _id: req.params.orderId,
            userId: (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id,
        }).populate('vehicleId', 'make modelName year price images grade');
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(order);
    }
    catch (err) {
        console.error('[Get Order Error]', err);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
}));
// ── GET /api/user/saved-vehicles ──────────────────────────────────────────────
// Get list of saved vehicles
router.get('/saved-vehicles', auth_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = yield User_1.default.findById((_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id)
            .select('savedVehicles')
            .populate('savedVehicles', 'make modelName year price images grade');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user.savedVehicles);
    }
    catch (err) {
        console.error('[Get Saved Vehicles Error]', err);
        res.status(500).json({ error: 'Failed to fetch saved vehicles' });
    }
}));
// ── POST /api/user/saved-vehicles ─────────────────────────────────────────────
// Add vehicle to saved list
router.post('/saved-vehicles', auth_1.requireUser, [(0, express_validator_1.body)('vehicleId').isMongoId().withMessage('Valid vehicle ID required')], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!handleValidation(req, res))
        return;
    try {
        const { vehicleId } = req.body;
        const user = yield User_1.default.findById((_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Check if vehicle exists
        const vehicle = yield Listing_1.default.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        // Check if already saved
        if (user.savedVehicles.some((id) => id.toString() === vehicleId)) {
            return res.status(400).json({ error: 'Vehicle already saved' });
        }
        user.savedVehicles.push(vehicleId);
        yield user.save();
        res.status(201).json({ message: 'Vehicle saved successfully' });
    }
    catch (err) {
        console.error('[Save Vehicle Error]', err);
        res.status(500).json({ error: 'Failed to save vehicle' });
    }
}));
// ── DELETE /api/user/saved-vehicles/:vehicleId ────────────────────────────────
// Remove vehicle from saved list
router.delete('/saved-vehicles/:vehicleId', auth_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { vehicleId } = req.params;
        const user = yield User_1.default.findById((_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        user.savedVehicles = user.savedVehicles.filter((id) => id.toString() !== vehicleId);
        yield user.save();
        res.json({ message: 'Vehicle removed from saved list' });
    }
    catch (err) {
        console.error('[Remove Saved Vehicle Error]', err);
        res.status(500).json({ error: 'Failed to remove vehicle' });
    }
}));
// ── GET /api/user/messages ────────────────────────────────────────────────────
// Get all message threads for the user
router.get('/messages', auth_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const threads = yield Message_1.default.find({ userId: (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id })
            .select('threadId sender senderName message timestamp readByCustomer readByAdmin')
            .sort({ timestamp: -1 })
            .lean();
        // Group messages by threadId to get unique threads with latest message
        const threadMap = new Map();
        threads.forEach((msg) => {
            if (!threadMap.has(msg.threadId)) {
                threadMap.set(msg.threadId, msg);
            }
        });
        const uniqueThreads = Array.from(threadMap.values());
        res.json(uniqueThreads);
    }
    catch (err) {
        console.error('[Get Messages Error]', err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
}));
// ── GET /api/user/messages/:threadId ──────────────────────────────────────────
// Get all messages in a specific thread
router.get('/messages/:threadId', auth_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { threadId } = req.params;
        const messages = yield Message_1.default.find({
            userId: (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id,
            threadId,
        }).sort({ timestamp: 1 });
        if (messages.length === 0) {
            return res.status(404).json({ error: 'Thread not found' });
        }
        res.json(messages);
    }
    catch (err) {
        console.error('[Get Thread Error]', err);
        res.status(500).json({ error: 'Failed to fetch thread' });
    }
}));
// ── POST /api/user/messages ───────────────────────────────────────────────────
// Create a new message thread
router.post('/messages', auth_1.requireUser, [(0, express_validator_1.body)('subject').trim().notEmpty().withMessage('Subject required'),
    (0, express_validator_1.body)('message').trim().notEmpty().withMessage('Message required')], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    if (!handleValidation(req, res))
        return;
    try {
        const { subject, message } = req.body;
        const user = yield User_1.default.findById((_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Generate unique threadId
        const threadId = `${(_b = req.currentUser) === null || _b === void 0 ? void 0 : _b.id}-${Date.now()}`;
        const newMessage = yield Message_1.default.create({
            userId: (_c = req.currentUser) === null || _c === void 0 ? void 0 : _c.id,
            threadId,
            sender: 'customer',
            senderName: `${user.firstName} ${user.lastName}`,
            message: `[${subject}]\n${message}`,
            readByCustomer: true,
            readByAdmin: false,
        });
        res.status(201).json(newMessage);
    }
    catch (err) {
        console.error('[Create Message Error]', err);
        res.status(500).json({ error: 'Failed to send message' });
    }
}));
// ── POST /api/user/messages/:threadId/reply ───────────────────────────────────
// Reply to a message thread
router.post('/messages/:threadId/reply', auth_1.requireUser, [(0, express_validator_1.body)('message').trim().notEmpty().withMessage('Message required')], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    if (!handleValidation(req, res))
        return;
    try {
        const { threadId } = req.params;
        const { message } = req.body;
        const user = yield User_1.default.findById((_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Verify thread exists and belongs to user
        const existingMessage = yield Message_1.default.findOne({
            threadId,
            userId: (_b = req.currentUser) === null || _b === void 0 ? void 0 : _b.id,
        });
        if (!existingMessage) {
            return res.status(404).json({ error: 'Thread not found' });
        }
        const newMessage = yield Message_1.default.create({
            userId: (_c = req.currentUser) === null || _c === void 0 ? void 0 : _c.id,
            threadId,
            sender: 'customer',
            senderName: `${user.firstName} ${user.lastName}`,
            message,
            readByCustomer: true,
            readByAdmin: false,
        });
        res.status(201).json(newMessage);
    }
    catch (err) {
        console.error('[Reply Message Error]', err);
        res.status(500).json({ error: 'Failed to send reply' });
    }
}));
exports.default = router;
