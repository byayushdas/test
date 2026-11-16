import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBatchHistory extends Document {
  cropId: mongoose.Types.ObjectId | string;
  sender: string;
  receiver: string;
  deliveryDate: Date;
  transactionHash?: string;
  createdAt: Date;
}

const BatchHistorySchema: Schema = new Schema({
  cropId: { type: Schema.Types.ObjectId, ref: 'Crop', required: true },
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  deliveryDate: { type: Date, required: true },
  transactionHash: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default (mongoose.models.BatchHistory as Model<IBatchHistory>) || mongoose.model<IBatchHistory>('BatchHistory', BatchHistorySchema);
