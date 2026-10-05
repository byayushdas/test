import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";
import {
  Factory,
  Boxes,
  Sprout,
  PlusCircle,
  QrCode as QrIcon,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  UploadCloud,
  X,
  Eye,
  Download,
  Copy,
  Check,
  Pencil,
  Trash2,
  Package,
  ArrowRight
} from "lucide-react";

export interface InventoryItem {
  id: string; // e.g. PROC-2026-001 or BATCH-2026-0079
  itemType: "PROCESSED" | "RAW"; // Processed Product vs Purchased Raw Crop
  productName: string;
  category: string;
  quantity: string;
  pricePerUnit: string;
  date: string;
  status: "In Stock" | "Listed" | "Processing" | "Dispatched" | "Archived";
  parentRawBatchId?: string;
  supplierFarmer?: string;
  productImage?: string;
  qrCodeUrl: string;
  processingStatus?: "Available for Processing" | "Sent for Processing" | "Fully Processed";
  sentForProcessingDate?: string;
  remainingStock?: string;
  processingQuantity?: string;
}

export default function ProductionHubPage() {
  const { data: session } = useSession();
  const processorId = (session?.user as any)?.id || (session?.user as any)?.processorId || "";
  const roleId = (session?.user as any)?.roleId || "";
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

  // Initial inventory initialized as empty array
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  useEffect(() => {
    if (!processorId) return;
    const fetchInventory = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/processor/inventory?userId=${processorId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const mapped = json.data.map((item: any) => ({
              id: item._id || item.batchId,
              itemType: item.itemType || "PROCESSED",
              productName: item.productName,
              category: item.category,
              quantity: `${item.quantity} kg`,
              pricePerUnit: `₹${item.pricePerUnit}/kg`,
              date: item.processingDate ? new Date(item.processingDate).toLocaleDateString("en-GB") : "",
              status: item.status,
              parentRawBatchId: item.parentRawBatchId,
              productImage: item.productImage || undefined,
              qrCodeUrl: item.qrCodeUrl || "",
              supplierFarmer: item.supplierFarmer,
              processingStatus: item.processingStatus,
              processingQuantity: item.processingQuantity ? `${item.processingQuantity} kg` : undefined,
              remainingStock: item.remainingStock ? `${item.remainingStock} kg` : undefined,
              consumedQuantity: item.consumedQuantity ? `${item.consumedQuantity} kg` : undefined,
              processingHistory: item.processingHistory || [],
              sentForProcessingDate: item.sentForProcessingDate ? new Date(item.sentForProcessingDate).toLocaleDateString("en-GB") : undefined
            }));
            setInventory(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to fetch processor inventory:", err);
      }
    };
    fetchInventory();
  }, [processorId]);

  // Form states for Log New Processed Item
  const [category, setCategory] = useState("Processed Grains");
  const [customCategory, setCustomCategory] = useState("");
  const [productName, setProductName] = useState("");
  const [parentRawBatchIds, setParentRawBatchIds] = useState<string[]>([]);
  const [isTransformingExisting, setIsTransformingExisting] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [productImage, setProductImage] = useState<string | null>(null);

  // Calendar Date Picker State
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);

  const calendarRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Submitted & Batch Info UI states
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [newBatchInfo, setNewBatchInfo] = useState<{ id: string; qr: string; url: string } | null>(null);
  const [selectedQrModal, setSelectedQrModal] = useState<InventoryItem | null>(null);
  const [processingModalItem, setProcessingModalItem] = useState<InventoryItem | null>(null);
  const [sendAmount, setSendAmount] = useState<string>("");
  const [sendError, setSendError] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  // Month Names Array
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Calendar Date Calculations
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay();

  const formattedDateDisplay = `${String(selectedDay).padStart(2, '0')}/${String(selectedMonth + 1).padStart(2, '0')}/${selectedYear}`;

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

  // Close calendar dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Default Image Fallbacks
  const getProductImage = (item: InventoryItem) => {
    return item.productImage || "";
  };

  // Register New Processed Product
  const handleRegisterProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !quantity || !price) return;

    const finalCategory = category === "Others" ? (customCategory.trim() || "Others") : category;
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    let newBatchId = `BATCH-2026-${randomDigits}`;
    if (parentRawBatchIds.length === 1) {
      const rawBatch = inventory.find(i => i.id === parentRawBatchIds[0]);
      if (rawBatch && rawBatch.parentRawBatchId) {
        newBatchId = rawBatch.parentRawBatchId;
      }
    }
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${newBatchId}`;
    const traceUrl = `https://seed2shelf.app/trace/${newBatchId}`;

    const dateToSave = new Date(selectedYear, selectedMonth, selectedDay).toISOString();

    const processSave = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/processor/inventory`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: processorId,
            roleId: roleId,
            productName,
            category: finalCategory,
            quantity: quantity,
            pricePerUnit: price,
            parentRawBatchIds: parentRawBatchIds,
            isTransformingExisting,
            productImage: productImage || getProductImage({ category: finalCategory } as any),
            qrCodeUrl: qrUrl,
            traceUrl: traceUrl,
            processingDate: dateToSave,
            batchId: newBatchId
          })
        });

        if (res.ok) {
          const json = await res.json();
          const serverItem = json.data || {};
          
          const farmerBatchIds = parentRawBatchIds.map(rawId => {
            const b = inventory.find(i => i.id === rawId);
            return b ? (b.parentRawBatchId || b.id) : rawId;
          });

          const newItem: InventoryItem = {
            id: serverItem._id || newBatchId,
            itemType: "PROCESSED",
            productName,
            category: finalCategory,
            quantity: `${quantity} kg`,
            pricePerUnit: `₹${price}/kg`,
            date: formattedDateDisplay,
            status: "In Stock",
            parentRawBatchId: farmerBatchIds.length > 0 ? farmerBatchIds[0] : undefined,
            productImage: productImage || getProductImage({ category: finalCategory } as any),
            qrCodeUrl: serverItem.qrCodeUrl || qrUrl
          };

          setInventory(prev => {
            const updatedPrev = prev.map(item => {
              if (parentRawBatchIds.includes(item.id)) {
                return {
                  ...item,
                  processingStatus: "Sent for Processing" as any,
                  remainingStock: `0 kg`,
                  processingQuantity: `0 kg`
                };
              }
              return item;
            });
            
            return [newItem, ...updatedPrev];
          });
          setNewBatchInfo({
            id: serverItem._id || newBatchId,
            qr: serverItem.qrCodeUrl || qrUrl,
            url: serverItem.traceUrl || traceUrl
          });
          setSubmitted(true);
          setTimeout(() => setSubmitted(false), 5000);

          // Reset Form
          setProductName("");
          setCustomCategory("");
          setQuantity("");
          setPrice("");
          setProductImage(null);
          setParentRawBatchIds([]);
          setIsTransformingExisting(false);
        }
      } catch (err) {
        console.error("Error saving processed product:", err);
      }
    };

    processSave();

  };

  // Toggle List / Unlist Status
  const handleToggleListStatus = async (id: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/processor/inventory/${id}/list`, { method: "PUT" });
      if (res.ok) {
        setInventory(
          inventory.map((item) => {
            if (item.id === id) {
              const newStatus = item.status === "Listed" ? "In Stock" : "Listed";
              return { ...item, status: newStatus };
            }
            return item;
          })
        );
      }
    } catch (err) {
      console.error("Error toggling list status:", err);
    }
  };

  // Delete Item
  const handleDeleteItem = async (id: string) => {
    if (confirm("Are you sure you want to remove this item from your inventory?")) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/processor/inventory/${id}`, { method: "DELETE" });
        if (res.ok) {
          setInventory(inventory.filter((item) => item.id !== id));
        }
      } catch (err) {
        console.error("Error deleting item:", err);
      }
    }
  };

  // Download QR Code
  const downloadQrCode = (qrUrl: string, batchId: string) => {
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = `QR-${batchId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Traceability URL
  const copyTraceUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to extract numeric quantity and unit string (e.g. "300 kg" -> { num: 300, unit: "kg" })
  const parseQuantityAndUnit = (str: string | undefined) => {
    if (!str) return { num: 0, unit: "kg" };
    const match = str.trim().match(/^([\d.]+)\s*(.*)$/);
    if (match) {
      return { num: parseFloat(match[1]) || 0, unit: match[2] || "kg" };
    }
    return { num: parseFloat(str) || 0, unit: "kg" };
  };

  // Open modal to set custom quantity/limit for processing
  const handleOpenProcessingModal = (item: InventoryItem) => {
    setProcessingModalItem(item);
    const { num: availNum } = parseQuantityAndUnit(item.remainingStock || item.quantity);
    setSendAmount(availNum > 0 ? String(availNum) : "");
    setSendError("");
  };

  // Confirm sending set quantity for processing
  const handleConfirmSendForProcessing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processingModalItem) return;

    const { num: availNum, unit } = parseQuantityAndUnit(
      processingModalItem.remainingStock || processingModalItem.quantity
    );
    const amountToSendNum = parseFloat(sendAmount);

    if (isNaN(amountToSendNum) || amountToSendNum <= 0) {
      setSendError("Please enter a valid quantity greater than 0.");
      return;
    }

    if (amountToSendNum > availNum) {
      setSendError(`Cannot send more than available stock (${availNum} ${unit}).`);
      return;
    }

    const itemId = processingModalItem.id;
    const { num: currentRemainingNum, unit: u } = parseQuantityAndUnit(processingModalItem.remainingStock || processingModalItem.quantity);
    const { num: currentProcNum } = parseQuantityAndUnit(processingModalItem.processingQuantity);

    const newRemainingNum = Math.max(0, currentRemainingNum - amountToSendNum);
    const newProcNum = currentProcNum + amountToSendNum;
    const newStatus = newRemainingNum === 0 ? "Fully Processed" : "Sent for Processing";
    const sentDate = new Date().toISOString();

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/processor/inventory/${itemId}/processing-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processingStatus: newStatus,
          remainingStock: newRemainingNum,
          processingQuantity: newProcNum,
          sentForProcessingDate: sentDate
        })
      });

      if (res.ok) {
        setInventory((prev) =>
          prev.map((item) => {
            if (item.id === itemId) {
              return {
                ...item,
                processingStatus: newStatus,
                sentForProcessingDate: new Date(sentDate).toLocaleDateString("en-GB"),
                remainingStock: `${newRemainingNum} ${u}`,
                processingQuantity: `${newProcNum} ${u}`
              };
            }
            return item;
          })
        );
        setProcessingModalItem(null);
        setSendAmount("");
        setSendError("");
      } else {
        setSendError("Failed to update status on server.");
      }
    } catch (err) {
      console.error("Error updating processing status:", err);
      setSendError("Network error. Please try again.");
    }
  };

  // Revoke/Reset processing status back to available
  const handleRevokeProcessing = async (id: string) => {
    if (confirm("Are you sure you want to reset processing status for this batch? All processing volume will be returned to available stock.")) {
      const itemToReset = inventory.find(i => i.id === id);
      if (!itemToReset) return;

      const { num: totalNum, unit } = parseQuantityAndUnit(itemToReset.quantity);

      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/processor/inventory/${id}/processing-status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            processingStatus: "Available for Processing",
            remainingStock: totalNum,
            processingQuantity: 0,
            sentForProcessingDate: null
          })
        });

        if (res.ok) {
          setInventory((prev) =>
            prev.map((item) => {
              if (item.id === id) {
                return {
                  ...item,
                  processingStatus: "Available for Processing",
                  sentForProcessingDate: undefined,
                  remainingStock: `${totalNum} ${unit}`,
                  processingQuantity: `0 ${unit}`
                };
              }
              return item;
            })
          );
        }
      } catch (err) {
        console.error("Error resetting processing status:", err);
      }
    }
  };

  // Filtered inventory list
  const filteredInventory = inventory.filter((item) => {
    return item.itemType === "PROCESSED";
  });

  return (
    <div className="min-h-screen text-stone-100 font-sans pb-24 pt-6 px-4 sm:px-6 lg:px-8 relative z-20">
      <Head>
        <title>Production Hub | Seed2Shelf Processor</title>
        <meta name="description" content="Transform raw farmer crops into processed goods with blockchain traceability." />
      </Head>

      {/* Solid Dark Background Overlay */}

      <div className="max-w-6xl mx-auto space-y-7">
        
        {/* =========================================================================
            HEADER (BORDER TOP & BOTTOM - MATCHING PURCHASE ORDERS STYLE)
           ========================================================================= */}
        <div className="flex items-center gap-3.5 border-y border-stone-800/80 py-3.5">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 shrink-0">
            <Factory className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Production Hub
            </h1>
          </div>
        </div>

        {submitted && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-400 font-bold flex items-center gap-2 animate-in fade-in duration-300 shadow-lg">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Processed product registered successfully! Transformed QR Code generated.</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
          
          {/* =========================================================================
              LOG NEW PROCESSED ITEM FORM (LEFT CARD - 6 COLS)
             ========================================================================= */}
          <div className="lg:col-span-6 bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
            <div className="pb-3 border-b border-stone-800">
              <h2 className="text-base font-extrabold text-emerald-400 flex items-center gap-2">
                <PlusCircle className="w-5 h-5" /> Log New Processed Item
              </h2>
            </div>

            <form onSubmit={handleRegisterProduct} className="space-y-4 text-xs">
              
              {/* FIELD 1: Product Category Dropdown */}
              <div>
                <label className="text-stone-400 font-bold uppercase text-[10px] tracking-wider block mb-1.5">
                  Product Category *
                </label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-2xl pl-4 pr-10 py-3 text-white focus:outline-none focus:border-emerald-500 transition cursor-pointer appearance-none text-xs font-semibold"
                  >
                    <option value="Processed Grains">Processed Grains</option>
                    <option value="Fruit Extracts">Fruit Extracts</option>
                    <option value="Flours & Starches">Flours & Starches</option>
                    <option value="Packaged Foods">Packaged Foods</option>
                    <option value="Organic Oils">Organic Oils</option>
                    <option value="Others">Others</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                    <ChevronDown className="w-4 h-4 text-stone-400" />
                  </div>
                </div>

                {category === "Others" && (
                  <div className="mt-2.5">
                    <label className="text-stone-400 font-bold uppercase text-[10px] tracking-wider block mb-1.5">
                      Specify Custom Category *
                    </label>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="e.g. Spices & Seasonings"
                      className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-3 text-white placeholder-stone-600 focus:outline-none focus:border-emerald-500 transition text-xs font-semibold"
                      required
                    />
                  </div>
                )}
              </div>

              {/* FIELD 2: Product Name */}
              <div>
                <label className="text-stone-400 font-bold uppercase text-[10px] tracking-wider block mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Refined Basmati Flour (5kg Bags)"
                  className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-3 text-white placeholder-stone-600 focus:outline-none focus:border-emerald-500 transition text-xs font-semibold"
                  required
                />
              </div>

              {/* FIELD 3: Linked Parent Farmer Crop Batch */}
              <div>
                <label className="text-stone-500 font-bold uppercase text-[10px] tracking-wider block mb-1.5">
                  Source Raw Material Batches (Select multiple to combine) *
                </label>
                <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
                  {inventory.filter(i => i.itemType === "RAW" && i.processingStatus !== "Fully Processed" && parseQuantityAndUnit(i.remainingStock || i.quantity).num > 0).length === 0 ? (
                    <div className="text-stone-500 text-xs italic">No available raw batches.</div>
                  ) : (
                    inventory.filter(i => i.itemType === "RAW" && i.processingStatus !== "Fully Processed" && parseQuantityAndUnit(i.remainingStock || i.quantity).num > 0).map((raw) => {
                      return (
                        <label key={raw.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-stone-900/50 transition group">
                          <input
                            type="checkbox"
                            checked={parentRawBatchIds.includes(raw.id)}
                            onChange={(e) => {
                              if (e.target.checked) setParentRawBatchIds(prev => [...prev, raw.id]);
                              else setParentRawBatchIds(prev => prev.filter(id => id !== raw.id));
                            }}
                            className="w-4 h-4 rounded border-stone-700 bg-stone-950 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
                          />
                          <div className="flex-1">
                            <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition">{raw.parentRawBatchId || raw.id} - {raw.productName}</span>
                            <span className="text-[10px] font-semibold text-stone-500 ml-2">({raw.remainingStock || raw.quantity} available)</span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
                {/* Full Consumption QR Transform Option */}
                {parentRawBatchIds.length === 1 && (
                  <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isTransformingExisting}
                      onChange={(e) => setIsTransformingExisting(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded-md border-emerald-700 bg-emerald-950 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-stone-950"
                    />
                    <div className="flex-1">
                      <label className="text-xs font-bold text-emerald-400 block cursor-pointer" onClick={() => setIsTransformingExisting(!isTransformingExisting)}>
                        Link Existing QR Code
                      </label>
                      <p className="text-[10px] text-stone-400 mt-1 leading-relaxed font-medium">
                        Since you are converting this single batch, you can link the original farmer crop QR code to this new processed product. The physical QR code will be preserved for complete traceability.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity & Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-400 font-bold uppercase text-[10px] tracking-wider block mb-1.5">
                    Processed Volume (kg) *
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-3 text-white placeholder-stone-600 focus:outline-none focus:border-emerald-500 transition text-xs font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-stone-400 font-bold uppercase text-[10px] tracking-wider block mb-1.5">
                    Selling Price (₹/kg) *
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 65"
                    className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-3 text-white placeholder-stone-600 focus:outline-none focus:border-emerald-500 transition text-xs font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    required
                  />
                </div>
              </div>

              {/* CUSTOM DATE PICKER */}
              <div className="relative" ref={calendarRef}>
                <label className="text-stone-400 font-bold uppercase text-[10px] tracking-wider block mb-1.5">
                  Processing Date *
                </label>
                
                <div
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-3 text-white flex items-center justify-between cursor-pointer hover:border-emerald-500/50 transition text-xs"
                >
                  <span className="font-semibold text-stone-200">{formattedDateDisplay}</span>
                  <CalendarIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                </div>

                {isCalendarOpen && (
                  <div className="absolute left-0 top-full mt-2 z-50 w-72 bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
                    
                    <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                      <span className="font-extrabold text-white text-xs sm:text-sm">
                        {monthNames[selectedMonth]}, {selectedYear}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handlePrevMonth}
                          className="p-1 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition cursor-pointer"
                          title="Previous Month"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={handleNextMonth}
                          className="p-1 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition cursor-pointer"
                          title="Next Month"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-stone-400">
                      <span>Su</span>
                      <span>Mo</span>
                      <span>Tu</span>
                      <span>We</span>
                      <span>Th</span>
                      <span>Fr</span>
                      <span>Sa</span>
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
                                ? "bg-emerald-600 text-white font-extrabold shadow-sm"
                                : isToday
                                ? "border border-emerald-500/50 text-emerald-400"
                                : "text-stone-300 hover:bg-stone-800 hover:text-white"
                            }`}
                          >
                            {dayNum}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDay(today.getDate());
                          setSelectedMonth(today.getMonth());
                          setSelectedYear(today.getFullYear());
                          setIsCalendarOpen(false);
                        }}
                        className="text-emerald-400 hover:text-emerald-300 font-bold"
                      >
                        Today
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsCalendarOpen(false)}
                        className="text-stone-400 hover:text-stone-200"
                      >
                        Close
                      </button>
                    </div>

                  </div>
                )}
              </div>

              {/* Processed Product Photo Upload */}
              <div>
                <label className="text-stone-400 font-bold uppercase text-[10px] tracking-wider block mb-1.5">
                  Processed Product Photo *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={imageInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {productImage ? (
                  <div className="relative rounded-2xl overflow-hidden border border-stone-800 bg-stone-950 p-2 group">
                    <img
                      src={productImage}
                      alt="Processed Product Preview"
                      className="w-full h-36 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setProductImage(null)}
                      className="absolute top-4 right-4 p-1.5 rounded-full bg-stone-950/80 text-stone-300 hover:text-white border border-stone-800 transition cursor-pointer"
                      title="Remove Image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    className="border-2 border-dashed border-stone-800 hover:border-emerald-500/50 bg-stone-950/80 rounded-2xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
                  >
                    <div className="p-3 bg-stone-900 rounded-xl text-stone-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition">
                        Click to upload product image photo
                      </p>
                      <p className="text-[10px] text-stone-500 mt-0.5">
                        PNG, JPG or WEBP (Displays on product card)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition cursor-pointer shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4.5 h-4.5" />
                  <span>
                    {isTransformingExisting
                      ? "Update the Batch"
                      : "Save & Register Processed Item"}
                  </span>
                </button>
              </div>

            </form>

            {/* BATCH INFORMATION SECTION */}
            {(() => {
              const selectedParentRaw = (isTransformingExisting && parentRawBatchIds.length === 1)
                ? inventory.find(i => i.id === parentRawBatchIds[0])
                : null;
              const displayedQrUrl = newBatchInfo
                ? newBatchInfo.qr
                : selectedParentRaw
                ? (selectedParentRaw.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${selectedParentRaw.id}`)
                : null;
              const displayedBatchId = newBatchInfo
                ? newBatchInfo.id
                : selectedParentRaw
                ? (selectedParentRaw.parentRawBatchId || selectedParentRaw.id)
                : parentRawBatchIds.length === 0
                ? "SELECT-SOURCE-BATCH"
                : "NEW-BATCH-GEN";

              return (
                <div className="mt-6 p-5 bg-stone-950 border border-stone-800 rounded-2xl space-y-4 shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <QrIcon className={`w-5 h-5 ${displayedQrUrl ? "text-emerald-400" : "text-stone-600"}`} />
                      <h3 className="text-sm font-extrabold text-white">Batch Information</h3>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      newBatchInfo || selectedParentRaw
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-stone-900 text-stone-500 border-stone-800"
                    }`}>
                      {newBatchInfo ? "Generated & Live" : selectedParentRaw ? "Loaded Previous QR" : "Pending Selection"}
                    </span>
                  </div>

                  {/* DYNAMIC LINEAGE CALLOUT FOR PREVIOUS BATCH */}
                  {selectedParentRaw && (
                    <div className="p-3.5 bg-stone-900 border border-emerald-500/30 rounded-xl text-xs space-y-1.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between text-emerald-400 font-bold">
                        <span>Source Batch Lineage: {selectedParentRaw.parentRawBatchId || selectedParentRaw.id}</span>
                        <span className="text-[10px] text-stone-400">Previous Data Loaded</span>
                      </div>
                      <p className="text-stone-300 text-[11px] leading-relaxed">
                        Previous data stored under <strong className="text-white font-mono">{selectedParentRaw.parentRawBatchId || selectedParentRaw.id}</strong> ({selectedParentRaw.productName}) has been loaded. Clicking <strong className="text-emerald-400">Update the Batch</strong> will save the new processed run under this batch ID.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    {displayedQrUrl ? (
                      <div className="p-2 bg-white rounded-2xl shadow-md shrink-0 border border-stone-700 animate-in zoom-in-95 duration-200">
                        <img src={displayedQrUrl} alt={`QR Code for ${displayedBatchId}`} className="w-28 h-28 object-contain" />
                      </div>
                    ) : (
                      <div className="w-28 h-28 border-2 border-dashed border-stone-800/80 bg-stone-950/80 rounded-2xl shrink-0 flex items-center justify-center">
                        <QrIcon className="w-10 h-10 text-stone-700/70" />
                      </div>
                    )}

                    <div className="space-y-2 flex-1 text-center sm:text-left">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-stone-500 block">Batch ID</span>
                        <span className={`font-extrabold ${displayedQrUrl ? "text-base text-emerald-400" : "text-sm text-stone-600"}`}>
                          {displayedBatchId}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2 justify-center sm:justify-start">
                        {displayedQrUrl ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setSelectedQrModal(inventory.find(i => i.id === displayedBatchId) || ({ id: displayedBatchId, qrCodeUrl: displayedQrUrl, productName, category: "Processed", quantity: `${quantity} kg`, pricePerUnit: `₹${price}/kg`, date: formattedDateDisplay, status: "In Stock" } as any))}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View QR</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadQrCode(displayedQrUrl, displayedBatchId)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-extrabold text-xs transition cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download QR</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              disabled
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 text-stone-600 border border-stone-800 text-xs font-bold cursor-not-allowed opacity-70"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View QR</span>
                            </button>
                            <button
                              type="button"
                              disabled
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 text-stone-600 border border-stone-800 text-xs font-bold cursor-not-allowed opacity-70"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download QR</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* =========================================================================
              MY INVENTORY SECTION (RIGHT CARD - 6 COLS)
             ========================================================================= */}
          <div className="lg:col-span-6 bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
            <div className="pb-3 border-b border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-base font-extrabold text-emerald-400 flex items-center gap-2">
                <Package className="w-5 h-5" /> My Inventory
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {inventory.filter(i => i.itemType === "PROCESSED" && i.status !== "Dispatched" && i.status !== "Archived").length === 0 ? (
                <div className="col-span-full p-8 text-center text-stone-400 text-xs">
                  No active processed product items registered yet.
                </div>
              ) : (
                inventory.filter(i => i.itemType === "PROCESSED" && i.status !== "Dispatched" && i.status !== "Archived").map((item) => {
                  const imgUrl = getProductImage(item);
                  return (
                    <div
                      key={item.id}
                      className="bg-stone-900/90 border border-stone-800 hover:border-emerald-500/40 rounded-3xl p-4 space-y-3.5 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div className="relative rounded-2xl overflow-hidden h-44 w-full bg-stone-950 border border-stone-800/80 group">
                        {getProductImage(item) && <img
                          src={getProductImage(item)}
                          alt={item.productName}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />}
                        <div className="absolute top-2.5 left-2.5 bg-stone-950/90 backdrop-blur-md text-emerald-400 font-mono text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-500/30 shadow-md">
                          {item.id}
                        </div>
                        <div className={`absolute top-2.5 right-2.5 text-[9px] font-extrabold px-2.5 py-1 rounded-full border backdrop-blur-md shadow-md ${
                          item.status === 'Listed'
                            ? 'bg-emerald-500/90 text-black border-emerald-400 font-black'
                            : 'bg-stone-900/90 text-stone-300 border-stone-700'
                        }`}>
                          {item.status}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <div className="space-y-0.5 truncate">
                          <span className="text-[9px] font-extrabold uppercase tracking-widest text-stone-400 block">
                            {item.category}
                          </span>
                          <h3 className="text-sm font-black text-white leading-tight truncate">
                            {item.productName}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => alert(`Editing ${item.productName}`)}
                            className="p-1.5 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-white border border-stone-800 transition cursor-pointer"
                            title="Edit Item"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 rounded-xl bg-stone-950 hover:bg-red-500/20 text-stone-400 hover:text-red-400 border border-stone-800 transition cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="p-3.5 bg-stone-950/80 border border-stone-800/90 rounded-2xl space-y-2 text-[11px]">
                        <div className="flex justify-between items-center text-stone-300">
                          <span className="text-stone-400 font-medium">Batch Volume:</span>
                          <strong className="text-emerald-400 font-extrabold">{item.quantity}</strong>
                        </div>
                        <div className="flex justify-between items-center text-stone-300">
                          <span className="text-stone-400 font-medium">Price per Unit:</span>
                          <strong className="text-white font-bold">{item.pricePerUnit}</strong>
                        </div>
                        {item.parentRawBatchId && (
                          <div className="flex justify-between items-center text-stone-300">
                            <span className="text-stone-400 font-medium">Linked Raw Batch:</span>
                            <strong className="font-mono text-stone-200 text-[10px]">{item.parentRawBatchId}</strong>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-stone-300">
                          <span className="text-stone-400 font-medium">Date:</span>
                          <span className="text-stone-300 font-mono text-[10px]">{item.date}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setSelectedQrModal(item)}
                          className="py-2.5 px-3 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-200 hover:text-white font-extrabold text-[11px] transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <QrIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">View QR</span>
                        </button>
                        <button
                          onClick={() => handleToggleListStatus(item.id)}
                          className={`py-2.5 px-3 rounded-xl text-[11px] font-extrabold transition cursor-pointer border flex items-center justify-center gap-1 truncate ${
                            item.status === 'Listed'
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-black border-emerald-400 font-black shadow-md shadow-emerald-500/10'
                          }`}
                        >
                          <span>{item.status === 'Listed' ? 'Unlist' : 'List Product'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>



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
              <h3 className="text-lg font-black text-white">{selectedQrModal.productName}</h3>
              <p className="font-mono text-xs font-bold text-emerald-400 mt-1">{selectedQrModal.id}</p>
            </div>

            <div className="p-4 bg-white rounded-2xl mx-auto w-56 h-56 flex items-center justify-center shadow-inner">
              <img src={selectedQrModal.qrCodeUrl} alt={`QR Code ${selectedQrModal.id}`} className="w-full h-full object-contain" />
            </div>

            <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-left space-y-1">
              <span className="text-[10px] font-bold text-stone-500 uppercase block">Traceability Link</span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-stone-300 truncate">
                  https://seed2shelf.app/trace/{selectedQrModal.id}
                </span>
                <button
                  onClick={() => copyTraceUrl(`https://seed2shelf.app/trace/${selectedQrModal.id}`)}
                  className="p-1 text-stone-400 hover:text-emerald-400 transition shrink-0 cursor-pointer"
                  title="Copy URL"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => downloadQrCode(selectedQrModal.qrCodeUrl, selectedQrModal.id)}
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

      {/* SET PROCESSING LIMIT MODAL */}
      {processingModalItem && (() => {
        const { num: availNum, unit } = parseQuantityAndUnit(
          processingModalItem.remainingStock || processingModalItem.quantity
        );
        const { num: currentProcNum } = parseQuantityAndUnit(processingModalItem.processingQuantity);
        const amountNum = parseFloat(sendAmount) || 0;
        const projectedRemaining = Math.max(0, availNum - amountNum);
        const projectedTotalProc = currentProcNum + amountNum;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl relative">
              <button
                type="button"
                onClick={() => setProcessingModalItem(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-stone-800 text-stone-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 border-b border-stone-800 pb-4">
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
                  <Factory className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Set Processing Limit</h3>
                  <p className="text-xs text-stone-400">Specify how much crop to send to processing line</p>
                </div>
              </div>

              {/* Crop Batch Summary Card */}
              <div className="p-4 bg-stone-950 border border-stone-800 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 font-bold uppercase text-[10px]">Crop Batch ID:</span>
                  <span className="font-mono font-extrabold text-emerald-400">{processingModalItem.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 font-bold uppercase text-[10px]">Product Crop Name:</span>
                  <span className="font-black text-white">{processingModalItem.productName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 font-bold uppercase text-[10px]">Supplier Farmer:</span>
                  <span className="font-semibold text-stone-300">{processingModalItem.supplierFarmer || "Local Farmer"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-800/80 text-[11px]">
                  <div>
                    <span className="text-stone-500 text-[10px] block">Current Available Stock</span>
                    <strong className="text-emerald-400 text-sm font-black">{availNum} {unit}</strong>
                  </div>
                  <div>
                    <span className="text-stone-500 text-[10px] block">Currently In Processing</span>
                    <strong className="text-amber-400 text-sm font-black">{currentProcNum} {unit}</strong>
                  </div>
                </div>
              </div>

              {/* Form Input */}
              <form onSubmit={handleConfirmSendForProcessing} className="space-y-4 text-xs">
                <div>
                  <label className="text-stone-300 font-bold block mb-1.5">
                    Quantity to Send for Processing ({unit}) *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const current = parseFloat(sendAmount) || 0;
                        const next = Math.max(1, current - 1);
                        setSendAmount(String(next));
                        setSendError("");
                      }}
                      className="w-11 h-11 bg-stone-950 hover:bg-stone-800 border border-stone-800 hover:border-emerald-500/50 text-stone-300 hover:text-white rounded-2xl font-black text-lg flex items-center justify-center transition cursor-pointer shrink-0 shadow-sm"
                      title="Decrease quantity"
                    >
                      -
                    </button>

                    <input
                      type="number"
                      step="any"
                      min="1"
                      max={availNum}
                      value={sendAmount}
                      onChange={(e) => {
                        setSendAmount(e.target.value);
                        setSendError("");
                      }}
                      placeholder={`Max ${availNum}`}
                      className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-3 text-white placeholder-stone-600 focus:outline-none focus:border-emerald-500 text-sm font-bold text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition shadow-inner"
                      required
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const current = parseFloat(sendAmount) || 0;
                        const next = Math.min(availNum, current + 1);
                        setSendAmount(String(next));
                        setSendError("");
                      }}
                      className="w-11 h-11 bg-stone-950 hover:bg-stone-800 border border-stone-800 hover:border-emerald-500/50 text-stone-300 hover:text-white rounded-2xl font-black text-lg flex items-center justify-center transition cursor-pointer shrink-0 shadow-sm"
                      title="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  {sendError && (
                    <p className="text-red-400 text-[11px] font-bold mt-1.5 text-center">{sendError}</p>
                  )}
                </div>

                {/* Preset Percentage Buttons */}
                <div>
                  <span className="text-stone-400 font-bold text-[10px] uppercase block mb-1.5">Quick Select Percentage</span>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "25", factor: 0.25 },
                      { label: "50", factor: 0.5 },
                      { label: "75", factor: 0.75 },
                      { label: "100", factor: 1 }
                    ].map((btn) => {
                      const calculatedVal = Math.round(availNum * btn.factor);
                      const isSelected = sendAmount === String(calculatedVal);
                      return (
                        <button
                          key={btn.label}
                          type="button"
                          onClick={() => {
                            setSendAmount(String(calculatedVal));
                            setSendError("");
                          }}
                          className={`py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer border flex items-center justify-center ${
                            isSelected
                              ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
                              : "bg-stone-950 hover:bg-stone-800 border-stone-800 text-stone-300 hover:text-white"
                          }`}
                        >
                          {btn.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Calculation Summary Box */}
                <div className="p-3.5 bg-stone-950/80 rounded-2xl border border-stone-800 space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center text-stone-300">
                    <span>New Volume to Process:</span>
                    <strong className="text-amber-400 font-extrabold">+{amountNum} {unit}</strong>
                  </div>
                  <div className="flex justify-between items-center text-stone-300">
                    <span>Remaining Stock Available:</span>
                    <strong className="text-emerald-400 font-extrabold">{projectedRemaining} {unit}</strong>
                  </div>
                  <div className="flex justify-between items-center text-stone-300 pt-1 border-t border-stone-800/60">
                    <span>New Status:</span>
                    <span className={`font-extrabold text-[10px] px-2 py-0.5 rounded-full border ${
                      projectedRemaining === 0
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {projectedRemaining === 0 ? "Fully Processed" : "Sent for Processing"}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setProcessingModalItem(null)}
                    className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-2xl font-bold text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-extrabold text-xs shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Factory className="w-4 h-4" />
                    <span>Confirm & Send {amountNum > 0 ? `${amountNum} ${unit}` : ""}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
