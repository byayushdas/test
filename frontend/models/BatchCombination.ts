import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBatchCombination extends Document {
  childCropId: mongoose.Types.ObjectId | string;
  parentCropId: mongoose.Types.ObjectId | string;
  createdAt: Date;
}

const BatchCombinationSchema: Schema = new Schema({
  childCropId: { type: Schema.Types.ObjectId, ref: 'Crop', required: true },
  parentCropId: { type: Schema.Types.ObjectId, ref: 'Crop', required: true },
  createdAt: { type: Date, default: Date.now },
});

BatchCombinationSchema.index({ childCropId: 1, parentCropId: 1 }, { unique: true });

export default (mongoose.models.BatchCombination as Model<IBatchCombination>) || mongoose.model<IBatchCombination>('BatchCombination', BatchCombinationSchema);
