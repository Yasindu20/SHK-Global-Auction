import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  threadId: string;
  sender: 'customer' | 'admin';
  senderName: string;
  message: string;
  timestamp: Date;
  readByCustomer: boolean;
  readByAdmin: boolean;
}

const MessageSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    threadId: { type: String, required: true, index: true },
    sender: { type: String, enum: ['customer', 'admin'], required: true },
    senderName: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    readByCustomer: { type: Boolean, default: false },
    readByAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for efficient querying by threadId
MessageSchema.index({ threadId: 1, timestamp: -1 });

export default mongoose.model<IMessage>('Message', MessageSchema);
