import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Listing from './models/Listing';
import { STCJapanParser } from './crawler/STCJapanParser';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/car_auction';

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// ─── Track active crawl state ─────────────────────────────────────────────────
interface CrawlState {
  running: boolean;
  logs: string[];
  added: number;
  skipped: number;
  failed: number;
  startedAt?: Date;
  finishedAt?: Date;
}

const crawlState: CrawlState = {
  running: false,
  logs: [],
  added: 0,
  skipped: 0,
  failed: 0,
};

// ─── SSE clients for live log streaming ──────────────────────────────────────
const sseClients: express.Response[] = [];

function broadcastLog(msg: string) {
  crawlState.logs.push(msg);
  // Keep last 500 lines
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
app.get('/api/listings', async (req, res) => {
  const listings = await Listing.find({ status: 'approved' }).sort({
    timestamp: -1,
  });
  res.json(listings);
});

app.get('/api/listings/all', async (req, res) => {
  const listings = await Listing.find().sort({ timestamp: -1 });
  res.json(listings);
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

// ─── API: single URL crawl ────────────────────────────────────────────────────
app.post('/api/crawl', async (req, res) => {
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

// ─── API: bulk crawl (year >= minYear, all pages) ─────────────────────────────
/**
 * POST /api/crawl-batch
 * Body: { supplier: "STC Japan", minYear?: number }
 *
 * minYear defaults to 2025.
 * Runs in background; poll /api/crawl-status for progress.
 */
app.post('/api/crawl-batch', async (req, res) => {
  if (crawlState.running) {
    return res
      .status(409)
      .json({ error: 'A crawl is already running. Check /api/crawl-status.' });
  }

  const { supplier, minYear = 2025 } = req.body;

  if (supplier !== 'STC Japan') {
    return res.status(400).json({ error: 'Unsupported supplier' });
  }

  // Reset state
  crawlState.running = true;
  crawlState.logs = [];
  crawlState.added = 0;
  crawlState.skipped = 0;
  crawlState.failed = 0;
  crawlState.startedAt = new Date();
  crawlState.finishedAt = undefined;

  res.json({
    message: `Batch scraping started for STC Japan — year >= ${minYear}. ` +
      `Stream logs at GET /api/crawl-logs or poll GET /api/crawl-status.`,
  });

  // ── Background task ──────────────────────────────────────────────────────
  (async () => {
    const parser = new STCJapanParser();
    broadcastLog(`🚀 Starting crawl — year >= ${minYear}`);

    try {
      await parser.scrapeAllByYear(
        minYear,
        async (data) => {
          const listing = new Listing({ ...data, status: 'approved' });
          await listing.save();
          crawlState.added++;
        },
        (msg) => {
          broadcastLog(msg);
          // Update counters from log messages
          if (msg.includes('Duplicate')) crawlState.skipped++;
          if (msg.includes('Failed') || msg.includes('❌')) crawlState.failed++;
        }
      );

      const summary =
        `✅ Crawl finished — ` +
        `Added: ${crawlState.added}, ` +
        `Skipped (dup): ${crawlState.skipped}, ` +
        `Failed: ${crawlState.failed}`;
      broadcastLog(summary);
      console.log(summary);
    } catch (err: any) {
      const msg = `💥 Crawl crashed: ${err.message}`;
      broadcastLog(msg);
      console.error(msg);
    } finally {
      await parser.close();
      crawlState.running = false;
      crawlState.finishedAt = new Date();
    }
  })();
});

// ─── API: stop crawl (graceful) ───────────────────────────────────────────────
app.post('/api/crawl-stop', (_req, res) => {
  if (!crawlState.running) {
    return res.json({ message: 'No crawl is running.' });
  }
  // We flag running=false; the parser will finish its current item then stop
  crawlState.running = false;
  res.json({ message: 'Stop signal sent. Current item will finish first.' });
});

// ─── API: crawl status ────────────────────────────────────────────────────────
app.get('/api/crawl-status', (_req, res) => {
  res.json({
    running: crawlState.running,
    added: crawlState.added,
    skipped: crawlState.skipped,
    failed: crawlState.failed,
    startedAt: crawlState.startedAt,
    finishedAt: crawlState.finishedAt,
    recentLogs: crawlState.logs.slice(-50),
  });
});

// ─── API: SSE live log stream ─────────────────────────────────────────────────
app.get('/api/crawl-logs', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send all existing logs immediately
  for (const line of crawlState.logs) {
    res.write(`data: ${JSON.stringify({ log: line })}\n\n`);
  }

  sseClients.push(res);

  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// ─── API: stats ───────────────────────────────────────────────────────────────
app.get('/api/stats', async (_req, res) => {
  try {
    const total = await Listing.countDocuments();
    const approved = await Listing.countDocuments({ status: 'approved' });
    const pending = await Listing.countDocuments({ status: 'pending' });
    const rejected = await Listing.countDocuments({ status: 'rejected' });
    res.json({ total, approved, pending, rejected });
  } catch {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});