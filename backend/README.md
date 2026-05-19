# SHK Global Auction Backend

This is the backend service for the SHK Global Auction platform, responsible for crawling car auction sites, processing listings, and managing the inventory.

## Features
- **Web Scraping**: Utilizes Playwright to scrape car details from various Japanese auction sites.
- **Data Storage**: Stores scraped and processed car listings in MongoDB Atlas.
- **Admin Review**: Provides API endpoints for administrators to review, approve, or reject new listings.
- **Deduplication**: Prevents duplicate listings based on Stock ID or Chassis Number.

## Technologies Used
- Node.js
- Express.js
- TypeScript
- Playwright
- Mongoose (for MongoDB interaction)
- MongoDB Atlas
- dotenv (for environment variables)
- cors (for Cross-Origin Resource Sharing)

## Setup and Installation

1.  **Clone the repository and navigate to the `backend` directory:**
    ```bash
    git clone https://github.com/Yasindu20/SHK-Global-Auction.git
    cd SHK-Global-Auction/backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    npx playwright install chromium
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the `backend` directory based on `.env.example`:
    ```
    PORT=5000
    MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/car_auction?retryWrites=true&w=majority
    ```
    Replace `<username>`, `<password>`, and `<cluster0.mongodb.net>` with your MongoDB Atlas credentials and cluster details.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    (Note: You might need to add a `dev` script to `package.json` like `"dev": "ts-node src/index.ts"`)

## API Endpoints

-   **`GET /api/listings`**
    -   **Description**: Retrieves all car listings, sorted by timestamp.
    -   **Response**: `Array` of `Listing` objects.

-   **`GET /api/listings/:id`**
    -   **Description**: Retrieves a single car listing by its ID.
    -   **Parameters**: `id` (string) - The MongoDB `_id` of the listing.
    -   **Response**: A `Listing` object.

-   **`POST /api/listings/approve/:id`**
    -   **Description**: Approves a pending car listing, changing its status to `approved`.
    -   **Parameters**: `id` (string) - The MongoDB `_id` of the listing.
    -   **Response**: The updated `Listing` object.

-   **`POST /api/crawl`**
    -   **Description**: Initiates a crawl for a specified URL and supplier.
    -   **Request Body**:
        ```json
        {
          "url": "string",
          "supplier": "string" (e.g., "STC Japan")
        }
        ```
    -   **Response**: `{
          "message": "Crawl successful",
          "data": Listing
        }` or an error message.

## Crawler Implementation

The `src/crawler` directory contains the base `Crawler` class and site-specific parser implementations. Each parser extends the `Crawler` class and implements the `scrape` method to extract data unique to its target website.

-   **`Crawler.ts`**: Defines the base class for all crawlers, handling Playwright initialization, browser management, and rate-limiting delays.
-   **`STCJapanParser.ts`**: Implements the scraping logic for STC Japan, extracting car details and normalizing them into the `Listing` schema.

## MongoDB Schema

The `src/models/Listing.ts` file defines the Mongoose schema for car listings:

```typescript
export interface IListing extends Document {
  sourceUrl: string;
  timestamp: Date;
  supplierName: string;
  stockId: string;
  chassisNumber?: string;
  make: string;
  model: string;
  grade?: string;
  year: number;
  mileage: number;
  transmission: string;
  fuel: string;
  color: string;
  price: number;
  location: string;
  status: 'pending' | 'approved' | 'rejected';
  images: string[];
  rawData: any;
}
```

## Ethical Considerations

-   The crawler respects `robots.txt` directives and `Crawl-delay` settings.
-   A global rate limit is implemented to prevent overwhelming target servers.
-   Only approved pages are visited, and anti-bot measures are not bypassed.
-   Source URL and timestamp are stored for every imported listing to maintain transparency and traceability.
