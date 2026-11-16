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
  RotateCcw,
  Loader2
} from "lucide-react";
import ShipmentCard from "@/components/shared/ShipmentCard";
import Pagination from "@/components/shared/Pagination";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

interface ShipmentItem {
  id: string;
  batchId: string;
  cropName: string;
  quantity: string;
  value: string;
  destination: string;
  dispatchedDate: string;
  estimatedDelivery: string;
  status: "IN_TRANSIT" | "DELIVERED" | "REJECTED";
  currentStep: number;
  rejectionReason?: string;
  rejectedDate?: string;
  acceptedDate?: string;
}

export default function FarmerShipments() {
  const { data: session } = useSession();
  const farmerId = (session?.user as any)?.id || (session?.user as any)?.farmerId || "";



  const [isLoading, setIsLoading] = useState(false);

  // Shipments State initialized as empty array
  const [shipments, setShipments] = useState<ShipmentItem[]>([]);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        setIsLoading(true);
        const endpoint = `${BACKEND_URL}/api/v1/farmer/shipments/outgoing?userId=${farmerId}`;

        const res = await fetch(endpoint);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            const mapped = json.data.map((s: any) => ({
              id: s.orderNumber || s._id,
              batchId: s.batchId,
              cropName: s.cropName,
              quantity: `${s.quantityKg} kg`,
              value: `₹ ${s.totalAmount?.toLocaleString() || 0}`,
              destination: s.buyerName || "Processor Corp",
              dispatchedDate: s.dispatchedAt ? new Date(s.dispatchedAt).toLocaleDateString() : new Date(s.updatedAt).toLocaleDateString(),
              estimatedDelivery: "Today, 4:30 PM",
              status: s.deliveryStatus === "DISPATCHED" ? "IN_TRANSIT" : s.deliveryStatus,
              currentStep: s.deliveryStatus === "DELIVERED" ? 3 : s.deliveryStatus === "REJECTED" ? 3 : 2,
              rejectionReason: s.rejectionReason,
              rejectedDate: s.deliveryStatus === "REJECTED" ? new Date(s.updatedAt).toLocaleDateString() : undefined,
              acceptedDate: s.deliveredAt ? new Date(s.deliveredAt).toLocaleDateString() : undefined
            }));
            setShipments(mapped);
          }
        }
      } catch (err) {
        console.warn("Backend API offline or unreachable, utilizing local state fallback", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShipments();
  }, [farmerId]);

  const filteredShipments = shipments;

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const totalItems = filteredShipments.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedShipments = filteredShipments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F5F1E6] text-[#283025] font-sans pb-24 pt-24 px-4 sm:px-6 lg:px-8 relative z-20">
      <Head>
        <title>Shipments & Logistics | Seed2Shelf Farmer</title>
        <meta name="description" content="Logistics tracking for farmer harvest dispatches." />
      </Head>

      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER WITH TOP RIGHT MAIN TABS & INLINE HISTORY SUB-FILTER */}
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

          <div className="flex flex-wrap items-center gap-3">
            {isLoading && (
              <div className="flex items-center gap-1.5 text-xs text-[#58664C] font-semibold">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Loading...</span>
              </div>
            )}
          </div>
        </div>

        {/* SHIPMENT CARDS LIST */}
        <div className="space-y-6">
          {filteredShipments.length === 0 ? (
            <div className="bg-[#FFFCF5] border border-[#DADFCF] rounded-[24px] p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FFFCF5] border border-[#DADFCF] flex items-center justify-center mx-auto text-[#69705E]">
                <Truck className="w-6 h-6" />
              </div>
              <p className="text-[#69705E] text-xs font-medium">No farmer shipments found.</p>
            </div>
          ) : (
            <>
              {paginatedShipments.map((shp) => (
              <ShipmentCard 
                key={shp.id} 
                shipment={{ ...shp, productName: (shp as any).cropName || (shp as any).productName, destination: (shp as any).destination || (shp as any).buyerName || (shp as any).sourceOrDestination } as any} 
                activeSignal="NONE"
                
                
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
