const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  transactionId: { type: String, required: true, unique: true }, // e.g. pay_XXXXXX
  orderId: { type: String }, // e.g. ORD-2026-XXXXX
  amount: { type: Number, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['DEBIT', 'CREDIT', 'ESCROW_HOLD', 'ESCROW_RELEASE', 'DEBIT_HOLD', 'FARMER_PAYMENT']
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
    default: 'COMPLETED'
  },
  description: { type: String },
  timestamp: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('Transaction', transactionSchema);
