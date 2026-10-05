import { fetchApi } from "../api";

export const shipmentService = {
  async getActiveShipments(sellerOrBuyerId: string) {
    const orders = await fetchApi("/orders");
    return orders.filter(
      (o: any) =>
        (o.sellerId === sellerOrBuyerId || o.buyerId === sellerOrBuyerId) &&
        (o.orderStatus === "ACCEPTED" || o.deliveryStatus === "SHIPPED")
    );
  },
};
