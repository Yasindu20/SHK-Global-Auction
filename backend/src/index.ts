import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import Listing from './models/Listing';
import { STCJapanParser } from './crawler/STCJapanParser';
import { requireAdmin } from './middleware/auth';
import authRouter from './routes/auth';

dotenv.config();

const app = express();

// ─── Trust proxy (needed for correct rate-limit IP detection behind Nginx/CDN) ──
app.set('trust proxy', 1);

// ─── Security: HTTP Headers via Helmet ────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding images from external sources
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// ─── Security: CORS — explicit allowed origins ────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, etc.) only in dev
      if (!origin && process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true, // Required for cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// ─── Security: Prevent NoSQL injection ───────────────────────────────────────
app.use(mongoSanitize({ replaceWith: '_' }));

// ─── HTTP Request logging (skip health checks) ────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
      skip: (req) => req.url === '/health',
    })
  );
}

// ─── Global rate limit: 120 req / 15 min per IP ───────────────────────────────
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please slow down.' },
  })
);

// ─── Static uploads ───────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// ─── MongoDB connection ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/car_auction';

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ─── Multer Disk Storage ──────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Restrict to image files only
const fileFilter = (
  _req: express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext) && allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// ─── Crawl state ──────────────────────────────────────────────────────────────
interface CrawlState {
  running: boolean;
  logs: string[];
  added: number;
  skipped: number;
  failed: number;
  totalLinks: number;
  phase: 'idle' | 'collecting' | 'scraping' | 'done';
  minYear: number;
  maxYear: number;
  startedAt?: Date;
  finishedAt?: Date;
}

const crawlState: CrawlState = {
  running: false,
  logs: [],
  added: 0,
  skipped: 0,
  failed: 0,
  totalLinks: 0,
  phase: 'idle',
  minYear: 2024,
  maxYear: 2026,
};

const sseClients: express.Response[] = [];

function broadcastLog(msg: string) {
  crawlState.logs.push(msg);
  if (crawlState.logs.length > 500) crawlState.logs.shift();
  for (const client of sseClients) {
    try {
      client.write(`data: ${JSON.stringify({ log: msg })}\n\n`);
    } catch (_) {
      /* client disconnected */
    }
  }
}

// ─── Health check (public) ────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Auth routes (public) ─────────────────────────────────────────────────────
app.use('/api/auth', authRouter);

