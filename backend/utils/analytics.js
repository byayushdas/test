const PurchaseOrder = require('../models/PurchaseOrder');

const getTimeframeFilter = (timeframe) => {
  const now = new Date();
  let startDate = new Date();
  if (timeframe === 'WEEKLY') {
    startDate.setDate(now.getDate() - 7);
  } else if (timeframe === 'MONTHLY') {
    startDate.setMonth(now.getMonth() - 1);
  } else if (timeframe === 'YEARLY') {
    startDate.setFullYear(now.getFullYear() - 1);
  } else {
    // Default to a wide range if not recognized
    startDate.setFullYear(2000);
  }
  return { $gte: startDate };
};

const getRoleAnalytics = async (userId, role, timeframe) => {
  const dateFilter = getTimeframeFilter(timeframe);

  // We look at orders where the user is the SELLER (meaning they sold/moved items)
  // For distributors, they could be buying from processor and selling to retailer. We track what they sold.
  // Exception: Retailers don't sell to anyone on this platform, they buy from Distributors.
  // So for RETAILER, we look at their purchases (buyerId).
  
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
  let orders = [];
  if (role === 'RETAILER') {
    orders = await PurchaseOrder.find({
      ...(isObjectId ? { buyerId: userId } : { buyerRoleId: userId }),
      buyerRole: role,
      updatedAt: dateFilter
    });
  } else {
    orders = await PurchaseOrder.find({
      ...(isObjectId ? { sellerId: userId } : { sellerRoleId: userId }),
      sellerRole: role,
      updatedAt: dateFilter
    });
  }

  let produceMoved = 0;
  let totalRevenue = 0;
  let escrowLocked = 0;
  let disputes = 0;
  let successfulShipments = 0;

  const itemMap = {};

  orders.forEach(order => {
    // For RETAILER, totalRevenue means total money spent. For others, it means money earned.
    
    // Revenue is only for delivered/released escrow, or whatever logic we want.
    // Let's say total revenue includes DISPATCHED/DELIVERED (where escrow is LOCKED or RELEASED)
    if (order.deliveryStatus === 'DELIVERED' || order.escrowStatus === 'RELEASED') {
      totalRevenue += order.totalAmount || 0;
      produceMoved += order.quantityKg || 0;
      successfulShipments++;
    } else if (order.escrowStatus === 'LOCKED' || order.deliveryStatus === 'DISPATCHED' || order.deliveryStatus === 'ACCEPTED') {
      escrowLocked += order.totalAmount || 0;
      produceMoved += order.quantityKg || 0;
    }

    if (order.deliveryStatus === 'REJECTED') {
      disputes++;
    }

    // Breakdown
    if (order.deliveryStatus === 'DELIVERED' || order.escrowStatus === 'RELEASED' || order.escrowStatus === 'LOCKED' || order.deliveryStatus === 'DISPATCHED' || order.deliveryStatus === 'ACCEPTED') {
      if (!itemMap[order.cropName]) {
        itemMap[order.cropName] = { quantity: 0, revenue: 0 };
      }
      itemMap[order.cropName].quantity += order.quantityKg || 0;
      itemMap[order.cropName].revenue += order.totalAmount || 0;
    }
  });

  const disputeRate = orders.length > 0 ? ((disputes / orders.length) * 100).toFixed(1) : "0.0";

  let totalMappedRevenue = 0;
  Object.values(itemMap).forEach(v => totalMappedRevenue += v.revenue);

  const breakdown = Object.keys(itemMap).map(name => {
    const data = itemMap[name];
    const percentage = totalMappedRevenue > 0 ? ((data.revenue / totalMappedRevenue) * 100).toFixed(1) : "0.0";
    return {
      name,
      quantity: `${data.quantity} kg`,
      revenue: `₹ ${data.revenue.toLocaleString('en-IN')}`,
      percentage
    };
  });

  // Sort breakdown by revenue descending
  breakdown.sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));

  return {
    produceSold: `${produceMoved} kg`,
    produceTransformed: `${produceMoved} kg`,
    totalRevenue: `₹ ${totalRevenue.toLocaleString('en-IN')}`,
    escrowLocked: `₹ ${escrowLocked.toLocaleString('en-IN')}`,
    disputeRate: `${disputeRate}%`,
    successfulShipments,
    totalOrders: orders.length,
    cropBreakdown: breakdown,
    productBreakdown: breakdown
  };
};

module.exports = { getRoleAnalytics };
