import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: string;
  walletAddress?: string;
  profilePhoto?: string;
  uniqueId: string;
  averageRating?: number;
  reviewCount?: number;
  regDate?: Date;
  aadhaarNumber?: string;
  aadhaarFront?: string;
  aadhaarBack?: string;
  kycStatus?: string;
  verificationDate?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // optional for oauth
  role: { type: String, required: true },
  walletAddress: { type: String, unique: true, sparse: true },
  uniqueId: { type: String, unique: true, sparse: true },
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  regDate: { type: Date },
  aadhaarNumber: { type: String },
  aadhaarFront: { type: String },
  aadhaarBack: { type: String },
  kycStatus: { type: String, default: "Pending Verification" },
  verificationDate: { type: Date },
  rejectionReason: { type: String },
}, { timestamps: true });

// Prevent mongoose from compiling the model multiple times in next.js
export default (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
