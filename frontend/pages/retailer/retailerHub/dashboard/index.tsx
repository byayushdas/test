import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { 
  BarChart3, 
  TrendingUp, 
  IndianRupee,
  Package,
  Lock,
  AlertTriangle,
  Calendar,
  Download,
  CheckCircle2,
  PieChart,
  ArrowUpRight,
  Activity,
  FileSpreadsheet,
  Loader2
} from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

type Timeframe = "WEEKLY" | "MONTHLY" | "YEARLY";

interface AnalyticsData {
  produceTransformed: string;
  totalRevenue: string;
  escrowLocked: string;
  disputeRate: string;
  successfulShipments: number;
  totalOrders: number;
  productBreakdown?: any[];
  cropBreakdown?: any[];
}

const emptyAnalytics: AnalyticsData = {
  produceTransformed: "0 kg",
  totalRevenue: "₹ 0",
  escrowLocked: "₹ 0",
  disputeRate: "0.0%",
  successfulShipments: 0,
  totalOrders: 0
};

function generatePdfBlob(title: string, timeframe: string, stats: any): Blob {
  const dateStr = new Date().toLocaleString("en-IN");
  const produceVal = stats.produceTransformed || stats.produceSold || "0 kg";
  const revenueVal = stats.totalRevenue || "₹ 0";
  const escrowVal = stats.escrowLocked || "₹ 0";
  const disputeVal = stats.disputeRate || "0.0%";
  const shipVal = String(stats.successfulShipments || 0);
  const orderVal = String(stats.totalOrders || 0);

  const items = stats.productBreakdown || stats.cropBreakdown || [];

  const textLines = [
    `${title.toUpperCase()} (${timeframe})`,
    `Generated: ${dateStr}`,
    "----------------------------------------------------------------------",
    `Items Moved                : ${produceVal}`,
    `Total Revenue              : ${revenueVal}`,
    `Escrow Locked              : ${escrowVal}`,
    `Dispute Rate               : ${disputeVal}`,
    `Successful Shipments       : ${shipVal}`,
    `Total Orders               : ${orderVal}`,
    "----------------------------------------------------------------------",
    "ITEMIZED BREAKDOWN:",
    ...(items.length > 0 
      ? items.map((it: any) => `* ${it.name}: ${it.quantity} | ${it.revenue} (${it.percentage}%)`)
      : ["* No recorded transactions for this timeframe."]),
    "----------------------------------------------------------------------",
    "Verified & Secured by Seed2Shelf Platform Blockchain"
  ];

  const pdfStreamText = textLines.map(line => {
    const escaped = line.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
    return `(${escaped}) '`;
  }).join("\n");

  const pdfContent = `BT\n/F1 11 Tf\n14 TL\n40 780 Td\n${pdfStreamText}\nET`;
  const streamLength = pdfContent.length;

  const obj1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`;
  const obj4 = `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${pdfContent}\nendstream\nendobj\n`;
  const obj5 = `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;

  const header = `%PDF-1.4\n`;
  
  const o1Pos = header.length;
  const o2Pos = o1Pos + obj1.length;
  const o3Pos = o2Pos + obj2.length;
  const o4Pos = o3Pos + obj3.length;
  const o5Pos = o4Pos + obj4.length;
  const xrefPos = o5Pos + obj5.length;

  const xref = `xref\n0 6\n0000000000 65535 f \n${String(o1Pos).padStart(10, '0')} 00000 n \n${String(o2Pos).padStart(10, '0')} 00000 n \n${String(o3Pos).padStart(10, '0')} 00000 n \n${String(o4Pos).padStart(10, '0')} 00000 n \n${String(o5Pos).padStart(10, '0')} 00000 n \n`;
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

  const fullPdf = header + obj1 + obj2 + obj3 + obj4 + obj5 + xref + trailer;
  return new Blob([fullPdf], { type: "application/pdf" });
}

