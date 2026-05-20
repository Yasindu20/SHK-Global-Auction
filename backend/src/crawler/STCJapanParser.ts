import { BrowserContext, Page } from 'playwright';
import { Crawler } from './Crawler';

const SITE_BASE = 'https://stcjapan.net';

/**
 * A session wraps one BrowserContext + its warm-up state.
 * We reuse the same context for a batch of pages so cookies accumulate
 * naturally — just like a human browsing multiple listings.
 * After SESSION_PAGE_LIMIT pages we rotate to a fresh fingerprint.
 */
const SESSION_PAGE_LIMIT = 12;

export class STCJapanParser extends Crawler {
  private _ctx: BrowserContext | null = null;
  private _ctxPageCount = 0;

  // ─── Session management ───────────────────────────────────────────────────

  /** Returns the active context, creating + warming one up if needed. */
  private async getContext(): Promise<BrowserContext> {
    if (!this._ctx || this._ctxPageCount >= SESSION_PAGE_LIMIT) {
      // Tear down old context gracefully
      if (this._ctx) {
        await this._ctx.close().catch(() => {});
        this._ctx = null;
      }
      // Build fresh fingerprinted context with search page as referrer
      this._ctx = await this.createStealthContext(`${SITE_BASE}/search.php`);
      this._ctxPageCount = 0;

      // Warm-up: visit the homepage so cookies are set before we touch any listing
      await this._warmUpHomepage(this._ctx);
    }
    return this._ctx;
  }

  /**
   * Visits the STC Japan homepage like a new visitor would.
   * Establishes session cookies and realistic navigation history.
   */
  private async _warmUpHomepage(context: BrowserContext): Promise<void> {
    const page = await context.newPage();
    try {
      await page.setExtraHTTPHeaders({ 'Referer': 'https://www.google.com/search?q=stc+japan+used+cars+export' });
      await page.goto(SITE_BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await this.humanDelay(2200, 900); // "reading" homepage
      await this.simulateScroll(page, 0.4);
      await this.simulateMouseMovement(page);
      await this.humanDelay(1400, 600);

      // Sometimes visit the search page too (extra legitimacy)
      if (Math.random() > 0.5) {
        await page.goto(SITE_BASE + '/search.php', { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await this.humanDelay(1800, 700);
        await this.simulateScroll(page, 0.3);
      }
    } catch (e) {
      console.warn('[warmup] homepage visit failed (non-fatal):', (e as Error).message);
    } finally {
      await page.close();
    }
  }

  // ─── Retry helper ─────────────────────────────────────────────────────────
  private async withRetry<T>(
    fn: () => Promise<T>,
    retries = 3,
    label = 'request'
  ): Promise<T | null> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        if (attempt === retries) {
          console.error(`[retry] ${label} failed after ${retries} attempts: ${err.message}`);
          return null;
        }
        // Exponential back-off: 4s, 8s, 16s …
        const backoff = 4000 * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.warn(`[retry] ${label} attempt ${attempt} failed. Waiting ${Math.round(backoff / 1000)}s…`);
        await this.wait(backoff);

        // Force a new session after a failure — we may be rate-limited
        if (this._ctx) {
          await this._ctx.close().catch(() => {});
          this._ctx = null;
          this._ctxPageCount = 0;
        }
      }
    }
    return null;
  }

  // ─── Check if page looks blocked / captcha'd ──────────────────────────────
  private async _isBlocked(page: Page): Promise<boolean> {
    const title = await page.title().catch(() => '');
    const body  = await page.evaluate(() => document.body?.innerText?.slice(0, 500) ?? '');
    const blocked =
      title.toLowerCase().includes('captcha')       ||
      title.toLowerCase().includes('blocked')       ||
      title.toLowerCase().includes('access denied') ||
      body.toLowerCase().includes('captcha')        ||
      body.toLowerCase().includes('too many requests') ||
      body.toLowerCase().includes('rate limit');
    if (blocked) console.warn('[blocked] Potential bot detection on page:', page.url());
    return blocked;
  }

