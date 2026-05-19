import mongoose, { Schema, Document } from 'mongoose';

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

const ListingSchema: Schema = new Schema({
  sourceUrl: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  supplierName: { type: String, required: true },
  stockId: { type: String, required: true, unique: true },
  chassisNumber: { type: String },
  make: { type: String, required: true },
  model: { type: String, required: true },
  grade: { type: String },
  year: { type: Number, required: true },
  mileage: { type: Number, required: true },
  transmission: { type: String, required: true },
  fuel: { type: String, required: true },
  color: { type: String, required: true },
  price: { type: Number, required: true },
  location: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  images: [{ type: String }],
  rawData: { type: Schema.Types.Mixed }
});

export default mongoose.model<IListing>('Listing', ListingSchema);
