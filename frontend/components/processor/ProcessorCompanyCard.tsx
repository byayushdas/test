import React from "react";
import { Factory, CheckCircle2, MapPin, Layers } from "lucide-react";
import { ProcessorCompany } from "@/types/processor";

interface Props {
  company: ProcessorCompany;
  onEdit?: () => void;
}

export default function ProcessorCompanyCard({ company, onEdit }: Props) {
  return (
    <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 shrink-0">
            <Factory className="h-7 w-7" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-lg sm:text-xl font-extrabold text-white">
                {company.companyName}
              </h3>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 rounded-full inline-flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> {company.verificationStatus} Facility
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-400 font-mono">
              <span>Processor ID: <strong className="text-emerald-400 font-sans">{company.processorId}</strong></span>
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-stone-500" /> {company.factoryLocation}</span>
            </div>
          </div>
        </div>

        {onEdit && (
          <button
            onClick={onEdit}
            className="w-full sm:w-auto inline-flex items-center justify-center bg-stone-800 hover:bg-stone-700 text-white font-semibold text-xs px-5 py-3 rounded-2xl border border-stone-700 transition cursor-pointer shrink-0"
          >
            Manage Facility
          </button>
        )}
      </div>

      <div className="pt-4 border-t border-stone-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-300">
        <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800/80 flex items-center justify-between">
          <span className="text-stone-400 font-medium">Factory Processing Capacity:</span>
          <strong className="text-white font-semibold">{company.factoryCapacity}</strong>
        </div>
        <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800/80 flex items-center justify-between">
          <span className="text-stone-400 font-medium">GPS Coordinates:</span>
          <strong className="text-emerald-400 font-mono">{company.coordinates}</strong>
        </div>
      </div>
    </div>
  );
}
