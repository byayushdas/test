import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRequest extends Document {
  senderId: mongoose.Types.ObjectId | string;
  receiverId: mongoose.Types.ObjectId | string;
  cropId: mongoose.Types.ObjectId | string;
  deliveryDate: Date;
  status: string;
  deliveryAddress?: string;
  paymentMode?: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

const RequestSchema: Schema = new Schema({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  cropId: { type: Schema.Types.ObjectId, ref: 'Crop', required: true },
  deliveryDate: { type: Date, required: true },
  status: { type: String, required: true },
  deliveryAddress: { type: String },
  paymentMode: { type: String },
  quantity: { type: Number, default: 1 },
}, { timestamps: true });

export default (mongoose.models.Request as Model<IRequest>) || mongoose.model<IRequest>('Request', RequestSchema);
