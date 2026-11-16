const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. BATCH-2026-XXXX
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roleId: { type: String }, // S2S-FRM-XXXXXX

  cropName: { type: String, required: true },
  category: { type: String, required: true },

  quantity: { type: Number, required: true },  // in kg (remaining available)
  originalQuantity: { type: Number },           // initial quantity logged
  pricePerKg: { type: Number, required: true },

  harvestDate: { type: Date },
  cropImage: { type: String },   // base64 or URL
  qrCode: { type: String },      // base64 QR image
  traceUrl: { type: String },

  status: {
    type: String,
    enum: ['Unlisted', 'Listed', 'Sold'],
    default: 'Unlisted',
    index: true
  },

  soldTo: { type: String },
  soldDate: { type: Date },
  totalSaleValue: { type: Number },

  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('Farmer', farmerSchema);
