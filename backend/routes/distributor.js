const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ProcessorBatch = require('../models/Processor');
const DistributorBatch = require('../models/Distributor');
const PurchaseOrder = require('../models/PurchaseOrder');

// ============================================================
// MARKETPLACE — Browse listed processor products
// ============================================================

// GET /api/v1/distributor/marketplace?search=&category=
router.get('/marketplace', async (req, res) => {
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

    const batches = await ProcessorBatch.find(query)
      .populate('processorId', 'name processorDetails location')
      .sort({ createdAt: -1 });

    const mapped = batches.map((b) => {
      const processor = b.processorId;
      const processorName = processor?.name || 'Registered Processor';
      const processorLocation = processor?.processorDetails?.facilityLocation || processor?.location || 'not available in ad';

      const farmerDetails = b.originDetails?.farmer || {};

      return {
        id: b._id,
        batchId: b._id,
        productName: b.productName,
        cropName: farmerDetails.cropName || b.productName,
        category: b.category,
        processorName,
        processorLocation,
        farmerName: farmerDetails.name || processorName,
        farmerLocation: farmerDetails.location || processorLocation,
        quantity: b.quantity,
        unit: 'kg',
        pricePerUnit: b.pricePerUnit,
        totalPrice: b.quantity * b.pricePerUnit,
        processingDate: b.processingDate
          ? new Date(b.processingDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
          : 'Recently Processed',
        harvestDate: farmerDetails.harvestDate
          ? new Date(farmerDetails.harvestDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
          : (b.processingDate ? new Date(b.processingDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Recently Processed'),
        hasQrCode: !!b.qrCodeUrl,
        imageUrl: b.productImage || '',
        parentRawBatchId: b.parentRawBatchId,
        parentRawBatchIds: b.parentRawBatchIds || [],
        originalCropImage: farmerDetails.cropImage || null,
        traceUrl: b.traceUrl || farmerDetails.traceUrl || null,
        originDetails: b.originDetails || {}
      };
    });

    return res.json({ success: true, data: mapped });
  } catch (err) {
    console.error('GET /distributor/marketplace error:', err);
    console.error(err); return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/v1/distributor/marketplace/order — Distributor places buy request
router.post('/marketplace/order', async (req, res) => {
  try {
    const { buyerId, batchId, quantityKg } = req.body;
    if (!buyerId || !batchId || !quantityKg) {
      return res.status(400).json({ success: false, message: 'buyerId, batchId, quantityKg required' });
    }

    const batch = await ProcessorBatch.findById(batchId).populate('processorId', 'name');
    if (!batch) return res.status(404).json({ success: false, message: 'Processed batch not found' });
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
      buyerRole: 'DISTRIBUTOR',
      buyerId: buyerId,
      buyerName: buyer.name,
      buyerRoleId: buyer.roleId,
      sellerRole: 'PROCESSOR',
      sellerId: batch.processorId._id,
      sellerName: batch.processorId.name,
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
    console.error('POST /distributor/marketplace/order error:', err);
    console.error(err); return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ============================================================
// SUPPLY HUB — Distributor's inventory
// ============================================================

// GET /api/v1/distributor/inventory?userId=
router.get('/inventory', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const items = await DistributorBatch.find({ distributorId: userId }).sort({ createdAt: -1 });
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error(err); return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/v1/distributor/inventory
router.post('/inventory', async (req, res) => {
  try {
    const {
      userId, roleId,
      productName, category,
      quantity, pricePerUnit,
      parentProcessedBatchId, parentProcessedBatchIds,
      isTransformingExisting,
      productImage, qrCodeUrl, traceUrl, date, batchId
    } = req.body;

    if (!userId || !productName || !quantity || !pricePerUnit) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const id = batchId || `DIST-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const parsedRawBatchIds = Array.isArray(parentProcessedBatchIds) ? parentProcessedBatchIds : (parentProcessedBatchId ? [parentProcessedBatchId] : []);
    
    let originDetails = {};
    const primaryBatchId = parsedRawBatchIds.length > 0 ? parsedRawBatchIds[0] : null;
    
    if (primaryBatchId) {
      const pBatch = await ProcessorBatch.findById(primaryBatchId).populate('processorId', 'name processorDetails location');
      if (pBatch) {
        const pUser = pBatch.processorId;
        const processorName = pUser?.name || 'Unknown Processor';
        const processorLocation = pUser?.processorDetails?.facilityLocation || pUser?.location || 'Unknown Location';
        
        originDetails = {
          ...(pBatch.originDetails || {}),
          processor: {
            batchId: pBatch._id,
            name: processorName,
            location: processorLocation,
            productName: pBatch.productName,
            category: pBatch.category,
            quantity: pBatch.quantity,
            pricePerUnit: pBatch.pricePerUnit,
            processingDate: pBatch.processingDate,
            productImage: pBatch.productImage,
            qrCodeUrl: pBatch.qrCodeUrl,
            traceUrl: pBatch.traceUrl,
            parentRawBatchIds: pBatch.parentRawBatchIds && pBatch.parentRawBatchIds.length > 0 ? pBatch.parentRawBatchIds : (pBatch.parentRawBatchId ? [pBatch.parentRawBatchId] : [])
          }
        };
      }
    }

    let finalQrCodeUrl = qrCodeUrl;
    let finalTraceUrl = traceUrl;

    if (isTransformingExisting && parsedRawBatchIds.length === 1) {
      const transformId = parsedRawBatchIds[0];
      const existingBatch = await DistributorBatch.findById(transformId);
      if (existingBatch) {
        finalQrCodeUrl = existingBatch.qrCodeUrl;
        finalTraceUrl = existingBatch.traceUrl;
      }
    }

    const item = await DistributorBatch.create({
      _id: id,
      distributorId: userId,
      roleId: roleId || '',
      productName,
      category: category || 'Processed Goods',
      quantity: parseFloat(quantity),
      originalQuantity: parseFloat(quantity),
      pricePerUnit: parseFloat(pricePerUnit),
      parentProcessedBatchId: parentProcessedBatchId || null,
      parentProcessedBatchIds: parsedRawBatchIds,
      productImage: productImage || null,
      qrCodeUrl: finalQrCodeUrl || null,
      traceUrl: finalTraceUrl || null,
      date: date ? new Date(date) : new Date(),
      status: 'In Stock',
      itemType: 'DISTRIBUTED',
      originDetails
    });

    // Deduct stock from the parent raw batches that were used
    if (parentProcessedBatchIds && parentProcessedBatchIds.length > 0) {
      // Split if it's a comma-separated string (from frontend)
      let rawIds = [];
      if (typeof parentProcessedBatchIds[0] === 'string' && parentProcessedBatchIds[0].includes(',')) {
        rawIds = parentProcessedBatchIds[0].split(',').map(id => id.trim());
      } else {
        rawIds = parentProcessedBatchIds;
      }
      
      let amountToDeduct = parseFloat(quantity);
      for (const rId of rawIds) {
        if (amountToDeduct <= 0) break;
        const rawBatch = await DistributorBatch.findById(rId);
        if (rawBatch && rawBatch.itemType === 'RAW') {
          const avail = rawBatch.remainingStock || 0;
          const deduct = Math.min(avail, amountToDeduct);
          
          rawBatch.remainingStock = avail - deduct;
          rawBatch.consumedQuantity = (rawBatch.consumedQuantity || 0) + deduct;
          
          if (rawBatch.remainingStock === 0) {
            rawBatch.processingStatus = 'Fully Distributed';
          } else if (rawBatch.processingStatus === 'Available for Distribution') {
            rawBatch.processingStatus = 'Sent for Distribution';
          }
          
          rawBatch.processingHistory = rawBatch.processingHistory || [];
          rawBatch.processingHistory.push({
            processedBatchId: id,
            quantityUsed: deduct,
            date: new Date()
          });
          
          await rawBatch.save();
          amountToDeduct -= deduct;
        }
      }
    }

    return res.status(201).json({ success: true, data: item });
  } catch (err) {
    console.error('POST /distributor/inventory error:', err);
    console.error(err); return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/v1/distributor/inventory/:id/list
router.put('/inventory/:id/list', async (req, res) => {
  try {
    const item = await DistributorBatch.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    if (item.status !== 'Listed' && item.quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Cannot list an item with 0kg available' });
    }

    item.status = item.status === 'Listed' ? 'In Stock' : 'Listed';
    item.updatedAt = new Date();
    await item.save();

    return res.json({ success: true, data: item });
  } catch (err) {
    console.error(err); return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/v1/distributor/inventory/:id
router.delete('/inventory/:id', async (req, res) => {
  try {
    await DistributorBatch.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    console.error(err); return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ============================================================
// PURCHASE ORDERS — Orders from Retailers
// ============================================================

// GET /api/v1/distributor/purchase-orders/incoming?userId= (From Retailers)
router.get('/purchase-orders/incoming', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const orders = await PurchaseOrder.find({
      ...( /^[0-9a-fA-F]{24}$/.test(userId) ? { sellerId: userId } : { sellerRoleId: userId } ),
      sellerRole: 'DISTRIBUTOR',
      $nor: [
        { deliveryStatus: 'REJECTED', dispatchedAt: { $exists: true, $ne: null } }
      ]
    }).sort({ createdAt: -1 });

    return res.json({ success: true, data: orders });
  } catch (err) {
    console.error(err); return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/v1/distributor/purchase-orders/outgoing?userId= (To Processors)
router.get('/purchase-orders/outgoing', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const orders = await PurchaseOrder.find({
      ...( /^[0-9a-fA-F]{24}$/.test(userId) ? { buyerId: userId } : { buyerRoleId: userId } ),
      buyerRole: 'DISTRIBUTOR',
      $nor: [
        { deliveryStatus: 'REJECTED', dispatchedAt: { $exists: true, $ne: null } }
      ]
    }).sort({ createdAt: -1 });

    return res.json({ success: true, data: orders });
  } catch (err) {
    console.error(err); return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});



// PUT /api/v1/distributor/purchase-orders/:id/accept
router.put('/purchase-orders/:id/accept', async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.deliveryStatus = 'ACCEPTED';
    order.escrowStatus = 'LOCKED';
    order.updatedAt = new Date();
    await order.save();

    // If batch is fully exhausted, mark it as Archived so it drops off active inventory
    if (order.batchId) {
      const batch = await DistributorBatch.findById(order.batchId);
      if (batch && batch.quantity <= 0) {
        batch.status = 'Archived';
        await batch.save();
      }
    }

    return res.json({ success: true, data: order });
  } catch (err) {
    console.error(err); return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/v1/distributor/purchase-orders/:id/reject
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
    await order.save();

    // RESTOCK LOGIC
    if (order.batchId) {
      const batch = await DistributorBatch.findById(order.batchId);
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
    console.error(err); return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/v1/distributor/purchase-orders/:id/dispatch
router.put('/purchase-orders/:id/dispatch', async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.deliveryStatus = 'DISPATCHED';
    order.dispatchedAt = new Date();
    order.updatedAt = new Date();
    await order.save();

    await DistributorBatch.findByIdAndUpdate(order.batchId, {
      status: 'Dispatched',
      updatedAt: new Date()
    });

    return res.json({ success: true, data: order });
  } catch (err) {
    console.error(err); return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ============================================================
// SHIPMENTS
// ============================================================

// GET /api/v1/distributor/shipments/incoming?userId= — From Processors
router.get('/shipments/incoming', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const shipments = await PurchaseOrder.find({
      ...( /^[0-9a-fA-F]{24}$/.test(userId) ? { buyerId: userId } : { buyerRoleId: userId } ),
      buyerRole: 'DISTRIBUTOR',
      $or: [
        { deliveryStatus: { $in: ['ACCEPTED', 'DISPATCHED', 'DELIVERED'] } },
        { deliveryStatus: 'REJECTED', dispatchedAt: { $exists: true, $ne: null } }
      ]
    }).sort({ updatedAt: -1 });

    return res.json({ success: true, data: shipments });
  } catch (err) {
    console.error(err); return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/v1/distributor/shipments/outgoing?userId= — To Retailers
router.get('/shipments/outgoing', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const shipments = await PurchaseOrder.find({
      ...( /^[0-9a-fA-F]{24}$/.test(userId) ? { sellerId: userId } : { sellerRoleId: userId } ),
      sellerRole: 'DISTRIBUTOR',
      $or: [
        { deliveryStatus: { $in: ['DISPATCHED', 'DELIVERED'] } },
        { deliveryStatus: 'REJECTED', dispatchedAt: { $exists: true, $ne: null } }
      ]
    }).sort({ updatedAt: -1 });

    return res.json({ success: true, data: shipments });
  } catch (err) {
    console.error(err); return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/v1/distributor/shipments/:orderId/receive
router.put('/shipments/:orderId/receive', async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Guard: only accept if dispatched (not already delivered or pending)
    if (order.deliveryStatus !== 'DISPATCHED') {
      return res.status(400).json({ success: false, message: `Cannot accept delivery — order is in status: ${order.deliveryStatus}` });
    }

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

    // Mint Distributor inventory only upon explicit acceptance
    const DistributorBatch = require('../models/Distributor');

    // Guard against duplicate minting (idempotency check)
    const existing = await DistributorBatch.findOne({ parentProcessedBatchId: order.batchId, distributorId: order.buyerId });
    if (!existing) {
      const newBatch = new DistributorBatch({
        _id: `RAW-DIST-${Date.now()}`,
        distributorId: order.buyerId,
        roleId: order.buyerRoleId,
        itemType: 'RAW',
        productName: order.cropName,
        category: 'Processed Goods',
        quantity: order.quantityKg,
        originalQuantity: order.quantityKg,
        pricePerUnit: order.pricePerUnit,
        parentProcessedBatchId: order.batchId,
        parentProcessedBatchIds: [order.batchId],
        status: 'In Stock',
        supplierProcessorId: order.sellerId,
        supplierProcessor: order.sellerName,
        remainingStock: order.quantityKg,
        processingStatus: 'Available for Distribution',
        processingQuantity: 0,
        date: new Date()
      });
      await newBatch.save();
    }

    return res.json({ success: true, data: order });
  } catch (err) {
    console.error('Distributor Receive Error:', err);
    console.error(err); return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/v1/distributor/shipments/:orderId/reject
router.put('/shipments/:orderId/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await PurchaseOrder.findById(req.params.orderId);
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
    console.error(err); return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ============================================================
// REPORTS
// ============================================================

// GET /api/v1/distributor/reports?userId=&timeframe=
router.get('/reports', async (req, res) => {
  try {
    const { userId, timeframe } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const { getRoleAnalytics } = require('../utils/analytics');
    const data = await getRoleAnalytics(userId, 'DISTRIBUTOR', timeframe || 'MONTHLY');
    
    return res.json({ success: true, data });
  } catch (err) {
    console.error('GET /distributor/reports error:', err);
    console.error(err); return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
