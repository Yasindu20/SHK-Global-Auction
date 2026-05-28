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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 30 * 60 * 1000; // 30 minutes
const AdminSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 12,
        select: false, // never returned in queries by default
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    role: {
        type: String,
        enum: ['admin', 'superadmin'],
        default: 'admin',
    },
    lastLogin: { type: Date },
    loginAttempts: { type: Number, required: true, default: 0 },
    lockUntil: { type: Date },
    refreshToken: { type: String, select: false },
}, { timestamps: true });
// ── Hash password before saving ───────────────────────────────────────────────
// Using async without `next` — required for Mongoose v9 + TypeScript compatibility.
// Mongoose v9 resolves the hook automatically when the function is async.
AdminSchema.pre('save', function () {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified('password'))
            return;
        this.password = yield bcryptjs_1.default.hash(this.password, 12);
    });
});
// Check if account is currently locked
AdminSchema.methods.isLocked = function () {
    return !!(this.lockUntil && this.lockUntil > new Date());
};
// Constant-time password comparison
AdminSchema.methods.comparePassword = function (candidatePassword) {
    return __awaiter(this, void 0, void 0, function* () {
        return bcryptjs_1.default.compare(candidatePassword, this.password);
    });
};
// Increment failed login counter; lock after MAX_LOGIN_ATTEMPTS
AdminSchema.methods.incrementLoginAttempts = function () {
    return __awaiter(this, void 0, void 0, function* () {
        // If a previous lock expired, reset and start fresh
        if (this.lockUntil && this.lockUntil < new Date()) {
            return this.updateOne({
                $set: { loginAttempts: 1 },
                $unset: { lockUntil: 1 },
            });
        }
        const updates = { $inc: { loginAttempts: 1 } };
        if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked()) {
            updates.$set = { lockUntil: new Date(Date.now() + LOCK_TIME_MS) };
        }
        return this.updateOne(updates);
    });
};
// Reset on successful login
AdminSchema.methods.resetLoginAttempts = function () {
    return __awaiter(this, void 0, void 0, function* () {
        return this.updateOne({
            $set: { loginAttempts: 0, lastLogin: new Date() },
            $unset: { lockUntil: 1 },
        });
    });
};
exports.default = mongoose_1.default.model('Admin', AdminSchema);
