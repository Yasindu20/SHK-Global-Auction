 section with dynamic data from the backend.
    *   **Vehicle Details**: Display associated vehicle information for each order.
    *   **Shipment Tracking Timeline**: A visual, multi-stage progress tracker for each order. The fixed steps, configurable from the admin panel, will be:
        *   **Stage 1: Purchased**: Order confirmed and vehicle acquired.
        *   **Stage 2: Shipped**: Vehicle has departed from the origin.
        *   **Stage 3: In Transit**: Vehicle is en route to the destination.
        *   **Stage 4: Customs Cleared**: Vehicle has cleared customs at the destination port.
        *   **Stage 5: Delivered**: Vehicle has been received by the customer.
    *   **Actions**: Links to view associated documents and contact support for a specific order.

3.  **Saved Vehicles**
    *   **Functionality**: Allows users to bookmark vehicles from the auction/inventory for later review.
    *   **Display**: Vehicle image, year, make, model, and price.
    *   **Management**: Option to remove vehicles from the saved list.

4.  **Documents**
    *   **Repository**: Centralized location for all documents pertinent to the user's orders.
    *   **Document Types**: Bill of Lading, Export Certificate, Invoice, Insurance Certificate, Inspection Reports, etc.
    *   **Access**: Ability to view and download documents.
    *   **Organization**: Documents will be categorized and linked to specific orders.

5.  **Messages**
    *   **Communication Channel**: A direct messaging system for users to communicate with the admin support team.
    *   **Threaded View**: Display message threads, showing both user-sent messages and admin replies.
    *   **Interaction**: Users can send new messages and reply to existing threads.

## II. Backend API Endpoints (New/Modified)

New and modified API endpoints will be implemented in `shk-auction/backend/src/index.ts` and `shk-auction/backend/src/routes/auth.ts` to support the customer profile page functionalities.

### A. User Profile Management
*   `GET /api/user/profile`: Retrieve the authenticated user's profile details.
*   `PUT /api/user/profile`: Update the authenticated user's `firstName`, `lastName`, `phone`, and `country`.
*   `PUT /api/user/password`: Allow the authenticated user to change their password.

### B. Shipment Tracking
*   `GET /api/user/orders`: Fetch all orders for the authenticated user, including associated vehicle and detailed shipment tracking information.
*   `GET /api/user/orders/:orderId/documents`: Retrieve a list of documents associated with a specific order.

### C. Saved Vehicles
*   `GET /api/user/saved-vehicles`: Get a list of vehicles saved by the authenticated user.
*   `POST /api/user/saved-vehicles`: Add a vehicle to the user's saved list.
*   `DELETE /api/user/saved-vehicles/:vehicleId`: Remove a vehicle from the user's saved list.

### D. Messages
*   `GET /api/user/messages`: Retrieve all message threads for the authenticated user.
*   `GET /api/user/messages/:threadId`: Get all messages within a specific thread.
*   `POST /api/user/messages`: Initiate a new message thread with admin support.
*   `POST /api/user/messages/:threadId/reply`: Send a reply to an existing message thread.

### E. Admin Panel Integration (Backend)
*   `GET /api/admin/users/:userId/orders`: Retrieve all orders for a specific customer.
*   `PUT /api/admin/orders/:orderId/status`: Update the shipment status of a particular order.
*   `POST /api/admin/orders/:orderId/documents`: Upload new documents for a specific order.
*   `GET /api/admin/messages`: Retrieve all customer message threads for admin review.
*   `GET /api/admin/messages/:threadId`: Get all messages within a specific customer thread.
*   `POST /api/admin/messages/:threadId/reply`: Send a reply to a customer message thread.

## III. MongoDB Atlas Database Schema Changes

To support the new functionalities, the following modifications will be made to the MongoDB schemas:

### A. User Model (`User.ts`)
*   **`savedVehicles`**: Add a new field to store references to `Listing` documents.
    ```typescript
    savedVehicles: [
      { type: Schema.Types.ObjectId, ref: 'Listing' }
    ];
    ```

### B. New Order Model (`Order.ts`)
*   A new `Order` model will be created to store customer orders and shipment tracking information.
    ```typescript
    export interface IOrder extends Document {
      userId: mongoose.Schema.Types.ObjectId; // Reference to the User
      vehicleId: mongoose.Schema.Types.ObjectId; // Reference to the Listing
      orderId: string; // Unique identifier for the order (e.g., JD-2025-0847)
      status: 'purchased' | 'shipped' | 'in_transit' | 'customs_cleared' | 'delivered';
      trackingSteps: [
        { label: string; done: boolean; active: boolean; timestamp?: Date; }
      ];
      vessel?: string;
      container?: string;
      eta?: string;
      documents: [
        { name: string; url: string; type: string; uploadedAt: Date; }
      ];
      createdAt: Date;
      updatedAt: Date;
    }

    const OrderSchema: Schema = new Schema(
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        vehicleId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
        orderId: { type: String, required: true, unique: true },
        status: { type: String, enum: ['purchased', 'shipped', 'in_transit', 'customs_cleared', 'delivered'], default: 'purchased' },
        trackingSteps: [
          { label: { type: String, required: true }, done: { type: Boolean, default: false }, active: { type: Boolean, default: false }, timestamp: { type: Date } }
        ],
        vessel: { type: String },
        container: { type: String },
        eta: { type: String },
        documents: [
          { name: { type: String, required: true }, url: { type: String, required: true }, type: { type: String }, uploadedAt: { type: Date, default: Date.now } }
        ],
      },
      { timestamps: true }
    );
    ```

### C. New Message Model (`Message.ts`)
*   A new `Message` model will be created to handle customer-admin communications.
    ```typescript
    export interface IMessage extends Document {
      userId: mongoose.Schema.Types.ObjectId; // Reference to the User
      threadId: string; // Unique identifier for the message thread
      sender: 'customer' | 'admin';
      message: string;
      timestamp: Date;
      readByCustomer: boolean;
      readByAdmin: boolean;
    }

    const MessageSchema: Schema = new Schema(
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        threadId: { type: String, required: true }, // Could be auto-generated or linked to an order
        sender: { type: String, enum: ['customer', 'admin'], required: true },
        message: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        readByCustomer: { type: Boolean, default: false },
        readByAdmin: { type: Boolean, default: false },
      }
    );
    ```

## IV. Frontend Modifications

*   **Rename `Dashboard.tsx`**: The existing `Dashboard.tsx` will be renamed to `CustomerProfile.tsx`.
*   **Route Update**: The `/dashboard` route will point to the new `CustomerProfile.tsx`.
*   **Auth Context (`AuthContext.tsx`)**: Update to include more comprehensive customer profile data and a mechanism to fetch it after refresh.
*   **UI Components**: Update existing components and create new ones to display dynamic data fetched from the new backend endpoints.
*   **Navigation**: Adjust the `Navbar.tsx` to reflect the new customer profile page and its sections.
*   **Admin Panel UI**: Update `AdminLayout.tsx` and `AdminDashboard.tsx` to include new navigation items and widgets for managing customer orders, documents, and messages.

This design provides a comprehensive plan for integrating the requested features into the SHK Global Auction platform, ensuring a robust and user-friendly customer profile experience.
