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
      className="bg-[#FEFAE0]/90 border border-[#CCD5AE] hover:border-[#7BA05B]/30 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between"
    >
      {/* Top Image & QR Badge */}
      <div className="relative h-44 w-full bg-[#FAEDCD] overflow-hidden">
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.cropName}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        )}
        {item.hasQrCode && (
          <span className="absolute top-3 right-3 bg-[#FEFAE0]/90 text-[#58664C] text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#7BA05B]/30 backdrop-blur-md flex items-center gap-1">
            <QrCode className="h-3 w-3" /> Verified QR
          </span>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-[#69705E] uppercase tracking-wider block font-mono">
            {item.batchId}
          </span>
          <h3 className="font-bold text-[#283025] text-base tracking-tight leading-snug">
            {item.cropName}
          </h3>
          <p className="text-xs text-[#69705E] flex items-center gap-1 pt-0.5">
            {sellerLabel}: <strong className="text-[#283025] font-semibold">{item.farmerName}</strong>
          </p>
        </div>

        <div className="space-y-2 pt-2 border-t border-[#CCD5AE] text-xs">
          <div className="flex items-center justify-between text-[#69705E]">
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-[#69705E]" /> {item.farmerLocation}</span>
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-[#69705E]" /> {item.harvestDate}</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-[11px] text-[#69705E] block">Batch Supply:</span>
              <strong className="text-[#283025] font-extrabold text-xs">{item.quantity} {item.unit}</strong>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-[#69705E] block">Price:</span>
              <strong className="text-[#58664C] font-extrabold text-sm">₹ {item.pricePerUnit}/{item.unit}</strong>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={() => onViewDetails(item)}
            className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-[#FEFAE0] border border-[#CCD5AE] hover:bg-[#FAEDCD] text-[#283025] hover:text-[#283025] rounded-xl text-xs font-semibold border border-[#CCD5AE] transition cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5 text-[#58664C]" /> Details
          </button>

          <button
            onClick={() => onAddToCart(item)}
            className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-[#7BA05B] hover:bg-[#688A4D] text-[#1F2A1A] rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
          </button>
        </div>
      </div>
    </motion.div>
  );
}
