const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const prisma = require('../utils/prisma');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

let razorpayInstance = null;
if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
  try {
    razorpayInstance = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
  } catch (err) {
    console.error('Razorpay SDK initialization error:', err.message);
  }
} else {
  console.warn('Razorpay keys are missing from environment variables.');
}

// POST /api/payments/create-order
router.post('/create-order', async (req, res, next) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    if (!razorpayInstance) {
      return next(err);
    }

    const amountInPaisa = Math.round(parseFloat(amount) * 100);

    const options = {
      amount: amountInPaisa,
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpayInstance.orders.create(options);
    return res.json({
      success: true,
      id: order.id,
      orderId: order.id,
      key: RAZORPAY_KEY_ID,
      keyId: RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error('Create Razorpay Order Error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to create Razorpay order',
    });
  }
});

// POST /api/payments/verify
router.post('/verify', async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpayOrderId,
      razorpay_payment_id,
      razorpayPaymentId,
      razorpay_signature,
      razorpaySignature,
      buyerId,
      buyerRole,
      amount,
    } = req.body;

    const orderId = razorpay_order_id || razorpayOrderId;
    const paymentId = razorpay_payment_id || razorpayPaymentId;
    const signature = razorpay_signature || razorpaySignature;

    if (!paymentId || !orderId || !signature) {
      return res.status(400).json({ success: false, message: 'Incomplete payment verification data' });
    }

    if (!RAZORPAY_KEY_SECRET) {
       return next(err);
    }

    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Preserve the mock orderNumber structure for frontend compatibility since orders.js handles the actual DB insertion
    const orderNumber = `ORD-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    return res.json({
      success: true,
      message: 'Payment verified and Escrow Locked',
      orderNumber,
      orderId: orderNumber,
      paymentId: paymentId,
      paymentStatus: 'PAID & ESCROW LOCKED',
      amount: amount || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Verify Razorpay Payment Error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Payment verification failed',
    });
  }
});

module.exports = router;
