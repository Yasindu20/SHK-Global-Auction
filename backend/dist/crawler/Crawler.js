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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Crawler = void 0;
const playwright_1 = require("playwright");
// ─── Rotating User Agent Pool ─────────────────────────────────────────────────
const USER_AGENTS = [
    // Chrome 122 – Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    // Chrome 121 – Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    // Chrome 120 – Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    // Chrome 122 – macOS Ventura
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    // Chrome 121 – macOS Sonoma
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    // Chrome 122 – Linux
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    // Edge 122 – Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
    // Edge 121 – Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0',
    // Firefox 123 – Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    // Firefox 122 – Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
    // Firefox 123 – macOS
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.3; rv:123.0) Gecko/20100101 Firefox/123.0',
    // Safari 17 – macOS
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
];
// ─── Realistic viewport sizes (real-world usage stats) ───────────────────────
const VIEWPORTS = [
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
    { width: 1600, height: 900 },
    { width: 1280, height: 800 },
    { width: 1280, height: 720 },
    { width: 2560, height: 1440 },
];
// ─── Timezone pool (believable locations for a car-buying demographic) ────────
const TIMEZONES = [
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'Europe/London',
    'Europe/Berlin',
    'Europe/Paris',
    'Asia/Dubai',
    'Asia/Singapore',
    'Australia/Sydney',
    'Africa/Nairobi',
];
// ─── Hardware profiles that fingerprint detectors expect from a real machine ──
const HW_PROFILES = [
    { concurrency: 4, memory: 4 },
    { concurrency: 6, memory: 8 },
    { concurrency: 8, memory: 8 },
    { concurrency: 8, memory: 16 },
    { concurrency: 12, memory: 16 },
    { concurrency: 16, memory: 16 },
];
// ─── Stealth Chrome launch args ───────────────────────────────────────────────
const STEALTH_ARGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--no-first-run',
    '--no-zygote',
    // *** THE most important flag — removes navigator.webdriver ***
    '--disable-blink-features=AutomationControlled',
    '--disable-features=IsolateOrigins,site-per-process',
    '--lang=en-US,en',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-breakpad',
    '--disable-client-side-phishing-detection',
    '--disable-component-update',
    '--disable-default-apps',
    '--disable-extensions',
    '--disable-hang-monitor',
    '--disable-ipc-flooding-protection',
    '--disable-prompt-on-repost',
    '--disable-renderer-backgrounding',
    '--disable-sync',
    '--force-color-profile=srgb',
    '--metrics-recording-only',
    '--safebrowsing-disable-auto-update',
    '--password-store=basic',
    '--use-mock-keychain',
    '--hide-scrollbars',
    '--mute-audio',
];
class Crawler {
    constructor(options = {}) {
        this.browser = null;
        this.options = Object.assign({ delay: 2000, headless: true }, options);
    }
    // ─── Browser lifecycle ────────────────────────────────────────────────────
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.browser = yield playwright_1.chromium.launch({
                headless: this.options.headless,
                args: STEALTH_ARGS,
            });
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.browser) {
                yield this.browser.close();
                this.browser = null;
            }
        });
    }
    // ─── Timing utilities ─────────────────────────────────────────────────────
    /**
     * Gaussian (normal) distribution — produces human-like timing clusters
     * instead of uniform random which looks mechanical.
     */
    gaussianMs(mean, stdDev) {
        let u = 0, v = 0;
        while (u === 0)
            u = Math.random();
        while (v === 0)
            v = Math.random();
        const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        return Math.max(400, Math.round(z * stdDev + mean));
    }
    wait(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => setTimeout(resolve, ms));
        });
    }
    /** Drop-in replacement for the old `this.wait()` call sites. */
    humanDelay() {
        return __awaiter(this, arguments, void 0, function* (mean = 2000, stdDev = 700) {
            yield this.wait(this.gaussianMs(mean, stdDev));
        });
    }
    // ─── Random pickers ───────────────────────────────────────────────────────
    pickRandom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }
    // ─── Stealth context factory ──────────────────────────────────────────────
    /**
     * Creates a new browser context with:
     *  • Rotated UA + viewport + timezone
     *  • Realistic HTTP headers
     *  • JS-level fingerprint spoofing (webdriver, plugins, chrome, canvas, etc.)
     */
    createStealthContext(referer) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.browser)
                yield this.init();
            const ua = this.pickRandom(USER_AGENTS);
            const viewport = this.pickRandom(VIEWPORTS);
            const timezone = this.pickRandom(TIMEZONES);
            const hw = this.pickRandom(HW_PROFILES);
            const context = yield this.browser.newContext({
                userAgent: ua,
                viewport,
                locale: 'en-US',
                timezoneId: timezone,
                extraHTTPHeaders: Object.assign({ 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9', 'Accept-Encoding': 'gzip, deflate, br', 'Connection': 'keep-alive', 'Upgrade-Insecure-Requests': '1', 'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"', 'Sec-Ch-Ua-Mobile': '?0', 'Sec-Ch-Ua-Platform': '"Windows"', 'Sec-Fetch-Dest': 'document', 'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Site': referer ? 'same-origin' : 'none', 'Sec-Fetch-User': '?1', 'Cache-Control': 'max-age=0', 'DNT': '1' }, (referer ? { 'Referer': referer } : {})),
            });
            // ── Inject JS stealth patches into every page from this context ──────────
            yield context.addInitScript(({ hwc, dm }) => {
                // 1. Kill the webdriver flag (primary bot signal)
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                // 2. Realistic plugin list
                const fakePLugins = [
                    { name: 'PDF Viewer', description: 'Portable Document Format', filename: 'internal-pdf-viewer' },
                    { name: 'Chrome PDF Viewer', description: '', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
                    { name: 'Chromium PDF Viewer', description: '', filename: 'internal-pdf-viewer' },
                    { name: 'Microsoft Edge PDF Viewer', description: '', filename: 'internal-pdf-viewer' },
                    { name: 'WebKit built-in PDF', description: '', filename: 'internal-pdf-viewer' },
                ];
                Object.defineProperty(navigator, 'plugins', {
                    get: () => Object.assign(fakePLugins, {
                        item: (i) => fakePLugins[i] || null,
                        namedItem: (n) => fakePLugins.find(p => p.name === n) || null,
                        refresh: () => { },
                    }),
                });
                // 3. Natural language list
                Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
                // 4. Hardware fingerprint
                Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => hwc });
                Object.defineProperty(navigator, 'deviceMemory', { get: () => dm });
                // 5. Chrome runtime object (absent in headless = bot signal)
                if (!window.chrome) {
                    window.chrome = {
                        app: {
                            isInstalled: false,
                            getDetails: () => { },
                            getIsInstalled: () => { },
                            installState: () => { },
                        },
                        runtime: {
                            OnInstalledReason: { CHROME_UPDATE: 'chrome_update', INSTALL: 'install', UPDATE: 'update' },
                            PlatformArch: { X86_64: 'x86-64', ARM: 'arm' },
                            PlatformOs: { WIN: 'win', MAC: 'mac', LINUX: 'linux' },
                            RequestUpdateCheckStatus: { NO_UPDATE: 'no_update', UPDATE_AVAILABLE: 'update_available' },
                        },
                    };
                }
                // 6. Permissions API — avoid `denied` on notifications revealing headless
                try {
                    const origQuery = window.navigator.permissions.query.bind(window.navigator.permissions);
                    window.navigator.permissions.query = (params) => params.name === 'notifications'
                        ? Promise.resolve({ state: Notification.permission, onchange: null })
                        : origQuery(params);
                }
                catch (_) { /* ignore */ }
                // 7. Remove leftover __proto__ webdriver key
                try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    delete navigator.__proto__.webdriver;
                }
                catch (_) { /* ignore */ }
                // 8. Canvas noise — shifts pixel data by sub-pixel amounts per session
                const _getCtx = HTMLCanvasElement.prototype.getContext;
                HTMLCanvasElement.prototype.getContext = function (type, ...args) {
                    const ctx = _getCtx.call(this, type, ...args);
                    if (type === '2d' && ctx) {
                        const _fill = ctx.fillText.bind(ctx);
                        ctx.fillText = (text, x, y, maxWidth) => {
                            if (maxWidth !== undefined)
                                _fill(text, x + 0.1, y + 0.1, maxWidth);
                            else
                                _fill(text, x + 0.1, y + 0.1);
                        };
                    }
                    return ctx;
                };
                // 9. Consistent screen dimensions
                try {
                    Object.defineProperty(screen, 'availWidth', { get: () => window.innerWidth });
                    Object.defineProperty(screen, 'availHeight', { get: () => window.innerHeight });
                }
                catch (_) { /* ignore */ }
            }, { hwc: hw.concurrency, dm: hw.memory });
            return context;
        });
    }
    // ─── Human-like interaction helpers ───────────────────────────────────────
    /**
     * Scrolls the page in uneven chunks — matches real reading behaviour.
     * @param coverage  0–1 fraction of page height to scroll (default 0.65)
     */
    simulateScroll(page_1) {
        return __awaiter(this, arguments, void 0, function* (page, coverage = 0.65) {
            try {
                yield page.evaluate((cov) => __awaiter(this, void 0, void 0, function* () {
                    const target = document.body.scrollHeight * cov;
                    let scrolled = 0;
                    yield new Promise((resolve) => {
                        const step = () => {
                            const chunk = Math.floor(Math.random() * 280) + 60;
                            window.scrollBy({ top: chunk, behavior: 'smooth' });
                            scrolled += chunk;
                            if (scrolled < target) {
                                setTimeout(step, Math.random() * 550 + 120);
                            }
                            else {
                                // Humans often scroll back up a little
                                window.scrollBy({ top: -(Math.random() * 160 + 40), behavior: 'smooth' });
                                setTimeout(resolve, 350);
                            }
                        };
                        setTimeout(step, 250);
                    });
                }), coverage);
            }
            catch ( /* page may have navigated away */_a) { /* page may have navigated away */ }
        });
    }
    /**
     * Moves the mouse in natural arcs across the viewport.
     */
    simulateMouseMovement(page) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const vp = page.viewportSize();
                if (!vp)
                    return;
                const moves = Math.floor(Math.random() * 4) + 2;
                for (let i = 0; i < moves; i++) {
                    const tx = Math.floor(vp.width * (0.1 + Math.random() * 0.8));
                    const ty = Math.floor(vp.height * (0.1 + Math.random() * 0.8));
                    yield page.mouse.move(tx, ty, { steps: Math.floor(Math.random() * 12) + 8 });
                    yield this.wait(Math.random() * 350 + 80);
                }
            }
            catch ( /* ignore */_a) { /* ignore */ }
        });
    }
    /**
     * Types text one character at a time with realistic key delays.
     */
    humanType(page, selector, text) {
        return __awaiter(this, void 0, void 0, function* () {
            yield page.click(selector);
            yield this.wait(this.gaussianMs(300, 100));
            for (const ch of text) {
                yield page.keyboard.type(ch, { delay: this.gaussianMs(90, 30) });
            }
        });
    }
}
exports.Crawler = Crawler;
