const express = require('express');
const router = express.Router();
const User = require('../models/User');
const FarmerBatch = require('../models/Farmer');
const ProcessorBatch = require('../models/Processor');
const PurchaseOrder = require('../models/PurchaseOrder');

// ============================================================
// MARKETPLACE — Browse listed farmer harvests
// ============================================================

// GET /api/v1/processor/marketplace?search=&category=
router.get('/marketplace', async (req, res) => {
  try {
    const { search, category } = req.query;
    const query = { status: 'Listed' };

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { cropName: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { _id: { $regex: search, $options: 'i' } }
      ];
    }

    const batches = await FarmerBatch.find(query)
      .populate('farmerId', 'name farmDetails location')
      .sort({ createdAt: -1 });

    const mapped = await Promise.all(batches.map(async (b) => {
      const farmer = b.farmerId;
      const farmerName = farmer?.name || 'Registered Farmer';
      const farmerLocation = farmer?.farmDetails?.farmLocation || farmer?.location || 'not available in ad';

      return {
        id: b._id,
        batchId: b._id,
        cropName: b.cropName,
        category: b.category,
        farmerName,
        farmerLocation,
        quantity: b.quantity,
        unit: 'kg',
        pricePerUnit: b.pricePerKg,
        totalPrice: b.quantity * b.pricePerKg,
        harvestDate: b.harvestDate
          ? new Date(b.harvestDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
          : 'Recently Harvested',
        hasQrCode: !!b.qrCode,
        imageUrl: b.cropImage || '',
        traceUrl: b.traceUrl
      };
    }));

    return res.json({ success: true, data: mapped });
  } catch (err) {
    console.error('GET /processor/marketplace error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/v1/processor/marketplace/order — Processor places buy request on a farmer harvest
router.post('/marketplace/order', async (req, res) => {
  try {
    const { buyerId, batchId, quantityKg } = req.body;
    if (!buyerId || !batchId || !quantityKg) {
      return res.status(400).json({ success: false, message: 'buyerId, batchId, quantityKg required' });
    }

    const batch = await FarmerBatch.findById(batchId).populate('farmerId', 'name');
    if (!batch) return res.status(404).json({ success: false, message: 'Harvest batch not found' });
    if (batch.status !== 'Listed') {
      return res.status(400).json({ success: false, message: 'Batch is not available for purchase' });
    }

    const buyer = await User.findById(buyerId);
    if (!buyer) return res.status(404).json({ success: false, message: 'Buyer not found' });

    const qty = parseFloat(quantityKg);
    if (qty > batch.quantity) {
      return res.status(400).json({ success: false, message: `Only ${batch.quantity} kg available` });
    }

    const order = new PurchaseOrder({
      buyerRole: 'PROCESSOR',
      buyerId: buyerId,
      buyerName: buyer.name,
      buyerRoleId: buyer.roleId,
      sellerRole: 'FARMER',
      sellerId: batch.farmerId._id,
      sellerName: batch.farmerId.name,
      sellerRoleId: batch.roleId,
      batchId: batchId,
      cropName: batch.cropName,
      quantityKg: qty,
      pricePerUnit: batch.pricePerKg,
      totalAmount: qty * batch.pricePerKg,
      deliveryStatus: 'PENDING_SELLER_ACCEPTANCE',
      escrowStatus: 'PENDING'
    });

    await order.save();

    return res.status(201).json({ success: true, data: order });
  } catch (err) {
    console.error('POST /processor/marketplace/order error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/v1/processor/marketplace/payment/initiate
router.post('/marketplace/payment/initiate', async (req, res) => {
  try {
    const { factoryId, totalAmount } = req.body;
    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid totalAmount required' });
    }

    const Razorpay = require('razorpay');
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_TAwi9UQj2Q7wP5';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'j41TrOzQZEd9WL9Mmu6oYahb';

    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const amountInPaisa = Math.round(parseFloat(totalAmount) * 100);

    const order = await rzp.orders.create({
      amount: amountInPaisa,
      currency: 'INR',
      receipt: `rcpt_proc_${Date.now()}`,
      payment_capture: 1
    });

    return res.json({
      success: true,
      data: {
        keyId,
        orderId: order.id,
        amount: totalAmount,
        currency: 'INR'
      }
    });
  } catch (err) {
    console.error('POST /marketplace/payment/initiate error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to initiate Razorpay payment'
    });
  }
});

// POST /api/v1/processor/marketplace/payment/verify
router.post('/marketplace/payment/verify', async (req, res) => {
  try {
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature, factoryId } = req.body;
    if (!razorpayPaymentId) {
      return res.status(400).json({ success: false, message: 'razorpayPaymentId is required' });
    }

    const crypto = require('crypto');
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'j41TrOzQZEd9WL9Mmu6oYahb';

    if (razorpayOrderId && razorpaySignature && keySecret) {
      const body = razorpayOrderId + '|' + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(body)
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        return res.status(400).json({ success: false, message: 'Invalid Razorpay payment signature' });
      }
    }

    const orderNumber = `ORD-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    return res.json({
      success: true,
      data: {
        orderNumber,
        paymentId: razorpayPaymentId,
        paymentStatus: 'PAID & ESCROW LOCKED',
        factoryId
      }
    });
  } catch (err) {
    console.error('POST /marketplace/payment/verify error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Payment verification failed' });
  }
});


// ============================================================
// PRODUCTION HUB — Processor's processed inventory
// ============================================================

// GET /api/v1/processor/inventory?userId=
router.get('/inventory', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const items = await ProcessorBatch.find({ processorId: userId }).sort({ createdAt: -1 });
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error('GET /processor/inventory error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/v1/processor/inventory — Log new processed product
router.post('/inventory', async (req, res) => {
  try {
    const {
      userId, roleId,
      productName, category,
      quantity, pricePerUnit,
      parentRawBatchIds,
      isTransformingExisting,
      productImage, qrCodeUrl, traceUrl,
      processingDate, batchId
    } = req.body;

    if (!userId || !productName || !quantity || !pricePerUnit) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const id = batchId || `PROC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const parsedRawBatchIds = Array.isArray(parentRawBatchIds) ? parentRawBatchIds : [];

    let finalQrCodeUrl = qrCodeUrl;
    let finalTraceUrl = traceUrl;

    if (isTransformingExisting && parsedRawBatchIds.length === 1) {
      const transformId = parsedRawBatchIds[0];
      const existingBatch = await ProcessorBatch.findById(transformId);
      if (existingBatch) {
        finalQrCodeUrl = existingBatch.qrCodeUrl;
        finalTraceUrl = existingBatch.traceUrl;
      }
    }

    const actualFarmerBatchIds = [];

    // Process validations and updates for raw batches
    for (const rawBatchId of parsedRawBatchIds) {
      if (!rawBatchId) continue;
      
      const rawBatch = await ProcessorBatch.findById(rawBatchId);
      if (!rawBatch) {
        return res.status(404).json({ success: false, message: `Raw batch ${rawBatchId} not found.` });
      }

      actualFarmerBatchIds.push(rawBatch.parentRawBatchId || rawBatchId);

      // Mark as fully processed directly
      rawBatch.consumedQuantity = rawBatch.quantity;
      rawBatch.remainingStock = 0;
      rawBatch.processingQuantity = 0;
      rawBatch.processingStatus = 'Fully Processed';

      rawBatch.processingHistory.push({
        processedBatchId: id,
        quantityUsed: rawBatch.quantity
      });

      await rawBatch.save();
    }

    // Fetch primary batch origin details for traceability
    let originDetails = {};
    if (actualFarmerBatchIds.length > 0) {
      const primaryBatchId = actualFarmerBatchIds[0];
      const fBatch = await FarmerBatch.findById(primaryBatchId).populate('farmerId', 'name farmDetails location');
      if (fBatch) {
        const fUser = fBatch.farmerId;
        const farmerName = fUser?.name || 'Unknown Farmer';
        const farmerLocation = fUser?.farmDetails?.farmLocation || fUser?.location || 'Unknown Location';
        
        originDetails = {
          farmer: {
            batchId: fBatch._id,
            name: farmerName,
            location: farmerLocation,
            cropName: fBatch.cropName,
            category: fBatch.category,
            quantity: fBatch.quantity,
            pricePerKg: fBatch.pricePerKg,
            harvestDate: fBatch.harvestDate,
            cropImage: fBatch.cropImage,
            qrCode: fBatch.qrCode,
            traceUrl: fBatch.traceUrl
          }
        };
      }
    }

    const item = await ProcessorBatch.create({
      _id: id,
      processorId: userId,
      roleId: roleId || '',
      productName,
      category: category || 'Processed Goods',
      quantity: parseFloat(quantity),
      originalQuantity: parseFloat(quantity),
      pricePerUnit: parseFloat(pricePerUnit),
      parentRawBatchIds: actualFarmerBatchIds,
      parentRawBatchId: actualFarmerBatchIds.length > 0 ? actualFarmerBatchIds[0] : null,
      productImage: productImage || null,
      qrCodeUrl: finalQrCodeUrl || null,
      traceUrl: finalTraceUrl || null,
      processingDate: processingDate ? new Date(processingDate) : new Date(),
      status: 'In Stock',
      originDetails
    });

    return res.status(201).json({ success: true, data: item });
  } catch (err) {
    console.error('POST /processor/inventory error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/v1/processor/inventory/:id/processing-status — Update processing limit
router.put('/inventory/:id/processing-status', async (req, res) => {
  try {
    const { processingStatus, remainingStock, processingQuantity, sentForProcessingDate } = req.body;
    
    const item = await ProcessorBatch.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    
    if (processingStatus !== undefined) item.processingStatus = processingStatus;
    if (remainingStock !== undefined) item.remainingStock = remainingStock;
    if (processingQuantity !== undefined) item.processingQuantity = processingQuantity;
    if (sentForProcessingDate !== undefined) item.sentForProcessingDate = sentForProcessingDate;

    await item.save();
    return res.json({ success: true, data: item });
  } catch (err) {
    console.error('PUT /inventory/:id/processing-status error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/v1/processor/inventory/:id/list — Toggle Listed/In Stock
router.put('/inventory/:id/list', async (req, res) => {
  try {
    const item = await ProcessorBatch.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    if (item.status !== 'Listed' && item.quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Cannot list an item with 0kg available' });
    }

    item.status = item.status === 'Listed' ? 'In Stock' : 'Listed';
    item.updatedAt = new Date();
    await item.save();

    return res.json({ success: true, data: item });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/v1/processor/inventory/:id
router.delete('/inventory/:id', async (req, res) => {
  try {
    const batchToDelete = await ProcessorBatch.findById(req.params.id);
    if (!batchToDelete) return res.status(404).json({ success: false, message: 'Item not found' });

    // Restore raw material batches
    const rawBatches = await ProcessorBatch.find({ "processingHistory.processedBatchId": req.params.id });
    
    for (const rawBatch of rawBatches) {
      // Revert the consumption 
      rawBatch.consumedQuantity -= rawBatch.quantity;
      if (rawBatch.consumedQuantity < 0) rawBatch.consumedQuantity = 0;
      
      rawBatch.remainingStock = rawBatch.quantity;
      rawBatch.processingStatus = 'Available for Processing';
      
      // Remove from history
      rawBatch.processingHistory = rawBatch.processingHistory.filter(h => h.processedBatchId !== req.params.id);
      
      await rawBatch.save();
    }

    await ProcessorBatch.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Item deleted and raw materials restored' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ============================================================
// PURCHASE ORDERS — Orders received from Distributors
// ============================================================

// GET /api/v1/processor/purchase-orders/incoming?userId=
router.get('/purchase-orders/incoming', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const orders = await PurchaseOrder.find({
      ...( /^[0-9a-fA-F]{24}$/.test(userId) ? { sellerId: userId } : { sellerRoleId: userId } ),
      sellerRole: 'PROCESSOR'
    }).sort({ createdAt: -1 });

    return res.json({ success: true, data: orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/v1/processor/purchase-orders/outgoing?userId=
router.get('/purchase-orders/outgoing', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const orders = await PurchaseOrder.find({
      ...( /^[0-9a-fA-F]{24}$/.test(userId) ? { buyerId: userId } : { buyerRoleId: userId } ),
      buyerRole: 'PROCESSOR'
    }).sort({ createdAt: -1 });

    return res.json({ success: true, data: orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


// PUT /api/v1/processor/purchase-orders/:id/accept
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
      const batch = await ProcessorBatch.findById(order.batchId);
      if (batch && batch.quantity <= 0) {
        batch.status = 'Archived';
        await batch.save();
      }
    }

    return res.json({ success: true, data: order });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/v1/processor/purchase-orders/:id/reject
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
      const batch = await ProcessorBatch.findById(order.batchId);
      if (batch) {
        batch.quantity += order.quantityKg;
        if (batch.status === 'Sold' || batch.status === 'Archived' || batch.status === 'Dispatched') {
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

// PUT /api/v1/processor/purchase-orders/:id/dispatch
router.put('/purchase-orders/:id/dispatch', async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.deliveryStatus = 'DISPATCHED';
    order.dispatchedAt = new Date();
    order.updatedAt = new Date();
    await order.save();

    // Mark batch as Dispatched
    await ProcessorBatch.findByIdAndUpdate(order.batchId, {
      status: 'Dispatched',
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

// GET /api/v1/processor/shipments/incoming?userId= — From Farmers
router.get('/shipments/incoming', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const shipments = await PurchaseOrder.find({
      ...( /^[0-9a-fA-F]{24}$/.test(userId) ? { buyerId: userId } : { buyerRoleId: userId } ),
      buyerRole: 'PROCESSOR',
      $or: [
        { deliveryStatus: { $in: ['ACCEPTED', 'DISPATCHED', 'DELIVERED'] } },
        { deliveryStatus: 'REJECTED', dispatchedAt: { $exists: true, $ne: null } }
      ]
    }).sort({ updatedAt: -1 });

    return res.json({ success: true, data: shipments });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/v1/processor/shipments/outgoing?userId= — To Distributors
router.get('/shipments/outgoing', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const shipments = await PurchaseOrder.find({
      ...( /^[0-9a-fA-F]{24}$/.test(userId) ? { sellerId: userId } : { sellerRoleId: userId } ),
      sellerRole: 'PROCESSOR',
      $or: [
        { deliveryStatus: { $in: ['DISPATCHED', 'DELIVERED'] } },
        { deliveryStatus: 'REJECTED', dispatchedAt: { $exists: true, $ne: null } }
      ]
    }).sort({ updatedAt: -1 });

    return res.json({ success: true, data: shipments });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/v1/processor/shipments/:orderId/receive — Mark as delivered/received
router.put('/shipments/:orderId/receive', async (req, res) => {
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

    // Automatically Mint Inventory for Processor
    const ProcessorBatch = require('../models/Processor');
    const newBatch = new ProcessorBatch({
      _id: `RAW-PROC-${Date.now()}`,
      processorId: order.buyerId,
      roleId: order.buyerRoleId,
      itemType: 'RAW',
      productName: order.cropName,
      category: 'Raw Material',
      quantity: order.quantityKg,
      originalQuantity: order.quantityKg,
      pricePerUnit: order.pricePerUnit,
      parentRawBatchId: order.batchId,
      status: 'In Stock',
      supplierFarmerId: order.sellerId,
      supplierFarmer: order.sellerName,
      remainingStock: order.quantityKg,
      processingStatus: 'Available for Processing',
      processingQuantity: 0
    });
    await newBatch.save();

    return res.json({ success: true, data: order });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/v1/processor/shipments/:orderId/reject
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
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ============================================================
// REPORTS
// ============================================================

// GET /api/v1/processor/reports?userId=&timeframe=
router.get('/reports', async (req, res) => {
  try {
    const { userId, timeframe } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const { getRoleAnalytics } = require('../utils/analytics');
    const data = await getRoleAnalytics(userId, 'PROCESSOR', timeframe || 'MONTHLY');
    
    return res.json({ success: true, data });
  } catch (err) {
    console.error('GET /processor/reports error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
