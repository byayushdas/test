import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { GetServerSideProps } from "next";
import Head from "next/head";
import { 
  Truck, 
  CheckCircle2, 
  Package, 
  MapPin, 
  ShieldCheck, 
  Calendar,
  XCircle,
  AlertTriangle,
  X,
  ArrowDownRight,
  ArrowUpRight,
  RotateCcw,
  History,
  Clock
} from "lucide-react";
import ShipmentCard from "@/components/shared/ShipmentCard";
import Pagination from "@/components/shared/Pagination";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

interface ShipmentItem {
  id: string;
  rawId: string;
  batchId: string;
  productName: string;
  quantity: string;
  value: string;
  sourceOrDestination: string;
  senderName: string;
  dispatchedDate: string;
  estimatedDelivery: string;
  status: "IN_TRANSIT" | "DELIVERED" | "REJECTED" | "ACCEPTED";
  currentStep: number;
  rejectionReason?: string;
  rejectedDate?: string;
  acceptedDate?: string;
}

export default function RetailerShipmentsPage() {
  const { data: session } = useSession();

  // 1. INCOMING SHIPMENTS (Distributor -> Retailer)
  const [incomingShipments, setIncomingShipments] = useState<ShipmentItem[]>([]);
  const activeSignal = "INCOMING";

  const [notification, setNotification] = useState<string | null>(null);
  const retailerId = (session?.user as any)?.id || (session?.user as any)?.retailerId || "";

  useEffect(() => {
    const fetchIncoming = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/retailer/shipments/incoming?userId=${retailerId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setIncomingShipments(json.data.map((s: any) => ({
              id: s.orderNumber || s._id,
              rawId: s._id,
              batchId: s.batchId,
              productName: s.cropName,
              quantity: `${s.quantityKg} kg`,
              value: `₹ ${s.totalAmount?.toLocaleString() || 0}`,
              sourceOrDestination: s.sellerName || "Distributor",
              senderName: s.sellerName || "Distributor",
              dispatchedDate: s.dispatchedAt ? new Date(s.dispatchedAt).toLocaleDateString() : "",
              estimatedDelivery: "Today, 4:30 PM",
              status: s.deliveryStatus === "DISPATCHED" ? "IN_TRANSIT" : s.deliveryStatus,
              currentStep: s.deliveryStatus === "DELIVERED" || s.deliveryStatus === "REJECTED" ? 3 : 2,
              rejectionReason: s.rejectionReason,
              rejectedDate: s.deliveryStatus === "REJECTED" ? new Date(s.updatedAt).toLocaleDateString() : undefined,
              acceptedDate: s.deliveredAt ? new Date(s.deliveredAt).toLocaleDateString() : undefined
            })));
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    if (retailerId) {
      fetchIncoming();
    }
  }, [retailerId]);

  // Rejection Modal State
  const [rejectModalItem, setRejectModalItem] = useState<ShipmentItem | null>(null);
  const [rejectCategory, setRejectCategory] = useState("Quality Inspection Failed");
  const [customReason, setCustomReason] = useState("");

  // Action: Accept Delivery & Release Escrow Payment
  const handleAcceptDelivery = async (shpId: string) => {
    const targetItem = incomingShipments.find(s => s.id === shpId);
    const targetId = targetItem?.rawId || shpId;

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/retailer/shipments/${targetId}/receive`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        setIncomingShipments((prev) =>
          prev.map((shp) =>
            shp.id === shpId
              ? {
                  ...shp,
                  status: "DELIVERED",
                  currentStep: 3,
                  acceptedDate: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              : shp
          )
        );
        setNotification("Delivery accepted! Escrow payment released.");
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Action: Confirm Rejection & Refund Escrow Payment
  const handleConfirmReject = async () => {
    if (!rejectModalItem) return;
    const details = customReason.trim();
    const finalReason = details
      ? `${rejectCategory}: ${details}`
      : `${rejectCategory}: Quality inspection failed intake standard. Cargo returned to seller.`;


    const targetId = rejectModalItem.rawId || rejectModalItem.id;

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/retailer/shipments/${targetId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: finalReason })
      });
      if (res.ok) {
        setIncomingShipments((prev) =>
          prev.map((shp) =>
            shp.id === rejectModalItem.id
              ? {
                  ...shp,
                  status: "REJECTED",
                  currentStep: 3,
                  rejectionReason: finalReason,
                  rejectedDate: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              : shp
          )
        );
        setNotification(`Delivery rejected! Cargo returned to seller.`);
        setTimeout(() => setNotification(null), 5000);
        setRejectModalItem(null);
        setCustomReason("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredList = incomingShipments;

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const totalItems = filteredList.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedShipments = filteredList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F5F1E6] text-[#283025] font-sans pb-24 pt-24 px-4 sm:px-6 lg:px-8 relative z-20">
      <Head>
        <title>Shipments & Logistics | Seed2Shelf Retailer</title>
        <meta name="description" content="Retailer B2B incoming distributor deliveries and outgoing consumer shipments." />
      </Head>

      {/* Solid Dark Background Overlay */}

      <div className="max-w-6xl mx-auto space-y-7">
        
        {/* HEADER WITH TOP RIGHT SIGNAL TABS MATCHING FARMER LOGISTICS */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-y border-[#DADFCF] py-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#EDF0E6] border border-[#6F7D61]/20 rounded-[20px] text-[#58664C] shrink-0">
              <Truck className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#283025] tracking-tight">
                Shipments & Logistics
              </h1>
            </div>
          </div>

        </div>

        {notification && (
          <div className="p-4 bg-[#EDF0E6] border border-[#6F7D61]/20 rounded-[20px] text-xs text-[#58664C] font-bold flex items-center gap-2 animate-in fade-in duration-300 shadow-lg">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{notification}</span>
          </div>
        )}



        {/* SHIPMENT CARDS LIST */}
        <div className="space-y-6">
          {filteredList.length === 0 ? (
            <div className="bg-[#FFFCF5] border border-[#DADFCF] rounded-[24px] p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FFFCF5] border border-[#DADFCF] flex items-center justify-center mx-auto text-[#69705E]">
                <Truck className="w-6 h-6" />
              </div>
              <p className="text-[#69705E] text-xs font-medium">
                No shipments found in {activeSignal.toLowerCase()} records.
              </p>
            </div>
          ) : (
            <>
              {paginatedShipments.map((shp) => (
              <ShipmentCard 
                key={shp.id} 
                shipment={{ ...shp, productName: (shp as any).cropName || (shp as any).productName, destination: (shp as any).destination || (shp as any).buyerName || (shp as any).sourceOrDestination } as any} 
                activeSignal={typeof activeSignal !== "undefined" ? activeSignal : "NONE"}
                onAccept={typeof handleAcceptDelivery !== "undefined" ? handleAcceptDelivery : undefined}
                onReject={typeof setRejectModalItem !== "undefined" ? (id) => setRejectModalItem(filteredList.find(s => s.id === id) || null) : undefined}
              />
            ))}
              <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
              />
            </>
          )}
        </div>

      </div>

      {/* REJECTION REASON MODAL WITH PROFESSIONAL UI & WRITTEN SECTION FOR OTHER */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FFFCF5]/85 backdrop-blur-md">
          <div className="bg-[#FFFCF5] border border-[#DADFCF] rounded-[24px] p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#DADFCF] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-500/10 border border-[#F87171]/20 rounded-[20px] text-[#DC2626] shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#283025] tracking-tight">Reject Delivery & Return Cargo</h3>
                  <p className="text-[11px] text-[#69705E] font-medium">Select or specify the official inspection failure reason</p>
                </div>
              </div>
              <button
                onClick={() => setRejectModalItem(null)}
                className="p-2 rounded-[12px] text-[#69705E] hover:text-[#283025] bg-[#FFFCF5] border border-[#DADFCF] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Shipment Summary Info Callout */}
            <div className="bg-[#FFFCF5]/90 border border-[#DADFCF] rounded-[20px] p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-[#69705E] uppercase tracking-tight block">Target Cargo</span>
                <span className="font-bold text-[#283025] text-sm">{rejectModalItem.productName}</span>
                <span className="text-[#69705E] block font-sans text-[11px]">ID: {rejectModalItem.id} | Batch: {rejectModalItem.batchId}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-[#69705E] uppercase tracking-tight block">Cargo Value</span>
                <span className="font-bold text-[#58664C] text-sm">{rejectModalItem.value}</span>
              </div>
            </div>

            {/* Radio Options List */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#283025] uppercase tracking-tight block">
                Select Rejection Reason Category:
              </span>

              <div className="space-y-2.5">
                {[
                  "Quality Inspection Failed",
                  "Cargo Damaged in Transit",
                  "Grade Mismatch",
                  "Other"
                ].map((reasonOption) => {
                  const isSelected = rejectCategory === reasonOption;
                  return (
                    <label
                      key={reasonOption}
                      className={`flex items-start gap-3 p-3.5 rounded-[20px] border text-xs font-bold transition cursor-pointer ${
                        isSelected
                          ? "bg-[#FEF2F2] border-[#F87171]/40 text-[#283025] shadow-sm"
                          : "bg-[#FFFCF5]/70 border-[#DADFCF] text-[#283025] hover:border-[#DADFCF] hover:bg-[#FFFCF5]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="rejectionReason"
                        checked={isSelected}
                        onChange={() => setRejectCategory(reasonOption)}
                        className="mt-0.5 accent-red-500 shrink-0"
                      />
                      <span className="leading-snug">{reasonOption}</span>
                    </label>
                  );
                })}
              </div>

              {/* DETAILED WRITTEN REJECTION TEXTAREA - AVAILABLE FOR ALL OPTIONS */}
              <div className="space-y-2 pt-2 animate-in fade-in duration-200">
                <label className="text-xs font-bold text-[#DC2626] block">
                  Detailed Written Explanation of Rejection Problem:
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide a detailed written explanation of the rejection problem (e.g. Moisture level exceeded 18%, produce damaged during transport, or quality grade mismatch)..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full bg-[#FFFCF5] border border-[#DADFCF] focus:border-[#F87171]/80 rounded-[20px] p-4 text-xs text-[#283025] placeholder-stone-500 focus:outline-none transition font-medium min-h-[100px] leading-relaxed shadow-inner"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-[#DADFCF] flex items-center justify-end gap-3">
              <button
                onClick={() => setRejectModalItem(null)}
                className="px-5 py-2.5 rounded-[12px] bg-[#FFFCF5] hover:bg-stone-800 text-[#283025] font-bold text-xs border border-[#DADFCF] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-6 py-2.5 rounded-[12px] bg-red-600 hover:bg-red-500 text-[#283025] font-bold text-xs transition shadow-lg shadow-red-950/40 cursor-pointer"
              >
                Confirm Rejection & Return Cargo
              </button>
            </div>

          </div>
        </div>
      )}
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
