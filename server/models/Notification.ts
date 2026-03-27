import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userAddress: string;
  role: "ADMIN" | "ISSUER" | "VERIFIER" | "AUDITOR" | "ALL";
  type: string;
  message: string;
  metadata: {
    documentHash?: string;
    txHash?: string;
    docId?: number;
    [key: string]: any;
  };
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
  userAddress: { type: String, required: false, index: true }, // Optional if role-based
  role: { 
    type: String, 
    enum: ["ADMIN", "ISSUER", "VERIFIER", "AUDITOR", "ALL"],
    required: true,
    index: true
  },
  type: { type: String, required: true },
  message: { type: String, required: true },
  metadata: { type: Object, default: {} },
  isRead: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now, index: true }
});

export const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
