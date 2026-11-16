import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  Store,
  Search,
  ShoppingCart,
  QrCode,
  X,
  MapPin,
  Calendar,
  CheckCircle2,
  Plus,
  Minus,
  ChevronRight
} from "lucide-react";
import FarmerHarvestCard from "@/components/processor/FarmerHarvestCard";
import { marketplaceService } from "@/services/processor/marketplaceService";
import { cartService } from "@/services/processor/cartService";
import { FarmerHarvestItem } from "@/types/processor";
import { useToast } from "@/context/ToastContext";


export default function DistributorMarketplace() {
  const { data: session } = useSession();
  const [harvests, setHarvests] = useState<FarmerHarvestItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<FarmerHarvestItem | null>(null);
  const [modalQty, setModalQty] = useState(50);
  const [cartCount, setCartCount] = useState(0);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMarketplaceHarvests = async () => {
      setLoading(true);
      try {
        const liveData = await marketplaceService.fetchAvailableProcessedGoodsFromApi(searchQuery);
        setHarvests(liveData);
      } catch (err) {
        console.error("Failed to load distributor marketplace:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMarketplaceHarvests();
    setCartCount(cartService.getCartTotals().itemCount);
    const unsubscribe = cartService.subscribe(() => {
      setCartCount(cartService.getCartTotals().itemCount);
    });
    return unsubscribe;
  }, [searchQuery]);

  const handleAddToCart = async (item: FarmerHarvestItem) => {
    const qty = Math.min(1, item.quantity);
    cartService.addToCart(item, qty);
    try {
      await marketplaceService.addToCartApi(item.id, qty);
      toast(`Successfully added ${item.cropName} to cart!`, "success");
    } catch (e) {
      console.warn("Backend cart sync fallback", e);
      toast(`Added ${item.cropName} to cart (local mode)`, "info");
    }
  };

  const filteredHarvests = harvests.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      item.cropName.toLowerCase().includes(q) ||
      item.farmerName.toLowerCase().includes(q) ||
      item.farmerLocation.toLowerCase().includes(q) ||
      item.batchId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen text-[#283025] font-sans pb-24 pt-6 px-4 sm:px-6 lg:px-8 relative z-20">
      <Head>
        <title>Market Place | Distributor Portal</title>
        <meta name="description" content="Browse and procure verified processed goods directly from processors" />
      </Head>

      {/* Solid Dark Background Overlay */}

      <div className="max-w-6xl mx-auto space-y-7">
        
        {/* =========================================================================
            HEADER & CART BUTTON
           ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-y border-[#CCD5AE] py-3.5">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-[#7BA05B]/10 border border-[#7BA05B]/20 rounded-[20px] text-[#58664C] shrink-0">
              <Store className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#283025] tracking-tight">
                Market Place
              </h1>
            </div>
          </div>

          <Link
            href="/distributor/distributorHub/marketplace/cart"
            className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-[20px] bg-[#7BA05B] hover:bg-[#688A4D] text-[#1F2A1A] font-bold text-xs transition shadow-lg cursor-pointer shrink-0"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Shopping Cart ({cartCount})</span>
          </Link>
        </div>

        {/* =========================================================================
            SEARCH CONTROLS
           ========================================================================= */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#69705E]" />
          <input
            type="text"
            placeholder="Search crop, processor name, batch ID, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FEFAE0] border border-[#CCD5AE] rounded-[20px] pl-10 pr-12 py-2.5 text-xs text-[#283025] placeholder-[#69705E] focus:outline-none focus:border-[#7BA05B]/50 transition"
          />

        </div>

        {/* =========================================================================
            PRODUCT CARDS GRID
           ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHarvests.map(item => (
            <FarmerHarvestCard
              key={item.id}
              item={item}
              onViewDetails={(item) => setSelectedItem(item)}
              onAddToCart={handleAddToCart}
              sellerLabel="Processor"
            />
          ))}
        </div>

      </div>

      {/* =========================================================================
          PRODUCT DETAIL MODAL
         ========================================================================= */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[#FEFAE0] border border-[#CCD5AE] w-full max-w-xl rounded-[24px] p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl relative">
            
            <div className="flex items-center justify-between border-b border-[#CCD5AE] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#7BA05B]/10 border border-[#7BA05B]/20 rounded-[20px] text-[#58664C]">
                  <Store className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#283025]">{selectedItem.cropName}</h3>
                  <span className="font-mono text-xs text-[#58664C]">{selectedItem.batchId}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 text-[#69705E] hover:text-[#283025] rounded-[12px] bg-[#FEFAE0] border border-[#CCD5AE] hover:bg-[#FAEDCD] transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="h-48 w-full rounded-[20px] overflow-hidden bg-[#FAEDCD]">
                <img src={selectedItem.imageUrl} alt={selectedItem.cropName} className="w-full h-full object-cover" />
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 bg-[#FAEDCD] rounded-[20px] border border-[#CCD5AE]">
                <div>
                  <span className="text-[11px] text-[#69705E] block">Processor:</span>
                  <strong className="text-[#283025] text-sm">{selectedItem.farmerName}</strong>
                </div>
                <div>
                  <span className="text-[11px] text-[#69705E] block">Location:</span>
                  <strong className="text-[#69705E] text-sm">{selectedItem.farmerLocation}</strong>
                </div>
                <div className="pt-2">
                  <span className="text-[11px] text-[#69705E] block">Listed Date:</span>
                  <strong className="text-[#69705E]">{selectedItem.harvestDate}</strong>
                </div>
                <div className="pt-2">
                  <span className="text-[11px] text-[#69705E] block">Price per Unit:</span>
                  <strong className="text-[#58664C] text-sm">₹ {selectedItem.pricePerUnit} / {selectedItem.unit}</strong>
                </div>
              </div>

              {selectedItem.originDetails && selectedItem.originDetails.processor && (
                <div className="p-4 bg-[#FEFAE0] rounded-[20px] border border-[#CCD5AE] space-y-2">
                  <h4 className="text-[#58664C] font-bold mb-2 border-b border-[#CCD5AE] pb-1">Processor Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-[#69705E] block">Processor Name:</span>
                      <strong className="text-[#283025] text-sm">{selectedItem.originDetails.processor.name}</strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#69705E] block">Location:</span>
                      <strong className="text-[#69705E] text-sm">{selectedItem.originDetails.processor.location}</strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#69705E] block">Batch ID:</span>
                      <strong className="text-[#69705E] text-xs font-mono">{selectedItem.originDetails.processor.batchId}</strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#69705E] block">Processing Date:</span>
                      <strong className="text-[#69705E] text-xs">{new Date(selectedItem.originDetails.processor.processingDate).toLocaleDateString()}</strong>
                    </div>
                  </div>
                </div>
              )}

              {selectedItem.parentRawBatchIds && selectedItem.parentRawBatchIds.length > 0 && (
                <div className="p-4 bg-[#FEFAE0] rounded-[20px] border border-[#CCD5AE] space-y-2">
                  <h4 className="text-[#58664C] font-bold mb-2 border-b border-[#CCD5AE] pb-1">Raw Material Origin (Farmer)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-[#69705E] block">Farmer Name:</span>
                      <strong className="text-[#283025] text-sm">{selectedItem.farmerName}</strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#69705E] block">Farmer Location:</span>
                      <strong className="text-[#69705E] text-sm">{selectedItem.farmerLocation}</strong>
                    </div>

                    <div>
                      <span className="text-[11px] text-[#69705E] block">Raw Batch IDs:</span>
                      <strong className="text-[#69705E] text-[10px] font-mono break-words block">
                        {selectedItem.parentRawBatchIds.join(', ')}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Quantity Selection Control Removed */}

              <div className="p-4 bg-[#7BA05B]/10 border border-[#7BA05B]/20 rounded-[20px] flex items-center justify-between text-xs">
                <span className="font-bold text-[#58664C] flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#58664C]" /> Origin Verification & QR Code Available
                </span>
                <span className="font-mono text-[#69705E] font-bold">QR Verified</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2.5 rounded-[12px] bg-[#FEFAE0] border border-[#CCD5AE] hover:bg-[#FAEDCD] text-[#69705E] font-semibold transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleAddToCart(selectedItem);
                  setSelectedItem(null);
                }}
                className="px-6 py-2.5 rounded-[12px] bg-[#7BA05B] hover:bg-[#688A4D] text-[#1F2A1A] font-bold transition shadow-md cursor-pointer flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Add to Cart</span>
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