// ─── Public listing endpoints ─────────────────────────────────────────────────
app.get('/api/listings', async (_req, res) => {
  try {
    const listings = await Listing.find({ status: 'approved' }).sort({ timestamp: -1 });
    res.json(listings);
  } catch {
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// NOTE: This specific route MUST come before /api/listings/:id
// otherwise Express will try to match "all" as an :id parameter.
app.get('/api/listings/all', requireAdmin, async (_req, res) => {
  try {
    const listings = await Listing.find().sort({ timestamp: -1 });
    res.json(listings);
  } catch {
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

app.get('/api/listings/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing || listing.status !== 'approved') {
      return res.status(404).json({ error: 'Listing not found' });
    }
    res.json(listing);
  } catch {
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

// ─── Protected admin-only endpoints (require valid admin JWT) ─────────────────

app.post('/api/listings/approve/:id', requireAdmin, async (req, res) => {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );
    res.json(listing);
  } catch {
    res.status(500).json({ error: 'Failed to approve listing' });
  }
});

app.post('/api/listings/reject/:id', requireAdmin, async (req, res) => {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    res.json(listing);
  } catch {
    res.status(500).json({ error: 'Failed to reject listing' });
  }
});

app.get('/api/stats', requireAdmin, async (_req, res) => {
  try {
    const [total, approved, pending, rejected] = await Promise.all([
      Listing.countDocuments(),
      Listing.countDocuments({ status: 'approved' }),
      Listing.countDocuments({ status: 'pending' }),
      Listing.countDocuments({ status: 'rejected' }),
    ]);
    res.json({ total, approved, pending, rejected });
  } catch {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Manual vehicle creation
app.post('/api/vehicles', requireAdmin, async (req, res) => {
  try {
    const newVehicle = new Listing({ ...req.body, status: 'approved', timestamp: new Date() });
    await newVehicle.save();
    res.status(201).json(newVehicle);
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Duplicate vehicle (Stock ID already exists)' });
    } else {
      res.status(500).json({ error: 'Failed to create vehicle', details: error.message });
    }
  }
});

// Image upload
app.post('/api/upload', requireAdmin, upload.array('images', 15), (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    const urls = files.map((file) => `/uploads/${file.filename}`);
    res.json({ urls });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to upload images', details: error.message });
  }
});

// Single URL crawl
app.post('/api/crawl', requireAdmin, async (req, res) => {
  const { url, supplier } = req.body;
  if (supplier === 'STC Japan') {
    const parser = new STCJapanParser();
    const data = await parser.scrape(url);
    await parser.close();
    if (data) {
      try {
        const newListing = new Listing({ ...data, status: 'approved' });
        await newListing.save();
        res.json({ message: 'Crawl successful', data: newListing });
      } catch (error: any) {
        if (error.code === 11000) {
          res.status(400).json({ error: 'Duplicate listing' });
        } else {
          res.status(500).json({ error: 'Failed to save listing' });
        }
      }
    } else {
      res.status(500).json({ error: 'Failed to crawl page' });
    }
  } else {
    res.status(400).json({ error: 'Unsupported supplier' });
  }
});

// Batch crawl
app.post('/api/crawl-batch', requireAdmin, async (req, res) => {
  if (crawlState.running) {
    return res.status(409).json({ error: 'A crawl is already running.' });
  }

  const { supplier, minYear = 2024, maxYear = new Date().getFullYear() + 1, concurrency = 6 } = req.body;

  if (supplier !== 'STC Japan') {
    return res.status(400).json({ error: 'Unsupported supplier' });
  }

  const safeConc = Math.max(1, Math.min(concurrency, 8));

  Object.assign(crawlState, {
    running: true,
    logs: [],
    added: 0,
    skipped: 0,
    failed: 0,
    totalLinks: 0,
    phase: 'collecting',
    minYear,
    maxYear,
    startedAt: new Date(),
    finishedAt: undefined,
  });

  res.json({ message: `2-phase batch scrape started. Poll GET /api/crawl-status.` });

  (async () => {
    const parser = new STCJapanParser();
    try {
      await parser.scrapeAllByYear(
        minYear,
        maxYear,
        async (data) => {
          const listing = new Listing({ ...data, status: 'approved' });
          await listing.save();
          crawlState.added++;
        },
        (msg) => {
          broadcastLog(msg);
          if (msg.includes('Phase 2')) crawlState.phase = 'scraping';
          const m = msg.match(/(\d+) unique listing/);
          if (m) crawlState.totalLinks = parseInt(m[1]);
          if (msg.includes('Duplicate') || msg.includes('⏭')) crawlState.skipped++;
          if (msg.includes('Failed') || msg.includes('❌') || msg.includes('💥')) crawlState.failed++;
        },
        safeConc
      );
      broadcastLog(`✅ Crawl finished — Added: ${crawlState.added}, Skipped: ${crawlState.skipped}, Failed: ${crawlState.failed}`);
    } catch (err: any) {
      broadcastLog(`💥 Crawl crashed: ${err.message}`);
    } finally {
      await parser.close();
      crawlState.running = false;
      crawlState.phase = 'done';
      crawlState.finishedAt = new Date();
    }
  })();
});

app.post('/api/crawl-stop', requireAdmin, (_req, res) => {
  if (!crawlState.running) return res.json({ message: 'No crawl running.' });
  crawlState.running = false;
  broadcastLog('🛑 Stop signal received.');
  res.json({ message: 'Stop signal sent.' });
});

app.get('/api/crawl-status', requireAdmin, (_req, res) => {
  res.json({ ...crawlState, recentLogs: crawlState.logs.slice(-50) });
});

app.get('/api/crawl-logs', requireAdmin, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  for (const line of crawlState.logs) {
    res.write(`data: ${JSON.stringify({ log: line })}\n\n`);
  }

  sseClients.push(res);
  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// ─── Catch-all: 404 for unknown API routes ────────────────────────────────────
// NOTE: Express v5 requires named wildcards — '/api/*' is invalid, use '/api/*path'
app.use('/api/*path', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Unhandled Error]', err.message);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});