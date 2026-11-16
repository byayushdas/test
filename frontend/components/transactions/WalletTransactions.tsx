import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Lock,
  CheckCircle2,
  Search,
  X,
  Share2,
  Copy,
  HelpCircle,
  ChevronRight,
  AlertCircle,
  Wallet,
  Clock,
  ReceiptIndianRupee,
  FileText
} from "lucide-react";

interface WalletTransactionsProps {
  role: "Farmer" | "Processor" | "Distributor" | "Retailer";
}

export default function WalletTransactions({ role }: WalletTransactionsProps) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showTransferDetails, setShowTransferDetails] = useState(false);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Derive icons and colors for transaction types
  const getTransactionDisplay = (tx: any) => {
    if (tx.type === "PAYOUT") return { icon: <ArrowDownLeft className="h-4 w-4" />, sign: "+ ", color: "text-[#58664C]", amountColor: "text-[#283025]" };
    if (tx.type === "PAYMENT") return { icon: <ArrowUpRight className="h-4 w-4" />, sign: "- ", color: "text-[#58664C]", amountColor: "text-[#283025]" };
    if (tx.type === "REFUND") return { icon: <ArrowDownLeft className="h-4 w-4" />, sign: "+ ", color: "text-[#69705E]", amountColor: "text-[#283025]" };
    return { icon: <Lock className="h-4 w-4" />, sign: "", color: "text-[#6F7D61]", amountColor: "text-[#283025]" };
  };

  const getStatusDisplay = (status: string) => {
    const s = status?.toUpperCase();
    if (s === "COMPLETED" || s === "SUCCESSFUL" || s === "SUCCESS") {
      return { text: "text-[#58664C]", icon: <CheckCircle2 className="h-4 w-4" /> };
    }
    if (s === "PENDING" || s === "PROCESSING") {
      return { text: "text-[#74766B]", icon: <Clock className="h-4 w-4" /> };
    }
    if (s === "FAILED" || s === "CANCELLED" || s === "ERROR") {
      return { text: "text-[#991B1B]", icon: <AlertCircle className="h-4 w-4" /> };
    }
    return { text: "text-[#74766B]", icon: <AlertCircle className="h-4 w-4" /> };
  };

  // Lock body scroll and listen for Escape key when modal is open
  useEffect(() => {
    if (!selectedTx) {
      setShowTransferDetails(false);
      return;
    }
    
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedTx(null);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedTx]);

  useEffect(() => {
    const fetchTxs = async () => {
      try {
        setLoading(true);
        const userId = (session?.user as any)?.id || (session?.user as any)?.farmerId || "";
        if (!userId) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001"}/api/v1/wallet/transactions?userId=${userId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
             setTransactions(json.data.map((tx: any) => ({
                id: tx._id,
                shortId: tx.transactionId.substring(0, 8),
                type: tx.type === 'CREDIT' ? 'PAYOUT' : (tx.type === 'DEBIT' ? 'PAYMENT' : tx.type), 
                title: tx.description || 'Transaction',
                amount: tx.amount || 0,
                amountStr: `₹${(tx.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
                date: (tx.razorpayData?.created_at ? new Date(tx.razorpayData.created_at * 1000) : new Date(tx.timestamp)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                time: (tx.razorpayData?.created_at ? new Date(tx.razorpayData.created_at * 1000) : new Date(tx.timestamp)).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                status: tx.status || 'UNKNOWN',
                orderId: tx.orderId || '',
                method: tx.razorpayData ? (tx.razorpayData.method || tx.razorpayData.status) : 'Escrow Wallet',
                razorpayId: tx.razorpayData?.id || tx.transactionId,
                rzpData: tx.razorpayData,
                cropName: tx.cropName,
                buyerUpi: tx.buyerUpi,
                bankName: tx.bankName,
                utr: tx.utr
             })));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTxs();
  }, [session]);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.shortId.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const ITEMS_PER_PAGE = 15;
  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const scrollToTop = () => {
    const tableTop = document.getElementById("transactions-table-container");
    if (tableTop) {
      const topPos = tableTop.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: topPos, behavior: 'smooth' });
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setTimeout(scrollToTop, 10);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F5F1E6] text-[#283025] font-sans pb-24 pt-24 px-4 sm:px-6 lg:px-8 relative z-10">
      <Head>
        <title>{role} Wallet Transactions | Seed2Shelf</title>
        <meta name="description" content={`Payment history and escrow transaction logs for ${role.toLowerCase()}s`} />
      </Head>

      <div className="max-w-[1200px] mx-auto space-y-5 animate-in fade-in duration-200 relative z-10">
        
        {/* CONTINUOUS ILLUSTRATED HEADER BANNER */}
        <div className="w-full bg-[#FFFCF5] border border-[#DADFCF] rounded-[10px] md:rounded-[12px] overflow-hidden shadow-sm flex flex-col md:relative">
          
          {/* Mobile Title (stacked above on small screens to avoid overlapping the artwork) */}
          <div className="md:hidden flex items-center gap-[10px] p-5 bg-[#FFFCF5] border-b border-[#DADFCF]/50">
            <Wallet className="h-6 w-6 text-[#283025]" strokeWidth={1.5} />
            <h1 className="text-[20px] sm:text-[24px] font-semibold text-[#283025] tracking-tight leading-none font-sans">
              Wallet Transactions
            </h1>
          </div>

          {/* Continuous Full-Width Illustration */}
          <div className="relative w-full h-[140px] sm:h-[160px] md:h-[170px] lg:h-[190px]">
            <img 
              src="/wallet-transactions-banner.png" 
              alt="Farmer and customer exchanging payment under a tree" 
              className="w-full h-full object-cover object-center pointer-events-none mix-blend-multiply" 
            />
            
            {/* Desktop Title (overlaid in the sky at ~24% from left) */}
            <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-[24%] items-center gap-[10px] pointer-events-auto">
              <Wallet className="h-[26px] w-[26px] lg:h-7 lg:w-7 text-[#283025]" strokeWidth={1.5} />
              <h1 className="text-[28px] lg:text-[32px] font-semibold text-[#283025] tracking-tight leading-none font-sans">
                Wallet Transactions
              </h1>
            </div>
          </div>
        </div>

        {/* SEARCH INPUT */}
        <div className="relative w-full md:w-[320px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#69705E]" />
          <input
            type="text"
            placeholder="Search transactions or orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FFFCF5] border border-[#DADFCF] rounded-[8px] pl-10 pr-4 py-2 text-[14px] text-[#283025] placeholder-[#69705E] focus:outline-none focus:border-[#6F7D61] focus:ring-1 focus:ring-[#6F7D61] transition"
          />
        </div>

        {/* UNIFIED TABLE */}
        <div id="transactions-table-container" className="bg-[#FFFCF5] border border-[#DADFCF] rounded-[10px] shadow-sm flex flex-col relative z-10">
          <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="p-12 text-center text-[#69705E] text-[14px]">Loading transactions...</div>
          ) : paginatedTransactions.length === 0 ? (
            <div className="p-12 text-center text-[#69705E] text-[14px]">
              No transaction records found matching your criteria.
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[700px] animate-in fade-in duration-300" key={currentPage}>
              <thead>
                <tr className="bg-[#EDF0E6] border-b border-[#DADFCF] text-[#69705E] text-[13px] font-medium">
                  <th className="px-6 py-3 font-medium">Transaction</th>
                  <th className="px-6 py-3 font-medium">Order reference</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Amount</th>
                  <th className="px-6 py-3 font-medium text-center w-16">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DADFCF]">
                {paginatedTransactions.map((tx) => {
                  const display = getTransactionDisplay(tx);
                  const statusDisplay = getStatusDisplay(tx.status);
                  
                  return (
                    <tr 
                      key={tx.id}
                      onClick={() => setSelectedTx(tx)}
                      className="hover:bg-[#EDF0E6]/60 transition cursor-pointer group h-[72px]"
                    >
                      <td className="px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-[8px] border shrink-0 bg-[#FFFCF5] ${display.color} border-[#DADFCF]`}>
                            {display.icon}
                          </div>
                          <span className="text-[15px] font-medium text-[#283025] capitalize">
                            {tx.type.replace('_', ' ').toLowerCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 whitespace-nowrap">
                        <span className="text-[14px] text-[#69705E]">{tx.orderId || '—'}</span>
                      </td>
                      <td className="px-6 whitespace-nowrap">
                        <span className="text-[14px] text-[#69705E]">{tx.date}</span>
                      </td>
                      <td className="px-6 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                           <span className={statusDisplay.text}>{statusDisplay.icon}</span>
                           <span className={`text-[14px] capitalize ${statusDisplay.text}`}>
                              {tx.status.toLowerCase()}
                           </span>
                        </div>
                      </td>
                      <td className="px-6 whitespace-nowrap text-right">
                        <span className={`text-[16px] font-medium ${display.amountColor}`}>
                          {display.sign}{tx.amountStr}
                        </span>
                      </td>
                      <td className="px-6 whitespace-nowrap text-center">
                        <button className="text-[#69705E] group-hover:text-[#58664C] transition mx-auto flex justify-center">
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          </div>

          {/* Pagination Footer */}
          {!loading && filteredTransactions.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#DADFCF] bg-[#FFFCF5] rounded-b-[10px]">
              <div className="text-[13px] text-[#69705E]">
                Showing <span className="font-medium text-[#283025]">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>–<span className="font-medium text-[#283025]">{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}</span> of <span className="font-medium text-[#283025]">{totalItems}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-[13px] font-medium text-[#283025] border border-[#DADFCF] rounded-[6px] hover:bg-[#EDF0E6] disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
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
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-7 h-7 flex items-center justify-center rounded-[6px] text-[13px] font-medium transition-colors ${
                          currentPage === pageNum
                            ? "bg-[#6F7D61] text-[#FFFCF5]"
                            : "text-[#69705E] hover:bg-[#EDF0E6] hover:text-[#283025]"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-[13px] font-medium text-[#283025] border border-[#DADFCF] rounded-[6px] hover:bg-[#EDF0E6] disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CENTERED DETAILS MODAL (Completely Refined) */}
      {selectedTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm transition-all p-3 md:p-4" onClick={() => setSelectedTx(null)}>
          <div 
            className="bg-[#FFFCF5] w-full md:w-[600px] md:max-w-[600px] max-h-[90dvh] rounded-[16px] flex flex-col shadow-xl border border-[#DADFCF] relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header: Compact & Light */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DADFCF] bg-[#FFFCF5] rounded-t-[16px]">
              <div className="flex items-center gap-2">
                 <ReceiptIndianRupee className="w-4 h-4 text-[#6F7D61]" />
                 <span className="text-[15px] font-medium text-[#283025]">Transaction details</span>
              </div>
              <button 
                onClick={() => setSelectedTx(null)}
                className="p-1.5 text-[#69705E] hover:text-[#283025] hover:bg-[#EDF0E6] rounded-md transition"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
              
              {/* Payment Summary */}
              <div className="flex flex-col">
                <div className="flex items-end justify-between">
                  <div className="text-[32px] font-medium text-[#283025] leading-none">
                    {getTransactionDisplay(selectedTx).sign}{selectedTx.amountStr}
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                     <span className={getStatusDisplay(selectedTx.status).text}>{getStatusDisplay(selectedTx.status).icon}</span>
                     <span className={`text-[14px] capitalize font-medium ${getStatusDisplay(selectedTx.status).text}`}>{selectedTx.status.toLowerCase()}</span>
                  </div>
                </div>
                
                <div className="text-[15px] font-medium text-[#283025] capitalize mt-3">
                  {selectedTx.type.replace('_', ' ').toLowerCase()}
                </div>
                
                <div className="text-[13px] text-[#69705E] mt-1.5">
                  {selectedTx.date} at {selectedTx.time}
                </div>
              </div>

              {/* Order Information (No Counterparty) */}
              <div className="space-y-4">
                {selectedTx.orderId && (
                  <div className="flex justify-between items-center py-2 border-b border-[#DADFCF]/60">
                    <span className="text-[14px] text-[#69705E]">Order Reference</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium text-[#283025]">{selectedTx.orderId}</span>
                      <button onClick={() => copyToClipboard(selectedTx.orderId, 'modal-order')} className="text-[#6F7D61] hover:text-[#58664C]">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      {copiedField === 'modal-order' && <span className="absolute right-4 text-[11px] text-[#58664C] font-medium -mt-6 bg-[#EDF0E6] px-2 py-0.5 rounded">Copied!</span>}
                    </div>
                  </div>
                )}
                {selectedTx.cropName && (
                  <div className="flex justify-between items-center py-2 border-b border-[#DADFCF]/60">
                    <span className="text-[14px] text-[#69705E]">Product</span>
                    <span className="text-[14px] font-medium text-[#283025]">{selectedTx.cropName}</span>
                  </div>
                )}
              </div>

              {/* Transfer Details - Expandable */}
              <div>
                <button 
                  onClick={() => setShowTransferDetails(!showTransferDetails)}
                  className="w-full flex items-center justify-between py-2 group"
                >
                  <div className="flex items-center gap-2 text-[#283025]">
                     <FileText className="w-4 h-4 text-[#6F7D61]" />
                     <span className="text-[14px] font-medium">Transfer Details</span>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-[#69705E] transition-transform ${showTransferDetails ? 'rotate-90' : 'group-hover:text-[#283025]'}`} />
                </button>
                
                {showTransferDetails && (
                  <div className="mt-3 space-y-3 bg-[#FFFCF5] p-1">
                     <div className="flex justify-between items-center py-1.5 border-b border-[#DADFCF]/40">
                        <span className="text-[13px] text-[#69705E]">Transaction ID</span>
                        <div className="flex items-center gap-2">
                           <span className="text-[13px] text-[#283025] font-mono">{selectedTx.razorpayId || selectedTx.id}</span>
                           <button onClick={() => copyToClipboard(selectedTx.razorpayId || selectedTx.id, 'modal-tx')} className="text-[#6F7D61] hover:text-[#58664C]">
                             <Copy className="h-3.5 w-3.5" />
                           </button>
                        </div>
                     </div>
                     
                     <div className="flex justify-between items-center py-1.5 border-b border-[#DADFCF]/40">
                        <span className="text-[13px] text-[#69705E]">Payment Method</span>
                        <span className="text-[13px] text-[#283025]">
                          {selectedTx.rzpData?.method === 'upi' ? 'UPI' : (selectedTx.rzpData?.method || 'Escrow Wallet').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </span>
                     </div>
                     
                     {selectedTx.bankName && (
                        <div className="flex justify-between items-center py-1.5 border-b border-[#DADFCF]/40">
                           <span className="text-[13px] text-[#69705E]">Destination</span>
                           <span className="text-[13px] text-[#283025]">{selectedTx.bankName}</span>
                        </div>
                     )}
                     
                     {selectedTx.utr && (
                        <div className="flex justify-between items-center py-1.5 border-b border-[#DADFCF]/40">
                           <span className="text-[13px] text-[#69705E]">UTR Reference</span>
                           <div className="flex items-center gap-2">
                              <span className="text-[13px] text-[#283025] font-mono">{selectedTx.utr}</span>
                              <button onClick={() => copyToClipboard(selectedTx.utr, 'modal-utr')} className="text-[#6F7D61] hover:text-[#58664C]">
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                           </div>
                        </div>
                     )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#DADFCF] bg-[#FFFCF5] rounded-b-[16px]">
              <button
                onClick={() => alert(`Connecting to Seed2Shelf ${role} Support...`)}
                className="px-4 py-2 text-[#6F7D61] hover:bg-[#EDF0E6] rounded-lg transition font-medium text-[13px]"
              >
                Support
              </button>
              <button
                onClick={() => alert(`Share Receipt link copied for ${selectedTx.shortId}`)}
                className="flex items-center justify-center gap-2 px-5 py-2 bg-[#58664C] hover:bg-[#4A573F] text-[#FFFCF5] rounded-lg transition font-medium text-[13px]"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share Receipt
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
