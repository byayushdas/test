import { useState, useEffect } from "react";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  MapPin, 
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Check,
  ArrowDown,
  GitBranch,
  Award,
  ExternalLink
} from "lucide-react";
import TraceDetailsModal, { StageData } from "../../components/common/TraceDetailsModal";

interface TraceRecord {
  batchId: string;
  cropName: string;
  currentOwnerName: string;
  totalVolume: string;
  harvestDate: string;
  qualityIndex: string;
  organicCertified: boolean;
  parentBatches: {
    batchId: string;
    cropName: string;
    farmerName: string;
    quantity: string;
    location: string;
  }[];
}

const DEMO_PARENT_BATCHES = [
  {
    batchId: "BATCH2026000001",
    cropName: "Grade-A Alphonso Mangoes",
    farmerName: "Ramesh Kumar (GreenAcres)",
    quantity: "300 kg",
    location: "Ratnagiri Orchard Plot #4"
  },
  {
    batchId: "BATCH2026000002",
    cropName: "Grade-A Alphonso Mangoes",
    farmerName: "Suresh Patil (GoldenFields)",
    quantity: "250 kg",
    location: "Devgad Orchard Plot #2"
  }
];

// Pre-packaged 5-level stages data with strict privacy filtering (No MongoDB IDs, No Tx Hashes, No Financials)
const STAGE_LEVELS_DATA: StageData[] = [
  {
    stageType: "FARMER",
    stageTitle: "Farm Harvest & Soil Origin",
    batchId: "BATCH2026000001",
    badge: "100% Organic Soil",
    generalInfo: [
      { label: "Product Name", value: "Grade-A Alphonso Mangoes" },
      { label: "Batch ID", value: "BATCH2026000001" },
      { label: "Farmer Name", value: "Farmer Ramesh Kumar" },
      { label: "Farm Name", value: "GreenAcres Organic Orchard" },
      { label: "Current Status", value: "Harvest Completed & Certified" }
    ],
    locationInfo: [
      { label: "Farm Address", value: "Ratnagiri Orchard Plot #4" },
      { label: "District", value: "Ratnagiri" },
      { label: "State", value: "Maharashtra" },
      { label: "Country", value: "India" }
    ],
    productInfo: [
      { label: "Harvest Quantity", value: "550 kg Raw Mangoes" },
      { label: "Farming Method", value: "Organic & Regenerative Agriculture" },
      { label: "Harvest Season", value: "Monsoon Peak Harvest 2026" }
    ],
    qualityInfo: [
      { label: "Certification", value: "NPOP Certified Organic (#NPOP-8821)" },
      { label: "Soil Quality Score", value: "100% Chemical Spray Free (Brix: 18.5°)" }
    ],
    timelineInfo: [
      { label: "Harvest Date", value: "14/07/2026 • 06:00 AM" }
    ]
  },
  {
    stageType: "PROCESSOR",
    stageTitle: "Factory Processing & Extraction",
    batchId: "BATCH2026000003",
    badge: "Lab Quality Pass",
    generalInfo: [
      { label: "Processed Product", value: "Organic Alphonso Mango Pulp" },
      { label: "New Batch ID", value: "BATCH2026000003" },
      { label: "Processor Name", value: "Heritage Food Processing Corp" },
      { label: "Factory Name", value: "Mandya Agro Processing Line A" },
      { label: "Current Status", value: "Aseptic Pulping Completed" }
    ],
    locationInfo: [
      { label: "Factory Address", value: "Plot #12, Agro Industrial Zone, Mandya, Karnataka, India" }
    ],
    productInfo: [
      { label: "Raw Material Used", value: "Fresh Organic Alphonso Mangoes" },
      { label: "Input Quantity", value: "550 kg Raw Produce" },
      { label: "Output Quantity", value: "450 Liters Concentrated Pulp" },
      { label: "Parent Batch Count", value: "2 Harvest Batches Merged" },
      { label: "Product Category", value: "Processed Fruit Pulp" }
    ],
    qualityInfo: [
      { label: "Quality Certification", value: "FSSAI Cleanroom Approved" },
      { label: "Lab Verification Status", value: "99.2% Purity Score Passed" }
    ],
    timelineInfo: [
      { label: "Processing Date", value: "16/07/2026 • 11:15 AM" }
    ]
  },
  {
    stageType: "DISTRIBUTOR",
    stageTitle: "Cold-Chain Logistics Transit",
    batchId: "BATCH2026000003-DIST",
    badge: "IoT Telemetry Active",
    generalInfo: [
      { label: "Distributor Name", value: "Metro Express Logistics" },
      { label: "Warehouse Name", value: "Central Refrigerated Hub Fleet #RF-90" },
      { label: "Shipment Status", value: "In Transit to Retail Outlet" },
      { label: "Current Location", value: "NH-48 Transport Corridor" }
    ],
    locationInfo: [
      { label: "Warehouse Address", value: "Logistics Corridor #4, Gurgaon Hub, India" }
    ],
    productInfo: [
      { label: "Storage Method", value: "Refrigerated Container (4.2°C Constant)" },
      { label: "Transport Method", value: "IoT Telemetry Truck Fleet" }
    ],
    timelineInfo: [
      { label: "Dispatch Date", value: "19/07/2026 • 02:30 PM" },
      { label: "Arrival Date", value: "21/07/2026 • 08:00 AM" }
    ]
  },
  {
    stageType: "RETAILER",
    stageTitle: "Retail Store & Consumer Display",
    batchId: "BATCH2026000003-RTL",
    badge: "Scan QR Verified",
    generalInfo: [
      { label: "Retail Store", value: "FreshMart Mega Superstore" },
      { label: "Branch Name", value: "Gurgaon CyberHub Outlet #14" },
      { label: "Product Status", value: "Stocked on Organic Produce Shelf" },
      { label: "Shelf Availability", value: "Available for Purchase" }
    ],
    locationInfo: [
      { label: "Store Address", value: "CyberHub Retail Complex, Sector 24, Gurgaon, Haryana" },
      { label: "Store Contact", value: "+91 98765 43210 (Customer Desk)" }
    ],
    timelineInfo: [
      { label: "Received Date", value: "22/07/2026 • 10:00 AM" }
    ]
  }
];

