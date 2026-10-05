const mongoose = require('mongoose');

const distributorSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. DIST-2026-XXXX
  distributorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roleId: { type: String }, // S2S-DST-XXXXXX

  productName: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true },  // remaining stock
  originalQuantity: { type: Number },
  pricePerUnit: { type: Number, required: true },

  itemType: { type: String, enum: ['RAW', 'DISTRIBUTED'], default: 'DISTRIBUTED' },
  remainingStock: { type: Number }, // remaining available stock for raw items

  // Raw Harvest Lifecycle
  supplierProcessorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  supplierProcessor: { type: String },
  processingStatus: { type: String, enum: ['Available for Distribution', 'Sent for Distribution', 'Fully Distributed'] },
  processingQuantity: { type: Number, default: 0 },
  sentForProcessingDate: { type: Date },
  consumedQuantity: { type: Number, default: 0 }, // tracks how much is fully converted to product

  // History for raw items
  processingHistory: [{
    processedBatchId: { type: String },
    quantityUsed: { type: Number },
    date: { type: Date, default: Date.now }
  }],

  // Links up the supply chain
  parentProcessedBatchId: { type: String },    // from Processor collection
  parentProcessedBatchIds: [{ type: String }],

  productImage: { type: String },
  qrCodeUrl: { type: String },
  traceUrl: { type: String },

  status: {
    type: String,
    enum: ['In Stock', 'Listed', 'Unlisted', 'Dispatched', 'Archived'],
    default: 'In Stock',
    index: true
  },

  date: { type: Date },
  originDetails: { type: mongoose.Schema.Types.Mixed },

  soldTo: { type: String },
  soldDate: { type: Date },
  totalSaleValue: { type: Number },

  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('Distributor', distributorSchema);
