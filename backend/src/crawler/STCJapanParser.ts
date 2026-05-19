import { Crawler } from './Crawler';

export class STCJapanParser extends Crawler {
  async scrape(url: string): Promise<any> {
    if (!this.browser) await this.init();
    const context = await this.browser!.newContext({ 
      userAgent: this.options.userAgent,
      viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();

    try {
      console.log(`Navigating to ${url}...`);
      // Use 'domcontentloaded' instead of 'networkidle' to be faster and less prone to timeout from slow external assets
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      
      // Wait for either the car details or a timeout
      try {
        await page.waitForSelector('.car-details, .product-img, .stock-id', { timeout: 15000 });
      } catch (e) {
        console.warn(`Warning: Timeout waiting for selector on ${url}, attempting to parse anyway.`);
      }

      const data = await page.evaluate(() => {
        const getText = (selector: string) => {
          const el = document.querySelector(selector);
          return el ? el.textContent?.trim() || '' : '';
        };
        
        // Try multiple selector patterns for resilience
        const stockId = getText('.stock-id') || getText('td:contains("Stock Id") + td') || '';
        const make = getText('.make') || getText('td:contains("Make") + td') || '';
        const model = getText('.model') || getText('td:contains("Model") + td') || '';
        
        // If we can't find basic info, it might be a different layout or failed load
        if (!stockId && !make) return null;

        return {
          stockId: stockId,
          make: make,
          model: model,
          year: parseInt(getText('.year') || getText('td:contains("Year") + td')) || 0,
          mileage: parseInt((getText('.mileage') || getText('td:contains("Mileage") + td')).replace(/[^0-9]/g, '')) || 0,
          transmission: getText('.transmission') || getText('td:contains("Transmission") + td'),
          fuel: getText('.fuel') || getText('td:contains("Fuel") + td'),
          color: getText('.color') || getText('td:contains("Color") + td'),
          price: parseFloat((getText('.price') || getText('.car-price') || '0').replace(/[^0-9.]/g, '')) || 0,
          location: getText('.location') || 'Japan',
          images: Array.from(document.querySelectorAll('.car-images img, .product-img img, .main-image img'))
            .map(img => (img as HTMLImageElement).src)
            .filter(src => src && !src.includes('placeholder'))
        };
      });

      if (!data) {
        // Fallback: try to extract from table rows if common classes are missing
        const fallbackData = await page.evaluate(() => {
          const rows = Array.from(document.querySelectorAll('tr'));
          const info: any = {};
          rows.forEach(row => {
            const label = row.querySelector('td:first-child')?.textContent?.trim().toLowerCase();
            const value = row.querySelector('td:last-child')?.textContent?.trim();
            if (label && value) {
              if (label.includes('stock')) info.stockId = value;
              if (label.includes('make')) info.make = value;
              if (label.includes('model')) info.model = value;
              if (label.includes('year')) info.year = parseInt(value) || 0;
              if (label.includes('mileage')) info.mileage = parseInt(value.replace(/[^0-9]/g, '')) || 0;
              if (label.includes('trans')) info.transmission = value;
              if (label.includes('fuel')) info.fuel = value;
              if (label.includes('color')) info.color = value;
              if (label.includes('price')) info.price = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
            }
          });
          
          if (info.stockId || info.make) {
            info.images = Array.from(document.querySelectorAll('img'))
              .map(img => img.src)
              .filter(src => src.includes('stock_images') || src.includes('car_images'));
            return info;
          }
          return null;
        });
        
        if (fallbackData) {
          return {
            ...fallbackData,
            sourceUrl: url,
            supplierName: 'STC Japan',
            timestamp: new Date(),
            status: 'pending'
          };
        }
        return null;
      }

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
        // Look for links in h4 tags or any links containing 'Car-Details'
        const anchors = Array.from(document.querySelectorAll('h4 a, a[href*="Car-Details"]'));
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
