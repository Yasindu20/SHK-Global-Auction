import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Listing from './models/Listing';
import { STCJapanParser } from './crawler/STCJapanParser';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ─── Static Files for Uploads ────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/car_auction';

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// ─── Multer Disk Storage ─────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// ─── Track active crawl state ─────────────────────────────────────────────────
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
  running:    false,
  logs:       [],
  added:      0,
  skipped:    0,
  failed:     0,
  totalLinks: 0,
  phase:      'idle',
  minYear:    2024,
  maxYear:    2026,
};

const sseClients: express.Response[] = [];

function broadcastLog(msg: string) {
  crawlState.logs.push(msg);
  if (crawlState.logs.length > 500) crawlState.logs.shift();

  for (const client of sseClients) {
    try {
      client.write(`data: ${JSON.stringify({ log: msg })}\n\n`);
    } catch {
      // client disconnected
    }
  }
}

// ─── API: listings ────────────────────────────────────────────────────────────
app.get('/api/listings', async (_req, res) => {
  try {
    const listings = await Listing.find({ status: 'approved' }).sort({ timestamp: -1 });
    res.json(listings);
  } catch {
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

app.get('/api/listings/all', async (_req, res) => {
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
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json(listing);
  } catch {
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

app.post('/api/listings/approve/:id', async (req, res) => {
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

app.post('/api/listings/reject/:id', async (req, res) => {
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

// ─── API: Manual Vehicle Creation ──────────────────────────────────────────────
app.post('/api/vehicles', async (req, res) => {
  try {
    const vehicleData = req.body;
    const newVehicle = new Listing({
      ...vehicleData,
      status: 'approved',
      timestamp: new Date()
    });
    await newVehicle.save();
    res.status(201).json(newVehicle);
  } catch (error: any) {
    console.error('Error creating vehicle:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Duplicate vehicle (Stock ID already exists)' });
    } else {
      res.status(500).json({ error: 'Failed to create vehicle', details: error.message });
    }
  }
});

// ─── API: Image Upload (Local Disk) ───────────────────────────────────────────
app.post('/api/upload', upload.array('images', 15), (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    // Return relative paths that the frontend can use
    const urls = files.map(file => `/uploads/${file.filename}`);
    res.json({ urls });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload images', details: error.message });
  }
});

// ─── API: single URL crawl ────────────────────────────────────────────────────
app.post('/api/crawl', async (req, res) => {
  const { url, supplier } = req.body;

  if (supplier === 'STC Japan') {
    const parser = new STCJapanParser();
    const data   = await parser.scrape(url);
    await parser.close();

    if (data) {
      try {
        const newListing = new Listing({ ...data, status: 'approved' });
        await newListing.save();
        res.json({ message: 'Crawl successful', data: newListing });
      } catch (error: any) {
        if (error.code === 11000) {
          res.status(400).json({ error: 'Duplicate listing (Stock ID already exists)' });
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

// ─── API: bulk crawl (optimised 2-phase) ──────────────────────────────────────
app.post('/api/crawl-batch', async (req, res) => {
  if (crawlState.running) {
    return res
      .status(409)
      .json({ error: 'A crawl is already running. Check /api/crawl-status.' });
  }

  const {
    supplier,
    minYear     = 2024,
    maxYear     = new Date().getFullYear() + 1,
    concurrency = 6,
  } = req.body;

  if (supplier !== 'STC Japan') {
    return res.status(400).json({ error: 'Unsupported supplier' });
  }

  const safeConc = Math.max(1, Math.min(concurrency, 8));

  crawlState.running    = true;
  crawlState.logs       = [];
  crawlState.added      = 0;
  crawlState.skipped    = 0;
  crawlState.failed     = 0;
  crawlState.totalLinks = 0;
  crawlState.phase      = 'collecting';
  crawlState.minYear    = minYear;
  crawlState.maxYear    = maxYear;
  crawlState.startedAt  = new Date();
  crawlState.finishedAt = undefined;

  res.json({
    message:
      `2-phase batch scrape started for STC Japan — ` +
      `year ${minYear}–${maxYear}, concurrency ${safeConc}. ` +
      `Stream logs at GET /api/crawl-logs or poll GET /api/crawl-status.`,
  });

  (async () => {
    const parser = new STCJapanParser();
    broadcastLog(
      `🚀 Starting optimised 2-phase crawl — year ${minYear}–${maxYear}, concurrency ${safeConc}`
    );

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
          const linkMatch = msg.match(/(\d+) unique listing/);
          if (linkMatch) crawlState.totalLinks = parseInt(linkMatch[1]);
          if (msg.includes('Duplicate') || msg.includes('⏭')) crawlState.skipped++;
          if (msg.includes('Failed') || msg.includes('❌') || msg.includes('💥'))
            crawlState.failed++;
        },
        safeConc
      );

      const summary =
        `✅ Crawl finished — ` +
        `Added: ${crawlState.added}, ` +
        `Skipped/Dup: ${crawlState.skipped}, ` +
        `Failed: ${crawlState.failed}, ` +
        `Total links scraped: ${crawlState.totalLinks}`;
      broadcastLog(summary);
    } catch (err: any) {
      const msg = `💥 Crawl crashed: ${err.message}`;
      broadcastLog(msg);
    } finally {
      await parser.close();
      crawlState.running    = false;
      crawlState.phase      = 'done';
      crawlState.finishedAt = new Date();
    }
  })();
});

app.post('/api/crawl-stop', (_req, res) => {
  if (!crawlState.running) {
    return res.json({ message: 'No crawl is running.' });
  }
  crawlState.running = false;
  broadcastLog('🛑 Stop signal received — finishing current batch then halting.');
  res.json({ message: 'Stop signal sent. Current batch will finish first.' });
});

app.get('/api/crawl-status', (_req, res) => {
  res.json({
    running:    crawlState.running,
    phase:      crawlState.phase,
    added:      crawlState.added,
    skipped:    crawlState.skipped,
    failed:     crawlState.failed,
    totalLinks: crawlState.totalLinks,
    minYear:    crawlState.minYear,
    maxYear:    crawlState.maxYear,
    startedAt:  crawlState.startedAt,
    finishedAt: crawlState.finishedAt,
    recentLogs: crawlState.logs.slice(-50),
  });
});

app.get('/api/crawl-logs', (req, res) => {
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
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

app.get('/api/stats', async (_req, res) => {
  try {
    const total    = await Listing.countDocuments();
    const approved = await Listing.countDocuments({ status: 'approved' });
    const pending  = await Listing.countDocuments({ status: 'pending' });
    const rejected = await Listing.countDocuments({ status: 'rejected' });
    res.json({ total, approved, pending, rejected });
  } catch {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
