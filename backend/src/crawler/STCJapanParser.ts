import { Crawler } from './Crawler';

export class STCJapanParser extends Crawler {
  async scrape(url: string): Promise<any> {
    if (!this.browser) await this.init();
    const context = await this.browser!.newContext({
      userAgent: this.options.userAgent,
      viewport: { width: 1280, height: 900 },
    });
    const page = await context.newPage();

    try {
      console.log(`Navigating to ${url}...`);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

      // Wait for main content
      try {
        await page.waitForSelector('table, .car-details, .vehicle-details, #content', {
          timeout: 20000,
        });
      } catch {
        console.warn(`Warning: Timeout waiting for content on ${url}`);
      }

      // Extra wait for images / lazy-load
      await this.wait(2000);

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
          // Try sibling TD first
          const next = labelCell.nextElementSibling;
          if (next) return next.textContent?.trim() ?? '';
          // Try parent row's next TD
          const row = labelCell.closest('tr');
          if (row) {
            const tds = row.querySelectorAll('td');
            if (tds.length >= 2) return tds[tds.length - 1].textContent?.trim() ?? '';
          }
          return '';
        };

        // ── Helper: parse number from string ─────────────────────────
        const parseNum = (s: string) => parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;
        const parseFloat2 = (s: string) =>
          parseFloat(s.replace(/[^0-9.]/g, '')) || 0;

        // ── Core fields ───────────────────────────────────────────────
        const stockId =
          getTdValue('Stock ID') ||
          getTdValue('Stock Id') ||
          getTdValue('Stock No') ||
          getTdValue('Ref No') ||
          '';

        const make =
          getTdValue('Make') || getTdValue('Brand') || getTdValue('Maker') || '';

        const model =
          getTdValue('Model') || getTdValue('Model Name') || '';

        if (!stockId && !make) return null;

        const yearRaw =
          getTdValue('Year') ||
          getTdValue('Model Year') ||
          getTdValue('Manufacture Year') ||
          '0';
        const year = parseNum(yearRaw);

        // ── Images ────────────────────────────────────────────────────
        // 1. Collect all img src / data-src attributes
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
            // Exclude tiny icons / logos / flags
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
            )
              continue;

            // Accept if it looks like a photo
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

        // 2. Also pull from anchor hrefs that look like images (lightbox links)
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        for (const a of anchors) {
          const href = (a as HTMLAnchorElement).href;
          if (href && href.match(/\.(jpe?g|png|webp)(\?|$)/i)) {
            imgUrls.push(href);
          }
        }

        // 3. Also check background-image styles on divs
        const divs = Array.from(
          document.querySelectorAll('[style*="background"]')
        );
        for (const div of divs) {
          const style = (div as HTMLElement).style.backgroundImage;
          const match = style.match(/url\(['"]?([^'"]+)['"]?\)/);
          if (match) imgUrls.push(match[1]);
        }

        // Deduplicate and take first 15
        const uniqueImgs = [...new Set(imgUrls)].slice(0, 15);

        return {
          stockId,
          make,
          model,
          chassisNumber: getTdValue('Chassis NO.') || getTdValue('Chassis No') || getTdValue('Chassis'),
          year,
          mileage: parseNum(getTdValue('Mileage') || getTdValue('KM') || '0'),
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
          price:
            parseFloat2(
              getTdValue('Price') || getTdValue('FOB Price') || getTdValue('Amount') || '0'
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

  /**
   * Returns listing links from a search result page.
   * Also extracts year hints from link text so we can pre-filter.
   */
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
      await this.wait(1500);

      const links = await page.evaluate(() => {
        const results: { href: string; year?: number }[] = [];
        const seen = new Set<string>();

        // Broad selector – try multiple patterns STC Japan might use
        const anchors = Array.from(
          document.querySelectorAll(
            'a[href*="Car-Details"], a[href*="car-details"], a[href*="vehicle-details"], a[href*="detail"], a[href*="stock"]'
          )
        );

        for (const a of anchors) {
          const href = (a as HTMLAnchorElement).href;
          if (!href || seen.has(href)) continue;
          seen.add(href);

          // Try to extract year from link text or nearby elements
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

  /**
   * Scrape ALL pages for year >= minYear.
   * Stops when a page returns zero new links.
   */
  async scrapeAllByYear(
    minYear: number,
    onSave: (data: any) => Promise<void>,
    onLog?: (msg: string) => void
  ): Promise<number> {
    const log = onLog ?? console.log;
    let page = 1;
    let totalAdded = 0;
    let emptyPages = 0;

    while (true) {
      const listUrl =
        `https://stcjapan.net/search.php?` +
        `make=&model=&fuel=&transmission=&category=&color=` +
        `&from_year=${minYear}&to_year=&page=${page}&searchy=Search+Now%21`;

      log(`📄 Scraping page ${page} — URL: ${listUrl}`);

      const links = await this.getListingLinks(listUrl);
      log(`   Found ${links.length} links on page ${page}`);

      if (links.length === 0) {
        emptyPages++;
        if (emptyPages >= 2) {
          log(`No links on page ${page}. Stopping.`);
          break;
        }
        page++;
        continue;
      }

      emptyPages = 0;

      for (const { href, year: hintYear } of links) {
        // Pre-filter by year hint (fast path – avoids full page load)
        if (hintYear !== undefined && hintYear < minYear) {
          log(`   ⏭  Skipping ${href} — year hint ${hintYear} < ${minYear}`);
          continue;
        }

        // Polite delay between requests
        await this.wait(1500 + Math.random() * 1000);

        const data = await this.scrape(href);
        if (!data) {
          log(`   ⚠  Failed to scrape ${href}`);
          continue;
        }

        // Double-check year from full scrape
        if (data.year > 0 && data.year < minYear) {
          log(`   ⏭  Skipping ${data.make} ${data.model} ${data.year} — below ${minYear}`);
          continue;
        }

        if (!data.stockId || !data.make) {
          log(`   ⚠  Missing stockId/make — skipping`);
          continue;
        }

        try {
          await onSave(data);
          totalAdded++;
          log(
            `   ✅ Saved: ${data.year} ${data.make} ${data.model} ` +
            `(${data.stockId}) — ${data.images.length} image(s)`
          );
        } catch (err: any) {
          if (err.code === 11000) {
            log(`   🔁 Duplicate — skipping ${data.stockId}`);
          } else {
            log(`   ❌ Save error: ${err.message}`);
          }
        }
      }

      page++;
    }

    return totalAdded;
  }
}