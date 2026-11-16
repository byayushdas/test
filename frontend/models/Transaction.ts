import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransaction extends Document {
  cropId: mongoose.Types.ObjectId | string;
  senderRole: string;
  receiverRole: string;
  blockchainHash?: string;
  timestamp: Date;
}

const TransactionSchema: Schema = new Schema({
  cropId: { type: Schema.Types.ObjectId, ref: 'Crop', required: true },
  senderRole: { type: String, required: true },
  receiverRole: { type: String, required: true },
  blockchainHash: { type: String },
  timestamp: { type: Date, default: Date.now },
});

export default (mongoose.models.Transaction as Model<ITransaction>) || mongoose.model<ITransaction>('Transaction', TransactionSchema);
