import mongoose, { Schema, Document } from 'mongoose';

export interface IVehicleSpecs {
  bodyType?: string;
  engineSize?: string;
  driveTrain?: string;
  doors?: number;
  seats?: number;
  steering?: 'Right' | 'Left';
  extColor?: string;
  intColor?: string;
  fuelType?: string;
  transmission?: string;
  vin?: string;
  chassisNumber?: string;
  auctionGrade?: string;
  interiorGrade?: string;
  exteriorGrade?: string;
  features?: string[];
}

export interface IListing extends Document {
  sourceUrl?: string;
  timestamp: Date;
  supplierName: string;
  stockId: string;
  make: string;
  modelName: string;
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
  specs: IVehicleSpecs;
  description?: string;
  rawData?: any;
}

const ListingSchema: Schema = new Schema({
  sourceUrl: { type: String },
  timestamp: { type: Date, default: Date.now },
  supplierName: { type: String, required: true },
  stockId: { type: String, required: true, unique: true },
  make: { type: String, required: true },
  modelName: { type: String, required: true },
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
  description: { type: String },
  specs: {
    bodyType: { type: String },
    engineSize: { type: String },
    driveTrain: { type: String },
    doors: { type: Number },
    seats: { type: Number },
    steering: { type: String, enum: ['Right', 'Left'], default: 'Right' },
    extColor: { type: String },
    intColor: { type: String },
    fuelType: { type: String },
    transmission: { type: String },
    vin: { type: String },
    chassisNumber: { type: String },
    auctionGrade: { type: String },
    interiorGrade: { type: String },
    exteriorGrade: { type: String },
    features: [{ type: String }]
  },
  rawData: { type: Schema.Types.Mixed }
});

export default mongoose.model<IListing>('Listing', ListingSchema);
