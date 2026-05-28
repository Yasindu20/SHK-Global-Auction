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
const Order_1 = __importDefault(require("../models/Order"));
const Message_1 = __importDefault(require("../models/Message"));
const User_1 = __importDefault(require("../models/User"));
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
// ── GET /api/admin/users ──────────────────────────────────────────────────────
// Retrieve all customers (admin only)
router.get('/users', auth_1.requireAdmin, (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield User_1.default.find({ role: 'customer' })
            .select('-password -refreshToken')
            .sort({ createdAt: -1 });
        res.json(users);
    }
    catch (err) {
        console.error('[Get Users Error]', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
}));
// ── GET /api/admin/users/:userId/orders ───────────────────────────────────────
// Retrieve all orders for a specific customer (admin only)
router.get('/users/:userId/orders', auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const orders = yield Order_1.default.find({ userId })
            .populate('vehicleId', 'make modelName year price images grade')
            .populate('userId', 'firstName lastName email')
            .sort({ createdAt: -1 });
        if (orders.length === 0) {
            return res.status(404).json({ error: 'No orders found for this user' });
        }
        res.json(orders);
    }
    catch (err) {
        console.error('[Get User Orders Error]', err);
        res.status(500).json({ error: 'Failed to fetch user orders' });
    }
}));
// ── PUT /api/admin/orders/:orderId/status ─────────────────────────────────────
// Update shipment status of an order (admin only)
router.put('/orders/:orderId/status', auth_1.requireAdmin, [
    (0, express_validator_1.body)('status')
        .isIn(['purchased', 'shipped', 'in_transit', 'customs_cleared', 'delivered'])
        .withMessage('Invalid status'),
    (0, express_validator_1.body)('vessel').optional().trim(),
    (0, express_validator_1.body)('container').optional().trim(),
    (0, express_validator_1.body)('eta').optional().trim(),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!handleValidation(req, res))
        return;
    try {
        const { orderId } = req.params;
        const { status, vessel, container, eta } = req.body;
        const order = yield Order_1.default.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        // Update status and tracking steps
        order.status = status;
        if (vessel)
            order.vessel = vessel;
        if (container)
            order.container = container;
        if (eta)
            order.eta = eta;
        // Update tracking steps based on status
        const statusMap = {
            purchased: 0,
            shipped: 1,
            in_transit: 2,
            customs_cleared: 3,
            delivered: 4,
        };
        const stepIndex = statusMap[status];
        order.trackingSteps = order.trackingSteps.map((step, idx) => (Object.assign(Object.assign({}, step), { done: idx <= stepIndex, active: idx === stepIndex, timestamp: idx === stepIndex ? new Date() : step.timestamp })));
        yield order.save();
        res.json({
            message: 'Order status updated successfully',
            order,
        });
    }
    catch (err) {
        console.error('[Update Order Status Error]', err);
        res.status(500).json({ error: 'Failed to update order status' });
    }
}));
// ── POST /api/admin/orders/:orderId/documents ──────────────────────────────────
// Upload documents for an order (admin only)
router.post('/orders/:orderId/documents', auth_1.requireAdmin, [
    (0, express_validator_1.body)('documentName').trim().notEmpty().withMessage('Document name required'),
    (0, express_validator_1.body)('documentUrl').trim().notEmpty().withMessage('Document URL required'),
    (0, express_validator_1.body)('documentType').optional().trim(),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!handleValidation(req, res))
        return;
    try {
        const { orderId } = req.params;
        const { documentName, documentUrl, documentType } = req.body;
        const order = yield Order_1.default.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        order.documents.push({
            name: documentName,
            url: documentUrl,
            type: documentType || 'PDF',
            uploadedAt: new Date(),
        });
        yield order.save();
        res.status(201).json({
            message: 'Document added successfully',
            order,
        });
    }
    catch (err) {
        console.error('[Add Document Error]', err);
        res.status(500).json({ error: 'Failed to add document' });
    }
}));
// ── DELETE /api/admin/orders/:orderId/documents/:docIndex ──────────────────────
// Delete a document from an order (admin only)
router.delete('/orders/:orderId/documents/:docIndex', auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderId, docIndex } = req.params;
        const index = parseInt(docIndex, 10);
        const order = yield Order_1.default.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        if (index < 0 || index >= order.documents.length) {
            return res.status(400).json({ error: 'Invalid document index' });
        }
        order.documents.splice(index, 1);
        yield order.save();
        res.json({
            message: 'Document removed successfully',
            order,
        });
    }
    catch (err) {
        console.error('[Delete Document Error]', err);
        res.status(500).json({ error: 'Failed to delete document' });
    }
}));
// ── GET /api/admin/messages ───────────────────────────────────────────────────
// Retrieve all customer message threads (admin only)
router.get('/messages', auth_1.requireAdmin, (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const threads = yield Message_1.default.find()
            .populate('userId', 'firstName lastName email')
            .sort({ timestamp: -1 })
            .lean();
        // Group by threadId to get unique threads with latest message
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
        console.error('[Get All Messages Error]', err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
}));
// ── GET /api/admin/messages/:threadId ──────────────────────────────────────────
// Get all messages in a specific thread (admin only)
router.get('/messages/:threadId', auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { threadId } = req.params;
        const messages = yield Message_1.default.find({ threadId })
            .populate('userId', 'firstName lastName email')
            .sort({ timestamp: 1 });
        if (messages.length === 0) {
            return res.status(404).json({ error: 'Thread not found' });
        }
        res.json(messages);
    }
    catch (err) {
        console.error('[Get Thread Messages Error]', err);
        res.status(500).json({ error: 'Failed to fetch thread' });
    }
}));
// ── POST /api/admin/messages/:threadId/reply ───────────────────────────────────
// Send a reply to a customer message thread (admin only)
router.post('/messages/:threadId/reply', auth_1.requireAdmin, [(0, express_validator_1.body)('message').trim().notEmpty().withMessage('Message required')], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!handleValidation(req, res))
        return;
    try {
        const { threadId } = req.params;
        const { message } = req.body;
        // Verify thread exists
        const existingMessage = yield Message_1.default.findOne({ threadId });
        if (!existingMessage) {
            return res.status(404).json({ error: 'Thread not found' });
        }
        const newMessage = yield Message_1.default.create({
            userId: existingMessage.userId,
            threadId,
            sender: 'admin',
            senderName: ((_a = req.admin) === null || _a === void 0 ? void 0 : _a.name) || 'Admin',
            message,
            readByCustomer: false,
            readByAdmin: true,
        });
        res.status(201).json(newMessage);
    }
    catch (err) {
        console.error('[Admin Reply Error]', err);
        res.status(500).json({ error: 'Failed to send reply' });
    }
}));
// ── PUT /api/admin/messages/:threadId/mark-read ────────────────────────────────
// Mark all messages in a thread as read by admin (admin only)
router.put('/messages/:threadId/mark-read', auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { threadId } = req.params;
        yield Message_1.default.updateMany({ threadId }, { $set: { readByAdmin: true } });
        res.json({ message: 'Thread marked as read' });
    }
    catch (err) {
        console.error('[Mark Read Error]', err);
        res.status(500).json({ error: 'Failed to mark thread as read' });
    }
}));
exports.default = router;
