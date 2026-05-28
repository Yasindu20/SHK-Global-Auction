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
const dns_1 = __importDefault(require("dns"));
dns_1.default.setServers(['8.8.8.8', '8.8.4.4']);
dns_1.default.setDefaultResultOrder('ipv4first');
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const Listing_1 = __importDefault(require("./models/Listing"));
const STCJapanParser_1 = require("./crawler/STCJapanParser");
const auth_1 = require("./middleware/auth");
const auth_2 = __importDefault(require("./routes/auth"));
const customer_1 = __importDefault(require("./routes/customer"));
const admin_customer_1 = __importDefault(require("./routes/admin-customer"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// ─── Trust proxy ──────────────────────────────────────────────────────────────
app.set('trust proxy', 1);
// ─── Security: HTTP Headers via Helmet ────────────────────────────────────────
app.use((0, helmet_1.default)({
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
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
}));
// ─── Security: CORS ────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin && process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express_1.default.json({ limit: '1mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '1mb' }));
app.use((0, cookie_parser_1.default)(process.env.COOKIE_SECRET));
// ─── NoSQL injection sanitization ────────────────────────────────────────────
// express-mongo-sanitize is incompatible with Express v5 because it tries to
// overwrite req.query, which is now a read-only getter. This custom middleware
// does the same job (strips $ keys and dots) without touching req.query.
function sanitizeValue(val) {
    if (Array.isArray(val))
        return val.map(sanitizeValue);
    if (val !== null && typeof val === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(val)) {
            // Replace keys starting with $ or containing dots
            const safeKey = k.startsWith('$') || k.includes('.')
                ? k.replace(/^\$+/, '_').replace(/\./g, '_')
                : k;
            out[safeKey] = sanitizeValue(v);
        }
        return out;
    }
    return val;
}
app.use((req, _res, next) => {
    if (req.body)
        req.body = sanitizeValue(req.body);
    if (req.params)
        req.params = sanitizeValue(req.params);
    // NOTE: req.query is a read-only getter in Express v5 — do not reassign it.
    next();
});
// ─── HTTP Request logging ─────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
        skip: (req) => req.url === '/health',
    }));
}
// ─── Global rate limit ────────────────────────────────────────────────────────
app.use((0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please slow down.' },
}));
// ─── Static uploads ───────────────────────────────────────────────────────────
const UPLOADS_DIR = path_1.default.join(__dirname, '../../public/uploads');
if (!fs_1.default.existsSync(UPLOADS_DIR)) {
    fs_1.default.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express_1.default.static(UPLOADS_DIR));
// ─── MongoDB connection ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/car_auction';
mongoose_1.default
    .connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});
