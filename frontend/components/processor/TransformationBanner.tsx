import React from "react";
import { ArrowRight, Sprout, Factory, Store, Info } from "lucide-react";

export default function TransformationBanner() {
  return (
    <div className="bg-gradient-to-r from-emerald-950/40 via-stone-900 to-stone-900 border border-emerald-500/20 rounded-3xl p-5 sm:p-6 space-y-3">
      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
        <Info className="h-4 w-4" /> Transformation Layer Role
      </div>

      <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-medium">
        As an official <strong className="text-white font-bold">Agricultural Processor</strong>, your facility acts as the core transformation bridge — converting raw farmer harvests into high-value, packaged, and supply-chain traceable products for retail distributors.
      </p>

      {/* Visual Flow Indicator */}
      <div className="pt-2 flex flex-wrap items-center justify-around gap-2 text-xs font-semibold text-stone-300 border-t border-stone-800/80">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-950/80 border border-stone-800">
          <Sprout className="h-4 w-4 text-emerald-400" />
          <span>Farmers (Raw Crop)</span>
        </div>

        <ArrowRight className="h-4 w-4 text-emerald-400 shrink-0" />

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold">
          <Factory className="h-4 w-4 text-emerald-400" />
          <span>Processor Transformation</span>
        </div>

        <ArrowRight className="h-4 w-4 text-emerald-400 shrink-0" />

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-950/80 border border-stone-800">
          <Store className="h-4 w-4 text-blue-400" />
          <span>Distributors & Retail</span>
        </div>
      </div>
    </div>
  );
}
