import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  ShoppingCart,
  Trash2,
  Edit3,
  Save,
  X,
  Plus,
  Minus,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Building2,
  Lock,
  MapPin,
  Calendar,
  ShieldCheck,
  FileText,
  ChevronRight
} from "lucide-react";
import { cartService } from "@/services/processor/cartService";
import { marketplaceService } from "@/services/processor/marketplaceService";
import { loadRazorpayScript } from "@/services/payment";
import { CartItem } from "@/types/processor";

const DEFAULT_SAVED_ADDRESSES = [
  {
    id: "saved-1",
    storeName: "Central Retail Store #1",
    contactPerson: "Logistics Director",
    contactPhone: "+91 98765 43210",
    streetAddress: "Plot 42, Industrial Development Zone",
    cityState: "Nagpur, Maharashtra - 440001",
    isDefault: true
  },
  {
    id: "saved-2",
    storeName: "East Zone Milling & Refinements Hub",
    contactPerson: "Warehouse Operations Lead",
    contactPhone: "+91 98123 76543",
    streetAddress: "Sector 5, Agritech Processing Park",
    cityState: "Bhubaneshwar, Odisha - 751024",
    isDefault: false
  }
];

export default function RetailerCartPage() {
  const { data: session } = useSession();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totals, setTotals] = useState({ subtotal: 0, tax: 0, platformFee: 0, total: 0, itemCount: 0 });
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);

  // Saved Addresses & Form State
  const [savedAddresses, setSavedAddresses] = useState(DEFAULT_SAVED_ADDRESSES);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("saved-1");
  const [saveForFuture, setSaveForFuture] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAddressSaved, setIsAddressSaved] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("razorpay");

  const [storeName, setFactoryName] = useState("Central Retail Store #1");
  const [contactPerson, setContactPerson] = useState("Logistics Director");
  const [contactPhone, setContactPhone] = useState("+91 98765 43210");
  const [streetAddress, setStreetAddress] = useState("Plot 42, Industrial Development Zone");
  const [cityState, setCityState] = useState("Nagpur, Maharashtra - 440001");
  const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7); const defaultDate = nextWeek.toISOString().slice(0,10);
  const [deliveryDate, setDeliveryDate] = useState(defaultDate);

  // Saved Snapshot for Confirmation Step
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderId: string;
    razorpayPaymentId?: string;
    items: CartItem[];
    totals: { subtotal: number; tax: number; platformFee: number; total: number };
    storeName: string;
    streetAddress: string;
    cityState: string;
    contactPerson: string;
    contactPhone: string;
  } | null>(null);

  const refreshCart = () => {
    setCartItems([...cartService.getCartItems()]);
    setTotals(cartService.getCartTotals());
  };

  useEffect(() => {
    refreshCart();
    const unsubscribe = cartService.subscribe(() => {
      refreshCart();
    });
    return unsubscribe;
  }, []);

  const handleSelectSavedAddress = (addr: typeof DEFAULT_SAVED_ADDRESSES[0]) => {
    setSelectedAddressId(addr.id);
    setFactoryName(addr.storeName);
    setContactPerson(addr.contactPerson);
    setContactPhone(addr.contactPhone);
    setStreetAddress(addr.streetAddress);
    setCityState(addr.cityState);
    setIsAddressSaved(false);
  };

  const handleAddNewAddressOption = () => {
    setSelectedAddressId("custom");
    setFactoryName("");
    setContactPerson("");
    setContactPhone("");
    setStreetAddress("");
    setCityState("");
    setIsAddressSaved(false);
  };

  const handleDeleteAddress = (idToDelete: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = savedAddresses.filter(a => a.id !== idToDelete);
    setSavedAddresses(updated);
    if (selectedAddressId === idToDelete) {
      if (updated.length > 0) {
        handleSelectSavedAddress(updated[0]);
      } else {
        handleAddNewAddressOption();
      }
    }
  };

  const handleUpdateSavedAddress = () => {
    if (selectedAddressId === "custom") return;
    const updated = savedAddresses.map(addr => {
      if (addr.id === selectedAddressId) {
        return {
          ...addr,
          storeName,
          contactPerson,
          contactPhone,
          streetAddress,
          cityState
        };
      }
      return addr;
    });
    setSavedAddresses(updated);
    setIsAddressSaved(true);
  };

  const handleUpdateQty = (harvestItemId: string, delta: number, currentQty: number) => {
    cartService.updateQuantity(harvestItemId, currentQty + delta);
  };

  const handleRemove = (harvestItemId: string) => {
    cartService.removeFromCart(harvestItemId);
  };

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAddressId === "custom" && saveForFuture && storeName) {
      const newAddr = {
        id: `saved-${Date.now()}`,
        storeName,
        contactPerson,
        contactPhone,
        streetAddress,
        cityState,
        isDefault: false
      };
      setSavedAddresses([...savedAddresses, newAddr]);
      setSelectedAddressId(newAddr.id);
    }
    setCheckoutStep(2);
  };

  const handleFinalizeOrder = async () => {
    if (cartItems.length === 0) return;
    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      // 1. Ensure Razorpay Checkout SDK script is loaded
      await loadRazorpayScript();

      // 2. Call Backend /payment/initiate API
      const initiationResponse = await marketplaceService.initiateRazorpayPaymentApi(
        selectedAddressId || "saved-1",
        totals.total
      );

      const paymentData = initiationResponse.data || initiationResponse;
      const razorpayKey = paymentData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TAwi9UQj2Q7wP5";
      const razorpayOrderId = paymentData.orderId || `order_RET_${Date.now()}`;

      // 3. Open official Razorpay Checkout SDK popup
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        const options: any = {
          key: razorpayKey,
          amount: (totals.total * 100).toString(),
          currency: "INR",
          name: "Seed2Shelf B2B Marketplace",
          description: "Raw Crop Procurement & Escrow Deposit",
          handler: async function (response: any) {
            try {
              // 4. Call Backend /payment/verify API
              const verifyRes = await marketplaceService.verifyRazorpayPaymentApi({
                razorpayPaymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
                razorpayOrderId: response.razorpay_order_id || razorpayOrderId,
                razorpaySignature: response.razorpay_signature || `mock_sig_${Date.now()}`,
                factoryId: selectedAddressId || "saved-1",
              });

              const confirmedData = verifyRes.data || verifyRes;

              // 5. Call Checkout API to deduct inventory, create POs & Transactions
              const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";
              const checkoutRes = await fetch(`${BACKEND_URL}/api/v1/orders/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  buyerId: (session?.user as any)?.id,
                  buyerRole: "RETAILER",
                  items: cartItems,
                  paymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
                  totalAmount: totals.total
                })
              });
              const checkoutData = await checkoutRes.json();
              if (!checkoutData.success) {
                console.warn("Checkout API warning:", checkoutData.message);
                throw new Error(checkoutData.message || "Failed to process order on backend");
              }

              const orderId = (checkoutData.orderNumbers && checkoutData.orderNumbers[0]) || confirmedData.orderNumber || confirmedData.orderReferenceId || `ORD-2026-${Math.floor(10000 + Math.random() * 90000)}`;

              setConfirmedOrder({
                orderId,
                razorpayPaymentId: response.razorpay_payment_id || confirmedData.paymentId || `pay_test_${Date.now()}`,
                items: [...cartItems],
                totals: { ...totals },
                storeName,
                streetAddress,
                cityState,
                contactPerson,
                contactPhone,
              });

              cartService.clearCart();
              setIsProcessingPayment(false);
              setCheckoutStep(3);
            } catch (err: any) {
              setIsProcessingPayment(false);
              setPaymentError(err.message || "Payment verification failed");
            }
          },
          prefill: {
            name: session?.user?.name || contactPerson || "Store Manager",
            email: session?.user?.email || "retailer@seed2shelf.com",
            contact: contactPhone || "+91 98765 43210",
          },
          theme: {
            color: "#059669",
          },
          modal: {
            ondismiss: function () {
              setIsProcessingPayment(false);
            },
          },
        };

        if (razorpayOrderId && razorpayOrderId.startsWith("order_") && razorpayOrderId.length === 20) {
          options.order_id = razorpayOrderId;
        }

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        throw new Error("Razorpay SDK failed to load. Please refresh the page and try again.");
      }
    } catch (error: any) {
      setIsProcessingPayment(false);
      setPaymentError(error.message || "Failed to initiate payment");
    }
  };

  return (
    <div className="min-h-screen text-[#283025] font-sans pb-24 pt-6 px-4 sm:px-6 lg:px-8 relative z-20">
      <Head>
        <title>Checkout & Order Placement | Retailer Portal</title>
        <meta name="description" content="Review raw crop purchases and place B2B orders with farmers" />
      </Head>

      {/* TOAST POPUP NOTIFICATION (BOTTOM RIGHT POSITIONED) */}


      {/* Solid Dark Background Overlay */}

      <div className="max-w-5xl mx-auto space-y-7">
        
        {/* =========================================================================
            HEADER & NAVIGATION
           ========================================================================= */}
        <div className="flex items-center justify-between border-y border-[#CCD5AE] py-3.5">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-[#7BA05B]/10 border border-[#7BA05B]/20 rounded-[20px] text-[#58664C] shrink-0">
              <ShoppingCart className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#283025] tracking-tight">
                Shopping Cart & Checkout
              </h1>
            </div>
          </div>

          <Link
            href="/retailer/retailerHub/marketplace"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-[#FEFAE0] hover:bg-[#FAEDCD] border border-[#CCD5AE] text-xs font-semibold text-[#69705E] hover:text-[#283025] transition"
          >
            <ArrowLeft className="h-4 w-4" /> Continue Shopping
          </Link>
        </div>

        {/* =========================================================================
            3-STEP PROGRESS STEPPER (WITHOUT NUMBERS)
           ========================================================================= */}
        {cartItems.length > 0 || checkoutStep === 3 ? (
          <div className="bg-[#FEFAE0]/90 border border-[#CCD5AE]/90 py-4 px-6 rounded-[24px] max-w-3xl mx-auto flex items-center justify-between shadow-lg">
            {[
              { step: 1, label: "Store Address", icon: MapPin },
              { step: 2, label: "Payment", icon: CreditCard },
              { step: 3, label: "Confirmation", icon: CheckCircle2 }
            ].map((item, idx) => {
              const Icon = item.icon;
              const isActive = checkoutStep === item.step;
              const isPassed = checkoutStep > item.step;
              return (
                <div key={item.step} className="flex items-center flex-1 last:flex-initial">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-[20px] flex items-center justify-center font-extrabold text-xs transition-all duration-300 ${
                        isActive
                          ? "bg-[#7BA05B] text-[#FFFCF5] shadow-lg shadow-[#7BA05B]/20 scale-105"
                          : isPassed
                          ? "bg-[#7BA05B]/20 text-[#58664C] border border-[#7BA05B]/30"
                          : "bg-[#FAEDCD] text-[#69705E] border border-[#CCD5AE]"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span
                      className={`text-xs font-extrabold uppercase tracking-wider hidden md:inline ${
                        isActive ? "text-[#58664C]" : isPassed ? "text-[#69705E]" : "text-[#69705E]"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  {idx < 2 && (
                    <div
                      className={`h-[1px] flex-grow mx-4 transition-all duration-500 ${
                        isPassed ? "bg-emerald-500" : "bg-[#FAEDCD]"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : null}

        {/* =========================================================================
            EMPTY CART STATE
           ========================================================================= */}
        {cartItems.length === 0 && checkoutStep !== 3 ? (
          <div className="bg-[#FEFAE0]/90 border border-[#CCD5AE] rounded-[24px] p-12 text-center space-y-4">
            <ShoppingCart className="h-12 w-12 text-[#69705E] mx-auto" />
            <h3 className="text-lg font-bold text-[#283025]">Your Shopping Cart is Empty</h3>
            <p className="text-[#69705E] text-xs">Browse the market place to add raw crops for processing.</p>
            <Link
              href="/retailer/retailerHub/marketplace"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[20px] bg-[#7BA05B] hover:bg-[#688A4D] text-[#1F2A1A] font-bold text-xs transition shadow-md"
            >
              Browse Marketplace
            </Link>
          </div>
        ) : null}

        {/* =========================================================================
            STEP 1: FACTORY & DELIVERY DESTINATION ADDRESS (STRAIGHT-DOWN LAYOUT)
           ========================================================================= */}
        {checkoutStep === 1 && cartItems.length > 0 && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* FACTORY ADDRESS FORM */}
            <div className="bg-[#FEFAE0]/90 border border-[#CCD5AE] rounded-[24px] p-6 space-y-5 shadow-sm">
              {/* CARD HEADER WITH LOCATION ICON & INTEGRATED SAVED ADDRESS SELECTOR */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#CCD5AE] pb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-[#283025]">Factory & Delivery Destination</h3>
                </div>

                {/* SLEEK COMPACT SAVED ADDRESS DROPDOWN */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="bg-[#FAEDCD] border border-[#CCD5AE] hover:border-[#7BA05B]/40 rounded-[12px] py-1.5 px-3 text-[11px] font-bold text-[#58664C] flex items-center justify-between gap-2 transition cursor-pointer shadow-sm max-w-[220px]"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="h-3.5 w-3.5 text-[#58664C] shrink-0" />
                      <span className="truncate">
                        {selectedAddressId === "custom"
                          ? "New Custom Address"
                          : savedAddresses.find(a => a.id === selectedAddressId)?.storeName || "Select Location"}
                      </span>
                    </div>
                    <span className="text-[9px] text-[#69705E] ml-1">▼</span>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-72 bg-[#FEFAE0] border border-[#CCD5AE] rounded-[12px] shadow-2xl z-30 overflow-hidden py-1 divide-y divide-[#CCD5AE]">
                      {savedAddresses.map((addr) => (
                        <div
                          key={addr.id}
                          onClick={() => {
                            handleSelectSavedAddress(addr);
                            setIsDropdownOpen(false);
                          }}
                          className={`px-3 py-2 flex items-center justify-between gap-2 hover:bg-[#7BA05B]/10 transition cursor-pointer text-[11px] group ${
                            selectedAddressId === addr.id ? "bg-[#7BA05B]/10 text-[#58664C] font-bold" : "text-[#283025]"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate flex-1">
                            <MapPin className="h-3 w-3 text-[#58664C] shrink-0" />
                            <div className="truncate">
                              <p className="truncate font-bold text-[#283025] text-[11px]">
                                {addr.storeName} {addr.isDefault && <span className="text-[8px] text-[#58664C] font-extrabold ml-1">(Default)</span>}
                              </p>
                              <p className="text-[9px] text-[#69705E] truncate">{addr.streetAddress}</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            title="Delete Saved Location"
                            onClick={(e) => handleDeleteAddress(addr.id, e)}
                            className="p-1 text-[#69705E] hover:text-red-400 hover:bg-red-500/10 rounded-md transition shrink-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}

                      <div
                        onClick={() => {
                          handleAddNewAddressOption();
                          setIsDropdownOpen(false);
                        }}
                        className="px-3 py-2 flex items-center gap-2 hover:bg-[#7BA05B]/10 transition cursor-pointer text-[11px] text-[#58664C] font-semibold"
                      >
                        <Plus className="h-3 w-3 text-[#58664C] shrink-0" />
                        <span>Enter New Custom Address</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* FORM FIELDS */}
              <form onSubmit={(e) => { e.preventDefault(); setCheckoutStep(2); }} className="space-y-4" autoComplete="off">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-[#69705E] font-bold uppercase tracking-wider mb-1.5">
                      Store Name *
                    </label>
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      value={storeName}
                      onChange={(e) => {
                        setFactoryName(e.target.value);
                        setIsAddressSaved(false);
                      }}
                      placeholder="e.g. Central Processing Hub"
                      className="w-full bg-[#FAEDCD] border border-[#CCD5AE] rounded-[12px] px-4 py-2.5 text-xs text-[#283025] focus:outline-none focus:border-[#7BA05B] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#69705E] font-bold uppercase tracking-wider mb-1.5">
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      value={contactPerson}
                      onChange={(e) => {
                        setContactPerson(e.target.value);
                        setIsAddressSaved(false);
                      }}
                      placeholder="e.g. Logistics Director"
                      className="w-full bg-[#FAEDCD] border border-[#CCD5AE] rounded-[12px] px-4 py-2.5 text-xs text-[#283025] focus:outline-none focus:border-[#7BA05B] transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-[#69705E] font-bold uppercase tracking-wider mb-1.5">
                      Contact Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      value={contactPhone}
                      onChange={(e) => {
                        setContactPhone(e.target.value);
                        setIsAddressSaved(false);
                      }}
                      placeholder="+91 9876543210"
                      className="w-full bg-[#FAEDCD] border border-[#CCD5AE] rounded-[12px] px-4 py-2.5 text-xs text-[#283025] focus:outline-none focus:border-[#7BA05B] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#69705E] font-bold uppercase tracking-wider mb-1.5">
                      Target Delivery Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full bg-[#FAEDCD] border border-[#CCD5AE] rounded-[12px] px-4 py-2.5 text-xs text-[#283025] focus:outline-none focus:border-[#7BA05B] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-[#69705E] font-bold uppercase tracking-wider mb-1.5">
                    Store Street Address & Landmark *
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={streetAddress}
                    onChange={(e) => {
                      setStreetAddress(e.target.value);
                      setIsAddressSaved(false);
                    }}
                    placeholder="e.g. Plot 42, Industrial Development Phase 2"
                    className="w-full bg-[#FAEDCD] border border-[#CCD5AE] rounded-[12px] px-4 py-2.5 text-xs text-[#283025] focus:outline-none focus:border-[#7BA05B] transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#69705E] font-bold uppercase tracking-wider mb-1.5">
                    City, State & Pincode *
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={cityState}
                    onChange={(e) => {
                      setCityState(e.target.value);
                      setIsAddressSaved(false);
                    }}
                    placeholder="e.g. Nagpur, Maharashtra - 440001"
                    className="w-full bg-[#FAEDCD] border border-[#CCD5AE] rounded-[12px] px-4 py-2.5 text-xs text-[#283025] focus:outline-none focus:border-[#7BA05B] transition"
                  />
                </div>

                {/* SAVED ADDRESS ACTION BANNER */}
                {selectedAddressId !== "custom" && (
                  <div className="p-3.5 rounded-[20px] bg-[#FAEDCD]/80 border border-[#CCD5AE] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mt-2 shadow-inner">
                    <div className="flex items-center gap-2 text-[#69705E] font-medium">
                      <span>Using saved store profile. Edit any field below to modify.</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleUpdateSavedAddress}
                        className={`px-3.5 py-1.5 rounded-[12px] font-extrabold text-xs transition-all cursor-pointer shadow-md flex items-center gap-1.5 ${
                          isAddressSaved
                            ? "bg-[#E2E8D8] text-[#58664C] border border-[#7BA05B]/80 shadow-[#7BA05B]/20"
                            : "bg-emerald-500 hover:bg-[#688A4D] text-black shadow-[#7BA05B]/20"
                        }`}
                      >
                        {isAddressSaved ? (
                          <>
                            <Save className="h-3.5 w-3.5 text-[#58664C]" /> Saved
                          </>
                        ) : (
                          <>
                            <Save className="h-3.5 w-3.5" /> Save Edits
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(selectedAddressId)}
                        className="px-3 py-1.5 rounded-[12px] bg-[#FEFAE0] hover:bg-red-500/20 text-[#69705E] hover:text-red-400 border border-[#CCD5AE] font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                )}

                {selectedAddressId === "custom" && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="saveAddressFuture"
                      checked={saveForFuture}
                      onChange={(e) => setSaveForFuture(e.target.checked)}
                      className="rounded accent-[#7BA05B]"
                    />
                    <label htmlFor="saveAddressFuture" className="text-xs text-[#69705E] font-medium cursor-pointer">
                      Save this store address for future orders
                    </label>
                  </div>
                )}
              </form>
            </div>

            {/* CART ITEMS REVIEW LIST */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#69705E] uppercase tracking-wider block px-1">
                Selected Crop Batches ({cartItems.length})
              </span>

              {cartItems.map((item) => {
                const itemTotal = item.harvestItem.pricePerUnit * item.selectedQuantity;
                return (
                  <div
                    key={item.harvestItem.id}
                    className="bg-[#FEFAE0]/90 border border-[#CCD5AE] rounded-[24px] p-4 flex items-center justify-between gap-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={item.harvestItem.imageUrl}
                        alt={item.harvestItem.cropName}
                        className="w-14 h-14 rounded-[20px] object-cover border border-[#CCD5AE] shrink-0"
                      />
                      <div className="space-y-0.5 text-xs">
                        <span className="text-[10px] font-mono text-[#58664C] font-bold block">
                          {item.harvestItem.batchId}
                        </span>
                        <h4 className="font-bold text-[#283025] text-sm">
                          {item.harvestItem.cropName}
                        </h4>
                        <span className="text-[11px] text-[#69705E] block font-medium">
                          Trade Batch • Verified Origin
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      {/* Quantity Selector */}
                      <div className="flex items-center gap-2 bg-[#FAEDCD] border border-[#CCD5AE] rounded-[20px] p-1 shadow-inner">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.harvestItem.id, -5, item.selectedQuantity)}
                          className="w-7 h-7 rounded-[12px] bg-[#FEFAE0] hover:bg-[#FAEDCD] text-[#69705E] hover:text-[#58664C] flex items-center justify-center transition cursor-pointer active:scale-95 shrink-0"
                        >
                          <Minus className="h-3 w-3" />
                        </button>

                        <div className="flex items-center justify-center px-1">
                          <input
                            type="number"
                            min="1"
                            max={item.harvestItem.quantity}
                            step="5"
                            value={item.selectedQuantity === 0 ? "" : item.selectedQuantity}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === "") {
                                cartService.updateQuantity(item.harvestItem.id, 0);
                              } else {
                                const val = parseInt(raw, 10);
                                if (!isNaN(val) && val >= 0) {
                                  cartService.updateQuantity(item.harvestItem.id, Math.min(item.harvestItem.quantity || 100000, val));
                                }
                              }
                            }}
                            onBlur={() => {
                              if (item.selectedQuantity <= 0) {
                                cartService.updateQuantity(item.harvestItem.id, 1);
                              }
                            }}
                            className="w-12 bg-transparent text-center text-xs font-bold text-[#283025] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-[11px] font-bold text-[#69705E] select-none ml-0.5">
                            {item.harvestItem.unit}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.harvestItem.id, 5, item.selectedQuantity)}
                          className="w-7 h-7 rounded-[12px] bg-[#7BA05B]/10 hover:bg-[#7BA05B]/20 text-[#58664C] flex items-center justify-center transition cursor-pointer active:scale-95 shrink-0"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <div>
                        <strong className="text-[#58664C] font-extrabold text-sm block">
                          ₹ {itemTotal.toLocaleString("en-IN")}
                        </strong>
                      </div>

                      <button
                        onClick={() => handleRemove(item.harvestItem.id)}
                        className="p-1.5 text-[#69705E] hover:text-red-400 transition cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* COST BREAKDOWN (INTEGRATED AT BOTTOM OF SINGLE COLUMN) */}
            <div className="bg-[#FEFAE0]/90 border border-[#CCD5AE] rounded-[24px] p-6 space-y-5 shadow-sm">
              <h3 className="text-xs font-bold text-[#69705E] uppercase tracking-wider">
                Order Financial Summary
              </h3>

              <div className="space-y-2.5 text-xs text-[#69705E]">
                <div className="flex justify-between">
                  <span>Crop Subtotal:</span>
                  <strong className="text-[#283025]">₹ {totals.subtotal.toLocaleString("en-IN")}</strong>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%):</span>
                  <strong className="text-[#283025]">₹ {totals.tax.toLocaleString("en-IN")}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee (2%):</span>
                  <strong className="text-[#283025]">₹ {(totals.platformFee || 0).toLocaleString("en-IN")}</strong>
                </div>

                <div className="pt-3 border-t border-[#CCD5AE] flex justify-between items-center text-sm font-extrabold text-[#283025]">
                  <span>Total Amount:</span>
                  <span className="text-[#58664C] text-lg">₹ {totals.total.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="pt-3 flex justify-end border-t border-[#CCD5AE]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setCheckoutStep(2);
                  }}
                  className="w-full sm:w-auto bg-[#7BA05B] hover:bg-[#688A4D] text-[#1F2A1A] font-extrabold px-8 py-3.5 rounded-[20px] text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  Proceed to Payment
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 2: PAYMENT MODE SELECTION (STRAIGHT-DOWN LAYOUT)
           ========================================================================= */}
        {checkoutStep === 2 && cartItems.length > 0 && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-[#FEFAE0]/90 border border-[#CCD5AE] rounded-[24px] p-6 space-y-5 shadow-sm">
              <div className="flex items-center gap-3 border-b border-[#CCD5AE] pb-4">
                <div className="p-2.5 bg-[#7BA05B]/10 border border-[#7BA05B]/20 rounded-[12px] text-[#58664C]">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#283025]">Choose Payment Method</h3>
                </div>
              </div>

              {/* SINGLE RAZORPAY PAYMENT MODE */}
              <div className="p-4 rounded-[20px] border border-[#7BA05B] bg-[#7BA05B]/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-[#58664C] shrink-0" />
                  <div>
                    <h4 className="font-extrabold text-sm text-[#283025]">Online Payment (Razorpay)</h4>
                    <p className="text-xs text-[#69705E]">UPI, Corporate NetBanking, Credit & Debit Cards</p>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#7BA05B] text-[#FFFCF5]">
                  Active
                </span>
              </div>

              {/* FACTORY ADDRESS PREVIEW CARD */}
              <div className="p-4 bg-[#FAEDCD] rounded-[20px] border border-[#CCD5AE] space-y-1.5">
                <span className="text-[10px] font-bold text-[#69705E] uppercase tracking-wider block">
                  Confirmed Delivery Destination
                </span>
                <div className="flex items-start gap-2 text-xs text-[#69705E]">
                  <MapPin className="h-4 w-4 text-[#58664C] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#283025] block">{storeName}</strong>
                    <p>{streetAddress}, {cityState}</p>
                    <p className="text-[#69705E] text-[11px] mt-0.5">Contact: {contactPerson} ({contactPhone})</p>
                  </div>
                </div>
              </div>

              {/* FINAL COST BREAKDOWN SUMMARY */}
              <div className="pt-4 border-t border-[#CCD5AE] space-y-3">
                <div className="space-y-2 text-xs text-[#69705E]">
                  <div className="flex justify-between">
                    <span>Crop Subtotal:</span>
                    <strong className="text-[#283025]">₹ {totals.subtotal.toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (5%):</span>
                    <strong className="text-[#283025]">₹ {totals.tax.toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee (2%):</span>
                    <strong className="text-[#283025]">₹ {(totals.platformFee || 0).toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="pt-2 border-t border-[#CCD5AE] flex justify-between items-center text-sm font-extrabold text-[#283025]">
                    <span>Total Payable:</span>
                    <span className="text-[#58664C] text-lg">₹ {totals.total.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {paymentError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-[12px] text-red-400 text-xs font-semibold flex items-center justify-between">
                  <span>{paymentError}</span>
                  <button onClick={() => setPaymentError(null)} className="text-[#69705E] hover:text-[#283025] text-xs">Dismiss</button>
                </div>
              )}

              {/* BOTTOM ACTION TOOLBAR */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#CCD5AE]">
                <button
                  type="button"
                  onClick={() => setCheckoutStep(1)}
                  disabled={isProcessingPayment}
                  className="w-full sm:w-auto bg-[#FEFAE0] hover:bg-[#FAEDCD] border border-[#CCD5AE] text-[#69705E] font-bold px-6 py-3 rounded-[20px] text-xs transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={handleFinalizeOrder}
                  disabled={isProcessingPayment}
                  className="w-full sm:w-auto bg-[#7BA05B] hover:bg-[#688A4D] text-[#1F2A1A] font-extrabold px-8 py-3.5 rounded-[20px] text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessingPayment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed to Buy</span>
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 3: ORDER CONFIRMATION & INSTITUTIONAL TRADE RECEIPT
           ========================================================================= */}
        {checkoutStep === 3 && confirmedOrder && (
          <div className="bg-[#FEFAE0]/90 border border-[#7BA05B]/30 rounded-[24px] p-8 space-y-7 shadow-2xl max-w-3xl mx-auto">
            
            {/* SUCCESS HEADER */}
            <div className="text-center space-y-3 border-b border-[#CCD5AE] pb-6">
              <div className="w-16 h-16 bg-[#7BA05B]/20 text-[#58664C] rounded-full border border-[#7BA05B]/30 flex items-center justify-center mx-auto shadow-lg shadow-[#7BA05B]/20">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div>
                <span className="text-[#58664C] font-mono text-xs font-extrabold uppercase tracking-widest block">
                  Trade Settlement Escrow Secured
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#283025] mt-1">
                  Order Successfully Placed!
                </h2>
                <p className="text-[#69705E] text-xs mt-1">
                  Trade Reference ID: <strong className="text-[#58664C] font-mono">{confirmedOrder.orderId}</strong>
                </p>
                {confirmedOrder.razorpayPaymentId && (
                  <p className="text-[#69705E] text-[11px] mt-0.5">
                    Razorpay Transaction ID: <strong className="text-[#69705E] font-mono">{confirmedOrder.razorpayPaymentId}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* FACTORY DESTINATION SUMMARY */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAEDCD] p-5 rounded-[20px] border border-[#CCD5AE] text-xs">
              <div>
                <span className="text-[10px] font-bold text-[#69705E] uppercase tracking-wider block mb-1">
                  Factory Delivery Location
                </span>
                <strong className="text-[#283025] text-sm block">{confirmedOrder.storeName}</strong>
                <p className="text-[#69705E] mt-0.5">{confirmedOrder.streetAddress}</p>
                <p className="text-[#69705E]">{confirmedOrder.cityState}</p>
              </div>
              <div className="sm:border-l sm:border-[#CCD5AE] sm:pl-4">
                <span className="text-[10px] font-bold text-[#69705E] uppercase tracking-wider block mb-1">
                  Receiver Contact Info
                </span>
                <p className="text-[#283025] font-medium">{confirmedOrder.contactPerson}</p>
                <p className="text-[#69705E] font-mono mt-0.5">{confirmedOrder.contactPhone}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#58664C] bg-[#7BA05B]/10 px-2 py-0.5 rounded-full mt-2 border border-[#7BA05B]/20">
                  <Lock className="h-3 w-3" /> ₹ {confirmedOrder.totals.total.toLocaleString("en-IN")} Escrow Locked
                </span>
              </div>
            </div>

            {/* ORDERED ITEMS TABLE */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#69705E] uppercase tracking-wider block">
                Purchased Crop Batches
              </span>
              <div className="bg-[#FAEDCD] rounded-[20px] border border-[#CCD5AE] overflow-hidden divide-y divide-[#CCD5AE]">
                {confirmedOrder.items.map((item) => (
                  <div key={item.harvestItem.id} className="p-3.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.harvestItem.imageUrl}
                        alt={item.harvestItem.cropName}
                        className="w-10 h-10 rounded-[12px] object-cover border border-[#CCD5AE]"
                      />
                      <div>
                        <h5 className="font-bold text-[#283025]">{item.harvestItem.cropName}</h5>
                        <span className="text-[10px] font-mono text-[#69705E]">{item.harvestItem.batchId}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <strong className="text-[#283025] font-bold block">{item.selectedQuantity} {item.harvestItem.unit}</strong>
                      <span className="text-[#58664C] font-semibold text-[11px]">
                        ₹ {(item.harvestItem.pricePerUnit * item.selectedQuantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/processor/processorHub/shipments"
                className="px-6 py-3 rounded-[20px] bg-[#7BA05B] hover:bg-[#688A4D] text-[#1F2A1A] font-bold text-xs transition shadow-lg text-center flex items-center justify-center gap-2"
              >
                <FileText className="h-4 w-4" /> Track Order Status
              </Link>
              <Link
                href="/retailer/retailerHub/marketplace"
                className="px-6 py-3 rounded-[20px] bg-[#FEFAE0] border border-[#CCD5AE] hover:bg-[#FAEDCD] text-[#283025] font-semibold text-xs transition border border-[#CCD5AE] text-center flex items-center justify-center gap-2"
              >
                Back to Marketplace
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) {
    return { redirect: { destination: "/", permanent: false } };
  }
  return { props: { user: JSON.parse(JSON.stringify(session.user)) } };
};

