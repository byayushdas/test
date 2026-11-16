import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { GetServerSideProps } from "next";
import Head from "next/head";
import { ClipboardList, CheckCircle2, Loader2 } from "lucide-react";
import OrderCard, { SharedOrderItem } from "@/components/shared/OrderCard";
import Pagination from "@/components/shared/Pagination";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

export default function RetailerOrders() {
  const { data: session } = useSession();
  const retailerId = (session?.user as any)?.id || (session?.user as any)?.retailerId || "";

  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;


  const [orders, setOrders] = useState<SharedOrderItem[]>([]);


  useEffect(() => {
    const fetchOrders = async () => {
      if (!retailerId) return;
      try {
        setIsLoading(true);

        const res = await fetch(`${BACKEND_URL}/api/v1/retailer/purchase-orders?userId=${retailerId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const activeOrders = json.data.filter((o: any) => 
              o.deliveryStatus !== "DISPATCHED" && o.deliveryStatus !== "DELIVERED"
            );
            setOrders(activeOrders.map((o: any) => ({
              id: o.orderNumber || o._id || o.id,
              rawId: o._id || o.id,
              batchId: o.batchNumber || o.batchId,
              counterpartyLabel: "Buyer",
              counterpartyName: o.buyerName || "Partner",
              productName: o.cropName,
              quantity: `${o.quantityKg} kg`,
              totalPrice: `₹ ${(o.totalAmount || 0).toLocaleString()}`,
              status: o.deliveryStatus === "PENDING_SELLER_ACCEPTANCE" ? "PENDING" : o.deliveryStatus,
              escrowLocked: o.escrowStatus === "LOCKED" || o.deliveryStatus === "ACCEPTED" || o.deliveryStatus === "DISPATCHED",
              date: new Date(o.createdAt).toLocaleDateString("en-GB")
            })));
          }
        }

      } catch (err) {
        console.warn("Backend API offline or unreachable", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, [retailerId]);


  const currentData = orders;
  const totalPages = Math.ceil(currentData.length / ITEMS_PER_PAGE);
  const currentOrders = currentData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const handleAcceptOrder = async (orderId: string) => {
    try {
      const targetOrder = orders.find(o => o.id === orderId);
      const targetId = targetOrder?.rawId || orderId;
      const res = await fetch(`${BACKEND_URL}/api/v1/retailer/purchase-orders/${targetId}/accept`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: retailerId }),
      });
      if (res.ok) {
        setOrders(prev => prev.map(ord => ord.id === orderId ? { ...ord, status: "ACCEPTED" as any, escrowLocked: true } : ord));
      }
    } catch (err) {}
    setNotification("Order accepted! Payment is now locked in Blockchain Escrow.");
    setTimeout(() => setNotification(null), 4000);
  };
  const handleRejectOrder = async (orderId: string) => {
    try {
      const targetOrder = orders.find(o => o.id === orderId);
      const targetId = targetOrder?.rawId || orderId;
      const res = await fetch(`${BACKEND_URL}/api/v1/retailer/purchase-orders/${targetId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: retailerId }),
      });
      if (res.ok) {
        setOrders(prev => prev.map(ord => ord.id === orderId ? { ...ord, status: "REJECTED" as any } : ord));
      }
    } catch (err) {}
    setNotification("Order rejected.");
    setTimeout(() => setNotification(null), 4000);
  };
  const handleDispatchOrder = async (orderId: string) => {
    try {
      const targetOrder = orders.find(o => o.id === orderId);
      const targetId = targetOrder?.rawId || orderId;
      const res = await fetch(`${BACKEND_URL}/api/v1/retailer/purchase-orders/${targetId}/dispatch`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: retailerId }),
      });
      if (res.ok) {
        setOrders(prev => prev.filter(ord => ord.id !== orderId));
      }
    } catch (err) {}
    setNotification("Order marked as dispatched!");
    setTimeout(() => setNotification(null), 4000);
  };


  return (
    <div className="min-h-screen bg-[#F5F1E6] text-[#283025] font-sans pb-24 pt-24 -mt-16">
      <Head>
        <title>Purchase Orders | Retailer Hub</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-y border-[#DADFCF] py-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#EDF0E6] border border-[#6F7D61]/20 rounded-[20px] text-[#58664C] shrink-0">
              <ClipboardList className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#283025] tracking-tight">
                Purchase Orders
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">

            {isLoading && (
              <div className="flex items-center gap-1.5 text-xs text-[#6F7D61] font-semibold">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Loading...</span>
              </div>
            )}
          </div>
        </div>

        {notification && (
          <div className="p-4 bg-[#EDF0E6] border border-[#6F7D61]/20 rounded-[12px] text-xs text-[#58664C] font-bold flex items-center gap-2 animate-in fade-in duration-300">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* ORDERS LIST */}
        <div className="space-y-4">
          {currentData.length === 0 ? (
            <div className="bg-[#FFFCF5] border border-[#DADFCF] rounded-[12px] p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#EDF0E6] border border-[#6F7D61]/20 flex items-center justify-center mx-auto text-[#6F7D61]">
                <ClipboardList className="w-6 h-6" />
              </div>
              <p className="text-[#69705E] text-sm font-medium">No purchase orders found.</p>
            </div>
          ) : (
            currentOrders.map((ord) => (
              <OrderCard
                key={ord.id}
                order={ord}
                activeTab={"INCOMING"}
                onAccept={handleAcceptOrder}
                onReject={handleRejectOrder}
                onDispatch={handleDispatchOrder}
              />
            ))
          )}
        </div>
        
        {currentData.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={currentData.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session || (session.user as any).role !== "RETAILER") {
    return { redirect: { destination: "/auth/login", permanent: false } };
  }
  return { props: {} };
};
