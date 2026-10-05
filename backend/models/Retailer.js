const mongoose = require('mongoose');

const retailerSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. RET-2026-XXXX
  retailerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roleId: { type: String }, // S2S-RET-XXXXXX

  productName: { type: String, required: true },
  category: { type: String, required: true },

  quantity: { type: Number, required: true },  // remaining stock
  originalQuantity: { type: Number },
  pricePerUnit: { type: Number, required: true },

  // Links up the supply chain
  parentDistBatchId: { type: String },         // from Distributor collection
  parentDistBatchIds: [{ type: String }],

  productImage: { type: String },
  qrCodeUrl: { type: String },
  traceUrl: { type: String },

  status: {
    type: String,
    enum: ['In Stock', 'Listed', 'Unlisted', 'Sold', 'Archived'],
    default: 'In Stock'
  },

  date: { type: Date },
  originDetails: { type: mongoose.Schema.Types.Mixed },

  soldTo: { type: String },
  soldDate: { type: Date },
  totalSaleValue: { type: Number },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Retailer', retailerSchema);
