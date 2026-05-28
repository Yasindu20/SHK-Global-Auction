"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const ListingSchema = new mongoose_1.Schema({
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
    rawData: { type: mongoose_1.Schema.Types.Mixed }
});
exports.default = mongoose_1.default.model('Listing', ListingSchema);
