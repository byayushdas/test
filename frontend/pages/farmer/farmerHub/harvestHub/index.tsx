import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { 
  Sprout, 
  PlusCircle, 
  CheckCircle2, 
  Package, 
  Pencil, 
  Trash2, 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  UploadCloud,
  ImageIcon,
  X,
  QrCode as QrIcon,
  Download,
  Eye,
  Copy,
  Check
} from "lucide-react";
import QRCode from "qrcode";


interface InventoryItem {
  id: string;
  category: string;
  cropName: string;
  quantity: string;
  pricePerKg: string;
  harvestDate: string;
  status: string;
  cropImage?: string;
  qrCode?: string;
  traceUrl?: string;
  isSold?: boolean;
  soldTo?: string;
  soldDate?: string;
  totalSaleValue?: string;
}

const getCropImage = (item: InventoryItem) => {
  return item.cropImage || "";
};

export default function HarvestHub() {
  const { data: session } = useSession();
  const farmerId = (session?.user as any)?.id || (session?.user as any)?.farmerId || "";
  const roleId = (session?.user as any)?.roleId || "";
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";


  // Form State
  const [cropCategory, setCropCategory] = useState("Grains");
  const [cropName, setCropName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Batch QR info state - initially null until user saves a harvest
  const [newBatchInfo, setNewBatchInfo] = useState<{ id: string; qr: string; url: string; cropName: string } | null>(null);
  const [selectedQrModal, setSelectedQrModal] = useState<{ id: string; qr: string; url: string; cropName: string } | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Custom Date Picker State
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Close calendar popup on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format date display
  const formattedDateDisplay = `${String(selectedDay).padStart(2, "0")}/${String(selectedMonth + 1).padStart(2, "0")}/${selectedYear}`;

  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  // Fetch inventory from backend on mount
  useEffect(() => {
    if (!farmerId) return;
    const fetchHarvests = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/farmer/harvests?userId=${farmerId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const mapped = json.data.map((item: any) => ({
              id: item._id || item.batchId,
              category: item.category,
              cropName: item.cropName,
              quantity: `${item.quantity} kg`,
              pricePerKg: `₹${item.pricePerKg}/kg`,
              harvestDate: item.harvestDate ? new Date(item.harvestDate).toLocaleDateString("en-GB") : formattedDateDisplay,
              status: item.status,
              cropImage: item.cropImage || undefined,
              qrCode: item.qrCode || undefined,
              traceUrl: item.traceUrl || undefined,
              isSold: item.status === "Sold",
              soldTo: item.soldTo,
              soldDate: item.soldDate ? new Date(item.soldDate).toLocaleDateString("en-GB") : undefined,
              totalSaleValue: item.totalSaleValue ? `₹${item.totalSaleValue}` : undefined
            }));
            setInventory(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to fetch harvests:", err);
      }
    };
    fetchHarvests();
  }, [farmerId, formattedDateDisplay]);

  const handleRegisterHarvest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    // Generate unique Batch ID
    const batchId = `BATCH-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // Generate QR code for trace URL
    const qrUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://seed2shelf.com'}/trace/${batchId}`;
    const qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 2, width: 300 });

    const currentCrop = cropName || "Mangoes";

    const dateToSave = new Date(selectedYear, selectedMonth, selectedDay).toISOString();

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/farmer/harvests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: farmerId,
          roleId: roleId,
          cropName: currentCrop,
          category: cropCategory,

          quantity: quantity,
          pricePerKg: price,
          harvestDate: dateToSave,
          cropImage: cropImage,
          qrCode: qrDataUrl,
          traceUrl: qrUrl,
          batchId: batchId
        })
      });

      if (res.ok) {
        // Add to inventory
        const newItem: InventoryItem = {
          id: batchId,
          category: cropCategory || "Fruits",
          cropName: currentCrop,
          quantity: `${quantity} kg`,
          pricePerKg: `₹${price}/kg`,
          harvestDate: formattedDateDisplay,
          status: "Unlisted",
          cropImage: cropImage || undefined,
          qrCode: qrDataUrl,
          traceUrl: qrUrl
        };

        setInventory([newItem, ...inventory]);
        setNewBatchInfo({ id: batchId, qr: qrDataUrl, url: qrUrl, cropName: currentCrop });
      } else {
        console.error("Failed to save harvest");
      }
    } catch (err) {
      console.error("Error saving harvest:", err);
    }

    setTimeout(() => {
      setSubmitted(false);
    }, 4000);
  };

  const handleMarkAsSold = (id: string) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              isSold: true,
              status: "Sold",
              soldTo: "AgroProc Processing Hub",
              soldDate: formattedDateDisplay,
              totalSaleValue: `₹${(parseFloat(item.quantity) * parseFloat(item.pricePerKg.replace(/[^0-9.]/g, ""))) || 2500}`
            }
          : item
      )
    );
  };

  const activeInventory = inventory.filter((i) => !i.isSold);
  const paginatedInventory = activeInventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPagesToRender = Math.max(1, Math.ceil(activeInventory.length / itemsPerPage));

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/farmer/harvests/${id}`, { method: "DELETE" });
      if (res.ok) {
        setInventory(inventory.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Error deleting harvest:", err);
    }
  };

  const handleToggleListStatus = async (id: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/farmer/harvests/${id}/list`, { method: "PUT" });
      if (res.ok) {
        setInventory(
          inventory.map((item) =>
            item.id === id
              ? { ...item, status: item.status === "Listed" ? "Unlisted" : "Listed" }
              : item
          )
        );
      }
    } catch (err) {
      console.error("Error toggling list status:", err);
    }
  };

  const handleInventoryQrClick = async (item: InventoryItem) => {
    let qrData = item.qrCode;
    let url = item.traceUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'https://seed2shelf.com'}/trace/${item.id}`;
    if (!qrData) {
      qrData = await QRCode.toDataURL(url, { margin: 2, width: 300 });
      setInventory(prev => prev.map(inv => inv.id === item.id ? { ...inv, qrCode: qrData, traceUrl: url } : inv));
    }
    setSelectedQrModal({
      id: item.id,
      qr: qrData,
      url,
      cropName: item.cropName
    });
  };

  const downloadQrCode = (qrDataUrl: string, batchId: string) => {
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${batchId}-QR.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const copyTraceUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Days in month calculation for custom calendar grid
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1E6] text-[#283025] font-sans pb-24 pt-24 -mt-16 relative z-20">
      <Head>
        <title>Harvest Hub | Seed2Shelf Farmer</title>
        <meta name="description" content="Log fresh crop harvests onto the blockchain escrow protocol." />
      </Head>


      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-7">
        
        {/* =========================================================================
            HEADER (BORDER TOP & BOTTOM - MATCHING PURCHASE ORDERS STYLE)
           ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-y border-[#DADFCF] py-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#EDF0E6] border border-[#6F7D61]/20 rounded-[20px] text-[#58664C] shrink-0">
              <Sprout className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#283025] tracking-tight">
                Harvest Hub
              </h1>
            </div>
          </div>
        </div>

        {submitted && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-400 font-bold flex items-center gap-2 animate-in fade-in duration-300 shadow-lg">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Harvest batch logged successfully! Unique Batch ID & QR Code generated.</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          
          {/* =========================================================================
              LOG NEW HARVEST FORM (LEFT CARD - 6 COLS)
             ========================================================================= */}
          <div className="lg:col-span-6 bg-[#FFFCF5] border border-[#DADFCF] rounded-[24px] p-6 sm:p-7 shadow-sm space-y-5">
            <div className="pb-3 border-b border-[#DADFCF]">
              <h2 className="text-base font-extrabold text-[#607D5B] flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#607D5B]" /> Log New Harvest Batch
              </h2>
            </div>

            <form onSubmit={handleRegisterHarvest} className="space-y-4 text-xs">
              
              {/* FIELD 1: Crop Category Dropdown */}
              <div>
                <label className="text-stone-500 font-bold uppercase text-[10px] tracking-wider block mb-1.5">
                  Crop Category *
                </label>
                <div className="relative">
                  <select
                    value={cropCategory}
                    onChange={(e) => setCropCategory(e.target.value)}
                    className="w-full bg-[#F2EFE8] border border-[#E3DFD5] rounded-2xl pl-4 pr-10 py-3 text-stone-800 focus:outline-none focus:border-[#607D5B] transition cursor-pointer appearance-none text-xs font-semibold"
                  >
                    <option value="Fruits">Fruits</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Grains">Grains & Pulses</option>
                    <option value="Cash Crops">Cash Crops (Cotton, Sugarcane)</option>
                    <option value="Spices">Spices & Herbs</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-500">
                    <ChevronDown className="w-4 h-4 text-stone-500" />
                  </div>
                </div>
              </div>

              {/* FIELD 2: Crop Name */}
              <div>
                <label className="text-stone-500 font-bold uppercase text-[10px] tracking-wider block mb-1.5">
                  Crop Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    placeholder="e.g. Mangoes, Rice, Wheat"
                    className="w-full bg-[#F2EFE8] border border-[#E3DFD5] rounded-2xl pl-4 pr-12 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#607D5B] transition text-xs font-semibold"
                    required
                  />

                </div>
              </div>

              {/* Quantity & Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-500 font-bold uppercase text-[10px] tracking-wider block mb-1.5">
                    Harvest Volume (kg) *
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 31"
                    className="w-full bg-[#F2EFE8] border border-[#E3DFD5] rounded-2xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#607D5B] transition text-xs font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-stone-500 font-bold uppercase text-[10px] tracking-wider block mb-1.5">
                    Selling Price (₹/kg) *
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 12"
                    className="w-full bg-[#F2EFE8] border border-[#E3DFD5] rounded-2xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#607D5B] transition text-xs font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    required
                  />
                </div>
              </div>

              {/* CUSTOM DATE PICKER */}
              <div className="relative" ref={calendarRef}>
                <label className="text-stone-500 font-bold uppercase text-[10px] tracking-wider block mb-1.5">
                  Harvest Date *
                </label>
                
                <div
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className="w-full bg-[#F2EFE8] border border-[#E3DFD5] rounded-2xl px-4 py-3 flex items-center justify-between cursor-pointer hover:border-[#607D5B]/50 transition text-xs"
                >
                  <span className="font-semibold text-stone-800">{formattedDateDisplay}</span>
                  <CalendarIcon className="w-4 h-4 text-stone-500 shrink-0" />
                </div>

                {isCalendarOpen && (
                  <div className="absolute left-0 top-full mt-2 z-50 w-72 bg-white border border-[#E3DFD5] rounded-2xl p-4 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
                    
                    <div className="flex items-center justify-between pb-2 border-b border-[#E3DFD5]">
                      <span className="font-extrabold text-stone-800 text-xs sm:text-sm">
                        {monthNames[selectedMonth]}, {selectedYear}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handlePrevMonth}
                          className="p-1 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={handleNextMonth}
                          className="p-1 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-stone-500">
                      <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                      {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                        <div key={`blank-${i}`} />
                      ))}

                      {Array.from({ length: daysInMonth }).map((_, idx) => {
                        const dayNum = idx + 1;
                        const isSelected = dayNum === selectedDay;
                        const isToday = dayNum === today.getDate() && selectedMonth === today.getMonth() && selectedYear === today.getFullYear();

                        return (
                          <button
                            key={dayNum}
                            type="button"
                            onClick={() => {
                              setSelectedDay(dayNum);
                              setIsCalendarOpen(false);
                            }}
                            className={`py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                              isSelected
                                ? "bg-[#7CA971] text-white font-extrabold shadow-sm"
                                : isToday
                                ? "border border-[#607D5B]/50 text-[#607D5B]"
                                : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                            }`}
                          >
                            {dayNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Harvest Batch Image Upload */}
              <div>
                <label className="text-stone-500 font-bold uppercase text-[10px] tracking-wider block mb-1.5">
                  Crop Photo *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={imageInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {cropImage ? (
                  <div className="relative rounded-2xl overflow-hidden border border-[#E3DFD5] bg-[#F2EFE8] p-2 group">
                    <img
                      src={cropImage}
                      alt="Harvest Crop Preview"
                      className="w-full h-36 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setCropImage(null)}
                      className="absolute top-4 right-4 p-1.5 rounded-full bg-white/80 text-stone-500 hover:text-stone-800 border border-[#E3DFD5] transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    className="border-2 border-dashed border-[#E3DFD5] hover:border-[#607D5B]/50 bg-[#F2EFE8]/50 rounded-2xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
                  >
                    <div className="p-3 bg-white rounded-xl text-stone-500 group-hover:text-[#607D5B] group-hover:bg-[#7CA971]/10 transition shadow-sm border border-[#E3DFD5]">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-800 group-hover:text-[#607D5B] transition">
                        Click to upload crop photo
                      </p>
                      <p className="text-[10px] text-stone-500 mt-0.5">
                        PNG, JPG or WEBP (Displays on crop card)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-[#7CA971] hover:bg-[#607D5B] text-white font-extrabold text-xs transition cursor-pointer shadow-md shadow-[#7CA971]/20 flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4.5 h-4.5" />
                  <span>Save & Register Harvest Batch</span>
                </button>
              </div>

            </form>

            {/* BATCH INFORMATION SECTION */}
            <details className="mt-6 group bg-[#F9F7F1] border border-[#E3DFD5] rounded-2xl shadow-sm transition-all duration-300">
              <summary className="p-5 flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden border-b border-transparent group-open:border-[#E3DFD5]">
                <div className="flex items-center gap-2">
                  <QrIcon className={`w-5 h-5 ${newBatchInfo ? "text-[#607D5B]" : "text-stone-400"}`} />
                  <h3 className="text-sm font-extrabold text-stone-800">Batch Information</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    newBatchInfo 
                      ? "bg-white text-[#607D5B] border-[#607D5B]/30" 
                      : "bg-white text-stone-500 border-stone-200"
                  }`}>
                    {newBatchInfo ? "Generated & Live" : "Pending Save"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-stone-500 transition-transform group-open:rotate-180" />
                </div>
              </summary>
              
              <div className="p-5 pt-0 mt-4">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {newBatchInfo ? (
                    <div className="p-2 bg-white rounded-2xl shadow-sm shrink-0 border border-[#E3DFD5] animate-in zoom-in-95 duration-200">
                      <img src={newBatchInfo.qr} alt={`QR Code for ${newBatchInfo.id}`} className="w-28 h-28 object-contain" />
                    </div>
                  ) : (
                    <div className="w-28 h-28 border-2 border-dashed border-[#E3DFD5] bg-white rounded-2xl shrink-0 flex items-center justify-center">
                      <QrIcon className="w-10 h-10 text-stone-300" />
                    </div>
                  )}

                  <div className="space-y-2 flex-1 text-center sm:text-left">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-stone-500 block">Batch ID</span>
                      {newBatchInfo ? (
                        <span className="text-base font-extrabold text-stone-800">{newBatchInfo.id}</span>
                      ) : (
                        <span className="text-sm font-bold text-stone-500">BATCH-ID-PENDING</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </details>
          </div>

          {/* =========================================================================
              MY INVENTORY SECTION (RIGHT CARD - 6 COLS WITH SALES HISTORY TAB)
             ========================================================================= */}
          <div className="lg:col-span-6 bg-[#FFFCF5] border border-[#DADFCF] rounded-[24px] p-6 sm:p-7 shadow-sm space-y-5">
            <div className="pb-3 border-b border-[#DADFCF]">
              <h2 className="text-base font-extrabold text-[#607D5B] flex items-center gap-2">
                <Package className="w-5 h-5" /> My Inventory
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              {activeInventory.length === 0 ? (
                <div className="col-span-full p-8 text-center text-stone-500 text-xs">
                  No active harvest batches available. Log a batch using the form on the left.
                </div>
              ) : (
                paginatedInventory.map((item) => {
                  const imgUrl = item.cropImage || getCropImage(item);
                  return (
                    <div
                      key={item.id}
                      className={`bg-white border rounded-3xl p-4 space-y-3.5 shadow-sm transition-all duration-300 flex flex-col justify-between ${
                        item.isSold
                          ? "border-[#E3DFD5] bg-[#F2EFE8]/60 opacity-80"
                          : "border-[#E3DFD5] hover:border-[#607D5B]/40 hover:shadow-xl hover:shadow-[#607D5B]/5"
                      }`}
                    >
                      {/* TOP IMAGE CONTAINER WITH OVERLAY BADGES */}
                      <div className="relative rounded-2xl overflow-hidden h-44 w-full bg-[#F2EFE8] border border-[#E3DFD5] group">
                        <img
                          src={imgUrl}
                          alt={item.cropName}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        
                        {/* Batch ID Pill (Top-Left Overlay) */}
                        <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-md text-[#607D5B] font-mono text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-[#E3DFD5] shadow-sm">
                          {item.id}
                        </div>

                        {/* Status Pill (Top-Right Overlay) */}
                        <div className={`absolute top-2.5 right-2.5 text-[9px] font-extrabold px-2.5 py-1 rounded-full border backdrop-blur-md shadow-sm ${
                          item.isSold
                            ? 'bg-blue-100 text-blue-600 border-blue-200 font-black'
                            : item.status === 'Listed'
                            ? 'bg-[#7CA971] text-white border-[#607D5B]/50'
                            : 'bg-white/90 text-stone-500 border-[#E3DFD5]'
                        }`}>
                          {item.isSold ? 'Sold' : item.status}
                        </div>
                      </div>

                      {/* TITLE & CATEGORY */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <div className="space-y-0.5 truncate">
                          <span className="text-[9px] font-extrabold uppercase tracking-widest text-stone-500 block">
                            {item.category}
                          </span>
                          <h3 className="text-sm font-black text-stone-800 leading-tight truncate">
                            {item.cropName}
                          </h3>
                        </div>

                        {!item.isSold && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => alert(`Editing ${item.cropName}`)}
                              className="p-1.5 rounded-xl bg-[#F2EFE8] hover:bg-[#E3DFD5] text-stone-500 hover:text-stone-800 border border-[#E3DFD5] transition cursor-pointer"
                              title="Edit Batch"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 rounded-xl bg-[#F2EFE8] hover:bg-red-50 text-stone-500 hover:text-red-500 border border-[#E3DFD5] transition cursor-pointer"
                              title="Delete Batch"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* INNER DETAILS BOX */}
                      <details className="group mt-1">
                        <summary className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-widest text-stone-500 hover:text-[#607D5B] cursor-pointer list-none [&::-webkit-details-marker]:hidden py-1 border-b border-[#E3DFD5]/50 transition-colors">
                          <span>Batch Details</span>
                          <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="mt-2 p-3.5 bg-[#F9F7F1] border border-[#E3DFD5] rounded-2xl space-y-2 text-[11px]">
                          <div className="flex justify-between items-center text-stone-600">
                            <span className="text-stone-500 font-medium">Batch Volume:</span>
                            <strong className="text-stone-800 font-extrabold">{item.quantity}</strong>
                          </div>
                          <div className="flex justify-between items-center text-stone-600">
                            <span className="text-stone-500 font-medium">Price per Unit:</span>
                            <strong className="text-stone-800 font-bold">{item.pricePerKg}</strong>
                          </div>

                          {item.isSold ? (
                            <>
                              <div className="flex justify-between items-center text-stone-600 border-t border-[#E3DFD5] pt-1.5">
                                <span className="text-stone-500 font-medium">Purchaser:</span>
                                <strong className="text-[#607D5B] font-bold text-[10px] truncate max-w-[120px]">
                                  {item.soldTo || "AgroProc Hub"}
                                </strong>
                              </div>
                              <div className="flex justify-between items-center text-stone-600">
                                <span className="text-stone-500 font-medium">Date Sold:</span>
                                <span className="text-stone-600 font-mono text-[10px]">{item.soldDate || item.harvestDate}</span>
                              </div>
                              <div className="flex justify-between items-center text-stone-600">
                                <span className="text-stone-500 font-medium">Total Earned:</span>
                                <strong className="text-stone-800 font-black text-xs">{item.totalSaleValue || "₹3,720"}</strong>
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-between items-center text-stone-600">
                              <span className="text-stone-500 font-medium">Harvest Date:</span>
                              <span className="text-stone-600 font-mono text-[10px]">{item.harvestDate}</span>
                            </div>
                          )}
                        </div>
                      </details>

                      {/* ACTION BAR */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleInventoryQrClick(item)}
                          className="py-2.5 px-3 rounded-xl bg-[#F2EFE8] hover:bg-[#E3DFD5] border border-[#E3DFD5] text-stone-700 hover:text-stone-800 font-extrabold text-[11px] transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <QrIcon className="w-3.5 h-3.5 text-[#607D5B] shrink-0" />
                          <span className="truncate">View QR</span>
                        </button>

                        {item.isSold ? (
                          <span className="py-2.5 px-3 rounded-xl bg-blue-50 text-blue-500 border border-blue-200 font-extrabold text-[11px] flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Completed</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleListStatus(item.id)}
                            className={`py-2.5 px-3 rounded-xl text-[11px] font-extrabold transition cursor-pointer border flex items-center justify-center gap-1 truncate ${
                              item.status === 'Listed'
                                ? 'bg-orange-50 hover:bg-orange-100 text-[#F9A826] border-[#F9A826]/30'
                                : 'bg-[#7CA971] hover:bg-[#607D5B] text-white border-[#7CA971] shadow-sm'
                            }`}
                          >
                            <span>{item.status === 'Listed' ? 'Unlist' : 'List Product'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {totalPagesToRender > 1 && (
              <div className="flex items-center justify-between border-t border-[#E3DFD5] pt-4 mt-6">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-[#E3DFD5] text-stone-600 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-xs font-bold text-stone-500">
                  Page {currentPage} of {totalPagesToRender}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPagesToRender, p + 1))}
                  disabled={currentPage === totalPagesToRender}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-[#E3DFD5] text-stone-600 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* VIEW QR MODAL */}
      {selectedQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-7 max-w-sm w-full text-center space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedQrModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-stone-800 text-stone-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="p-3 bg-emerald-500/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2 text-emerald-400 border border-emerald-500/20">
                <QrIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">{selectedQrModal.cropName}</h3>
              <p className="font-mono text-xs font-bold text-emerald-400 mt-1">{selectedQrModal.id}</p>
            </div>

            <div className="p-4 bg-white rounded-2xl mx-auto w-56 h-56 flex items-center justify-center shadow-inner">
              <img src={selectedQrModal.qr} alt={`QR Code ${selectedQrModal.id}`} className="w-full h-full object-contain" />
            </div>

            <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-left space-y-1">
              <span className="text-[10px] font-bold text-stone-500 uppercase block">Traceability Link</span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-stone-300 truncate">{selectedQrModal.url}</span>
                <button
                  onClick={() => copyTraceUrl(selectedQrModal.url)}
                  className="p-1 text-stone-400 hover:text-emerald-400 transition shrink-0 cursor-pointer"
                  title="Copy URL"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => downloadQrCode(selectedQrModal.qr, selectedQrModal.id)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download QR
              </button>
              <button
                onClick={() => setSelectedQrModal(null)}
                className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Close
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
