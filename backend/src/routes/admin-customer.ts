import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Order from '../models/Order';
import Message from '../models/Message';
import User from '../models/User';
import { requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// ── Validation helper ─────────────────────────────────────────────────────────
const handleValidation = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: 'Validation failed', details: errors.array() });
    return false;
  }
  return true;
};

// ── GET /api/admin/users ──────────────────────────────────────────────────────
// Retrieve all customers (admin only)
router.get('/users', requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({ role: 'customer' })
      .select('-password -refreshToken')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    console.error('[Get Users Error]', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ── GET /api/admin/users/:userId/orders ───────────────────────────────────────
// Retrieve all orders for a specific customer (admin only)
router.get(
  '/users/:userId/orders',
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const orders = await Order.find({ userId } as any)
        .populate('vehicleId', 'make modelName year price images grade')
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 });

      if (orders.length === 0) {
        return res.status(404).json({ error: 'No orders found for this user' });
      }

      res.json(orders);
    } catch (err) {
      console.error('[Get User Orders Error]', err);
      res.status(500).json({ error: 'Failed to fetch user orders' });
    }
  }
);

// ── PUT /api/admin/orders/:orderId/status ─────────────────────────────────────
// Update shipment status of an order (admin only)
router.put(
  '/orders/:orderId/status',
  requireAdmin,
  [
    body('status')
      .isIn(['purchased', 'shipped', 'in_transit', 'customs_cleared', 'delivered'])
      .withMessage('Invalid status'),
    body('vessel').optional().trim(),
    body('container').optional().trim(),
    body('eta').optional().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    if (!handleValidation(req, res)) return;

    try {
      const { orderId } = req.params;
      const { status, vessel, container, eta } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Update status and tracking steps
      order.status = status;
      if (vessel) order.vessel = vessel;
      if (container) order.container = container;
      if (eta) order.eta = eta;

      // Update tracking steps based on status
      const statusMap: Record<string, number> = {
        purchased: 0,
        shipped: 1,
        in_transit: 2,
        customs_cleared: 3,
        delivered: 4,
      };

      const stepIndex = statusMap[status];
      order.trackingSteps = order.trackingSteps.map((step, idx) => ({
        ...step,
        done: idx <= stepIndex,
        active: idx === stepIndex,
        timestamp: idx === stepIndex ? new Date() : step.timestamp,
      }));

      await order.save();

      res.json({
        message: 'Order status updated successfully',
        order,
      });
    } catch (err) {
      console.error('[Update Order Status Error]', err);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  }
);

// ── POST /api/admin/orders/:orderId/documents ──────────────────────────────────
// Upload documents for an order (admin only)
router.post(
  '/orders/:orderId/documents',
  requireAdmin,
  [
    body('documentName').trim().notEmpty().withMessage('Document name required'),
    body('documentUrl').trim().notEmpty().withMessage('Document URL required'),
    body('documentType').optional().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    if (!handleValidation(req, res)) return;

    try {
      const { orderId } = req.params;
      const { documentName, documentUrl, documentType } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      order.documents.push({
        name: documentName,
        url: documentUrl,
        type: documentType || 'PDF',
        uploadedAt: new Date(),
      });

      await order.save();

      res.status(201).json({
        message: 'Document added successfully',
        order,
      });
    } catch (err) {
      console.error('[Add Document Error]', err);
      res.status(500).json({ error: 'Failed to add document' });
    }
  }
);

// ── DELETE /api/admin/orders/:orderId/documents/:docIndex ──────────────────────
// Delete a document from an order (admin only)
router.delete(
  '/orders/:orderId/documents/:docIndex',
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { orderId, docIndex } = req.params;
      const index = parseInt(docIndex as string, 10);

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (index < 0 || index >= order.documents.length) {
        return res.status(400).json({ error: 'Invalid document index' });
      }

      order.documents.splice(index as number, 1);
      await order.save();

      res.json({
        message: 'Document removed successfully',
        order,
      });
    } catch (err) {
      console.error('[Delete Document Error]', err);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  }
);

// ── GET /api/admin/messages ───────────────────────────────────────────────────
// Retrieve all customer message threads (admin only)
router.get('/messages', requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const threads = await Message.find()
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
  } catch (err) {
    console.error('[Get All Messages Error]', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// ── GET /api/admin/messages/:threadId ──────────────────────────────────────────
// Get all messages in a specific thread (admin only)
router.get(
  '/messages/:threadId',
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { threadId } = req.params;
      const messages = await Message.find({ threadId })
        .populate('userId', 'firstName lastName email')
        .sort({ timestamp: 1 });

      if (messages.length === 0) {
        return res.status(404).json({ error: 'Thread not found' });
      }

      res.json(messages);
    } catch (err) {
      console.error('[Get Thread Messages Error]', err);
      res.status(500).json({ error: 'Failed to fetch thread' });
    }
  }
);

// ── POST /api/admin/messages/:threadId/reply ───────────────────────────────────
// Send a reply to a customer message thread (admin only)
router.post(
  '/messages/:threadId/reply',
  requireAdmin,
  [body('message').trim().notEmpty().withMessage('Message required')],
  async (req: AuthRequest, res: Response) => {
    if (!handleValidation(req, res)) return;

    try {
      const { threadId } = req.params;
      const { message } = req.body;

      // Verify thread exists
      const existingMessage = await Message.findOne({ threadId });
      if (!existingMessage) {
        return res.status(404).json({ error: 'Thread not found' });
      }

      const newMessage = await Message.create({
        userId: existingMessage.userId,
        threadId,
        sender: 'admin',
        senderName: req.admin?.name || 'Admin',
        message,
        readByCustomer: false,
        readByAdmin: true,
      } as any);

      res.status(201).json(newMessage);
    } catch (err) {
      console.error('[Admin Reply Error]', err);
      res.status(500).json({ error: 'Failed to send reply' });
    }
  }
);

// ── PUT /api/admin/messages/:threadId/mark-read ────────────────────────────────
// Mark all messages in a thread as read by admin (admin only)
router.put(
  '/messages/:threadId/mark-read',
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { threadId } = req.params;

      await Message.updateMany(
        { threadId },
        { $set: { readByAdmin: true } } as any
      );

      res.json({ message: 'Thread marked as read' });
    } catch (err) {
      console.error('[Mark Read Error]', err);
      res.status(500).json({ error: 'Failed to mark thread as read' });
    }
  }
);

export default router;
