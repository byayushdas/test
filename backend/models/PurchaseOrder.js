const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true }, // ORD-2026-XXXXX

  // Buyer info
  buyerRole: {
    type: String,
    required: true,
    enum: ['PROCESSOR', 'DISTRIBUTOR', 'RETAILER']
  },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  buyerName: { type: String },
  buyerRoleId: { type: String, index: true },

  // Seller info
  sellerRole: {
    type: String,
    required: true,
    enum: ['FARMER', 'PROCESSOR', 'DISTRIBUTOR', 'RETAILER']
  },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sellerName: { type: String },
  sellerRoleId: { type: String, index: true },

  // What's being bought
  batchId: { type: String, required: true },     // ID from Farmer/Processor/Distributor/Retailer collection
  cropName: { type: String, required: true },     // product name
  quantityKg: { type: Number, required: true },
  pricePerUnit: { type: Number },
  totalAmount: { type: Number },

  // Order lifecycle status
  deliveryStatus: {
    type: String,
    enum: [
      'PENDING_SELLER_ACCEPTANCE',
      'ACCEPTED',
      'DISPATCHED',
      'DELIVERED',
      'REJECTED'
    ],
    default: 'PENDING_SELLER_ACCEPTANCE'
  },

  // Razorpay Integration
  razorpayPaymentId: { type: String },
  razorpayRefundId: { type: String },

  // Escrow simulated as a status flag (no real payment)
  escrowStatus: {
    type: String,
    enum: ['PENDING', 'LOCKED', 'RELEASED'],
    default: 'PENDING'
  },

  rejectionReason: { type: String },
  dispatchedAt: { type: Date },
  deliveredAt: { type: Date },

  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now, index: true }
});

// Auto-generate orderNumber before save
purchaseOrderSchema.pre('save', async function () {
  if (!this.orderNumber) {
    // Generate a unique ID using timestamp and a random number to prevent E11000 duplicate errors
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const timePart = Date.now().toString().slice(-4);
    this.orderNumber = `ORD-2026-${timePart}${randomPart}`;
  }
});

// Compound indexes to perfectly optimize the order and shipment fetching
purchaseOrderSchema.index({ sellerId: 1, createdAt: -1 });
purchaseOrderSchema.index({ buyerId: 1, createdAt: -1 });
purchaseOrderSchema.index({ sellerRoleId: 1, createdAt: -1 });
purchaseOrderSchema.index({ buyerRoleId: 1, createdAt: -1 });
purchaseOrderSchema.index({ sellerId: 1, updatedAt: -1 });
purchaseOrderSchema.index({ buyerId: 1, updatedAt: -1 });
purchaseOrderSchema.index({ sellerRoleId: 1, updatedAt: -1 });
purchaseOrderSchema.index({ buyerRoleId: 1, updatedAt: -1 });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
