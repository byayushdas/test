const mongoose = require('mongoose');

const processorSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. PROC-2026-XXXX
  processorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roleId: { type: String }, // S2S-PRC-XXXXXX

  productName: { type: String, required: true },
  category: { type: String, required: true },
  itemType: { type: String, enum: ['RAW', 'PROCESSED'], default: 'PROCESSED' },

  quantity: { type: Number, required: true },  // in kg/units remaining
  originalQuantity: { type: Number },
  pricePerUnit: { type: Number, required: true },
  remainingStock: { type: Number }, // remaining available stock for raw items

  // Raw Harvest Lifecycle
  supplierFarmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  supplierFarmer: { type: String },
  processingStatus: { type: String, enum: ['Available for Processing', 'Sent for Processing', 'Fully Processed'] },
  processingQuantity: { type: Number, default: 0 },
  sentForProcessingDate: { type: Date },
  consumedQuantity: { type: Number, default: 0 }, // tracks how much is fully converted to product

  // History for raw items
  processingHistory: [{
    processedBatchId: { type: String },
    quantityUsed: { type: Number },
    date: { type: Date, default: Date.now }
  }],

  // Link back to the raw harvest(s) used
  parentRawBatchId: { type: String },          // single raw batch ref
  parentRawBatchIds: [{ type: String }],        // multi-batch processing
  consumedBatches: [{
    batchId: { type: String },
    quantityUsed: { type: Number }
  }],

  productImage: { type: String },
  qrCodeUrl: { type: String },
  traceUrl: { type: String },

  status: {
    type: String,
    enum: ['In Stock', 'Listed', 'Unlisted', 'Dispatched', 'Archived'],
    default: 'In Stock',
    index: true
  },

  processingDate: { type: Date },
  originDetails: { type: mongoose.Schema.Types.Mixed },

  soldTo: { type: String },
  soldDate: { type: Date },
  totalSaleValue: { type: Number },

  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('Processor', processorSchema);
