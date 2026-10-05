import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { 
  ClipboardList, 
  CheckCircle2, 
  Lock, 
  Truck, 
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  Loader2,
  XCircle
} from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

interface OrderItem {
  id: string;
  rawId?: string;
  orderNumber?: string;
  batchId: string;
  buyer: string;
  cropName: string;
  quantity: string;
  totalPrice: string;
  status: string;
  escrowLocked: boolean;
  date: string;
  hasBeenDispatched?: boolean;
}

export default function FarmerOrders() {
  const { data: session } = useSession();
  const farmerId = (session?.user as any)?.id || (session?.user as any)?.farmerId || "";

  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!farmerId) return;
      try {
        setIsLoading(true);
        const res = await fetch(`${BACKEND_URL}/api/v1/farmer/purchase-orders?userId=${farmerId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            const activeOrders = json.data.filter((o: any) => 
              o.deliveryStatus !== "DISPATCHED" && o.deliveryStatus !== "DELIVERED"
            );
            const mapped = activeOrders.map((o: any) => ({
              id: o.orderNumber || o._id || o.id,
              rawId: o._id || o.id,
              batchId: o.batchNumber || o.batchId,
              buyer: o.buyerName || "Processor Corp",
              cropName: o.cropName,
              quantity: `${o.quantityKg} kg`,
              totalPrice: `₹ ${o.totalAmount.toLocaleString()}`,
              status: o.deliveryStatus === "PENDING_SELLER_ACCEPTANCE" ? "PENDING" : o.deliveryStatus,
              escrowLocked: o.escrowStatus === "LOCKED" || o.deliveryStatus === "ACCEPTED" || o.deliveryStatus === "DISPATCHED",
              date: new Date(o.createdAt).toLocaleDateString("en-GB"),
              hasBeenDispatched: !!o.dispatchedAt
            }));
            setOrders(mapped);
          } else {
            setOrders([]);
          }
        }
      } catch (err) {
        console.warn("Backend API offline or unreachable", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, [farmerId]);

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const targetOrder = orders.find(o => o.id === orderId);
      const targetId = (targetOrder as any)?.rawId || orderId;
      const res = await fetch(`${BACKEND_URL}/api/v1/farmer/purchase-orders/${targetId}/accept`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: farmerId }),
      });
      if (res.ok) {
        setOrders(prev => prev.map(ord => ord.id === orderId ? { ...ord, status: "ACCEPTED", escrowLocked: true } : ord));
      }
    } catch (err) {
      setOrders(prev => prev.map(ord => ord.id === orderId ? { ...ord, status: "ACCEPTED", escrowLocked: true } : ord));
    }
    setNotification("Order accepted! Payment is now locked in Blockchain Escrow.");
    setTimeout(() => setNotification(null), 4000);
  };

  const handleStartDelivery = async (orderId: string) => {
    try {
      const targetOrder = orders.find(o => o.id === orderId);
      const targetId = (targetOrder as any)?.rawId || orderId;
      const res = await fetch(`${BACKEND_URL}/api/v1/farmer/purchase-orders/${targetId}/dispatch`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: farmerId, carrierName: "Standard Agri Express" }),
      });
      if (res.ok) {
        setOrders(prev => prev.map(ord => ord.id === orderId ? { ...ord, status: "DISPATCHED" } : ord));
      }
    } catch (err) {
      setOrders(prev => prev.map(ord => ord.id === orderId ? { ...ord, status: "DISPATCHED" } : ord));
    }
    setNotification("Delivery initiated! Order is now in transit.");
    setTimeout(() => setNotification(null), 4000);
  };

  const handleRejectOrder = async (orderId: string) => {
    try {
      const targetOrder = orders.find(o => o.id === orderId);
      const targetId = (targetOrder as any)?.rawId || orderId;
      const res = await fetch(`${BACKEND_URL}/api/v1/farmer/purchase-orders/${targetId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: farmerId, reason: "Rejected by seller" }),
      });
      if (res.ok) {
        setOrders(prev => prev.map(ord => ord.id === orderId ? { ...ord, status: "REJECTED" } : ord));
        setNotification("Order rejected. Batch quantity has been restocked.");
      }
    } catch (err) {
      console.error(err);
    }
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="min-h-screen text-stone-100 font-sans pb-24 pt-6 px-4 sm:px-6 lg:px-8 relative z-20">
      <Head>
        <title>Purchase Orders | Seed2Shelf Farmer</title>
        <meta name="description" content="Review purchase offers and manage blockchain escrow delivery." />
      </Head>

      <div className="max-w-6xl mx-auto space-y-7">

        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-y border-stone-800/80 py-3.5">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 shrink-0">
              <ClipboardList className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Purchase Orders
              </h1>
            </div>
          </div>
          {isLoading && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Loading...</span>
            </div>
          )}
        </div>

        {notification && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-400 font-bold flex items-center gap-2 animate-in fade-in duration-300">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* ORDERS LIST */}
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-stone-950 border border-stone-800 flex items-center justify-center mx-auto text-stone-500">
                <ClipboardList className="w-6 h-6" />
              </div>
              <p className="text-stone-400 text-xs font-medium">No purchase orders found.</p>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-stone-900/90 border border-stone-800/90 rounded-3xl p-6 sm:p-7 shadow-sm transition-all duration-200 hover:border-stone-700/80 space-y-5"
              >
                {/* TOP HEADER */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-800">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs text-stone-200 font-extrabold bg-stone-950 px-3 py-1 rounded-xl border border-stone-800">
                      {ord.id}
                    </span>
                    <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20 flex items-center gap-1">
                      Batch: {ord.batchId}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-stone-400 font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-500" />
                      {ord.date}
                    </span>
                    {ord.status === "PENDING" && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Awaiting Acceptance
                      </span>
                    )}
                    {ord.status === "ACCEPTED" && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Order Accepted
                      </span>
                    )}
                    {ord.status === "DISPATCHED" && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-blue-400" /> In Transit
                      </span>
                    )}
                    {ord.status === "REJECTED" && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5 text-red-400" /> {ord.hasBeenDispatched ? "Rejected at Delivery" : "Rejected"}
                      </span>
                    )}
                    {ord.status === "DELIVERED" && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Delivered
                      </span>
                    )}
                  </div>
                </div>

                {/* MAIN CONTENT GRID */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  <div className="md:col-span-7 space-y-2.5">
                    <div>
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Harvested Crop</span>
                      <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">{ord.cropName}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-stone-300">
                      <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-semibold text-stone-400">Buyer:</span>
                      <span className="font-extrabold text-white">{ord.buyer}</span>
                    </div>
                  </div>

                  <div className="md:col-span-5 bg-stone-950/60 border border-stone-800/80 rounded-2xl p-4 flex flex-col justify-center space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-400 font-medium">Quantity Requested:</span>
                      <span className="font-extrabold text-white text-sm">{ord.quantity}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs border-t border-stone-800/60 pt-2">
                      <span className="text-stone-400 font-medium">Total Offer Amount:</span>
                      <span className="text-base font-black text-emerald-400">{ord.totalPrice}</span>
                    </div>
                    {(ord.status === "ACCEPTED" || ord.status === "DISPATCHED") && (
                      <div className="pt-1">
                        <span className="text-amber-300 font-extrabold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5 w-full justify-center text-[11px]">
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          {ord.status === "DISPATCHED" ? "Escrow Secured • In Transit" : "Smart Contract Escrow Secured"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* BOTTOM ACTION BAR */}
                <div className="pt-3 border-t border-stone-800/70 flex items-center justify-between flex-wrap gap-3">
                  <div className="text-[11px] text-stone-400 font-medium flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Protected by Escrow Security Protocol</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {ord.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRejectOrder(ord.id)}
                          className="px-5 py-2.5 rounded-xl bg-red-600/10 border border-red-500/20 hover:bg-red-600/20 text-red-400 font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <span>Reject</span>
                        </button>
                        <button
                          onClick={() => handleAcceptOrder(ord.id)}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                        >
                          <span>Accept Order</span>
                        </button>
                      </div>
                    )}
                    {ord.status === "ACCEPTED" && (
                      <button
                        onClick={() => handleStartDelivery(ord.id)}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition cursor-pointer shadow-md flex items-center gap-2"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Start Delivery</span>
                      </button>
                    )}
                    {ord.status === "DISPATCHED" && (
                      <Link
                        href="/farmer/farmerHub/shipments"
                        className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-emerald-400 font-extrabold text-xs transition cursor-pointer border border-stone-700 flex items-center justify-center"
                      >
                        <span>View Live Shipment</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
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
