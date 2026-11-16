import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRating extends Document {
  value: number;
  comment?: string;
  reviewerId: mongoose.Types.ObjectId | string;
  revieweeId: mongoose.Types.ObjectId | string;
  requestId?: mongoose.Types.ObjectId | string;
  createdAt: Date;
}

const RatingSchema: Schema = new Schema({
  value: { type: Number, required: true },
  comment: { type: String },
  reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  revieweeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  requestId: { type: Schema.Types.ObjectId, ref: 'Request' },
  createdAt: { type: Date, default: Date.now },
});

// Adding compound index as in Prisma: @@unique([reviewerId, requestId])
RatingSchema.index({ reviewerId: 1, requestId: 1 }, { unique: true });

export default (mongoose.models.Rating as Model<IRating>) || mongoose.model<IRating>('Rating', RatingSchema);
