import { Crawler } from './Crawler';

export class STCJapanParser extends Crawler {
  async scrape(url: string): Promise<any> {
    if (!this.browser) await this.init();
    const context = await this.browser!.newContext({ userAgent: this.options.userAgent });
    const page = await context.newPage();

    try {
      console.log(`Navigating to ${url}...`);
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Wait for listing content
      await page.waitForSelector('.car-details, .product-img', { timeout: 10000 });

      const data = await page.evaluate(() => {
        const getText = (selector: string) => document.querySelector(selector)?.textContent?.trim() || '';
        
        // Detailed page extraction
        if (document.querySelector('.car-details')) {
            return {
                stockId: getText('.stock-id'),
                make: getText('.make'),
                model: getText('.model'),
                year: parseInt(getText('.year')) || 0,
                mileage: parseInt(getText('.mileage').replace(/[^0-9]/g, '')) || 0,
                transmission: getText('.transmission'),
                fuel: getText('.fuel'),
                color: getText('.color'),
                price: parseFloat(getText('.price').replace(/[^0-9.]/g, '')) || 0,
                location: getText('.location'),
                images: Array.from(document.querySelectorAll('.car-images img')).map(img => (img as HTMLImageElement).src)
            };
        }
        return null;
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
    }
  }

  async getListingLinks(baseUrl: string): Promise<string[]> {
    if (!this.browser) await this.init();
    const context = await this.browser!.newContext({ userAgent: this.options.userAgent });
    const page = await context.newPage();
    
    try {
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      const links = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('h4 a'));
        return anchors.map(a => (a as HTMLAnchorElement).href);
      });
      return links;
    } catch (error) {
      console.error('Error getting listing links:', error);
      return [];
    } finally {
      await page.close();
    }
  }
}
