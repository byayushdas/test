import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, MapPin, Package, Clock, Award } from "lucide-react";

export type StageType = "FARMER" | "PROCESSOR" | "DISTRIBUTOR" | "RETAILER";

export interface StageDetailItem {
  label: string;
  value: string;
}

export interface StageData {
  stageType: StageType;
  stageTitle: string;
  batchId: string;
  badge: string;
  generalInfo: StageDetailItem[];
  locationInfo?: StageDetailItem[];
  productInfo?: StageDetailItem[];
  qualityInfo?: StageDetailItem[];
  timelineInfo?: StageDetailItem[];
}

interface TraceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: StageData | null;
}

export default function TraceDetailsModal({ isOpen, onClose, data }: TraceDetailsModalProps) {
  if (!isOpen || !data) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 z-10 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-stone-800 pb-5 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] px-3 py-1 rounded-xl font-extrabold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  {data.stageType} STAGE
                </span>
                <span className="text-xs font-mono text-emerald-400 bg-stone-950 px-2.5 py-0.5 rounded-lg border border-stone-800 font-bold">
                  {data.batchId}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {data.stageTitle}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-white transition cursor-pointer shrink-0"
              aria-label="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Grouped Information Sections */}
          <div className="space-y-5 text-xs">
            
            {/* General Information */}
            {data.generalInfo && data.generalInfo.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-black text-stone-300 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  General Stage Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.generalInfo.map((item, idx) => (
                    <div key={idx} className="p-3.5 bg-stone-950 rounded-2xl border border-stone-800 space-y-1">
                      <span className="text-[10px] text-stone-400 font-extrabold uppercase block">{item.label}</span>
                      <span className="text-xs font-bold text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location Information */}
            {data.locationInfo && data.locationInfo.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-stone-800/80">
                <h3 className="text-xs font-black text-stone-300 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  Location & Address Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.locationInfo.map((item, idx) => (
                    <div key={idx} className="p-3.5 bg-stone-950 rounded-2xl border border-stone-800 space-y-1">
                      <span className="text-[10px] text-stone-400 font-extrabold uppercase block">{item.label}</span>
                      <span className="text-xs font-bold text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Product & Processing Information */}
            {data.productInfo && data.productInfo.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-stone-800/80">
                <h3 className="text-xs font-black text-stone-300 uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-400" />
                  Product & Crop Specifications
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.productInfo.map((item, idx) => (
                    <div key={idx} className="p-3.5 bg-stone-950 rounded-2xl border border-stone-800 space-y-1">
                      <span className="text-[10px] text-stone-400 font-extrabold uppercase block">{item.label}</span>
                      <span className="text-xs font-bold text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quality & Lab Verification */}
            {data.qualityInfo && data.qualityInfo.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-stone-800/80">
                <h3 className="text-xs font-black text-stone-300 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  Quality & Lab Verification
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.qualityInfo.map((item, idx) => (
                    <div key={idx} className="p-3.5 bg-stone-950 rounded-2xl border border-stone-800 space-y-1">
                      <span className="text-[10px] text-stone-400 font-extrabold uppercase block">{item.label}</span>
                      <span className="text-xs font-bold text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline & Status */}
            {data.timelineInfo && data.timelineInfo.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-stone-800/80">
                <h3 className="text-xs font-black text-stone-300 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  Timeline & Status Verification
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.timelineInfo.map((item, idx) => (
                    <div key={idx} className="p-3.5 bg-stone-950 rounded-2xl border border-stone-800 space-y-1">
                      <span className="text-[10px] text-stone-400 font-extrabold uppercase block">{item.label}</span>
                      <span className="text-xs font-bold text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-stone-800 flex items-center justify-between">
            <span className="text-[10px] text-stone-500 font-extrabold uppercase flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Public Provenance Record
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-300 font-bold text-xs transition cursor-pointer"
            >
              Close Record
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
