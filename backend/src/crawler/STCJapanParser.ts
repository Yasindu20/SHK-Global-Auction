import { Crawler } from './Crawler';

export class STCJapanParser extends Crawler {
  async scrape(url: string): Promise<any> {
    if (!this.browser) await this.init();
    const context = await this.browser!.newContext({ 
      userAgent: this.options.userAgent,
      viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    try {
      console.log(`Navigating to ${url}...`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      
      // Wait for the main content table which contains vehicle info
      try {
        await page.waitForSelector('table', { timeout: 20000 });
      } catch (e) {
        console.warn(`Warning: Timeout waiting for table on ${url}`);
      }

      const data = await page.evaluate(() => {
        const getTdValue = (label: string) => {
          const cells = Array.from(document.querySelectorAll('td'));
          const labelCell = cells.find(td => td.textContent?.trim().toLowerCase().includes(label.toLowerCase()));
          return labelCell?.nextElementSibling?.textContent?.trim() || '';
        };

        const stockId = getTdValue('Stock ID') || getTdValue('Stock Id');
        const make = getTdValue('Make');
        const model = getTdValue('Model');

        if (!stockId && !make) return null;

        return {
          stockId: stockId,
          make: make,
          model: model,
          chassisNumber: getTdValue('Chassis NO.'),
          year: parseInt(getTdValue('Year')) || 0,
          mileage: parseInt(getTdValue('Mileage').replace(/[^0-9]/g, '')) || 0,
          transmission: getTdValue('Transmission'),
          fuel: getTdValue('Fuel Type'),
          color: getTdValue('Exterior color'),
          price: parseFloat(getTdValue('Price').replace(/[^0-9.]/g, '')) || 0,
          location: 'Japan',
          images: Array.from(document.querySelectorAll('img'))
            .map(img => img.src)
            .filter(src => src.includes('stock_images') || src.includes('car_images') || src.includes('wowslider'))
        };
      });

      if (!data) return null;

      return {
        ...data,
        sourceUrl: url,
        supplierName: 'STC Japan',
        timestamp: new Date(),
        status: 'pending'
      };
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      return null;
    } finally {
      await page.close();
      await context.close();
    }
  }

  async getListingLinks(baseUrl: string): Promise<string[]> {
    if (!this.browser) await this.init();
    const context = await this.browser!.newContext({ userAgent: this.options.userAgent });
    const page = await context.newPage();
    
    try {
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      const links = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a[href*="Car-Details"]'));
        return Array.from(new Set(anchors.map(a => (a as HTMLAnchorElement).href)));
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
}
