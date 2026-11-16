import { CartItem, FarmerHarvestItem } from "@/types/processor";

let cartState: CartItem[] = [];
let listeners: (() => void)[] = [];

function notify() {
  listeners.forEach(l => l());
}

export const cartService = {
  getCartItems(): CartItem[] {
    return cartState;
  },

  addToCart(harvestItem: FarmerHarvestItem, qty: number = 100) {
    const existing = cartState.find(item => item.harvestItem.id === harvestItem.id);
    const maxAvailable = harvestItem.quantity || 100000;
    if (existing) {
      existing.selectedQuantity = Math.min(maxAvailable, existing.selectedQuantity + qty);
    } else {
      cartState.push({
        harvestItem,
        selectedQuantity: Math.min(maxAvailable, qty)
      });
    }
    notify();
  },

  updateQuantity(harvestItemId: string, newQty: number) {
    const item = cartState.find(i => i.harvestItem.id === harvestItemId);
    if (item) {
      const maxAvailable = item.harvestItem.quantity || 100000;
      item.selectedQuantity = Math.min(maxAvailable, Math.max(1, newQty));
      notify();
    }
  },

  removeFromCart(harvestItemId: string) {
    cartState = cartState.filter(i => i.harvestItem.id !== harvestItemId);
    notify();
  },

  clearCart() {
    cartState = [];
    notify();
  },

  getCartTotals() {
    const subtotal = cartState.reduce((sum, item) => {
      return sum + (item.harvestItem.pricePerUnit * item.selectedQuantity);
    }, 0);
    const tax = Math.round(subtotal * 0.05); // 5% GST
    const platformFee = Math.round(subtotal * 0.02); // 2% Platform Fee
    const total = subtotal + tax + platformFee;
    return { subtotal, tax, platformFee, total, itemCount: cartState.length };
  },

  subscribe(listener: () => void) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }
};
