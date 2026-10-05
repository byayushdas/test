import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  Lock,
  Building2,
  CheckCircle2,
  Search,
  X,
  Share2,
  Copy,
  HelpCircle,
  ChevronDown
} from "lucide-react";

export default function WalletTransactions() {
  const { data: session } = useSession();
  const [filterType] = useState<"ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<any[]>([]);

  const getTransactionDisplay = (tx: any) => {
    if (tx.type === "PAYOUT") return { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: <ArrowDownLeft className="h-5 w-5" />, label: "Received from:", sign: "+ ", amountColor: "text-emerald-400", modalBg: "bg-emerald-700" };
    if (tx.type === "PAYMENT") return { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: <ArrowUpRight className="h-5 w-5" />, label: "Paid to:", sign: "- ", amountColor: "text-emerald-400", modalBg: "bg-emerald-700" };
    if (tx.type === "REFUND") return { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: <ArrowDownLeft className="h-5 w-5" />, label: "Refund for:", sign: "+ ", amountColor: "text-blue-400", modalBg: "bg-blue-600" };
    return { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: <Lock className="h-5 w-5" />, label: "Escrow Locked:", sign: "", amountColor: "text-amber-300", modalBg: "bg-amber-600" };
  };

  useEffect(() => {
    const fetchTxs = async () => {
      try {
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
                buyer: tx.orderId || 'Unknown',
                amount: `₹ ${tx.amount?.toLocaleString()}`,
                date: (tx.razorpayData?.created_at ? new Date(tx.razorpayData.created_at * 1000) : new Date(tx.timestamp)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                time: (tx.razorpayData?.created_at ? new Date(tx.razorpayData.created_at * 1000) : new Date(tx.timestamp)).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                status: tx.status,
                orderId: tx.orderId || '',
                method: tx.razorpayData ? (tx.razorpayData.method || tx.razorpayData.status) : 'Escrow Wallet',
                razorpayId: tx.razorpayData?.id || tx.transactionId,
                rzpData: tx.razorpayData
             })));
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchTxs();
  }, [session]);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesFilter =
      filterType === "ALL" ||
      (filterType === "PAYOUTS" && tx.type === "PAYOUT") ||
      (filterType === "ESCROW" && tx.type === "ESCROW_HOLD");

    const matchesSearch =
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.buyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.shortId.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="min-h-screen text-stone-100 font-sans pb-24 pt-6 px-4 sm:px-6 lg:px-8 relative z-20">
      <Head>
        <title>Distributor Wallet Transactions | Seed2Shelf</title>
        <meta name="description" content="Payment history and escrow transaction logs for farmers" />
      </Head>

      {/* Solid Dark Background Overlay */}

      <div className="max-w-5xl mx-auto space-y-7">

        {/* =========================================================================
            PAGE HEADER (MATCHING WALLET BALANCE HEADER LOGO STYLE)
           ========================================================================= */}
        <div className="flex items-center gap-3.5 border-y border-stone-800/80 py-3.5">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 shrink-0">
            <ArrowLeftRight className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Wallet Transactions
            </h1>
          </div>
        </div>


        {/* =========================================================================
            SEARCH & FILTER CONTROLS
           ========================================================================= */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
              <input
                type="text"
                placeholder="Search crop, buyer, or Order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500/50 transition"
              />
            </div>

            {/* Single Filter Option */}
            <div className="relative shrink-0">
              <div className="bg-stone-900 border border-emerald-500/30 text-emerald-400 rounded-2xl px-5 py-2.5 text-xs font-extrabold flex items-center justify-center shadow-md">
                <span>All Transactions</span>
              </div>
            </div>

          </div>
        </div>


        {/* =========================================================================
            TRANSACTIONS LIST CONTAINER (CLEAN & UNCLUTTERED)
           ========================================================================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 h-6">
            <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Transaction Records
            </h2>
            <span className="text-[11px] text-stone-500">
              Tap any row to view details
            </span>
          </div>

          <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-5 sm:p-6 space-y-2.5 shadow-sm">
            {filteredTransactions.length === 0 ? (
              <div className="p-8 text-center text-stone-400 text-xs">
                No transaction records found matching your query.
              </div>
            ) : (
              filteredTransactions.map((tx) => {
                const display = getTransactionDisplay(tx);
                return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="bg-stone-950/60 border border-stone-800/80 hover:border-stone-700/80 rounded-2xl p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-stone-900/50 transition shadow-sm"
                >
                  {/* Left Side: Icon + Title & Buyer */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`p-2.5 rounded-xl border shrink-0 ${display.bg} ${display.color}`}>
                      {display.icon}
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-sm tracking-tight truncate">
                        {tx.cropName || tx.title || 'Transaction'}
                      </h4>
                      <p className="text-xs text-stone-400 truncate mt-0.5">
                        {display.label} <strong className="text-stone-300 font-semibold">{tx.buyer}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Amount & Date */}
                  <div className="text-right shrink-0">
                    <span className={`text-base font-extrabold block tracking-tight ${display.amountColor}`}>
                      {display.sign}{tx.amount}
                    </span>
                    <span className="text-xs text-stone-400 font-medium block mt-0.5">
                      {tx.date}
                    </span>
                  </div>
                </div>
              )})
            )}
          </div>
        </div>

      </div>


      {/* =========================================================================
          PHONEPE-INSPIRED TRANSACTION DETAILS MODAL DIALOG (POPUP)
         ========================================================================= */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* PhonePe Green Status Top Header Bar */}
            <div className={`p-4 sm:p-5 text-white flex items-center justify-between ${getTransactionDisplay(selectedTx).modalBg}`}>
              <div className="space-y-0.5">
                <h3 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                  {selectedTx.status}
                </h3>
                <p className="text-xs text-emerald-100/90 font-medium pl-7">
                  {selectedTx.time} on {selectedTx.date}
                </p>
              </div>

              <button
                onClick={() => setSelectedTx(null)}
                className="p-1.5 text-white/80 hover:text-white rounded-xl bg-black/20 hover:bg-black/40 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Main Content Container */}
            <div className="p-5 sm:p-6 space-y-5">
              
              {/* Paid By / Received From Card */}
              <div className="bg-stone-950 rounded-2xl p-4 border border-stone-800 space-y-3">
                <span className="text-[11px] text-stone-400 font-semibold block uppercase tracking-wider">
                  {getTransactionDisplay(selectedTx).label}
                </span>

                <div className="flex items-center justify-between gap-3 pb-3 border-b border-stone-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-extrabold text-sm flex items-center justify-center shrink-0">
                      {selectedTx.buyer.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-sm">{selectedTx.buyer}</h4>
                      <p className="text-xs text-stone-400 font-mono text-[11px]">{selectedTx.buyerUpi}</p>
                    </div>
                  </div>

                  <span className="text-lg font-black text-white tracking-tight shrink-0">
                    {selectedTx.amount}
                  </span>
                </div>

                <div className="text-xs text-stone-400 space-y-1 pt-1">
                  <div className="flex justify-between">
                    <span>Crop Item:</span>
                    <strong className="text-stone-200">{selectedTx.cropName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Order ID:</span>
                    <strong className="font-mono text-stone-300">{selectedTx.orderId}</strong>
                  </div>
                </div>
              </div>


              {/* Transfer Details Section */}
              <div className="bg-stone-950 rounded-2xl p-4 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-white border-b border-stone-800/80 pb-2.5">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-emerald-400" /> Transfer Details
                  </span>
                  <ChevronDown className="h-4 w-4 text-stone-500" />
                </div>

                <div className="space-y-3 text-xs">
                  
                  {/* Transaction ID */}
                  <div>
                    <span className="text-[11px] text-stone-400 block">Payment Method & ID (Razorpay)</span>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="font-mono text-stone-200 text-[11px] truncate">
                        {selectedTx.rzpData?.method ? `${selectedTx.rzpData.method.charAt(0).toUpperCase() + selectedTx.rzpData.method.slice(1)} | ` : ''}{selectedTx.razorpayId || selectedTx.id}
                      </span>
                      <button
                        onClick={() => copyToClipboard(selectedTx.razorpayId || selectedTx.id, "id")}
                        className="text-stone-400 hover:text-emerald-400 p-1 transition cursor-pointer shrink-0"
                        title="Copy Transaction ID"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {copiedField === "id" && (
                      <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">Copied!</span>
                    )}
                  </div>

                  {/* Account / Credited to */}
                  <div className="pt-2 border-t border-stone-800/60">
                    <span className="text-[11px] text-stone-400 block">
                      {selectedTx.type === "PAYOUT" ? "Credited to Bank Account" : "Destination Bank Account"}
                    </span>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="font-semibold text-emerald-400 text-xs">{selectedTx.bankName}</span>
                      <span className="font-extrabold text-white text-xs">{selectedTx.amount}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="text-[11px] text-stone-400">UTR Reference:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-stone-300 text-[11px]">{selectedTx.utr}</span>
                        <button
                          onClick={() => copyToClipboard(selectedTx.utr, "utr")}
                          className="text-stone-400 hover:text-emerald-400 p-0.5 transition cursor-pointer"
                          title="Copy UTR"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {copiedField === "utr" && (
                      <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">Copied UTR!</span>
                    )}
                  </div>

                </div>
              </div>


              {/* PhonePe-Style Action Buttons: ONLY Share Receipt & Support */}
              <div className={`grid ${(selectedTx.status === "COMPLETED" || selectedTx.status === "SUCCESSFUL" || selectedTx.status === "REFUND" || selectedTx.status === "REFUNDED") ? 'grid-cols-3' : 'grid-cols-2'} gap-3 pt-1`}>
                {(selectedTx.status === "COMPLETED" || selectedTx.status === "SUCCESSFUL" || selectedTx.status === "REFUND" || selectedTx.status === "REFUNDED") && (
                  <button
                    onClick={() => alert(`Viewing Invoice (Mockup) for ${selectedTx.orderId}`)}
                    className="flex flex-col items-center justify-center p-3 bg-stone-950 hover:bg-stone-800 rounded-2xl border border-stone-800 transition cursor-pointer text-stone-200 hover:text-white"
                  >
                    <ArrowDownLeft className="h-5 w-5 text-emerald-400 mb-1" />
                    <span className="text-[11px] font-bold">View Invoice</span>
                  </button>
                )}

                <button
                  onClick={() => alert(`Share Receipt link copied for ${selectedTx.shortId}`)}
                  className="flex flex-col items-center justify-center p-3 bg-stone-950 hover:bg-stone-800 rounded-2xl border border-stone-800 transition cursor-pointer text-stone-200 hover:text-white"
                >
                  <Share2 className="h-5 w-5 text-emerald-400 mb-1" />
                  <span className="text-[11px] font-bold">Share Receipt</span>
                </button>

                <button
                  onClick={() => alert("Connecting to Seed2Shelf Distributor Support...")}
                  className="flex flex-col items-center justify-center p-3 bg-stone-950 hover:bg-stone-800 rounded-2xl border border-stone-800 transition cursor-pointer text-stone-200 hover:text-white"
                >
                  <HelpCircle className="h-5 w-5 text-emerald-400 mb-1" />
                  <span className="text-[11px] font-bold">Support</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) {
    return { redirect: { destination: "/", permanent: false } };
  }
  return { props: { user: JSON.parse(JSON.stringify(session.user)) } };
};
