import React from "react";
import { CheckCircle2, XCircle, Truck, Building2, Calendar, Lock, Clock, Package } from "lucide-react";

export interface SharedOrderItem {
  id: string;
  rawId?: string;
  batchId: string;
  counterpartyLabel: string; // "Buyer", "Seller", "Processor", etc.
  counterpartyName: string;
  productName: string;
  quantity: string;
  totalPrice: string;
  status: "PENDING" | "ACCEPTED" | "DISPATCHED" | "DELIVERED" | "REJECTED";
  escrowLocked?: boolean;
  date: string;
}

interface OrderCardProps {
  order: SharedOrderItem;
  activeTab?: "INCOMING" | "OUTGOING" | "NONE";
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onDispatch?: (id: string) => void;
}

export default function OrderCard({ order, activeTab = "NONE", onAccept, onReject, onDispatch }: OrderCardProps) {
  
  const renderStatusBadge = () => {
    switch (order.status) {
      case "PENDING":
        return (
          <span className="text-[11px] font-bold px-3 py-1.5 rounded-[8px] border bg-amber-500/10 text-amber-600 border-amber-500/20 flex items-center gap-1.5 uppercase tracking-wide">
            <Clock className="w-3.5 h-3.5" /> AWAITING ACCEPTANCE
          </span>
        );
      case "ACCEPTED":
        return (
          <span className="text-[11px] font-bold px-3 py-1.5 rounded-[8px] border bg-[#EDF0E6] text-[#58664C] border-[#6F7D61]/20 flex items-center gap-1.5 uppercase tracking-wide">
            <CheckCircle2 className="w-3.5 h-3.5" /> ORDER ACCEPTED
          </span>
        );
      case "DISPATCHED":
        return (
          <span className="text-[11px] font-bold px-3 py-1.5 rounded-[8px] border bg-blue-500/10 text-blue-600 border-blue-500/20 flex items-center gap-1.5 uppercase tracking-wide">
            <Truck className="w-3.5 h-3.5" /> IN TRANSIT
          </span>
        );
      case "DELIVERED":
        return (
          <span className="text-[11px] font-bold px-3 py-1.5 rounded-[8px] border bg-[#EDF0E6] text-[#58664C] border-[#6F7D61]/20 flex items-center gap-1.5 uppercase tracking-wide">
            <CheckCircle2 className="w-3.5 h-3.5" /> DELIVERED
          </span>
        );
      case "REJECTED":
        return (
          <span className="text-[11px] font-bold px-3 py-1.5 rounded-[8px] border bg-red-500/10 text-[#DC2626] border-[#F87171]/20 flex items-center gap-1.5 uppercase tracking-wide">
            REJECTED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#FFFCF5] border border-[#DADFCF] rounded-[12px] p-5 sm:p-6 shadow-sm flex flex-col gap-5">
      
      {/* HEADER META LINE: IDs, Dates & Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#DADFCF]">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs text-[#283025] font-bold bg-[#FFFCF5] px-3 py-1.5 rounded-xl border border-[#DADFCF]">
            {order.id}
          </span>
          <span className="text-xs text-[#58664C] font-bold bg-[#EDF0E6] px-3 py-1.5 rounded-xl border border-[#6F7D61]/20">
            Batch: {order.batchId}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#69705E] font-medium flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#69705E]" />
            Date: {order.date}
          </span>
          {renderStatusBadge()}
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        
        {/* Left Column: Product & Counterparty */}
        <div className="md:col-span-7 space-y-2.5">
          <div>
            <span className="text-[10px] font-bold text-[#69705E] uppercase tracking-tight block">Requested Product</span>
            <h3 className="text-xl font-bold text-[#283025] tracking-tight">
              {order.productName} <span className="text-[#69705E] text-base font-medium">({order.quantity})</span>
            </h3>
          </div>

          <div className="flex items-start gap-2 text-xs text-[#283025]">
            <Building2 className="w-4 h-4 text-[#58664C] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#69705E]">{order.counterpartyLabel}: </span>
              <span className="font-bold text-[#283025]">{order.counterpartyName}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Order Value */}
        <div className="md:col-span-5 bg-[#FFFCF5]/60 border border-[#DADFCF] rounded-2xl p-4 flex flex-col justify-center space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#69705E] font-medium">Quantity Requested:</span>
            <span className="font-bold text-[#283025]">{order.quantity}</span>
          </div>
          <div className="flex items-center justify-between text-xs border-t border-[#DADFCF] pt-2">
            <span className="text-[#69705E] font-medium">Total Offer Amount:</span>
            <span className="text-base font-bold text-[#58664C]">{order.totalPrice}</span>
          </div>
          {order.escrowLocked && (
             <div className="flex items-center justify-between text-xs border-t border-[#DADFCF] pt-2">
                <span className="flex items-center gap-1 text-[#69705E] font-medium">
                  <Lock className="w-3.5 h-3.5" /> Escrow Status:
                </span>
                <span className="font-bold text-[#58664C]">Locked & Secured</span>
             </div>
          )}
        </div>
      </div>

      {/* ACTIONS */}
      {(onAccept || onReject || onDispatch) && (
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-[#DADFCF]">
          {order.status === "PENDING" && activeTab === "INCOMING" && onReject && (
            <button
              onClick={() => onReject(order.id)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-[8px] bg-[#FFFCF5] border border-[#F87171]/50 hover:bg-[#FEF2F2] hover:border-[#F87171] text-[#DC2626] font-bold text-[13px] flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <span>Reject Order</span>
            </button>
          )}
          {order.status === "PENDING" && activeTab === "INCOMING" && onAccept && (
            <button
              onClick={() => onAccept(order.id)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-[8px] bg-[#58664C] hover:bg-[#4A573F] text-[#FFFCF5] font-bold text-[13px] flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <span>Accept Order</span>
            </button>
          )}
          {order.status === "ACCEPTED" && activeTab === "INCOMING" && onDispatch && (
             <button
               onClick={() => onDispatch(order.id)}
               className="w-full sm:w-auto px-5 py-2.5 rounded-[8px] bg-[#FFFCF5] border border-[#6F7D61]/30 hover:bg-[#EDF0E6] text-[#58664C] font-bold text-[13px] flex items-center justify-center gap-2 transition-all shadow-sm"
             >
               <Package className="w-4 h-4" />
               <span>Mark as Dispatched</span>
             </button>
          )}
        </div>
      )}
    </div>
  );
}
