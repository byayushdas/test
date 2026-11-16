import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 mb-2">
      <div className="text-[13px] text-[#69705E]">
        Showing <span className="font-medium text-[#283025]">{(currentPage - 1) * itemsPerPage + 1}</span>–<span className="font-medium text-[#283025]">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="font-medium text-[#283025]">{totalItems}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-[13px] font-medium text-[#283025] border border-[#DADFCF] rounded-[6px] hover:bg-[#EDF0E6] disabled:opacity-50 disabled:hover:bg-transparent bg-[#FFFCF5] transition-colors"
        >
          Previous
        </button>
        <div className="hidden sm:flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum = i + 1;
            if (totalPages > 5 && currentPage > 3) {
              pageNum = currentPage - 2 + i;
              if (pageNum > totalPages) pageNum = totalPages - (4 - i);
            }
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-7 h-7 flex items-center justify-center rounded-[6px] text-[13px] font-medium transition-colors ${
                  currentPage === pageNum
                    ? "bg-[#7BA05B] text-[#FFFCF5]"
                    : "text-[#69705E] hover:bg-[#EDF0E6] hover:text-[#283025] bg-[#FFFCF5]"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-[13px] font-medium text-[#283025] border border-[#DADFCF] rounded-[6px] hover:bg-[#EDF0E6] disabled:opacity-50 disabled:hover:bg-transparent bg-[#FFFCF5] transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
