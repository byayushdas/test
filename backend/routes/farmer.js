const express = require('express');
const router = express.Router();
const User = require('../models/User');
const FarmerBatch = require('../models/Farmer');
const PurchaseOrder = require('../models/PurchaseOrder');

// ============================================================
// HARVEST BATCHES
// ============================================================

// POST /api/v1/farmer/harvests — Log a new harvest batch
router.post('/harvests', async (req, res) => {
  try {
    const {
      userId, roleId,
      cropName, category,
      quantity, pricePerKg,
      harvestDate, cropImage, qrCode, traceUrl,
      batchId
    } = req.body;

    if (!userId || !cropName || !quantity || !pricePerKg) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const id = batchId || `BATCH-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const batch = await FarmerBatch.create({
      _id: id,
      farmerId: userId,
      roleId: roleId || '',
      cropName,
      category: category || 'General',
      quantity: parseFloat(quantity),
      originalQuantity: parseFloat(quantity),
      pricePerKg: parseFloat(pricePerKg),
      harvestDate: harvestDate ? new Date(harvestDate) : new Date(),
      cropImage: cropImage || null,
      qrCode: qrCode || null,
      traceUrl: traceUrl || null,
      status: 'Unlisted'
    });

    return res.status(201).json({ success: true, data: batch });
  } catch (err) {
    console.error('POST /farmer/harvests error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/v1/farmer/harvests?userId= — Get farmer's own harvests
router.get('/harvests', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.json({ success: true, data: [] });
    }

    const batches = await FarmerBatch.find({ farmerId: userId }).sort({ createdAt: -1 });
    return res.json({ success: true, data: batches });
  } catch (err) {
    console.error('GET /farmer/harvests error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/v1/farmer/harvests/:id/list — Toggle Listed/Unlisted
router.put('/harvests/:id/list', async (req, res) => {
  try {
    const batch = await FarmerBatch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Harvest not found' });

    if (batch.status !== 'Listed' && batch.quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Cannot list a batch with 0kg available' });
    }

    batch.status = batch.status === 'Listed' ? 'Unlisted' : 'Listed';
    batch.updatedAt = new Date();
    await batch.save();

    return res.json({ success: true, data: batch });
  } catch (err) {
    console.error('PUT /farmer/harvests/:id/list error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/v1/farmer/harvests/:id — Delete a harvest
router.delete('/harvests/:id', async (req, res) => {
  try {
    await FarmerBatch.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Harvest deleted' });
  } catch (err) {
    console.error('DELETE /farmer/harvests/:id error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ============================================================
// PURCHASE ORDERS (received from Processors)
// ============================================================

// GET /api/v1/farmer/purchase-orders?userId= — All orders for a farmer
router.get('/purchase-orders', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const orders = await PurchaseOrder.find({
      ...( /^[0-9a-fA-F]{24}$/.test(userId) ? { sellerId: userId } : { sellerRoleId: userId } ),
      sellerRole: 'FARMER'
    }).sort({ createdAt: -1 });

    return res.json({ success: true, data: orders });
  } catch (err) {
    console.error('GET /farmer/purchase-orders error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


// PUT /api/v1/farmer/purchase-orders/:id/accept
router.put('/purchase-orders/:id/accept', async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.deliveryStatus = 'ACCEPTED';
    order.escrowStatus = 'LOCKED';
    order.updatedAt = new Date();
    await order.save();

    // If batch is fully exhausted, mark it as Sold so it drops off the active inventory
    if (order.batchId) {
      const batch = await FarmerBatch.findById(order.batchId);
      if (batch && batch.quantity <= 0) {
        batch.status = 'Sold';
        await batch.save();
      }
    }

    return res.json({ success: true, data: order });
  } catch (err) {
    console.error('PUT /farmer/purchase-orders/:id/accept error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/v1/farmer/purchase-orders/:id/reject
router.put('/purchase-orders/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const Transaction = require('../models/Transaction');
    
    let refundId = null;
    if (order.razorpayPaymentId) {
      try {
        const Razorpay = require('razorpay');
        const rzp = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TAwi9UQj2Q7wP5',
          key_secret: process.env.RAZORPAY_KEY_SECRET || 'j41TrOzQZEd9WL9Mmu6oYahb'
        });
        const refund = await rzp.payments.refund(order.razorpayPaymentId, {
          amount: Math.round(order.totalAmount * 100),
          notes: { reason: 'Order rejected by seller' }
        });
        refundId = refund.id;
        order.razorpayRefundId = refundId;
      } catch (rzpErr) {
        console.error('Razorpay refund error:', rzpErr);
      }
    }

    order.deliveryStatus = 'REJECTED';
    order.escrowStatus = 'RELEASED';
    order.rejectionReason = reason || 'No reason provided';
    order.updatedAt = new Date();
    await order.save();

    if (order.buyerId) {
      const refundTx = new Transaction({
        userId: order.buyerId,
        transactionId: refundId || `ref_${Date.now()}`,
        orderId: order.orderNumber,
        amount: order.totalAmount,
        type: 'CREDIT',
        status: 'COMPLETED',
        description: `Refund (Order Rejected)`
      });
      await refundTx.save();
    }

    // RESTOCK LOGIC
    if (order.batchId) {
      const batch = await FarmerBatch.findById(order.batchId);
      if (batch) {
        batch.quantity += order.quantityKg;
        if (batch.status === 'Sold' || batch.status === 'Archived') {
          batch.status = 'Listed';
        }
        await batch.save();
      }
    }

    return res.json({ success: true, data: order });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/v1/farmer/purchase-orders/:id/dispatch
router.put('/purchase-orders/:id/dispatch', async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.deliveryStatus = 'DISPATCHED';
    order.dispatchedAt = new Date();
    order.updatedAt = new Date();
    await order.save();

    // Mark the batch as Sold if fully dispatched
    await FarmerBatch.findByIdAndUpdate(order.batchId, {
      status: 'Sold',
      soldTo: order.buyerName,
      soldDate: new Date(),
      updatedAt: new Date()
    });

    return res.json({ success: true, data: order });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ============================================================
// SHIPMENTS
// ============================================================

// GET /api/v1/farmer/shipments/outgoing?userId= — To Processors
router.get('/shipments/outgoing', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const shipments = await PurchaseOrder.find({
      ...( /^[0-9a-fA-F]{24}$/.test(userId) ? { sellerId: userId } : { sellerRoleId: userId } ),
      sellerRole: 'FARMER',
      deliveryStatus: { $in: ['DISPATCHED', 'DELIVERED', 'REJECTED'] }
    }).sort({ updatedAt: -1 });

    return res.json({ success: true, data: shipments });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ============================================================
// REPORTS
// ============================================================

// GET /api/v1/farmer/reports?userId=&timeframe=
router.get('/reports', async (req, res) => {
  try {
    const { userId, timeframe } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const { getRoleAnalytics } = require('../utils/analytics');
    const data = await getRoleAnalytics(userId, 'FARMER', timeframe || 'MONTHLY');
    
    return res.json({ success: true, data });
  } catch (err) {
    console.error('GET /farmer/reports error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
