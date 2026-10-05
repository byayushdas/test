import React from "react";
import { QrCode, ShoppingCart, Eye, MapPin, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { FarmerHarvestItem } from "@/types/processor";

interface Props {
  item: FarmerHarvestItem;
  onViewDetails: (item: FarmerHarvestItem) => void;
  onAddToCart: (item: FarmerHarvestItem) => void;
  sellerLabel?: string;
}

export default function FarmerHarvestCard({ item, onViewDetails, onAddToCart, sellerLabel = "Farmer" }: Props) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-stone-900/90 border border-stone-800 hover:border-emerald-500/30 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between"
    >
      {/* Top Image & QR Badge */}
      <div className="relative h-44 w-full bg-stone-800 overflow-hidden">
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.cropName}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        )}
        {item.hasQrCode && (
          <span className="absolute top-3 right-3 bg-stone-950/90 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/30 backdrop-blur-md flex items-center gap-1">
            <QrCode className="h-3 w-3" /> Verified QR
          </span>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block font-mono">
            {item.batchId}
          </span>
          <h3 className="font-bold text-white text-base tracking-tight leading-snug">
            {item.cropName}
          </h3>
          <p className="text-xs text-stone-400 flex items-center gap-1 pt-0.5">
            {sellerLabel}: <strong className="text-stone-200 font-semibold">{item.farmerName}</strong>
          </p>
        </div>

        <div className="space-y-2 pt-2 border-t border-stone-800/80 text-xs">
          <div className="flex items-center justify-between text-stone-400">
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-stone-500" /> {item.farmerLocation}</span>
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-stone-500" /> {item.harvestDate}</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-[11px] text-stone-400 block">Batch Supply:</span>
              <strong className="text-white font-extrabold text-xs">{item.quantity} {item.unit}</strong>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-stone-400 block">Price:</span>
              <strong className="text-emerald-400 font-extrabold text-sm">₹ {item.pricePerUnit}/{item.unit}</strong>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={() => onViewDetails(item)}
            className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-xl text-xs font-semibold border border-stone-700 transition cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5 text-emerald-400" /> Details
          </button>

          <button
            onClick={() => onAddToCart(item)}
            className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
          </button>
        </div>
      </div>
    </motion.div>
  );
}