export default function RetailerDashboard() {
  const { data: session } = useSession();
  const retailerId = (session?.user as any)?.retailerId || (session?.user as any)?.id || "";

  const [timeframe, setTimeframe] = useState<Timeframe>("MONTHLY");
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStats, setCurrentStats] = useState<AnalyticsData>(emptyAnalytics);

  useEffect(() => {
    if (!retailerId) return;
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        // Mock API call
        const res = await fetch(`${BACKEND_URL}/api/v1/retailer/reports?userId=${retailerId}&timeframe=${timeframe}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setCurrentStats(json.data);
          } else {
            setCurrentStats(emptyAnalytics);
          }
        }
      } catch (err) {
        console.warn("Backend API offline or unreachable, utilizing default zero state", err);
        setCurrentStats(emptyAnalytics);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [retailerId, timeframe]);

  const handleExportReport = async (type: "CSV" | "PDF") => {
    try {
      if (type === "CSV") {
        const rows = [
          ["Seed2Shelf Retailer Analytics Report"],
          ["Timeframe", timeframe],
          ["Date Generated", new Date().toLocaleString("en-IN")],
          [""],
          ["Summary Metric", "Value"],
          ["Items Moved", currentStats.produceTransformed || "0 kg"],
          ["Total Revenue", currentStats.totalRevenue || "₹ 0"],
          ["Escrow Locked", currentStats.escrowLocked || "₹ 0"],
          ["Dispute Rate", currentStats.disputeRate || "0.0%"],
          ["Successful Shipments", currentStats.successfulShipments || 0],
          ["Total Orders", currentStats.totalOrders || 0],
          [""],
          ["Product Breakdown"],
          ["Item Name", "Quantity", "Revenue", "Share %"],
          ...(currentStats.productBreakdown || []).map(c => [c.name, c.quantity, c.revenue, `${c.percentage}%`])
        ];

        const csvString = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Retailer_Report_${timeframe}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const blob = generatePdfBlob("Seed2Shelf Retailer Analytics Report", timeframe, currentStats);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Retailer_Report_${timeframe}_${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      setDownloadSuccess(`${type} file downloaded to your device!`);
    } catch (err) {
      console.error("Export error:", err);
    }
    setTimeout(() => setDownloadSuccess(null), 3500);
  };



  return (
    <div className="min-h-screen text-stone-100 font-sans pb-24 pt-6 px-4 sm:px-6 lg:px-8 relative z-20">
      <Head>
        <title>Retailer Dashboard | Seed2Shelf</title>
        <meta name="description" content="View retailer analytics and total revenue summaries." />
      </Head>

      <div className="max-w-6xl mx-auto space-y-7">
        
        {/* HEADER WITH TIMEFRAME SELECTOR ON RIGHT */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-y border-stone-800/80 py-3.5">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 shrink-0">
              <BarChart3 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Dashboard
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isLoading && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating...</span>
              </div>
            )}

            {/* TIMEFRAME SWITCHING OPTIONS */}
            <div className="flex items-center bg-stone-950 p-1.5 rounded-2xl border border-stone-800 text-xs font-extrabold">
              <button
                onClick={() => setTimeframe("WEEKLY")}
                className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  timeframe === "WEEKLY"
                    ? "bg-emerald-600 text-white shadow-md font-black"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                <span>Weekly</span>
              </button>

              <div className="w-[1px] h-4 bg-stone-800 mx-1 shrink-0"></div>

              <button
                onClick={() => setTimeframe("MONTHLY")}
                className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  timeframe === "MONTHLY"
                    ? "bg-emerald-600 text-white shadow-md font-black"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                <span>Monthly</span>
              </button>

              <div className="w-[1px] h-4 bg-stone-800 mx-1 shrink-0"></div>

              <button
                onClick={() => setTimeframe("YEARLY")}
                className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  timeframe === "YEARLY"
                    ? "bg-emerald-600 text-white shadow-md font-black"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                <span>Yearly</span>
              </button>
            </div>
          </div>
        </div>

        {downloadSuccess && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-400 font-bold flex items-center gap-2 animate-in fade-in duration-300">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* TIMEFRAME SUB-HEADER BANNER */}
        <div className="flex flex-wrap items-center justify-between bg-stone-900/90 border border-stone-800/90 rounded-2xl p-4 sm:p-5 gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-stone-200">
              {timeframe === "WEEKLY" ? "Current Week Report" : timeframe === "MONTHLY" ? "Monthly Summary" : "Annual Summary"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportReport("CSV")}
              className="px-3.5 py-1.5 bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded-xl text-xs font-bold text-stone-300 transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => handleExportReport("PDF")}
              className="px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* UNIFIED 4-METRIC SQUARE CONTAINER */}
        <div className="bg-stone-900/90 border border-stone-800/90 rounded-3xl p-3.5 sm:p-5 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            
            {/* Cell 1: Items Moved */}
            <div className="p-6 bg-stone-950/80 border border-stone-800/70 rounded-2xl space-y-4 flex flex-col justify-between hover:border-emerald-500/30 transition duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-stone-400 uppercase tracking-wider block">
                  ITEMS MOVED
                </span>
                <div className="p-2.5 bg-stone-900 border border-stone-800 rounded-xl text-stone-300">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-3xl font-extrabold text-white tracking-tight">{currentStats.produceTransformed}</p>
                <div className="text-[11px] text-stone-400 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{currentStats.successfulShipments} Dispatched Batches</span>
                </div>
              </div>
            </div>

            {/* Cell 2: Total Revenue */}
            <div className="p-6 bg-stone-950/80 border border-emerald-900/30 rounded-2xl space-y-4 flex flex-col justify-between hover:border-emerald-500/40 transition duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider block">
                  TOTAL REVENUE
                </span>
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-3xl font-extrabold text-emerald-400 tracking-tight">{currentStats.totalRevenue}</p>
                <div className="text-[11px] text-emerald-400/90 flex items-center gap-1.5 font-medium">
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                  <span>Settled Escrow Earnings</span>
                </div>
              </div>
            </div>

            {/* Cell 3: Escrow Locked */}
            <div className="p-6 bg-stone-950/80 border border-amber-900/30 rounded-2xl space-y-4 flex flex-col justify-between hover:border-amber-500/40 transition duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">
                  ESCROW LOCKED
                </span>
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                  <Lock className="w-4 h-4" />
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-3xl font-extrabold text-amber-400 tracking-tight">{currentStats.escrowLocked}</p>
                <div className="text-[11px] text-stone-400 flex items-center gap-1.5 font-medium">
                  <Activity className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>In-Transit Protection</span>
                </div>
              </div>
            </div>

            {/* Cell 4: Dispute Rate */}
            <div className="p-6 bg-stone-950/80 border border-rose-900/30 rounded-2xl space-y-4 flex flex-col justify-between hover:border-rose-500/40 transition duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-stone-400 uppercase tracking-wider block">
                  DISPUTE RATE
                </span>
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-3xl font-extrabold text-rose-400 tracking-tight">{currentStats.disputeRate}</p>
                <div className="text-[11px] text-stone-400 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Quality Assurance Approved</span>
                </div>
              </div>
            </div>

          </div>
        </div>



      </div>
    </div>
  );
}