  // ─── Scrape a single vehicle detail page ──────────────────────────────────
  async scrape(url: string): Promise<any> {
    return this.withRetry(async () => {
      const context = await this.getContext();
      const page    = await context.newPage();
      this._ctxPageCount++;

      try {
        // Use the search page as the referrer — we "clicked" from there
        await page.setExtraHTTPHeaders({
          'Referer': `${SITE_BASE}/search.php`,
        });

        await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });

        // Bail early if we've been flagged
        if (await this._isBlocked(page)) {
          // Force session rotation on next call
          this._ctxPageCount = SESSION_PAGE_LIMIT;
          throw new Error('Bot detection triggered');
        }

        try {
          await page.waitForSelector('table, .car-details, .vehicle-details, #content', {
            timeout: 20_000,
          });
        } catch {
          console.warn(`[scrape] Content selector timeout: ${url}`);
        }

        // ── Human behaviour on the detail page ──
        await this.humanDelay(1800, 800);    // initial "landing" pause
        await this.simulateMouseMovement(page);
        await this.simulateScroll(page, 0.6);
        await this.humanDelay(1200, 600);    // "reading" specs

        // ── Extract data ──────────────────────────────────────────────────
        const data = await page.evaluate(() => {
          const getTdValue = (label: string): string => {
            const cells = Array.from(document.querySelectorAll('td, th'));
            const labelCell = cells.find(
              (td) =>
                td.textContent?.trim().toLowerCase() === label.toLowerCase() ||
                td.textContent?.trim().toLowerCase().includes(label.toLowerCase())
            );
            if (!labelCell) return '';
            const next = labelCell.nextElementSibling;
            if (next) return next.textContent?.trim() ?? '';
            const row = labelCell.closest('tr');
            if (row) {
              const tds = row.querySelectorAll('td');
              if (tds.length >= 2) return tds[tds.length - 1].textContent?.trim() ?? '';
            }
            return '';
          };

          const parseNum   = (s: string) => parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;
          const parseFloat2 = (s: string) => parseFloat(s.replace(/[^0-9.]/g, '')) || 0;

          const stockId =
            getTdValue('Stock ID')  || getTdValue('Stock Id') ||
            getTdValue('Stock No')  || getTdValue('Ref No')   || '';
          const make =
            getTdValue('Make') || getTdValue('Brand') || getTdValue('Maker') || '';
          const model = getTdValue('Model') || getTdValue('Model Name') || '';

          if (!stockId && !make) return null;

          const yearRaw =
            getTdValue('Year') || getTdValue('Model Year') ||
            getTdValue('Manufacture Year') || '0';

          // ── Image collection ──────────────────────────────────────────────
          const imgUrls: string[] = [];
          const seen = new Set<string>();

          const addImg = (src: string | null | undefined) => {
            if (!src || src.startsWith('data:') || seen.has(src)) return;
            const lower = src.toLowerCase();
            if (['logo','icon','flag','banner','sprite','button','arrow','bg.','background']
                .some(k => lower.includes(k))) return;
            if (lower.match(/\.(jpe?g|png|webp)(\?|$)/) ||
                ['stock_image','car_image','vehicle','photo','thumb','gallery','wowslider','upload','img/']
                .some(k => lower.includes(k))) {
              seen.add(src);
              imgUrls.push(src);
            }
          };

          Array.from(document.querySelectorAll('img')).forEach(img => {
            [img.src, img.getAttribute('data-src'), img.getAttribute('data-original'),
             img.getAttribute('data-lazy'), img.getAttribute('data-lazy-src'),
             img.getAttribute('data-full')].forEach(addImg);
          });

          Array.from(document.querySelectorAll('a[href]')).forEach(a => {
            const href = (a as HTMLAnchorElement).href;
            if (href?.match(/\.(jpe?g|png|webp)(\?|$)/i)) addImg(href);
          });

          Array.from(document.querySelectorAll('[style*="background"]')).forEach(div => {
            const m = (div as HTMLElement).style.backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
            if (m) addImg(m[1]);
          });

          return {
            stockId,
            make,
            model,
            chassisNumber:
              getTdValue('Chassis NO.') || getTdValue('Chassis No') || getTdValue('Chassis'),
            year:         parseNum(yearRaw),
            mileage:      parseNum(getTdValue('Mileage') || getTdValue('KM') || '0'),
            transmission: getTdValue('Transmission') || getTdValue('Gear') || 'Automatic',
            fuel:         getTdValue('Fuel') || getTdValue('Fuel Type') || getTdValue('Engine Type') || 'Petrol',
            color:        getTdValue('Exterior color') || getTdValue('Color') || getTdValue('Colour') || '',
            price:        parseFloat2(
              getTdValue('Price') || getTdValue('FOB Price') || getTdValue('Amount') || '0'
            ),
            images: imgUrls.slice(0, 15),
          };
        });

        if (!data) return null;

        return {
          ...data,
          location:    'Japan',
          sourceUrl:   url,
          supplierName:'STC Japan',
          timestamp:   new Date(),
          status:      'pending',
        };
      } catch (err) {
        await page.close().catch(() => {});
        throw err; // propagate so withRetry can handle it
      } finally {
        // Close only if not already closed in the catch above
        await page.close().catch(() => {});
      }
    }, 3, url);
  }

  // ─── Get listing links from ONE search-result page ────────────────────────
  async getListingLinks(baseUrl: string): Promise<{ href: string; year?: number }[]> {
  return (await this.withRetry(async () => {
    const context = await this.getContext();
    const page    = await context.newPage();
    this._ctxPageCount++;

    try {
      await page.setExtraHTTPHeaders({ 'Referer': `${SITE_BASE}/` });
      await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60_000 });

      if (await this._isBlocked(page)) {
        this._ctxPageCount = SESSION_PAGE_LIMIT;
        throw new Error('Bot detection on listing page');
      }

      await this.humanDelay(1200, 500);
      await this.simulateScroll(page, 0.5);

      const links = await page.evaluate(() => {
        const results: { href: string; year?: number }[] = [];
        const seen = new Set<string>();
        const anchors = Array.from(document.querySelectorAll(
          'a[href*="Car-Details"], a[href*="car-details"], a[href*="vehicle-details"], a[href*="detail"], a[href*="stock"]'
        ));
        for (const a of anchors) {
          const href = (a as HTMLAnchorElement).href;
          if (!href || seen.has(href)) continue;
          seen.add(href);
          const text =
            a.textContent?.trim() ||
            a.closest('tr, .car-card, .vehicle-card')?.textContent || '';
          const yearMatch = text.match(/\b(20\d{2})\b/);
          results.push({ href, year: yearMatch ? parseInt(yearMatch[1]) : undefined });
        }
        return results;
      });

      return links;
    } finally {
      await page.close().catch(() => {});
    }
  }, 3, baseUrl)) ?? [];
}

  // ─── Phase 1 — collect all listing links across all pages ─────────────────
  async getAllListingLinks(
    minYear: number,
    onLog?: (msg: string) => void
  ): Promise<string[]> {
    const log = onLog ?? console.log;
    const allHrefs: string[] = [];
    const seen = new Set<string>();
    let page = 1;
    let emptyPages = 0;

    log(`🔍 Phase 1 — Collecting links (STC Japan filter: year ≥ ${minYear})…`);

    while (true) {
      const listUrl =
        `${SITE_BASE}/search.php?` +
        `make=&model=&fuel=&transmission=&category=&color=` +
        `&from_year=${minYear}&to_year=&page=${page}&searchy=Search+Now%21`;

      log(`   📄 Page ${page} — ${listUrl}`);

      const links = await this.getListingLinks(listUrl);
      log(`      → ${links.length} link(s) found`);

      if (links.length === 0) {
        emptyPages++;
        if (emptyPages >= 2) {
          log('   🛑 Two consecutive empty pages — collection complete.');
          break;
        }
        page++;
        continue;
      }
      emptyPages = 0;

      for (const { href } of links) {
        if (!seen.has(href)) { seen.add(href); allHrefs.push(href); }
      }
      log(`      Cumulative unique links: ${allHrefs.length}`);
      page++;

      // Polite inter-page pause — gaussian around 2 s
      await this.humanDelay(2000, 600);
    }

    log(`✅ Phase 1 complete — ${allHrefs.length} unique listing(s) to scrape.`);
    return allHrefs;
  }

  // ─── Phase 2 — parallel detail scraping with conservative concurrency ──────
  /**
   * Default concurrency is 2 (down from 4) — safer, still reasonable speed.
   * Stagger start times within each batch to avoid burst traffic.
   */
  async scrapeAllByYear(
    minYear: number,
    onSave: (data: any) => Promise<void>,
    onLog?: (msg: string) => void,
    concurrency = 2              // ← reduced default for safety
  ): Promise<number> {
    const log = onLog ?? console.log;

    // Clamp: never run more than 3 concurrent scrapers on a single site
    const safeConc = Math.min(concurrency, 3);
    log(`🚀 2-phase stealth crawl — year ≥ ${minYear}, concurrency ${safeConc}`);

    // ── Phase 1 ────────────────────────────────────────────────────────────
    const hrefs = await this.getAllListingLinks(minYear, log);
    if (hrefs.length === 0) {
      log('⚠  No listings found.');
      return 0;
    }

    // ── Phase 2 ────────────────────────────────────────────────────────────
    log(`\n⚡ Phase 2 — Scraping ${hrefs.length} detail page(s) (concurrency ${safeConc})…`);

    let totalAdded = 0;
    let processed  = 0;
    const total    = hrefs.length;

    const scrapeOne = async (href: string): Promise<void> => {
      // Stagger starts within a batch: 1–4 s random offset
      await this.wait(this.gaussianMs(2000, 800));

      const data = await this.scrape(href);
      processed++;
      const progress = `[${processed}/${total}]`;

      if (!data) {
        log(`   ⚠  ${progress} No data: ${href}`);
        return;
      }
      if (data.year > 0 && data.year < minYear) {
        log(`   ⏭  ${progress} Year ${data.year} < ${minYear} — skipped`);
        return;
      }
      if (!data.stockId || !data.make) {
        log(`   ⚠  ${progress} Missing stockId/make — skipped`);
        return;
      }

      try {
        await onSave(data);
        totalAdded++;
        log(`   ✅ ${progress} Saved: ${data.year} ${data.make} ${data.model} (${data.stockId}) — ${data.images.length} image(s)`);
      } catch (err: any) {
        if (err.code === 11000) {
          log(`   🔁 ${progress} Duplicate — ${data.stockId}`);
        } else {
          log(`   ❌ ${progress} Save error: ${err.message}`);
        }
      }
    };

    // Run in batches of `safeConc` with a courtesy pause between batches
    for (let i = 0; i < hrefs.length; i += safeConc) {
      const batch = hrefs.slice(i, i + safeConc);
      await Promise.all(batch.map(scrapeOne));

      const batchNum = Math.ceil((i + 1) / safeConc);
      log(`   📊 Batch ${batchNum} done — added so far: ${totalAdded}`);

      // Inter-batch pause: 3–6 s gaussian
      if (i + safeConc < hrefs.length) {
        await this.humanDelay(4000, 1000);
      }
    }

    // Clean up shared context
    if (this._ctx) {
      await this._ctx.close().catch(() => {});
      this._ctx = null;
    }

    log(`\n🏁 Crawl complete — Added: ${totalAdded} | Skipped/Dup: ${processed - totalAdded} | Total: ${processed}`);
    return totalAdded;
  }

  // ─── Ensure context is closed on explicit parser.close() call ────────────
  async close(): Promise<void> {
    if (this._ctx) {
      await this._ctx.close().catch(() => {});
      this._ctx = null;
    }
    await super.close();
  }
}