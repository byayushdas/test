const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');

// ============================================================
// HARVEST BATCHES
// ============================================================

// POST /api/v1/farmer/harvests — Log a new harvest batch
router.post('/harvests', async (req, res, next) => {
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

    const batch = await prisma.farmerBatch.create({
      data: {
        id,
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
      }
    });

    return res.status(201).json({ success: true, data: batch });
  } catch (err) {
    console.error('POST /farmer/harvests error:', err);
    return next(err);
  }
});

// GET /api/v1/farmer/harvests?userId= — Get farmer's own harvests
router.get('/harvests', async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    // Validate if userId is cuid/uuid vs roleId by length/format
    const isId = userId.startsWith('cuid') || userId.length > 20;
    if (!isId) return res.json({ success: true, data: [] });

    const batches = await prisma.farmerBatch.findMany({ 
      where: { farmerId: userId },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, data: batches });
  } catch (err) {
    console.error('GET /farmer/harvests error:', err);
    return next(err);
  }
});

// PUT /api/v1/farmer/harvests/:id/list — Toggle Listed/Unlisted
router.put('/harvests/:id/list', async (req, res, next) => {
  try {
    const batch = await prisma.farmerBatch.findUnique({ where: { id: req.params.id } });
    if (!batch) return res.status(404).json({ success: false, message: 'Harvest not found' });

    if (batch.status !== 'Listed' && batch.quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Cannot list a batch with 0kg available' });
    }

    const updatedBatch = await prisma.farmerBatch.update({
      where: { id: req.params.id },
      data: {
        status: batch.status === 'Listed' ? 'Unlisted' : 'Listed'
      }
    });

    return res.json({ success: true, data: updatedBatch });
  } catch (err) {
    console.error('PUT /farmer/harvests/:id/list error:', err);
    return next(err);
  }
});

// DELETE /api/v1/farmer/harvests/:id — Delete a harvest
router.delete('/harvests/:id', async (req, res, next) => {
  try {
    await prisma.farmerBatch.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Harvest deleted' });
  } catch (err) {
    console.error('DELETE /farmer/harvests/:id error:', err);
    return next(err);
  }
});

// ============================================================
// PURCHASE ORDERS (received from Processors)
// ============================================================

// GET /api/v1/farmer/purchase-orders?userId= — All orders for a farmer
router.get('/purchase-orders', async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const isId = userId.startsWith('cuid') || userId.length > 20;
    
    const orders = await prisma.purchaseOrder.findMany({
      where: {
        OR: [
          isId ? { sellerId: userId } : { sellerRoleId: userId }
        ],
        sellerRole: 'FARMER'
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, data: orders });
  } catch (err) {
    console.error('GET /farmer/purchase-orders error:', err);
    return next(err);
  }
});


// PUT /api/v1/farmer/purchase-orders/:id/accept
router.put('/purchase-orders/:id/accept', async (req, res, next) => {
  try {
    const order = await prisma.purchaseOrder.update({
      where: { orderNumber: req.params.id },
      data: {
        deliveryStatus: 'ACCEPTED',
        escrowStatus: 'LOCKED'
      }
    });

    if (order.batchId) {
      const batch = await prisma.farmerBatch.findUnique({ where: { id: order.batchId } });
      if (batch && batch.quantity <= 0) {
        await prisma.farmerBatch.update({
          where: { id: order.batchId },
          data: { status: 'Sold' }
        });
      }
    }

    return res.json({ success: true, data: order });
  } catch (err) {
    console.error('PUT /farmer/purchase-orders/:id/accept error:', err);
    return next(err);
  }
});

// PUT /api/v1/farmer/purchase-orders/:id/reject
router.put('/purchase-orders/:id/reject', async (req, res, next) => {
  try {
    const { reason } = req.body;
    let order = await prisma.purchaseOrder.findUnique({ where: { orderNumber: req.params.id } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

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
      } catch (rzpErr) {
        console.error('Razorpay refund error:', rzpErr);
      }
    }

    order = await prisma.purchaseOrder.update({
      where: { orderNumber: req.params.id },
      data: {
        deliveryStatus: 'REJECTED',
        escrowStatus: 'RELEASED',
        rejectionReason: reason || 'No reason provided',
        razorpayRefundId: refundId
      }
    });

    if (order.buyerId) {
      await prisma.transaction.create({
        data: {
          transactionId: refundId || `ref_${Date.now()}`,
          userId: order.buyerId,
          orderId: order.orderNumber,
          amount: order.totalAmount,
          type: 'CREDIT',
          status: 'COMPLETED',
          description: `Refund (Order Rejected)`
        }
      });
    }

    // RESTOCK LOGIC
    if (order.batchId) {
      const batch = await prisma.farmerBatch.findUnique({ where: { id: order.batchId } });
      if (batch) {
        await prisma.farmerBatch.update({
          where: { id: order.batchId },
          data: {
            quantity: batch.quantity + order.quantityKg,
            status: (batch.status === 'Sold' || batch.status === 'Archived') ? 'Listed' : batch.status
          }
        });
      }
    }

    return res.json({ success: true, data: order });
  } catch (err) {
    return next(err);
  }
});

// PUT /api/v1/farmer/purchase-orders/:id/dispatch
router.put('/purchase-orders/:id/dispatch', async (req, res, next) => {
  try {
    const order = await prisma.purchaseOrder.update({
      where: { orderNumber: req.params.id },
      data: {
        deliveryStatus: 'DISPATCHED',
        dispatchedAt: new Date()
      }
    });

    // Mark the batch as Sold if fully dispatched
    if (order.batchId) {
      await prisma.farmerBatch.update({
        where: { id: order.batchId },
        data: {
          status: 'Sold',
          soldTo: order.buyerName,
          soldDate: new Date()
        }
      });
    }

    return res.json({ success: true, data: order });
  } catch (err) {
    return next(err);
  }
});

// ============================================================
// SHIPMENTS
// ============================================================

// GET /api/v1/farmer/shipments/outgoing?userId= — To Processors
router.get('/shipments/outgoing', async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const isId = userId.startsWith('cuid') || userId.length > 20;

    const shipments = await prisma.purchaseOrder.findMany({
      where: {
        OR: [
          isId ? { sellerId: userId } : { sellerRoleId: userId }
        ],
        sellerRole: 'FARMER',
        deliveryStatus: { in: ['DISPATCHED', 'DELIVERED', 'REJECTED'] }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return res.json({ success: true, data: shipments });
  } catch (err) {
    return next(err);
  }
});

// ============================================================
// REPORTS
// ============================================================

// GET /api/v1/farmer/reports?userId=&timeframe=
router.get('/reports', async (req, res, next) => {
  try {
    const { userId, timeframe } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const { getRoleAnalytics } = require('../utils/analytics');
    const data = await getRoleAnalytics(userId, 'FARMER', timeframe || 'MONTHLY');
    
    return res.json({ success: true, data });
  } catch (err) {
    console.error('GET /farmer/reports error:', err);
    return next(err);
  }
});

module.exports = router;
