import React, { useEffect } from "react";
import { X, Copy, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type StageType = "FARMER" | "PROCESSOR" | "DISTRIBUTOR" | "RETAILER";

export interface StageData {
  stageType: StageType;
  stageTitle: string; // The role/stage label
  batchId: string;
  productName: string;
  recordedStatus: string;
  
  overview: { label: string; value: string }[];
  location: { label: string; value: string }[];
  quantityAndProcessing: { label: string; value: string }[];
  qualityAndDocuments: { 
    type: 'measurement' | 'document';
    label: string; 
    value: string;
    issuer?: string;
    refNumber?: string;
    date?: string;
    link?: string;
  }[];
  activity: {
    event: string;
    timestamp: string;
    responsibleParty: string;
  }[];
  blockchainRecord?: {
    txHash: string;
    network: string;
    block: string;
  };
}

interface TraceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: StageData | null;
}

export default function TraceDetailsModal({ isOpen, onClose, data }: TraceDetailsModalProps) {
  const [showBlockchain, setShowBlockchain] = React.useState(false);

  // Esc to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen || !data) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const panelContent = (
    <div className="flex flex-col h-full bg-[#FFFCF5] lg:border lg:border-[#DADFCF] shadow-xl lg:shadow-none lg:rounded-xl">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-[#FFFCF5] z-10 p-5 border-b border-[#DADFCF] flex flex-col gap-3 lg:rounded-t-xl">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-medium text-[#69705E] uppercase tracking-wider">{data.stageTitle}</span>
            <h2 className="text-[18px] font-medium text-[#283025]">{data.productName}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#69705E] hover:bg-[#EDF0E6] rounded-lg transition shrink-0" aria-label="Close details">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-[#69705E] shrink-0">Batch ID:</span>
            <span className="font-mono text-[#283025] truncate">{data.batchId}</span>
            <button onClick={() => handleCopy(data.batchId)} className="text-[#6F7D61] hover:text-[#4A573F] shrink-0" title="Copy Batch ID">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-[#69705E] shrink-0">Status:</span>
            <span className="bg-[#E2E8D8] text-[#58664C] px-2 py-0.5 rounded text-[12px] font-medium truncate">{data.recordedStatus}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Overview */}
        {data.overview?.length > 0 && (
          <section>
            <h3 className="text-[14px] font-medium text-[#283025] mb-3">Overview</h3>
            <dl className="space-y-2.5">
              {data.overview.map((item, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 text-[13px]">
                  <dt className="text-[#69705E] sm:w-1/3 shrink-0">{item.label}</dt>
                  <dd className="text-[#283025]">{item.value || "Not provided"}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <div className="h-px bg-[#DADFCF]" />

        {/* Location */}
        {data.location?.length > 0 && (
          <section>
            <h3 className="text-[14px] font-medium text-[#283025] mb-3">Location</h3>
            <dl className="space-y-2.5">
              {data.location.map((item, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 text-[13px]">
                  <dt className="text-[#69705E] sm:w-1/3 shrink-0">{item.label}</dt>
                  <dd className="text-[#283025]">{item.value || "Not provided"}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <div className="h-px bg-[#DADFCF]" />

        {/* Quantity and processing */}
        {data.quantityAndProcessing?.length > 0 && (
          <section>
            <h3 className="text-[14px] font-medium text-[#283025] mb-3">Quantity & Processing</h3>
            <dl className="space-y-2.5">
              {data.quantityAndProcessing.map((item, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 text-[13px]">
                  <dt className="text-[#69705E] sm:w-1/3 shrink-0">{item.label}</dt>
                  <dd className="text-[#283025]">{item.value || "Not provided"}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <div className="h-px bg-[#DADFCF]" />

        {/* Quality and documents */}
        {data.qualityAndDocuments?.length > 0 && (
          <section>
            <h3 className="text-[14px] font-medium text-[#283025] mb-3">Quality & Documents</h3>
            <div className="space-y-4">
              {data.qualityAndDocuments.map((item, i) => (
                <div key={i} className="flex flex-col gap-1 text-[13px] bg-[#EDF0E6] p-3 rounded-lg">
                  <div className="font-medium text-[#283025]">{item.label}</div>
                  <div className="text-[#69705E]">{item.value}</div>
                  {item.issuer && <div className="text-[#69705E] mt-1">Issuer: <span className="text-[#283025]">{item.issuer}</span></div>}
                  {item.refNumber && <div className="text-[#69705E]">Ref: <span className="text-[#283025]">{item.refNumber}</span></div>}
                  {item.date && <div className="text-[#69705E]">Date: <span className="text-[#283025]">{item.date}</span></div>}
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noreferrer" className="text-[#6F7D61] hover:underline flex items-center gap-1 mt-1 font-medium w-fit">
                      View Document <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="h-px bg-[#DADFCF]" />

        {/* Activity */}
        {data.activity?.length > 0 && (
          <section>
            <h3 className="text-[14px] font-medium text-[#283025] mb-3">Activity</h3>
            <div className="space-y-4">
              {data.activity.map((act, i) => (
                <div key={i} className="flex gap-3 text-[13px]">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#DADFCF] mt-1 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-medium text-[#283025]">{act.event}</span>
                    <span className="text-[#69705E]">{act.timestamp}</span>
                    <span className="text-[#69705E]">By {act.responsibleParty}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Blockchain Record */}
        {data.blockchainRecord && (
          <section className="pt-2">
            <button 
              onClick={() => setShowBlockchain(!showBlockchain)}
              className="flex items-center justify-between w-full text-left bg-[#F5F1E6] p-3 rounded-lg border border-[#DADFCF] hover:bg-[#EDF0E6] transition"
            >
              <span className="text-[14px] font-medium text-[#283025]">Blockchain Record</span>
              {showBlockchain ? <ChevronUp className="w-4 h-4 text-[#69705E]" /> : <ChevronDown className="w-4 h-4 text-[#69705E]" />}
            </button>
            <AnimatePresence>
              {showBlockchain && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 border border-t-0 border-[#DADFCF] rounded-b-lg bg-[#FFFCF5] space-y-2 text-[13px] -mt-1 pt-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[#69705E]">Network</span>
                      <span className="text-[#283025]">{data.blockchainRecord.network}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[#69705E]">Transaction Hash</span>
                      <span className="font-mono text-[#283025] break-all">{data.blockchainRecord.txHash}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[#69705E]">Block</span>
                      <span className="text-[#283025]">{data.blockchainRecord.block}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop side panel wrapper */}
      <div className="hidden lg:block w-[440px] shrink-0 sticky top-6 h-[calc(100vh-3rem)]">
        {panelContent}
      </div>

      {/* Mobile/Tablet Drawer overlay */}
      <div className="lg:hidden">
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-[#283025]/40 z-40"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-x-0 bottom-0 top-12 z-50 md:top-24 md:left-auto md:right-0 md:w-[440px] md:rounded-l-xl bg-[#FFFCF5] shadow-2xl flex flex-col rounded-t-xl overflow-hidden"
              >
                {panelContent}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
