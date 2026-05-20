import { Crawler } from './Crawler';

export class STCJapanParser extends Crawler {

  // ─── Scrape a single vehicle detail page ──────────────────────────────────
  async scrape(url: string): Promise<any> {
    if (!this.browser) await this.init();
    const context = await this.browser!.newContext({
      userAgent: this.options.userAgent,
      viewport: { width: 1280, height: 900 },
    });
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

      try {
        await page.waitForSelector('table, .car-details, .vehicle-details, #content', {
          timeout: 20000,
        });
      } catch {
        console.warn(`Warning: Timeout waiting for content on ${url}`);
      }

      await this.wait(1500);

      const data = await page.evaluate(() => {
        // ── Helper: find table-cell value by label ────────────────────
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

        const parseNum = (s: string) => parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;
        const parseFloat2 = (s: string) => parseFloat(s.replace(/[^0-9.]/g, '')) || 0;

        const stockId =
          getTdValue('Stock ID') ||
          getTdValue('Stock Id') ||
          getTdValue('Stock No') ||
          getTdValue('Ref No') ||
          '';

        const make =
          getTdValue('Make') || getTdValue('Brand') || getTdValue('Maker') || '';

        const model = getTdValue('Model') || getTdValue('Model Name') || '';

        if (!stockId && !make) return null;

        const yearRaw =
          getTdValue('Year') ||
          getTdValue('Model Year') ||
          getTdValue('Manufacture Year') ||
          '0';
        const year = parseNum(yearRaw);

        // ── Image collection ─────────────────────────────────────────
        const allImgs = Array.from(document.querySelectorAll('img'));
        const imgUrls: string[] = [];

        for (const img of allImgs) {
          const candidates = [
            img.src,
            img.getAttribute('data-src'),
            img.getAttribute('data-original'),
            img.getAttribute('data-lazy'),
            img.getAttribute('data-lazy-src'),
            img.getAttribute('data-full'),
          ].filter(Boolean) as string[];

          for (const src of candidates) {
            if (!src || src.startsWith('data:')) continue;
            const lower = src.toLowerCase();
            if (
              lower.includes('logo') ||
              lower.includes('icon') ||
              lower.includes('flag') ||
              lower.includes('banner') ||
              lower.includes('sprite') ||
              lower.includes('button') ||
              lower.includes('arrow') ||
              lower.includes('bg.') ||
              lower.includes('background')
            ) continue;

            if (
              lower.match(/\.(jpe?g|png|webp)(\?|$)/) ||
              lower.includes('stock_image') ||
              lower.includes('car_image') ||
              lower.includes('vehicle') ||
              lower.includes('photo') ||
              lower.includes('thumb') ||
              lower.includes('gallery') ||
              lower.includes('wowslider') ||
              lower.includes('upload') ||
              lower.includes('img/')
            ) {
              imgUrls.push(src);
            }
          }
        }

        // Lightbox anchor hrefs
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        for (const a of anchors) {
          const href = (a as HTMLAnchorElement).href;
          if (href && href.match(/\.(jpe?g|png|webp)(\?|$)/i)) {
            imgUrls.push(href);
          }
        }

        // Background-image styles
        const divs = Array.from(document.querySelectorAll('[style*="background"]'));
        for (const div of divs) {
          const style = (div as HTMLElement).style.backgroundImage;
          const match = style.match(/url\(['"]?([^'"]+)['"]?\)/);
          if (match) imgUrls.push(match[1]);
        }

        const uniqueImgs = [...new Set(imgUrls)].slice(0, 15);

        return {
          stockId,
          make,
          model,
          chassisNumber:
            getTdValue('Chassis NO.') ||
            getTdValue('Chassis No') ||
            getTdValue('Chassis'),
          year,
          mileage: parseNum(
            getTdValue('Mileage') || getTdValue('KM') || '0'
          ),
          transmission:
            getTdValue('Transmission') || getTdValue('Gear') || 'Automatic',
          fuel:
            getTdValue('Fuel') ||
            getTdValue('Fuel Type') ||
            getTdValue('Engine Type') ||
            'Petrol',
          color:
            getTdValue('Exterior color') ||
            getTdValue('Color') ||
            getTdValue('Colour') ||
            '',
          price: parseFloat2(
            getTdValue('Price') ||
            getTdValue('FOB Price') ||
            getTdValue('Amount') ||
            '0'
          ),
          images: uniqueImgs,
        };
      });

      if (!data) return null;

      return {
        ...data,
        location: 'Japan',
        sourceUrl: url,
        supplierName: 'STC Japan',
        timestamp: new Date(),
        status: 'pending',
      };
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      return null;
    } finally {
      await page.close();
      await context.close();
    }
  }

  // ─── Get listing links from ONE search-result page ────────────────────────
  async getListingLinks(
    baseUrl: string
  ): Promise<{ href: string; year?: number }[]> {
    if (!this.browser) await this.init();
    const context = await this.browser!.newContext({
      userAgent: this.options.userAgent,
    });
    const page = await context.newPage();

    try {
      await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60000 });
      await this.wait(1000);

      const links = await page.evaluate(() => {
        const results: { href: string; year?: number }[] = [];
        const seen = new Set<string>();

        const anchors = Array.from(
          document.querySelectorAll(
            'a[href*="Car-Details"], a[href*="car-details"], a[href*="vehicle-details"], a[href*="detail"], a[href*="stock"]'
          )
        );

        for (const a of anchors) {
          const href = (a as HTMLAnchorElement).href;
          if (!href || seen.has(href)) continue;
          seen.add(href);

          const text =
            a.textContent?.trim() ||
            a.closest('tr, .car-card, .vehicle-card')?.textContent ||
            '';
          const yearMatch = text.match(/\b(20\d{2})\b/);
          const year = yearMatch ? parseInt(yearMatch[1]) : undefined;

          results.push({ href, year });
        }
        return results;
      });

      return links;
    } catch (error) {
      console.error('Error getting listing links:', error);
      return [];
    } finally {
      await page.close();
      await context.close();
    }
  }

  // ─── Phase 1: Collect ALL listing links across ALL pages (year-filtered) ──
  /**
   * Uses STC Japan's built-in from_year/to_year URL filter so only
   * pre-filtered result pages are visited. Much faster than checking
   * each car's year on the detail page.
   */
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
      // STC Japan's own search filter does the year restriction for us
      const listUrl =
        `https://stcjapan.net/search.php?` +
        `make=&model=&fuel=&transmission=&category=&color=` +
        `&from_year=${minYear}&to_year=&page=${page}&searchy=Search+Now%21`;

      log(`   📄 Page ${page} — ${listUrl}`);

      const links = await this.getListingLinks(listUrl);
      log(`      → ${links.length} link(s) found`);

      if (links.length === 0) {
        emptyPages++;
        if (emptyPages >= 2) {
          log(`   🛑 Two consecutive empty pages — collection complete.`);
          break;
        }
        page++;
        continue;
      }

      emptyPages = 0;

      for (const { href } of links) {
        if (!seen.has(href)) {
          seen.add(href);
          allHrefs.push(href);
        }
      }

      log(`      Cumulative unique links: ${allHrefs.length}`);
      page++;

      // Short polite delay between list pages (faster than full detail-page delay)
      await this.wait(800 + Math.random() * 400);
    }

    log(`✅ Phase 1 complete — ${allHrefs.length} unique listing(s) to scrape.`);
    return allHrefs;
  }

  // ─── Phase 2: Parallel detail-page scraping with concurrency pool ─────────
  /**
   * Runs `concurrency` detail-page scrapers simultaneously.
   * Default concurrency = 4 (safe for most servers; raise carefully).
   */
  async scrapeAllByYear(
    minYear: number,
    onSave: (data: any) => Promise<void>,
    onLog?: (msg: string) => void,
    concurrency = 4
  ): Promise<number> {
    const log = onLog ?? console.log;
    log(`🚀 Starting optimised 2-phase crawl — year ≥ ${minYear}, concurrency ${concurrency}`);

    // ── Phase 1: collect every URL that STC Japan already filtered ──────────
    const hrefs = await this.getAllListingLinks(minYear, log);
    if (hrefs.length === 0) {
      log('⚠  No listings found. Check the search URL or minYear value.');
      return 0;
    }

    // ── Phase 2: parallel detail scraping ───────────────────────────────────
    log(`\n⚡ Phase 2 — Scraping ${hrefs.length} detail page(s) with concurrency ${concurrency}…`);

    let totalAdded = 0;
    let processed = 0;
    const total = hrefs.length;

    const scrapeOne = async (href: string): Promise<void> => {
      // Stagger start times within each concurrency batch to be polite
      await this.wait(300 + Math.random() * 700);

      const data = await this.scrape(href);
      processed++;
      const progress = `[${processed}/${total}]`;

      if (!data) {
        log(`   ⚠  ${progress} Failed: ${href}`);
        return;
      }

      // Secondary year guard (in case the site filter returned a stray record)
      if (data.year > 0 && data.year < minYear) {
        log(`   ⏭  ${progress} Year ${data.year} below ${minYear} — skipped`);
        return;
      }

      if (!data.stockId || !data.make) {
        log(`   ⚠  ${progress} Missing stockId/make — skipped`);
        return;
      }

      try {
        await onSave(data);
        totalAdded++;
        log(
          `   ✅ ${progress} Saved: ${data.year} ${data.make} ${data.model}` +
          ` (${data.stockId}) — ${data.images.length} image(s)`
        );
      } catch (err: any) {
        if (err.code === 11000) {
          log(`   🔁 ${progress} Duplicate — ${data.stockId}`);
        } else {
          log(`   ❌ ${progress} Save error: ${err.message}`);
        }
      }
    };

    // Run in batches of `concurrency` at a time
    for (let i = 0; i < hrefs.length; i += concurrency) {
      const batch = hrefs.slice(i, i + concurrency);
      await Promise.all(batch.map(scrapeOne));
      log(`   📊 Batch ${Math.ceil((i + 1) / concurrency)} done — added so far: ${totalAdded}`);
    }

    log(
      `\n🏁 Crawl complete — Added: ${totalAdded} | Duplicates/skipped: ${processed - totalAdded} | Total processed: ${processed}`
    );
    return totalAdded;
  }
}