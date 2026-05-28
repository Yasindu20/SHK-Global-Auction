import mongoose, { Schema, Document } from 'mongoose';

export interface ITrackingStep {
  label: string;
  done: boolean;
  active: boolean;
  timestamp?: Date;
}

export interface IDocument {
  name: string;
  url: string;
  type: string;
  uploadedAt: Date;
}

export interface IOrder extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  vehicleId: mongoose.Schema.Types.ObjectId;
  orderId: string;
  status: 'purchased' | 'shipped' | 'in_transit' | 'customs_cleared' | 'delivered';
  trackingSteps: ITrackingStep[];
  vessel?: string;
  container?: string;
  eta?: string;
  documents: IDocument[];
  createdAt: Date;
  updatedAt: Date;
}

const TrackingStepSchema: Schema = new Schema({
  label: { type: String, required: true },
  done: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
  timestamp: { type: Date },
});

const DocumentSchema: Schema = new Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String },
  uploadedAt: { type: Date, default: Date.now },
});

const OrderSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
    orderId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['purchased', 'shipped', 'in_transit', 'customs_cleared', 'delivered'],
      default: 'purchased',
    },
    trackingSteps: [TrackingStepSchema],
    vessel: { type: String },
    container: { type: String },
    eta: { type: String },
    documents: [DocumentSchema],
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>('Order', OrderSchema);
