const express = require('express');
const router = express.Router();
const User = require('../models/User');
const DistributorBatch = require('../models/Distributor');
const RetailerBatch = require('../models/Retailer');
const PurchaseOrder = require('../models/PurchaseOrder');

// ============================================================
// MARKETPLACE — Browse listed distributor goods
// ============================================================

// GET /api/v1/retailer/marketplace?search=&category=
router.get('/marketplace', async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const query = { status: 'Listed' };

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { _id: { $regex: search, $options: 'i' } }
      ];
    }

    const batches = await DistributorBatch.find(query)
      .populate('distributorId', 'name distributorDetails location')
      .sort({ createdAt: -1 });

    const mapped = batches.map((b) => {
      const distributor = b.distributorId;
      const distributorName = distributor?.name || 'Registered Distributor';
      const distributorLocation = distributor?.distributorDetails?.location || distributor?.location || 'not available in ad';

      const farmerDetails = b.originDetails?.farmer || {};

      return {
        id: b._id,
        batchId: b._id,
        productName: b.productName,
        cropName: farmerDetails.cropName || b.productName,
        category: b.category,
        distributorName,
        distributorLocation,
        farmerName: farmerDetails.name || distributorName,
        farmerLocation: farmerDetails.location || distributorLocation,
        quantity: b.quantity,
        unit: 'kg',
        pricePerUnit: b.pricePerUnit,
        totalPrice: b.quantity * b.pricePerUnit,
        date: b.date
          ? new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
          : 'Recently Added',
        harvestDate: farmerDetails.harvestDate
          ? new Date(farmerDetails.harvestDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
          : (b.date ? new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Recently Added'),
        hasQrCode: !!b.qrCodeUrl,
        imageUrl: b.productImage || '',
        parentProcessedBatchId: b.parentProcessedBatchId,
        parentDistBatchIds: b.parentDistBatchIds || [],
        originalCropImage: farmerDetails.cropImage || null,
        traceUrl: b.traceUrl || farmerDetails.traceUrl || null,
        originDetails: b.originDetails || {}
      };
    });

    return res.json({ success: true, data: mapped });
  } catch (err) {
    console.error('GET /retailer/marketplace error:', err);
    return handleDbError(err, res);
  }
});

// POST /api/v1/retailer/marketplace/order — Retailer places buy request
router.post('/marketplace/order', async (req, res, next) => {
  try {
    const { buyerId, batchId, quantityKg } = req.body;
    if (!buyerId || !batchId || !quantityKg) {
      return res.status(400).json({ success: false, message: 'buyerId, batchId, quantityKg required' });
    }

    const batch = await DistributorBatch.findById(batchId).populate('distributorId', 'name');
    if (!batch) return res.status(404).json({ success: false, message: 'Distributed batch not found' });
    if (batch.status !== 'Listed') {
      return res.status(400).json({ success: false, message: 'Batch is not available for purchase' });
    }

    const buyer = await User.findById(buyerId);
    if (!buyer) return res.status(404).json({ success: false, message: 'Buyer not found' });

    const qty = parseFloat(quantityKg);
    if (qty > batch.quantity) {
      return res.status(400).json({ success: false, message: `Only ${batch.quantity} units available` });
    }

    const order = new PurchaseOrder({
      buyerRole: 'RETAILER',
      buyerId: buyerId,
      buyerName: buyer.name,
      buyerRoleId: buyer.roleId,
      sellerRole: 'DISTRIBUTOR',
      sellerId: batch.distributorId._id,
      sellerName: batch.distributorId.name,
      batchId: batchId,
      cropName: batch.productName,
      quantityKg: qty,
      pricePerUnit: batch.pricePerUnit,
      totalAmount: qty * batch.pricePerUnit,
      deliveryStatus: 'PENDING_SELLER_ACCEPTANCE',
      escrowStatus: 'PENDING'
    });

    await order.save();

    return res.status(201).json({ success: true, data: order });
  } catch (err) {
    console.error('POST /retailer/marketplace/order error:', err);
    return handleDbError(err, res);
  }
});


// ============================================================
// PURCHASE ORDERS — Orders from Customers
// ============================================================

// GET /api/v1/retailer/purchase-orders?userId=
router.get('/purchase-orders', async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const orders = await PurchaseOrder.find({
      ...( /^[0-9a-fA-F]{24}$/.test(userId) ? { sellerId: userId } : { sellerRoleId: userId } ),
      sellerRole: 'RETAILER'
    }).sort({ createdAt: -1 });

    return res.json({ success: true, data: orders });
  } catch (err) {
    return handleDbError(err, res);
  }
});


// PUT /api/v1/retailer/purchase-orders/:id/accept
router.put('/purchase-orders/:id/accept', async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.deliveryStatus = 'ACCEPTED';
    order.escrowStatus = 'LOCKED';
    order.updatedAt = new Date();
    await order.save();

    // If batch is fully exhausted, mark it as Sold so it drops off active inventory
    if (order.batchId) {
      const batch = await RetailerBatch.findById(order.batchId);
      if (batch && batch.quantity <= 0) {
        batch.status = 'Sold';
        await batch.save();
      }
    }

    return res.json({ success: true, data: order });
  } catch (err) {
    return handleDbError(err, res);
  }
});

