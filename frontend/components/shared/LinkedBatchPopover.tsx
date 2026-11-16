import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Copy, Check } from 'lucide-react';

interface LinkedBatchPopoverProps {
  batches: string[];
  label?: string;
}

export default function LinkedBatchPopover({ batches, label = "Linked Raw Batches" }: LinkedBatchPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Parse batches (some might be comma-separated strings if multiple)
  const allBatches = batches.flatMap(b => b.split(',').map(s => s.trim())).filter(Boolean);
  const count = allBatches.length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleCopy = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-1 text-[11px] font-medium text-[#58664C] hover:text-[#283025] transition-colors bg-[#EDF0E6] hover:bg-[#DADFCF]/50 px-2 py-0.5 rounded-md"
      >
        {count === 0 ? "None" : count === 1 ? "View batch" : `View ${count} batches`}
        {count > 0 && <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
      </button>

      {isOpen && count > 0 && (
        <div
          ref={popoverRef}
          className="absolute right-0 bottom-full mb-1 z-[100] w-64 bg-[#FFFCF5] border border-[#DADFCF] rounded-lg shadow-xl shadow-black/5 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150"
          onClick={e => e.stopPropagation()}
        >
          <div className="px-3 py-2 bg-[#F5F1E6] border-b border-[#DADFCF]">
            <span className="text-[10px] font-semibold text-[#69705E] uppercase tracking-wider">{label}</span>
          </div>
          <div className="max-h-48 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
            {allBatches.map((batchId, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-[#F5F1E6]/50 transition-colors">
                <span className="text-[11px] font-mono text-[#283025] break-all">{batchId}</span>
                <button
                  onClick={(e) => handleCopy(batchId, e)}
                  className="shrink-0 p-1.5 rounded bg-white border border-[#DADFCF] hover:bg-[#EDF0E6] text-[#69705E] transition-colors"
                  title="Copy ID"
                >
                  {copiedId === batchId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
