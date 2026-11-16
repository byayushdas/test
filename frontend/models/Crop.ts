import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICrop extends Document {
  batchId?: string;
  name: string;
  quantity: number;
  harvestDate: Date;
  farmerId: mongoose.Types.ObjectId | string;
  currentOwnerId: mongoose.Types.ObjectId | string;
  parentCropId?: mongoose.Types.ObjectId | string;
  isListed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CropSchema: Schema = new Schema({
  batchId: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  harvestDate: { type: Date, required: true },
  farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  currentOwnerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  parentCropId: { type: Schema.Types.ObjectId, ref: 'Crop' },
  isListed: { type: Boolean, default: true },
}, { timestamps: true });

export default (mongoose.models.Crop as Model<ICrop>) || mongoose.model<ICrop>('Crop', CropSchema);
