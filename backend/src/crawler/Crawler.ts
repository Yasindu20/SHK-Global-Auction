import { chromium, Browser, Page } from 'playwright';

export interface CrawlerOptions {
  delay?: number;
  userAgent?: string;
}

export abstract class Crawler {
  protected browser: Browser | null = null;
  protected options: CrawlerOptions;

  constructor(options: CrawlerOptions = {}) {
    this.options = {
      delay: 1000,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ...options
    };
  }

  async init() {
    this.browser = await chromium.launch({ headless: true });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  protected async wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  abstract scrape(url: string): Promise<any>;
}
