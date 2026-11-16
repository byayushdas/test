import React, { useState, useEffect } from 'react';
import { Copy, Check, X } from 'lucide-react';

interface LinkedBatchDisplayProps {
  batches: string[];
}

export default function LinkedBatchDisplay({ batches }: LinkedBatchDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Parse batches
  const allBatches = batches.flatMap(b => b.split(',').map(s => s.trim())).filter(Boolean);
  const count = allBatches.length;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleCopy = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (count === 0) {
    return <span className="text-[14.5px] text-[#69705E] font-medium">Not linked</span>;
  }

  if (count === 1) {
    const id = allBatches[0];
    return (
      <div className="flex justify-between items-start gap-2 w-full">
        <span className="text-[14.5px] text-[#58664C] font-medium break-all">
          {id}
        </span>
        <button 
          onClick={(e) => handleCopy(id, e)}
          className="shrink-0 p-1 mt-0.5 rounded hover:bg-[#DADFCF]/50 text-[#69705E] hover:text-[#283025] transition"
          title="Copy ID"
        >
          {copiedId === id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-start">
        <button 
          onClick={() => setIsOpen(true)} 
          className="text-[14.5px] text-[#58664C] font-medium hover:text-[#283025] underline decoration-[#DADFCF] underline-offset-2 transition"
        >
          {count} source batches
        </button>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" 
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-[#FFFCF5] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 border border-[#DADFCF]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-[#DADFCF]/50 bg-[#F5F1E6]">
              <h3 className="font-medium text-[#283025]">Source batches</h3>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-1 text-[#69705E] hover:text-black rounded-full hover:bg-[#DADFCF]/50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
              {allBatches.map((batchId, idx) => (
                <div key={idx} className="flex flex-col gap-1.5 pb-3 border-b border-[#DADFCF]/30 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[14.5px] text-[#58664C] font-medium break-all">{batchId}</span>
                    <button
                      onClick={(e) => handleCopy(batchId, e)}
                      className="shrink-0 p-1.5 rounded-lg bg-white border border-[#DADFCF] hover:bg-[#EDF0E6] text-[#69705E] hover:text-[#283025] transition-colors flex items-center gap-1.5 mt-0.5"
                      title="Copy ID"
                    >
                      {copiedId === batchId ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-[12px] font-medium text-emerald-600 pr-0.5">Copied</span>
                        </>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
