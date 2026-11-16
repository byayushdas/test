import React, { useState } from "react";
import { CheckCircle2, XCircle, Truck, Package, RotateCcw, AlertTriangle, ShieldCheck, MapPin, Calendar } from "lucide-react";

export interface SharedShipmentItem {
  id: string;
  rawId?: string;
  batchId: string;
  productName: string;
  quantity: string;
  value: string;
  destination: string;
  dispatchedDate: string;
  estimatedDelivery: string;
  status: "IN_TRANSIT" | "DELIVERED" | "REJECTED" | "ACCEPTED";
  rejectionReason?: string;
  rejectedDate?: string;
  acceptedDate?: string;
}

interface ShipmentCardProps {
  shipment: SharedShipmentItem;
  activeSignal?: "INCOMING" | "OUTGOING" | "NONE";
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
}

export default function ShipmentCard({ shipment: shp, activeSignal = "NONE", onAccept, onReject }: ShipmentCardProps) {
  
  const getStepStatus = (step: number) => {
    const isRejected = shp.status === "REJECTED";
    const isDelivered = shp.status === "DELIVERED" || shp.status === "ACCEPTED";
    
    // Step 1: Dispatched
    const step1Done = true;
    
    // Step 2: Transit
    const step2Done = isDelivered || isRejected;
    const step2Current = !step2Done;
    
    // Step 3: Delivered/Rejected
    const step3Done = isDelivered || isRejected;

    return [
      { id: 1, label: "Dispatched", active: step1Done, current: false, date: shp.dispatchedDate, icon: <Package className="w-3.5 h-3.5" /> },
      { id: 2, label: isRejected ? "Return Transit" : "In Transit", active: step2Done, current: step2Current, date: step2Current ? shp.estimatedDelivery : undefined, icon: isRejected ? <RotateCcw className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" /> },
      { id: 3, label: isDelivered ? "Accepted" : isRejected ? "Rejected" : "Delivery", active: step3Done, current: false, date: isDelivered ? shp.acceptedDate : isRejected ? shp.rejectedDate : undefined, icon: isDelivered ? <CheckCircle2 className="w-3.5 h-3.5" /> : isRejected ? <XCircle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" /> }
    ];
  };

  const steps = getStepStatus(0);

  return (
    <div className="bg-[#FFFCF5] border border-[#DADFCF] rounded-[12px] p-5 sm:p-6 shadow-sm flex flex-col gap-5">
      
      {/* HEADER META LINE: IDs, Dates & Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#DADFCF]">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs text-[#283025] font-bold bg-[#FFFCF5] px-3 py-1.5 rounded-xl border border-[#DADFCF]">
            {shp.id}
          </span>
          <span className="text-xs text-[#58664C] font-bold bg-[#EDF0E6] px-3 py-1.5 rounded-xl border border-[#6F7D61]/20">
            Batch: {shp.batchId}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#69705E] font-medium flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#69705E]" />
            Dispatched: {shp.dispatchedDate}
          </span>

          {/* STATUS BADGE */}
          <span className={`text-[11px] font-bold px-3 py-1.5 rounded-[8px] border flex items-center gap-1.5 uppercase tracking-wide ${
            shp.status === 'DELIVERED' || shp.status === 'ACCEPTED'
              ? 'bg-[#EDF0E6] text-[#58664C] border-[#6F7D61]/20'
              : shp.status === 'REJECTED'
              ? 'bg-red-500/10 text-[#DC2626] border-[#F87171]/20'
              : 'bg-blue-500/10 text-blue-600 border-blue-500/20 animate-pulse'
          }`}>
            {shp.status === 'DELIVERED' || shp.status === 'ACCEPTED' ? (
              <>
                <span>ACCEPTED & PAID</span>
              </>
            ) : shp.status === 'REJECTED' ? (
              <>
                <span>REJECTED & RETURNED</span>
              </>
            ) : (
              <>
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                <span>IN TRANSIT</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        
        {/* Left Column: Shipment Cargo & Destination */}
        <div className="md:col-span-7 space-y-2.5">
          <div>
            <span className="text-[10px] font-bold text-[#69705E] uppercase tracking-tight block">Shipment Cargo</span>
            <h3 className="text-xl font-bold text-[#283025] tracking-tight">
              {shp.productName} <span className="text-[#69705E] text-base font-medium">({shp.quantity})</span>
            </h3>
          </div>

          <div className="flex items-start gap-2 text-xs text-[#283025]">
            <MapPin className="w-4 h-4 text-[#58664C] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#69705E]">Destination: </span>
              <span className="font-bold text-[#283025]">{shp.destination}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Cargo Value & Dates */}
        <div className="md:col-span-5 bg-[#FFFCF5]/60 border border-[#DADFCF] rounded-2xl p-4 flex flex-col justify-center space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#69705E] font-medium">Total Cargo Value:</span>
            <span className="text-base font-bold text-[#58664C]">{shp.value}</span>
          </div>

          {(shp.status === 'DELIVERED' || shp.status === 'ACCEPTED') && shp.acceptedDate && (
            <div className="flex items-center justify-between text-xs border-t border-[#DADFCF] pt-2">
              <span className="text-[#69705E] font-medium">Accepted Date:</span>
              <span className="font-bold text-[#283025] font-sans">{shp.acceptedDate}</span>
            </div>
          )}

          {shp.status === 'REJECTED' && shp.rejectedDate && (
            <div className="flex items-center justify-between text-xs border-t border-[#DADFCF] pt-2">
              <span className="text-[#69705E] font-medium">Rejected Date:</span>
              <span className="font-bold text-[#DC2626] font-sans">{shp.rejectedDate}</span>
            </div>
          )}

          {shp.status === 'IN_TRANSIT' && (
            <div className="flex items-center justify-between text-xs border-t border-[#DADFCF] pt-2">
              <span className="text-[#69705E] font-medium">Estimated Arrival:</span>
              <span className="font-bold text-[#283025] font-sans">{shp.estimatedDelivery}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tracking Section */}
      <div className="bg-[#EDF0E6]/50 rounded-[10px] border border-[#DADFCF]/60 p-4 mt-2">
        <p className="text-[13px] font-semibold text-[#283025] mb-4">Shipment progress.</p>
        
        {/* Horizontal Desktop / Vertical Mobile Stepper */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 relative">
           
           {steps.map((step, index) => (
             <React.Fragment key={step.id}>
               {/* Step Item */}
               <div className="flex sm:flex-col items-center sm:justify-center gap-3 sm:gap-1.5 relative z-10 sm:w-[100px]">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                   step.active && !step.current 
                    ? "bg-[#6F7D61] text-[#FFFCF5]" 
                    : step.current 
                    ? "bg-[#FFFCF5] border-[2px] border-[#6F7D61] text-[#6F7D61]" 
                    : "bg-[#DADFCF] text-[#69705E]"
                 }`}>
                   {step.icon}
                 </div>
                 <div className="sm:text-center">
                   <p className={`text-[12px] font-medium ${step.current ? "text-[#283025]" : "text-[#69705E]"}`}>{step.label}</p>
                   {step.date && <p className="text-[10px] text-[#69705E] mt-0.5">{step.date}</p>}
                 </div>
               </div>

               {/* Connector Line */}
               {index < steps.length - 1 && (
                 <div className={`hidden sm:block flex-1 h-[2px] mx-2 -mt-6 ${
                   step.active && !step.current ? "bg-[#6F7D61]" : "bg-[#DADFCF]"
                 }`} />
               )}
               {index < steps.length - 1 && (
                 <div className={`sm:hidden w-[2px] h-6 ml-4 ${
                   step.active && !step.current ? "bg-[#6F7D61]" : "bg-[#DADFCF]"
                 }`} />
               )}
             </React.Fragment>
           ))}

        </div>
      </div>

      {/* Rejection Details */}
      {shp.status === 'REJECTED' && shp.rejectionReason && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl space-y-2 mt-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#DC2626]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Rejection Details</span>
          </div>
          <div className="text-xs text-[#283025]">
            {shp.rejectionReason}
          </div>
        </div>
      )}

      {/* Actions */}
      {activeSignal === 'INCOMING' && shp.status === 'IN_TRANSIT' && onAccept && onReject && (
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-[#DADFCF]">
          <button
            onClick={() => onReject(shp.id)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-[8px] bg-[#FFFCF5] border border-[#F87171]/50 hover:bg-[#FEF2F2] hover:border-[#F87171] text-[#DC2626] font-bold text-[13px] flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject Delivery</span>
          </button>
          <button
            onClick={() => onAccept(shp.id)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-[8px] bg-[#6F7D61] hover:bg-[#58664C] text-[#FFFCF5] font-bold text-[13px] flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Accept Delivery</span>
          </button>
        </div>
      )}

    </div>
  );
}
