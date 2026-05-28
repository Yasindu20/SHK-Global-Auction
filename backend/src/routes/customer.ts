import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import Order from '../models/Order';
import Message from '../models/Message';
import Listing from '../models/Listing';
import { requireUser, AuthRequest } from '../middleware/auth';

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

// ── GET /api/user/profile ─────────────────────────────────────────────────────
// Retrieve authenticated user's profile details
router.get('/profile', requireUser, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.currentUser?.id)
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
  } catch (err) {
    console.error('[Get Profile Error]', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ── PUT /api/user/profile ─────────────────────────────────────────────────────
// Update user profile (firstName, lastName, phone, country)
router.put(
  '/profile',
  requireUser,
  [
    body('firstName').optional().trim().isLength({ max: 50 }),
    body('lastName').optional().trim().isLength({ max: 50 }),
    body('phone').optional().trim(),
    body('country').optional().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    if (!handleValidation(req, res)) return;

    try {
      const { firstName, lastName, phone, country } = req.body;
      const user = await User.findById(req.currentUser?.id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (phone !== undefined) user.phone = phone;
      if (country !== undefined) user.country = country;

      await user.save();

      res.json({
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        country: user.country,
        role: user.role,
      });
    } catch (err) {
      console.error('[Update Profile Error]', err);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// ── PUT /api/user/password ────────────────────────────────────────────────────
// Change password
router.put(
  '/password',
  requireUser,
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and a number'),
  ],
  async (req: AuthRequest, res: Response) => {
    if (!handleValidation(req, res)) return;

    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.currentUser?.id).select('+password');

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      user.password = newPassword;
      await user.save();

      res.json({ message: 'Password changed successfully' });
    } catch (err) {
      console.error('[Change Password Error]', err);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
);

// ── GET /api/user/orders ──────────────────────────────────────────────────────
// Fetch all orders for authenticated user
router.get('/orders', requireUser, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find({ userId: req.currentUser?.id } as any)
      .populate('vehicleId', 'make modelName year price images grade')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error('[Get Orders Error]', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ── GET /api/user/orders/:orderId ─────────────────────────────────────────────
// Fetch a specific order with documents
router.get('/orders/:orderId', requireUser, async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.currentUser?.id,
    } as any).populate('vehicleId', 'make modelName year price images grade');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    console.error('[Get Order Error]', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// ── GET /api/user/saved-vehicles ──────────────────────────────────────────────
// Get list of saved vehicles
router.get('/saved-vehicles', requireUser, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.currentUser?.id)
      .select('savedVehicles')
      .populate('savedVehicles', 'make modelName year price images grade');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.savedVehicles);
  } catch (err) {
    console.error('[Get Saved Vehicles Error]', err);
    res.status(500).json({ error: 'Failed to fetch saved vehicles' });
  }
});

// ── POST /api/user/saved-vehicles ─────────────────────────────────────────────
// Add vehicle to saved list
router.post(
  '/saved-vehicles',
  requireUser,
  [body('vehicleId').isMongoId().withMessage('Valid vehicle ID required')],
  async (req: AuthRequest, res: Response) => {
    if (!handleValidation(req, res)) return;

    try {
      const { vehicleId } = req.body;
      const user = await User.findById(req.currentUser?.id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if vehicle exists
      const vehicle = await Listing.findById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      // Check if already saved
      if (user.savedVehicles.some((id) => id.toString() === vehicleId)) {
        return res.status(400).json({ error: 'Vehicle already saved' });
      }

      user.savedVehicles.push(vehicleId as any);
      await user.save();

      res.status(201).json({ message: 'Vehicle saved successfully' });
    } catch (err) {
      console.error('[Save Vehicle Error]', err);
      res.status(500).json({ error: 'Failed to save vehicle' });
    }
  }
);

// ── DELETE /api/user/saved-vehicles/:vehicleId ────────────────────────────────
// Remove vehicle from saved list
router.delete(
  '/saved-vehicles/:vehicleId',
  requireUser,
  async (req: AuthRequest, res: Response) => {
    try {
      const { vehicleId } = req.params;
      const user = await User.findById(req.currentUser?.id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      user.savedVehicles = user.savedVehicles.filter(
        (id) => id.toString() !== vehicleId
      );
      await user.save();

      res.json({ message: 'Vehicle removed from saved list' });
    } catch (err) {
      console.error('[Remove Saved Vehicle Error]', err);
      res.status(500).json({ error: 'Failed to remove vehicle' });
    }
  }
);

// ── GET /api/user/messages ────────────────────────────────────────────────────
// Get all message threads for the user
router.get('/messages', requireUser, async (req: AuthRequest, res: Response) => {
  try {
    const threads = await Message.find({ userId: req.currentUser?.id } as any)
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
  } catch (err) {
    console.error('[Get Messages Error]', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// ── GET /api/user/messages/:threadId ──────────────────────────────────────────
// Get all messages in a specific thread
router.get(
  '/messages/:threadId',
  requireUser,
  async (req: AuthRequest, res: Response) => {
    try {
      const { threadId } = req.params;
      const messages = await Message.find({
        userId: req.currentUser?.id,
        threadId,
      } as any).sort({ timestamp: 1 });

      if (messages.length === 0) {
        return res.status(404).json({ error: 'Thread not found' });
      }

      res.json(messages);
    } catch (err) {
      console.error('[Get Thread Error]', err);
      res.status(500).json({ error: 'Failed to fetch thread' });
    }
  }
);

// ── POST /api/user/messages ───────────────────────────────────────────────────
// Create a new message thread
router.post(
  '/messages',
  requireUser,
  [body('subject').trim().notEmpty().withMessage('Subject required'),
   body('message').trim().notEmpty().withMessage('Message required')],
  async (req: AuthRequest, res: Response) => {
    if (!handleValidation(req, res)) return;

    try {
      const { subject, message } = req.body;
      const user = await User.findById(req.currentUser?.id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Generate unique threadId
      const threadId = `${req.currentUser?.id}-${Date.now()}`;

      const newMessage = await Message.create({
        userId: req.currentUser?.id,
        threadId,
        sender: 'customer',
        senderName: `${user.firstName} ${user.lastName}`,
        message: `[${subject}]\n${message}`,
        readByCustomer: true,
        readByAdmin: false,
      } as any);

      res.status(201).json(newMessage);
    } catch (err) {
      console.error('[Create Message Error]', err);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
);

// ── POST /api/user/messages/:threadId/reply ───────────────────────────────────
// Reply to a message thread
router.post(
  '/messages/:threadId/reply',
  requireUser,
  [body('message').trim().notEmpty().withMessage('Message required')],
  async (req: AuthRequest, res: Response) => {
    if (!handleValidation(req, res)) return;

    try {
      const { threadId } = req.params;
      const { message } = req.body;
      const user = await User.findById(req.currentUser?.id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify thread exists and belongs to user
      const existingMessage = await Message.findOne({
        threadId,
        userId: req.currentUser?.id,
      } as any);

      if (!existingMessage) {
        return res.status(404).json({ error: 'Thread not found' });
      }

      const newMessage = await Message.create({
        userId: req.currentUser?.id,
        threadId,
        sender: 'customer',
        senderName: `${user.firstName} ${user.lastName}`,
        message,
        readByCustomer: true,
        readByAdmin: false,
      } as any);

      res.status(201).json(newMessage);
    } catch (err) {
      console.error('[Reply Message Error]', err);
      res.status(500).json({ error: 'Failed to send reply' });
    }
  }
);

export default router;
