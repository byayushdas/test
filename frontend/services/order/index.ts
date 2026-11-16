import { fetchApi } from "../api";

export const orderService = {
  async getAllOrders() {
    return fetchApi("/orders");
  },

  async getOrdersForUser(userId: string) {
    const [orders, users, products] = await Promise.all([
      fetchApi("/orders"),
      fetchApi("/users"),
      fetchApi("/products"),
    ]);

    return orders
      .filter((o: any) => o.sellerId === userId || o.buyerId === userId)
      .map((o: any) => {
        const buyer = users.find(
          (u: any) => u.farmerId === o.buyerId || u.processorId === o.buyerId || u.id === o.buyerId
        );
        const seller = users.find(
          (u: any) => u.farmerId === o.sellerId || u.processorId === o.sellerId || u.id === o.sellerId
        );
        const prod = products.find((p: any) => p._id === o.productId || p.batchId === o.batchId);

        return {
          id: o._id,
          orderId: o.orderId,
          buyerId: o.buyerId,
          buyerName: buyer ? buyer.name : "Buyer",
          sellerId: o.sellerId,
          sellerName: seller ? seller.name : "Seller",
          cropName: prod ? prod.cropName : "Crop Batch",
          batchId: o.batchId,
          quantity: o.quantityPurchased,
          amount: o.amount,
          orderStatus: o.orderStatus,
          paymentStatus: o.paymentStatus,
          deliveryStatus: o.deliveryStatus,
        };
      });
  },

  async acceptOrder(orderId: string) {
    return fetchApi(`/orders/${orderId}/accept`, {
      method: "PUT",
    });
  },

  async shipOrder(orderId: string) {
    return fetchApi(`/orders/${orderId}/ship`, {
      method: "PUT",
    });
  },

  async confirmDelivery(orderId: string) {
    return fetchApi(`/orders/${orderId}/confirm-delivery`, {
      method: "PUT",
    });
  },
};