export default function TraceBatch() {
  const [batchId, setBatchId] = useState("BATCH2026000003");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"TREE" | "PASSPORT">("TREE");
  
  // Reusable Details Modal State
  const [selectedStageModal, setSelectedStageModal] = useState<StageData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTrace = async (id: string) => {
    const cleanId = id.trim().toUpperCase();
    if (!cleanId) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 300);
  };

  useEffect(() => {
    fetchTrace("BATCH2026000003");
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTrace(batchId);
  };

  const handleOpenModal = (stageData: StageData) => {
    setSelectedStageModal(stageData);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen text-stone-100 font-sans pt-20 pb-24 relative z-20">
      <Head>
        <title>Farm to Shelf Product Journey | Seed2Shelf</title>
        <meta name="description" content="Decentralized farm to shelf product provenance tree." />
      </Head>


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 relative z-10">
        
        {/* HEADER BAR (CLEAN TITLE & BATCH ID - NO DESCRIPTION LINE & NO SHARE/REFRESH BUTTONS) */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="space-y-1.5 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-extrabold">
              <ShieldCheck className="w-4 h-4" />
              <span>Decentralized On-Chain Provenance</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Farm to Shelf Product Journey
            </h1>
          </div>

          <div className="text-right font-mono text-xs text-stone-400 bg-stone-950 p-3 rounded-2xl border border-stone-800 shrink-0">
            <span className="block text-[10px] text-stone-500 uppercase font-sans font-bold">Active Batch</span>
            <strong className="text-emerald-400 font-black text-sm">{batchId}</strong>
          </div>
        </div>

        {/* SEARCH DOCK & QUICK DEMO SEEDS */}
        <div className="bg-stone-900/90 border border-stone-800 p-6 rounded-3xl space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-stone-300 uppercase tracking-wider flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-400" />
              Query Batch Traceability Code
            </h3>
            <span className="text-xs font-bold text-stone-400 tracking-wider uppercase">Immutable Ledger Index</span>
          </div>

          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-stone-500" />
              </span>
              <input
                type="text"
                required
                placeholder="Enter Batch ID (e.g. BATCH2026000003)"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-2xl pl-11 pr-4 py-3.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black px-6 sm:px-8 rounded-2xl text-xs transition shadow-md flex items-center justify-center cursor-pointer gap-2 shrink-0"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Querying...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Trace Produce</span>
                </>
              )}
            </button>
          </form>

          <div className="space-y-2.5 pt-2 border-t border-stone-800/80">
            <span className="text-[10px] text-stone-400 font-extrabold uppercase tracking-wider block">
              Quick Demo Lineage Seeds:
            </span>
            <div className="flex flex-wrap gap-2.5">
              {[
                { id: "BATCH2026000003", label: "Processor Alphonso Mango Pulp (Merged)" },
                { id: "BATCH2026000001", label: "Farmer Ratnagiri Organic Harvest" },
                { id: "BATCH2026000005", label: "Retail Mango Nectar Jars (Split)" }
              ].map((demo) => (
                <button
                  key={demo.id}
                  onClick={() => {
                    setBatchId(demo.id);
                    fetchTrace(demo.id);
                  }}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    batchId === demo.id 
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400" 
                      : "bg-stone-950 hover:bg-stone-800 border-stone-800 text-stone-300"
                  }`}
                >
                  <span className="font-mono text-[10px] font-black text-emerald-400 bg-stone-900 px-1.5 py-0.5 rounded border border-stone-800">
                    {demo.id}
                  </span>
                  <span>{demo.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* VIEW SWITCHER TAB BAR (TOGGLE BETWEEN TREE & CERTIFICATION PASSPORT) */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3 flex-wrap gap-4">
          <div className="flex items-center bg-stone-950 p-1.5 rounded-2xl border border-stone-800 text-xs font-extrabold">
            <button
              onClick={() => setActiveTab("TREE")}
              className={`px-5 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 ${
                activeTab === "TREE"
                  ? "bg-emerald-600 text-white shadow-md font-black"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <GitBranch className="w-4 h-4" />
              <span>Supply Chain Lineage Tree</span>
            </button>

            <div className="w-[1px] h-4 bg-stone-800 mx-2 shrink-0"></div>

            <button
              onClick={() => setActiveTab("PASSPORT")}
              className={`px-5 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 ${
                activeTab === "PASSPORT"
                  ? "bg-emerald-600 text-white shadow-md font-black"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Digital Certificate Passport</span>
            </button>
          </div>
        </div>

        {/* TAB CONTENTS */}
        <AnimatePresence mode="wait">
          {activeTab === "TREE" && (
            <motion.div
              key="tree-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-stone-900/90 border border-stone-800 p-6 sm:p-8 rounded-3xl space-y-8 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 pb-4">
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight">
                    Supply Chain Lineage Tree
                  </h2>
                  <p className="text-xs text-stone-400">
                    Interactive farm-to-shelf provenance network & parent harvest batch mergers.
                  </p>
                </div>
              </div>

              {/* 5-LEVEL VISUAL HIERARCHICAL TREE GRAPH WITH SECTION LEVEL HEADERS & TOP BATCH ID PILL */}
              <div className="space-y-6 py-4 max-w-4xl mx-auto">
                
                {/* LEVEL 1: FARM HARVEST ORIGIN (FARMER) */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-stone-300 uppercase tracking-widest text-center border-b border-stone-800 pb-2">
                    LEVEL 1: FARM HARVEST ORIGIN (FARMER)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {DEMO_PARENT_BATCHES.map((parent, idx) => (
                      <div key={idx} className="p-5 bg-stone-950 rounded-2xl border border-emerald-500/30 space-y-3 relative shadow-md">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-black text-emerald-400 bg-stone-900 px-3 py-1 rounded-xl border border-stone-800">
                            {parent.batchId}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-white">{parent.cropName}</h4>
                          <p className="text-xs text-stone-300">Farmer: <strong className="text-emerald-400 font-bold">{parent.farmerName}</strong></p>
                          <p className="text-[11px] text-stone-400 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                            {parent.location}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-stone-900 flex items-center justify-end">
                          <button
                            onClick={() => handleOpenModal(STAGE_LEVELS_DATA[0])}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 font-extrabold text-[11px] transition cursor-pointer flex items-center gap-1"
                          >
                            <span>View Details</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CONNECTOR LINE 1 */}
                <div className="flex flex-col items-center justify-center my-1">
                  <div className="w-[2px] h-6 bg-purple-500/50" />
                  <ArrowDown className="w-4 h-4 text-purple-400 my-0.5" />
                  <div className="w-[2px] h-6 bg-purple-500/50" />
                </div>

                {/* LEVEL 2: FACTORY PROCESSING (PROCESSOR) */}
                <div className="max-w-2xl mx-auto space-y-3">
                  <h3 className="text-xs font-black text-stone-300 uppercase tracking-widest text-center border-b border-stone-800 pb-2">
                    LEVEL 2: FACTORY PROCESSING & EXTRACTION (PROCESSOR)
                  </h3>

                  <div className="p-6 bg-stone-950 rounded-2xl border border-purple-500/40 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-purple-400 bg-stone-900 px-3 py-1 rounded-xl border border-stone-800">
                        {batchId}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-base font-black text-white">Organic Alphonso Mango Pulp</h4>
                      <p className="text-xs text-purple-400 font-extrabold">Heritage Food Processing Corp</p>
                      <p className="text-xs text-stone-400">Mandya Agro Processing Zone, Karnataka</p>
                    </div>

                    <div className="pt-3 border-t border-stone-900 flex items-center justify-end">
                      <button
                        onClick={() => handleOpenModal(STAGE_LEVELS_DATA[1])}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-400 font-extrabold text-[11px] transition cursor-pointer flex items-center gap-1"
                      >
                        <span>View Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* CONNECTOR LINE 2 */}
                <div className="flex flex-col items-center justify-center my-1">
                  <div className="w-[2px] h-6 bg-blue-500/50" />
                  <ArrowDown className="w-4 h-4 text-blue-400 my-0.5" />
                  <div className="w-[2px] h-6 bg-blue-500/50" />
                </div>

                {/* LEVEL 3: LOGISTICS TRANSIT (DISTRIBUTOR) */}
                <div className="max-w-2xl mx-auto space-y-3">
                  <h3 className="text-xs font-black text-stone-300 uppercase tracking-widest text-center border-b border-stone-800 pb-2">
                    LEVEL 3: COLD-CHAIN LOGISTICS TRANSIT (DISTRIBUTOR)
                  </h3>

                  <div className="p-6 bg-stone-950 rounded-2xl border border-blue-500/40 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-blue-400 bg-stone-900 px-3 py-1 rounded-xl border border-stone-800">
                        {batchId}-DIST
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-base font-black text-white">Metro Express Logistics</h4>
                      <p className="text-xs text-stone-300">Central Refrigerated Hub Fleet #RF-90</p>
                      <p className="text-xs text-stone-400">NH-48 Cargo Transport Corridor</p>
                    </div>

                    <div className="pt-3 border-t border-stone-900 flex items-center justify-end">
                      <button
                        onClick={() => handleOpenModal(STAGE_LEVELS_DATA[2])}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-400 font-extrabold text-[11px] transition cursor-pointer flex items-center gap-1"
                      >
                        <span>View Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* CONNECTOR LINE 3 */}
                <div className="flex flex-col items-center justify-center my-1">
                  <div className="w-[2px] h-6 bg-amber-500/50" />
                  <ArrowDown className="w-4 h-4 text-amber-400 my-0.5" />
                  <div className="w-[2px] h-6 bg-amber-500/50" />
                </div>

                {/* LEVEL 4: RETAIL STORE (RETAILER) */}
                <div className="max-w-2xl mx-auto space-y-3">
                  <h3 className="text-xs font-black text-stone-300 uppercase tracking-widest text-center border-b border-stone-800 pb-2">
                    LEVEL 4: RETAIL STORE & CONSUMER DISPLAY (RETAILER)
                  </h3>

                  <div className="p-6 bg-stone-950 rounded-2xl border border-amber-500/40 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-amber-400 bg-stone-900 px-3 py-1 rounded-xl border border-stone-800">
                        {batchId}-RTL
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-base font-black text-white">FreshMart Mega Superstore</h4>
                      <p className="text-xs text-stone-300">Gurgaon CyberHub Retail Complex</p>
                      <p className="text-xs text-stone-400">Gurgaon CyberHub, Haryana</p>
                    </div>

                    <div className="pt-3 border-t border-stone-900 flex items-center justify-end">
                      <button
                        onClick={() => handleOpenModal(STAGE_LEVELS_DATA[3])}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-400 font-extrabold text-[11px] transition cursor-pointer flex items-center gap-1"
                      >
                        <span>View Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "PASSPORT" && (
            <motion.div
              key="passport-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-3xl mx-auto bg-stone-900/90 border border-emerald-500/30 p-8 sm:p-10 rounded-3xl space-y-7 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-bl-full pointer-events-none" />

              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 pb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Blockchain Produce Passport
                  </h2>
                  <p className="text-xs text-emerald-400 font-bold">
                    Official Seed2Shelf Provenance Certificate
                  </p>
                </div>

                <div className="text-right font-mono text-xs text-stone-400 bg-stone-950 p-2.5 rounded-2xl border border-stone-800">
                  <span className="block text-[10px] text-stone-500 uppercase font-sans font-bold">Batch Registry Code</span>
                  <strong className="text-emerald-400 font-black">{batchId}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 space-y-1">
                  <span className="text-[10px] font-extrabold text-stone-500 uppercase">Produce Name</span>
                  <p className="text-sm font-black text-white">Organic Alphonso Mango Pulp</p>
                </div>

                <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 space-y-1">
                  <span className="text-[10px] font-extrabold text-stone-500 uppercase">Total Harvest Volume</span>
                  <p className="text-sm font-black text-emerald-400">450 Liters</p>
                </div>

                <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 space-y-1">
                  <span className="text-[10px] font-extrabold text-stone-500 uppercase">Current Custodian</span>
                  <p className="text-sm font-black text-white">FreshMart Mega Superstore</p>
                </div>

                <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 space-y-1">
                  <span className="text-[10px] font-extrabold text-stone-500 uppercase">Authenticity Guarantee</span>
                  <p className="text-xs font-bold text-emerald-400">5-Level Provenance Verified</p>
                </div>
              </div>

              <div className="p-5 bg-stone-950/80 rounded-2xl border border-emerald-500/20 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black text-white">Immutable Ledger Guarantee</p>
                  <p className="text-[11px] text-stone-400 font-medium">Smart contract verifies 100% farm-to-table authenticity.</p>
                </div>
                
                <span className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1">
                  <Check className="w-4 h-4" /> Verified Valid
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* REUSABLE DETAILS MODAL */}
      <TraceDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedStageModal}
      />
    </div>
  );
}
