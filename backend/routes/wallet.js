const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const PurchaseOrder = require('../models/PurchaseOrder');
const Razorpay = require('razorpay');

// GET /api/v1/wallet/transactions?userId=
router.get('/transactions', async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });



    const txs = await Transaction.find({ userId }).sort({ timestamp: -1 }).lean();
    
    // Batch fetch all related Purchase Orders in one query to prevent N+1 problem
    const orderIds = [...new Set(txs.map(tx => tx.orderId).filter(Boolean))];
    const orders = await PurchaseOrder.find({ orderNumber: { $in: orderIds } }).lean();
    const orderMap = {};
    orders.forEach(o => { orderMap[o.orderNumber] = o; });

    // Enrich with Razorpay Data locally without slow external API calls
    for (let i = 0; i < txs.length; i++) {
      let tx = txs[i];
      tx.razorpayData = null;
      if (tx.orderId && orderMap[tx.orderId]) {
        const order = orderMap[tx.orderId];
        
        // Construct the Razorpay payload structure expected by the frontend
        // using data already available in the DB to avoid network delays.
        const created_at = Math.floor(new Date(order.createdAt).getTime() / 1000);
        
        if (tx.type === 'CREDIT' && tx.transactionId.startsWith('ref_')) {
             if (order.razorpayRefundId) {
               tx.razorpayData = {
                 id: order.razorpayRefundId,
                 method: 'upi', // Default or could be stored in DB
                 status: 'processed',
                 created_at: created_at
               };
             }
        } else if (order.razorpayPaymentId) {
             tx.razorpayData = {
               id: order.razorpayPaymentId,
               method: 'upi', // Default or could be stored in DB
               status: 'captured',
               created_at: created_at
             };
        }
      }
    }
    
    return res.json({ success: true, data: txs });
  } catch (err) {
    console.error('Fetch transactions error:', err);
    return handleDbError(err, res);
  }
});

module.exports = router;
