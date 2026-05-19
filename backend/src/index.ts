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
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/car_auction';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// API Endpoints
app.get('/api/listings', async (req, res) => {
  const listings = await Listing.find().sort({ timestamp: -1 });
  res.json(listings);
});

app.get("/api/listings/:id", async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }
    res.json(listing);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch listing" });
  }
});

app.post("/api/listings/approve/:id", async (req, res) => {
  try {
    const listing = await Listing.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
    res.json(listing);
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve listing' });
  }
});

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

app.post('/api/crawl-batch', async (req, res) => {
  const { supplier, pages = 1 } = req.body;
  
  if (supplier === 'STC Japan') {
    const parser = new STCJapanParser();
    const allResults = [];
    
    try {
      for (let p = 1; p <= pages; p++) {
        const listUrl = `https://stcjapan.net/search.php?make=&model=&fuel=&transmission=&category=&color=&from_year=&to_year=&page=${p}&searchy=Search+Now%21`;
        const links = await parser.getListingLinks(listUrl);
        
        for (const link of links) {
          const data = await parser.scrape(link);
          if (data) {
            try {
              const newListing = new Listing({ ...data, status: 'approved' });
              await newListing.save();
              allResults.push(newListing);
            } catch (error: any) {
              if (error.code !== 11000) {
                console.error('Failed to save listing:', error);
              }
            }
          }
        }
      }
      res.json({ message: `Batch crawl completed. Added ${allResults.length} new listings.`, count: allResults.length });
    } catch (error) {
      console.error('Batch crawl error:', error);
      res.status(500).json({ error: 'Batch crawl failed' });
    } finally {
      await parser.close();
    }
  } else {
    res.status(400).json({ error: 'Unsupported supplier' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
