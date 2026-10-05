import { fetchApi } from "../api";

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const paymentService = {
  async createRazorpayOrder(amount: number) {
    return fetchApi("/payments/create-order", {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  },

  async verifyPayment(verificationData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    buyerId: string;
    buyerRole: string;
    amount: number;
    items: any[];
  }) {
    return fetchApi("/payments/verify", {
      method: "POST",
      body: JSON.stringify(verificationData),
    });
  },

  async openRazorpayCheckout({
    amount,
    user,
    items,
    onSuccess,
    onError,
  }: {
    amount: number;
    user: any;
    items: any[];
    onSuccess: (data: any) => void;
    onError: (err: any) => void;
  }) {
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
      }

      const orderData = await this.createRazorpayOrder(amount);
      if (!orderData.success || !orderData.id) {
        throw new Error("Failed to initialize Razorpay checkout order.");
      }

      const options = {
        key: orderData.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TAwi9UQj2Q7wP5",
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Seed2Shelf Escrow Payment",
        description: "Agri-Supply Chain Automated Escrow Protocol",
        order_id: orderData.id,
        handler: async (response: any) => {
          try {
            const verifyResult = await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              buyerId: user?.farmerId || user?.processorId || user?.distributorId || user?.retailerId || user?.id || "GUEST_BUYER",
              buyerRole: user?.role || "BUYER",
              amount,
              items,
            });
            onSuccess(verifyResult);
          } catch (err) {
            onError(err);
          }
        },
        prefill: {
          name: user?.name || "Agri Buyer",
          email: user?.email || "buyer@seed2shelf.com",
          contact: user?.mobileNumber || "9999999999",
        },
        theme: {
          color: "#00d26a",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        onError(response.error);
      });
      rzp.open();
    } catch (err) {
      onError(err);
    }
  },
};
