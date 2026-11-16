import React, { useState } from "react";
import { X, QrCode, Boxes, PlusCircle, CheckCircle2 } from "lucide-react";
import { RawMaterialStock, ProcessedProductItem } from "@/types/processor";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  rawMaterials: RawMaterialStock[];
  onSubmit: (item: Omit<ProcessedProductItem, "id" | "processedBatchId" | "qrCodeUrl">) => void;
}

export default function LogProcessedItemModal({ isOpen, onClose, rawMaterials, onSubmit }: Props) {
  const [productName, setProductName] = useState("");
  const [parentRawBatchId, setParentRawBatchId] = useState(rawMaterials[0]?.batchId || "");
  const [category, setCategory] = useState("Grains & Rice");
  const [quantity, setQuantity] = useState<number>(500);
  const [unit, setUnit] = useState("kg");
  const [processingDate, setProcessingDate] = useState("2026-07-24");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [previewBatchId, setPreviewBatchId] = useState(`PRC-BATCH-2026-${Math.floor(100 + Math.random() * 900)}`);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      alert("Please enter a valid product name.");
      return;
    }
    onSubmit({
      parentRawBatchId,
      productName,
      category,
      quantity: Number(quantity),
      unit,
      processingDate,
      description,
      imageUrl
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-stone-900 border border-stone-800 w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl relative">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">Log New Processed Product</h3>
              <p className="text-xs text-stone-400">Transform raw agricultural crop stock into retail-ready product</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-xl bg-stone-800 hover:bg-stone-700 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Row 1: Product Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-stone-300">Processed Product Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Premium Aged Basmati Rice"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white placeholder-stone-600 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-stone-300">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
              >
                <option value="Grains & Rice">Grains & Rice (Paddy → Rice)</option>
                <option value="Flour & Grains">Flour & Grains (Wheat → Flour)</option>
                <option value="Beverages & Concentrates">Beverages (Mango → Mango Pulp)</option>
                <option value="Sugars & Sweeteners">Sweeteners (Sugarcane → Sugar)</option>
                <option value="Processed Sauces">Sauces & Pastes (Tomato → Ketchup/Paste)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Parent Raw Batch Selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-stone-300">Link Parent Raw Crop Batch *</label>
            <select
              value={parentRawBatchId}
              onChange={(e) => setParentRawBatchId(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500/50"
            >
              {rawMaterials.map((raw) => (
                <option key={raw.id} value={raw.batchId}>
                  {raw.batchId} — {raw.productName} ({raw.quantity} {raw.unit} from {raw.supplierFarmer})
                </option>
              ))}
            </select>
          </div>

          {/* Row 3: Quantity, Unit, Processing Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-stone-300">Processed Quantity *</label>
              <input
                type="number"
                required
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-stone-300">Unit *</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
              >
                <option value="kg">kg</option>
                <option value="Liters">Liters</option>
                <option value="Packs">Packs</option>
                <option value="Tons">Tons</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-stone-300">Processing Date *</label>
              <input
                type="date"
                required
                value={processingDate}
                onChange={(e) => setProcessingDate(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Row 4: Description */}
          <div className="space-y-1.5">
            <label className="font-bold text-stone-300">Processing Notes / Description</label>
            <textarea
              rows={2}
              placeholder="e.g. Milled, double-polished, and sealed in 25kg moisture-proof sacks."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white placeholder-stone-600 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* QR Code & Batch Preview Box */}
          <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800/80 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                Generated Batch & QR Architecture
              </span>
              <p className="text-stone-300 text-xs">
                New Transformed Batch ID: <strong className="font-mono text-white">{previewBatchId}</strong>
              </p>
              <p className="text-[10px] text-stone-500">
                Linked directly to parent crop batch <span className="font-mono text-stone-400">{parentRawBatchId}</span>
              </p>
            </div>

            <div className="w-14 h-14 bg-white p-1 rounded-xl flex items-center justify-center shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${previewBatchId}`}
                alt="QR Preview"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-md cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" /> Save Processed Item
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
