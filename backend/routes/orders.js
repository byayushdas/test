const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PurchaseOrder = require('../models/PurchaseOrder');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const FarmerBatch = require('../models/Farmer');
const ProcessorBatch = require('../models/Processor');
const DistributorBatch = require('../models/Distributor');
const User = require('../models/User');

// Central checkout route: Deduct inventory, create POs, Transactions, and Notifications
router.post('/checkout', async (req, res) => {
  console.log('--- /api/v1/orders/checkout CALLED ---');
  console.log('req.body:', req.body);
  try {
    const { buyerId, buyerRole, items, paymentId, totalAmount } = req.body;

    if (!buyerId || !buyerRole || !items || !items.length) {
      console.log('Missing checkout data');
      return res.status(400).json({ success: false, message: 'Missing checkout data' });
    }

    const buyer = await User.findById(buyerId);
    if (!buyer) return res.status(404).json({ success: false, message: 'Buyer not found' });

    const orderNumbers = [];



    for (const item of items) {
      // Determine which collection to deduct from based on buyerRole/sellerRole
      // Farmer -> Processor -> Distributor -> Retailer
      let sellerModel;
      let sellerRole;
      if (buyerRole === 'PROCESSOR') { sellerModel = FarmerBatch; sellerRole = 'FARMER'; }
      else if (buyerRole === 'DISTRIBUTOR') { sellerModel = ProcessorBatch; sellerRole = 'PROCESSOR'; }
      else if (buyerRole === 'RETAILER') { sellerModel = DistributorBatch; sellerRole = 'DISTRIBUTOR'; }
      else {
        // Fallback or generic logic
        sellerModel = FarmerBatch; sellerRole = 'FARMER';
      }

      // Handle nested CartItem structure or flat item structure
      const targetBatchId = item.batchId || item.id || (item.harvestItem && (item.harvestItem.id || item.harvestItem.batchId));
      const qty = parseFloat(item.quantity || item.selectedQuantity);

      if (!targetBatchId) {
        console.warn('Skipping item missing batch ID:', item);
        continue;
      }

      const batch = await sellerModel.findById(targetBatchId);
      if (!batch) {
        console.warn(`Skipping item, batch not found for ID: ${targetBatchId}`);
        continue; // Skip if batch not found
      }

      // Deduct quantity
      batch.quantity -= qty;
      
      // If empty, set status to Unlisted so it hides from marketplace but stays in active inventory until accepted
      if (batch.quantity <= 0) {
        batch.quantity = 0;
        batch.status = 'Unlisted';
      }
      await batch.save();

      // Seller info extraction
      let sellerId;
      if (sellerRole === 'FARMER') sellerId = batch.farmerId;
      else if (sellerRole === 'PROCESSOR') sellerId = batch.processorId;
      else if (sellerRole === 'DISTRIBUTOR') sellerId = batch.distributorId;

      const seller = await User.findById(sellerId);

      // Create Purchase Order
      const order = new PurchaseOrder({
        buyerRole,
        buyerId,
        buyerName: buyer.name,
        buyerRoleId: buyer.roleId,
        sellerRole,
        sellerId,
        sellerName: seller ? seller.name : 'Unknown Seller',
        sellerRoleId: seller ? seller.roleId : '',
        batchId: batch._id,
        cropName: batch.cropName || batch.productName,
        quantityKg: qty,
        pricePerUnit: batch.pricePerKg || batch.pricePerUnit,
        totalAmount: qty * (batch.pricePerKg || batch.pricePerUnit),
        deliveryStatus: 'PENDING_SELLER_ACCEPTANCE',
        escrowStatus: 'LOCKED',
        razorpayPaymentId: paymentId
      });
      await order.save();
      orderNumbers.push(order.orderNumber);

      // Create Seller Escrow Hold Transaction
      const creditTx = new Transaction({
        userId: sellerId,
        transactionId: `escrow_${order.orderNumber}`,
        orderId: order.orderNumber,
        amount: order.totalAmount,
        type: 'ESCROW_HOLD',
        status: 'PENDING',
        description: `Escrow Hold for Order ${order.orderNumber}`
      });
      await creditTx.save();

      // Create Buyer Debit Hold Transaction
      const buyerTx = new Transaction({
        userId: buyerId,
        transactionId: paymentId ? `${paymentId}_${order.orderNumber}` : `pay_${Date.now()}_${order.orderNumber}`,
        orderId: order.orderNumber,
        amount: order.totalAmount,
        type: 'DEBIT_HOLD',
        status: 'PENDING',
        description: `Marketplace Purchase Hold for Order ${order.orderNumber}`
      });
      await buyerTx.save();

      // Create Notification for Seller
      const notif = new Notification({
        userId: sellerId,
        title: 'New Crop Order Request',
        message: `You have received a new order (${order.orderNumber}) for ${qty}kg of ${order.cropName}.`,
        type: 'ORDER_REQUEST'
      });
      await notif.save();
    }

    return res.json({ success: true, message: 'Checkout completed successfully', orderNumbers });
  } catch (err) {
    console.error('Checkout error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get orders for a user (either as buyer or seller)
router.get('/', async (req, res) => {
  try {
    const { userId, role } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    // Find orders where user is either buyer or seller
    const orders = await PurchaseOrder.find({
      $or: [ { buyerId: userId }, { sellerId: userId } ]
    }).sort({ createdAt: -1 });

    return res.json({ success: true, data: orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update order status (Accept, Dispatch, Deliver)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.deliveryStatus = status;

    if (status === 'DISPATCHED') {
      order.dispatchedAt = new Date();
    } else if (status === 'DELIVERED') {
      order.deliveredAt = new Date();
      order.escrowStatus = 'RELEASED';

      // Release Escrow -> Credit Seller
      const tx = await Transaction.findOne({ orderId: order.orderNumber, type: 'ESCROW_HOLD' });
      if (tx) {
        tx.status = 'COMPLETED';
        tx.type = 'CREDIT';
        tx.description = `Payment Released for Order ${order.orderNumber}`;
        await tx.save();
      }

      // Update Buyer Debit Hold
      const buyerTx = await Transaction.findOne({ orderId: order.orderNumber, type: 'DEBIT_HOLD' });
      if (buyerTx) {
        buyerTx.status = 'COMPLETED';
        buyerTx.type = order.sellerRole === 'FARMER' ? 'FARMER_PAYMENT' : 'DEBIT';
        buyerTx.description = `Marketplace Purchase Completed for Order ${order.orderNumber}`;
        await buyerTx.save();
      }

      // Automatically Mint Inventory for Buyer
      if (order.buyerRole === 'PROCESSOR') {
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
      }
      // NOTE: DISTRIBUTOR inventory is NOT minted here.
      // It is minted only when the Distributor explicitly accepts delivery
      // via PUT /api/v1/distributor/shipments/:orderId/receive
    }

    await order.save();

    // Send Notification to counterparty
    const targetUserId = status === 'DELIVERED' ? order.sellerId : order.buyerId;
    const notifMsg = status === 'ACCEPTED' ? `Your order ${order.orderNumber} was accepted.` 
                   : status === 'DISPATCHED' ? `Your order ${order.orderNumber} has been dispatched.`
                   : `Your order ${order.orderNumber} has been marked as delivered and payment released.`;
                   
    await Notification.create({
      userId: targetUserId,
      title: 'Order Status Update',
      message: notifMsg,
      type: 'ORDER_UPDATE'
    });

    return res.json({ success: true, data: order });
  } catch (err) {
    console.error('Update order status error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