// PUT /api/v1/retailer/purchase-orders/:id/reject
router.put('/purchase-orders/:id/reject', async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const Transaction = require('../models/Transaction');
    
    let refundId = null;
    if (order.razorpayPaymentId) {
      try {
        const Razorpay = require('razorpay');
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keyId || !keySecret) throw new Error("Razorpay credentials missing");
        
        const rzp = new Razorpay({
          key_id: keyId,
          key_secret: keySecret
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
      const batch = await RetailerBatch.findById(order.batchId);
      if (batch) {
        batch.quantity += order.quantityKg;
        if (batch.status === 'Sold' || batch.status === 'Archived' || batch.status === 'Unlisted') {
          batch.status = 'Listed';
        }
        await batch.save();
      }
    }

    return res.json({ success: true, data: order });
  } catch (err) {
    return handleDbError(err, res);
  }
});

// PUT /api/v1/retailer/purchase-orders/:id/dispatch
router.put('/purchase-orders/:id/dispatch', async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.deliveryStatus = 'DISPATCHED';
    order.dispatchedAt = new Date();
    order.updatedAt = new Date();
    await order.save();

    await RetailerBatch.findByIdAndUpdate(order.batchId, {
      status: 'Sold',
      updatedAt: new Date()
    });

    return res.json({ success: true, data: order });
  } catch (err) {
    return handleDbError(err, res);
  }
});

// ============================================================
// SHIPMENTS
// ============================================================

// GET /api/v1/retailer/shipments/incoming?userId= — From Distributors
router.get('/shipments/incoming', async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const shipments = await PurchaseOrder.find({
      ...( /^[0-9a-fA-F]{24}$/.test(userId) ? { buyerId: userId } : { buyerRoleId: userId } ),
      buyerRole: 'RETAILER',
      $or: [
        { deliveryStatus: { $in: ['ACCEPTED', 'DISPATCHED', 'DELIVERED'] } },
        { deliveryStatus: 'REJECTED', dispatchedAt: { $exists: true, $ne: null } }
      ]
    }).sort({ updatedAt: -1 });

    return res.json({ success: true, data: shipments });
  } catch (err) {
    return handleDbError(err, res);
  }
});


// PUT /api/v1/retailer/shipments/:orderId/receive
router.put('/shipments/:orderId/receive', async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.deliveryStatus = 'DELIVERED';
    order.escrowStatus = 'RELEASED';
    order.deliveredAt = new Date();
    order.updatedAt = new Date();
    await order.save();

    const Transaction = require('../models/Transaction');
    if (order.sellerId) {
      const payoutTx = new Transaction({
        userId: order.sellerId,
        transactionId: `payout_${Date.now()}`,
        orderId: order.orderNumber,
        amount: order.totalAmount,
        type: 'CREDIT',
        status: 'COMPLETED',
        description: `Escrow Released (Order Delivered)`
      });
      await payoutTx.save();
    }

    if (order.buyerId) {
      const buyerTx = await Transaction.findOne({ orderId: order.orderNumber, userId: order.buyerId, type: 'DEBIT' });
      if (buyerTx) {
        buyerTx.status = 'COMPLETED';
        await buyerTx.save();
      }
    }

    // Mint Retailer inventory only upon explicit acceptance
    const RetailerBatch = require('../models/Retailer');

    // Guard against duplicate minting (idempotency check)
    const existing = await RetailerBatch.findOne({ parentDistBatchId: order.batchId, retailerId: order.buyerId });
    if (!existing) {
      const newBatch = new RetailerBatch({
        _id: `RAW-RET-${Date.now()}`,
        retailerId: order.buyerId,
        roleId: order.buyerRoleId,
        itemType: 'RAW',
        productName: order.cropName,
        category: 'Retail Goods',
        quantity: order.quantityKg,
        originalQuantity: order.quantityKg,
        pricePerUnit: order.pricePerUnit,
        parentDistBatchId: order.batchId,
        parentDistBatchIds: [order.batchId],
        status: 'In Stock',
        supplierDistributorId: order.sellerId,
        supplierDistributor: order.sellerName,
        date: new Date()
      });
      await newBatch.save();
    }

    return res.json({ success: true, data: order });
  } catch (err) {
    return handleDbError(err, res);
  }
});

// PUT /api/v1/retailer/shipments/:orderId/reject
router.put('/shipments/:orderId/reject', async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await PurchaseOrder.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const Transaction = require('../models/Transaction');
    
    let refundId = null;
    if (order.razorpayPaymentId) {
      try {
        const Razorpay = require('razorpay');
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keyId || !keySecret) throw new Error("Razorpay credentials missing");
        
        const rzp = new Razorpay({
          key_id: keyId,
          key_secret: keySecret
        });
        const refund = await rzp.payments.refund(order.razorpayPaymentId, {
          amount: Math.round(order.totalAmount * 100),
          notes: { reason: 'Delivery rejected by buyer' }
        });
        refundId = refund.id;
        order.razorpayRefundId = refundId;
      } catch (rzpErr) {
        console.error('Razorpay refund error:', rzpErr);
      }
    }

    order.deliveryStatus = 'REJECTED';
    order.escrowStatus = 'RELEASED';
    order.rejectionReason = reason || 'Delivery rejected by buyer';
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
        description: `Refund (Delivery Rejected)`
      });
      await refundTx.save();
    }

    return res.json({ success: true, data: order });
  } catch (err) {
    return handleDbError(err, res);
  }
});

// ============================================================
// REPORTS
// ============================================================

// GET /api/v1/retailer/reports?userId=&timeframe=
router.get('/reports', async (req, res, next) => {
  try {
    const { userId, timeframe } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const { getRoleAnalytics } = require('../utils/analytics');
    const data = await getRoleAnalytics(userId, 'RETAILER', timeframe || 'MONTHLY');
    
    return res.json({ success: true, data });
  } catch (err) {
    console.error('GET /retailer/reports error:', err);
    return handleDbError(err, res);
  }
});

module.exports = router;