// ─── Multer Disk Storage ──────────────────────────────────────────────────────
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
const fileFilter = (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (allowed.test(ext) && allowed.test(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Only image files are allowed'));
    }
};
const upload = (0, multer_1.default)({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });
const crawlState = {
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
const sseClients = [];
function broadcastLog(msg) {
    crawlState.logs.push(msg);
    if (crawlState.logs.length > 500)
        crawlState.logs.shift();
    for (const client of sseClients) {
        try {
            client.write(`data: ${JSON.stringify({ log: msg })}\n\n`);
        }
        catch (_) {
            /* client disconnected */
        }
    }
}
// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// ─── Auth routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', auth_2.default);
// ─── Customer profile routes ──────────────────────────────────────────────────
app.use('/api/user', customer_1.default);
// ─── Admin customer management routes ──────────────────────────────────────────
app.use('/api/admin', admin_customer_1.default);
// ─── Public listing endpoints ─────────────────────────────────────────────────
app.get('/api/listings', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const listings = yield Listing_1.default.find({ status: 'approved' }).sort({ timestamp: -1 });
        res.json(listings);
    }
    catch (_a) {
        res.status(500).json({ error: 'Failed to fetch listings' });
    }
}));
// NOTE: must come before /api/listings/:id
app.get('/api/listings/all', auth_1.requireAdmin, (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const listings = yield Listing_1.default.find().sort({ timestamp: -1 });
        res.json(listings);
    }
    catch (_a) {
        res.status(500).json({ error: 'Failed to fetch listings' });
    }
}));
app.get('/api/listings/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const listing = yield Listing_1.default.findById(req.params.id);
        if (!listing || listing.status !== 'approved') {
            return res.status(404).json({ error: 'Listing not found' });
        }
        res.json(listing);
    }
    catch (_a) {
        res.status(500).json({ error: 'Failed to fetch listing' });
    }
}));
// ─── Protected admin endpoints ────────────────────────────────────────────────
app.post('/api/listings/approve/:id', auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const listing = yield Listing_1.default.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
        res.json(listing);
    }
    catch (_a) {
        res.status(500).json({ error: 'Failed to approve listing' });
    }
}));
app.post('/api/listings/reject/:id', auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const listing = yield Listing_1.default.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
        res.json(listing);
    }
    catch (_a) {
        res.status(500).json({ error: 'Failed to reject listing' });
    }
}));
app.get('/api/stats', auth_1.requireAdmin, (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [total, approved, pending, rejected] = yield Promise.all([
            Listing_1.default.countDocuments(),
            Listing_1.default.countDocuments({ status: 'approved' }),
            Listing_1.default.countDocuments({ status: 'pending' }),
            Listing_1.default.countDocuments({ status: 'rejected' }),
        ]);
        res.json({ total, approved, pending, rejected });
    }
    catch (_a) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
}));
// Manual vehicle creation
app.post('/api/vehicles', auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newVehicle = new Listing_1.default(Object.assign(Object.assign({}, req.body), { status: 'approved', timestamp: new Date() }));
        yield newVehicle.save();
        res.status(201).json(newVehicle);
    }
    catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ error: 'Duplicate vehicle (Stock ID already exists)' });
        }
        else {
            res.status(500).json({ error: 'Failed to create vehicle', details: error.message });
        }
    }
}));
// Image upload
app.post('/api/upload', auth_1.requireAdmin, upload.array('images', 15), (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }
        const urls = files.map((file) => `/uploads/${file.filename}`);
        res.json({ urls });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to upload images', details: error.message });
    }
});
// Single URL crawl
app.post('/api/crawl', auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { url, supplier } = req.body;
    if (supplier === 'STC Japan') {
        const parser = new STCJapanParser_1.STCJapanParser();
        const data = yield parser.scrape(url);
        yield parser.close();
        if (data) {
            try {
                const newListing = new Listing_1.default(Object.assign(Object.assign({}, data), { status: 'approved' }));
                yield newListing.save();
                res.json({ message: 'Crawl successful', data: newListing });
            }
            catch (error) {
                if (error.code === 11000) {
                    res.status(400).json({ error: 'Duplicate listing' });
                }
                else {
                    res.status(500).json({ error: 'Failed to save listing' });
                }
            }
        }
        else {
            res.status(500).json({ error: 'Failed to crawl page' });
        }
    }
    else {
        res.status(400).json({ error: 'Unsupported supplier' });
    }
}));
// Batch crawl
app.post('/api/crawl-batch', auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    (() => __awaiter(void 0, void 0, void 0, function* () {
        const parser = new STCJapanParser_1.STCJapanParser();
        try {
            yield parser.scrapeAllByYear(minYear, maxYear, (data) => __awaiter(void 0, void 0, void 0, function* () {
                const listing = new Listing_1.default(Object.assign(Object.assign({}, data), { status: 'approved' }));
                yield listing.save();
                crawlState.added++;
            }), (msg) => {
                broadcastLog(msg);
                if (msg.includes('Phase 2'))
                    crawlState.phase = 'scraping';
                const m = msg.match(/(\d+) unique listing/);
                if (m)
                    crawlState.totalLinks = parseInt(m[1]);
                if (msg.includes('Duplicate') || msg.includes('⏭'))
                    crawlState.skipped++;
                if (msg.includes('Failed') || msg.includes('❌') || msg.includes('💥'))
                    crawlState.failed++;
            }, safeConc);
            broadcastLog(`✅ Crawl finished — Added: ${crawlState.added}, Skipped: ${crawlState.skipped}, Failed: ${crawlState.failed}`);
        }
        catch (err) {
            broadcastLog(`💥 Crawl crashed: ${err.message}`);
        }
        finally {
            yield parser.close();
            crawlState.running = false;
            crawlState.phase = 'done';
            crawlState.finishedAt = new Date();
        }
    }))();
}));
app.post('/api/crawl-stop', auth_1.requireAdmin, (_req, res) => {
    if (!crawlState.running)
        return res.json({ message: 'No crawl running.' });
    crawlState.running = false;
    broadcastLog('🛑 Stop signal received.');
    res.json({ message: 'Stop signal sent.' });
});
app.get('/api/crawl-status', auth_1.requireAdmin, (_req, res) => {
    res.json(Object.assign(Object.assign({}, crawlState), { recentLogs: crawlState.logs.slice(-50) }));
});
app.get('/api/crawl-logs', auth_1.requireAdmin, (req, res) => {
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
        if (idx !== -1)
            sseClients.splice(idx, 1);
    });
});
// ─── 404 for unknown API routes ───────────────────────────────────────────────
app.use('/api/*path', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
});
// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('[Unhandled Error]', err.message);
    res.status(500).json({
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
});
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
