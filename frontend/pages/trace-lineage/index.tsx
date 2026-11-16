import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Head from "next/head";
import { Search, RefreshCw, ZoomIn, ZoomOut, Maximize, MapPin, X } from "lucide-react";
import TraceDetailsModal, { StageData } from "../../components/common/TraceDetailsModal";

// Pre-packaged 5-level stages data conforming to the new StageData interface
const STAGE_LEVELS_DATA: StageData[] = [
  {
    stageType: "FARMER",
    stageTitle: "Farm Harvest & Soil Origin",
    batchId: "BATCH2026000001",
    productName: "Grade-A Alphonso Mangoes",
    recordedStatus: "Harvest Completed",
    overview: [
      { label: "Responsible Party", value: "Farmer Ramesh Kumar" },
      { label: "Recorded Status", value: "Harvest Completed & Certified" },
      { label: "Latest Update", value: "14/07/2026" }
    ],
    location: [
      { label: "Farm Name", value: "GreenAcres Organic Orchard" },
      { label: "Address", value: "Ratnagiri Orchard Plot #4, Ratnagiri, Maharashtra, India" }
    ],
    quantityAndProcessing: [
      { label: "Harvest Quantity", value: "550 kg Raw Mangoes" },
      { label: "Farming Method", value: "Organic & Regenerative Agriculture" },
      { label: "Crop Variety", value: "Alphonso" }
    ],
    qualityAndDocuments: [
      {
        type: 'document',
        label: "Organic Certification",
        value: "Certified Organic",
        issuer: "NPOP",
        refNumber: "#NPOP-8821"
      },
      {
        type: 'measurement',
        label: "Soil Quality Score",
        value: "100% Chemical Spray Free (Brix: 18.5°)"
      }
    ],
    activity: [
      { event: "Harvest Started", timestamp: "12/07/2026 • 05:30 AM", responsibleParty: "Ramesh Kumar" },
      { event: "Harvest Completed", timestamp: "14/07/2026 • 06:00 AM", responsibleParty: "Ramesh Kumar" }
    ],
    blockchainRecord: {
      txHash: "0x8f2a1b...391c",
      network: "Polygon POS",
      block: "5829103"
    }
  },
  {
    stageType: "PROCESSOR",
    stageTitle: "Factory Processing",
    batchId: "BATCH2026000003",
    productName: "Organic Alphonso Mango Pulp",
    recordedStatus: "Aseptic Pulping Completed",
    overview: [
      { label: "Responsible Party", value: "Heritage Food Processing Corp" },
      { label: "Recorded Status", value: "Aseptic Pulping Completed" },
      { label: "Latest Update", value: "16/07/2026" }
    ],
    location: [
      { label: "Factory Name", value: "Mandya Agro Processing Line A" },
      { label: "Address", value: "Plot #12, Agro Industrial Zone, Mandya, Karnataka, India" }
    ],
    quantityAndProcessing: [
      { label: "Input Quantity", value: "550 kg Raw Produce" },
      { label: "Output Quantity", value: "450 Liters Concentrated Pulp" },
      { label: "Processing Method", value: "Cold-press extraction and aseptic packing" }
    ],
    qualityAndDocuments: [
      {
        type: 'document',
        label: "Quality Certification",
        value: "Cleanroom Approved",
        issuer: "FSSAI",
        link: "#"
      },
      {
        type: 'measurement',
        label: "Lab Verification",
        value: "99.2% Purity Score Passed"
      }
    ],
    activity: [
      { event: "Received Raw Material", timestamp: "15/07/2026 • 09:00 AM", responsibleParty: "Heritage Food Corp" },
      { event: "Processing Completed", timestamp: "16/07/2026 • 11:15 AM", responsibleParty: "Heritage Food Corp" }
    ],
    blockchainRecord: {
      txHash: "0x3b1c9f...7a21",
      network: "Polygon POS",
      block: "5830214"
    }
  },
  {
    stageType: "DISTRIBUTOR",
    stageTitle: "Cold-Chain Logistics",
    batchId: "BATCH2026000003-DIST",
    productName: "Organic Alphonso Mango Pulp",
    recordedStatus: "In Transit",
    overview: [
      { label: "Responsible Party", value: "Metro Express Logistics" },
      { label: "Recorded Status", value: "In Transit to Retail Outlet" },
      { label: "Latest Update", value: "19/07/2026" }
    ],
    location: [
      { label: "Current Location", value: "NH-48 Transport Corridor" },
      { label: "Origin Warehouse", value: "Logistics Corridor #4, Gurgaon Hub, India" }
    ],
    quantityAndProcessing: [
      { label: "Storage Method", value: "Refrigerated Container (4.2°C Constant)" },
      { label: "Transport Method", value: "IoT Telemetry Truck Fleet" }
    ],
    qualityAndDocuments: [],
    activity: [
      { event: "Dispatched from Processor", timestamp: "18/07/2026 • 04:00 PM", responsibleParty: "Heritage Food Corp" },
      { event: "In Transit", timestamp: "19/07/2026 • 02:30 PM", responsibleParty: "Metro Express Logistics" }
    ],
    blockchainRecord: {
      txHash: "0x9c2d4f...1e33",
      network: "Polygon POS",
      block: "5835612"
    }
  },
  {
    stageType: "RETAILER",
    stageTitle: "Retail Store",
    batchId: "BATCH2026000003-RTL",
    productName: "Organic Alphonso Mango Pulp",
    recordedStatus: "Available for Purchase",
    overview: [
      { label: "Responsible Party", value: "FreshMart Mega Superstore" },
      { label: "Recorded Status", value: "Stocked on Organic Produce Shelf" },
      { label: "Latest Update", value: "22/07/2026" }
    ],
    location: [
      { label: "Store Name", value: "Gurgaon CyberHub Outlet #14" },
      { label: "Address", value: "CyberHub Retail Complex, Sector 24, Gurgaon, Haryana" }
    ],
    quantityAndProcessing: [],
    qualityAndDocuments: [],
    activity: [
      { event: "Received at Store", timestamp: "22/07/2026 • 10:00 AM", responsibleParty: "FreshMart Mega Superstore" }
    ],
    blockchainRecord: {
      txHash: "0x1a2b3c...4d5e",
      network: "Polygon POS",
      block: "5841200"
    }
  }
];

const DEMO_PARENT_BATCHES = [
  {
    batchId: "BATCH2026000001",
    cropName: "Grade-A Alphonso Mangoes",
    farmerName: "Ramesh Kumar (GreenAcres)",
    quantity: "300 kg",
    location: "Ratnagiri, MH",
    stageData: STAGE_LEVELS_DATA[0]
  },
  {
    batchId: "BATCH2026000002",
    cropName: "Grade-A Alphonso Mangoes",
    farmerName: "Suresh Patil (GoldenFields)",
    quantity: "250 kg",
    location: "Devgad, MH",
    // Reuse the same farmer template for demo
    stageData: {
      ...STAGE_LEVELS_DATA[0],
      batchId: "BATCH2026000002",
      overview: [
        { label: "Responsible Party", value: "Farmer Suresh Patil" },
        { label: "Recorded Status", value: "Harvest Completed & Certified" },
        { label: "Latest Update", value: "15/07/2026" }
      ],
      location: [
        { label: "Farm Name", value: "GoldenFields Orchard" },
        { label: "Address", value: "Devgad, Maharashtra, India" }
      ]
    }
  }
];

export default function TraceBatch() {
  const [batchId, setBatchId] = useState("BATCH2026000003");
  const [loading, setLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [selectedStageModal, setSelectedStageModal] = useState<StageData | null>(STAGE_LEVELS_DATA[1]);
  const [fullscreenStageModal, setFullscreenStageModal] = useState<StageData | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const activeModal = isFullscreen ? fullscreenStageModal : selectedStageModal;
  const setActiveModal = (data: StageData | null) => {
    if (isFullscreen) setFullscreenStageModal(data);
    else setSelectedStageModal(data);
  };

  const fitToView = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;
    const container = containerRef.current;
    const content = contentRef.current;
    
    // Calculate natural size
    const naturalWidth = content.scrollWidth;
    const naturalHeight = content.scrollHeight;
    
    const modalWidth = (isFullscreen && fullscreenStageModal) && window.innerWidth >= 768 ? 440 : 0;
    const availableWidth = container.clientWidth - modalWidth;
    const availableHeight = container.clientHeight;
    
    const paddingX = 64;
    const paddingY = 64;
    
    const scaleX = (availableWidth - paddingX) / (naturalWidth || 1);
    const scaleY = (availableHeight - paddingY) / (naturalHeight || 1);
    
    const newScale = Math.min(scaleX, scaleY, 1.2);
    setZoomLevel(Math.max(0.2, newScale));
  }, [isFullscreen, fullscreenStageModal]);

  useEffect(() => {
    if (isFullscreen) {
      requestAnimationFrame(() => fitToView());
    }
  }, [isFullscreen, fullscreenStageModal, fitToView]);

  const fetchTrace = async (id: string) => {
    const cleanId = id.trim().toUpperCase();
    if (!cleanId) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Reset selected item on new search
      setActiveModal(STAGE_LEVELS_DATA[1]);
    }, 400);
  };

  useEffect(() => {
    fetchTrace("BATCH2026000003");
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
        document.body.style.overflow = "";
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isFullscreen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTrace(batchId);
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 1.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  const handleResetZoom = () => fitToView();
  
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      setFullscreenStageModal(null);
      setIsFullscreen(true);
      document.body.style.overflow = "hidden";
    } else {
      setIsFullscreen(false);
      document.body.style.overflow = "";
    }
  };

  const renderGraphNodes = () => (
    <>
      {/* Level 1: Farmers */}
      <div className="flex flex-col justify-around gap-8 relative z-10 py-4">
        {DEMO_PARENT_BATCHES.map((parent, idx) => (
          <button
            key={idx}
            onClick={() => setActiveModal(parent.stageData)}
            className={`w-[260px] p-4 bg-[#FFFCF5] rounded-lg border text-left transition-all ${
              activeModal?.batchId === parent.batchId
                ? "border-[#6F7D61] bg-[#E2E8D8] ring-1 ring-[#6F7D61]"
                : "border-[#DADFCF] hover:border-[#69705E]"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#EDF0E6] text-[#69705E] border border-[#DADFCF]">Harvest</span>
              <span className="text-[12px] font-mono text-[#69705E]">{parent.batchId}</span>
            </div>
            <h4 className="text-[14px] font-medium text-[#283025] mb-1 truncate">{parent.cropName}</h4>
            <p className="text-[13px] text-[#69705E] truncate">{parent.farmerName}</p>
            <div className="flex justify-between items-end mt-3">
                <span className="text-[12px] font-medium text-[#283025]">{parent.quantity}</span>
                <span className="flex items-center gap-1 text-[11px] text-[#69705E]"><MapPin className="w-3 h-3" /> {parent.location}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Connectors to Level 2 */}
      <div className="w-16 flex flex-col justify-center py-[4.5rem]">
          <div className="w-full h-[calc(100%-1rem)] border-t-2 border-b-2 border-r-2 border-[#DADFCF] rounded-r-xl" />
      </div>
      <div className="w-6 flex flex-col justify-center">
          <div className="w-full h-0.5 bg-[#DADFCF]" />
      </div>

      {/* Level 2: Processor */}
      <div className="flex flex-col justify-center relative z-10">
        <button
          onClick={() => setActiveModal(STAGE_LEVELS_DATA[1])}
          className={`w-[260px] p-4 bg-[#FFFCF5] rounded-lg border text-left transition-all ${
            activeModal?.batchId === STAGE_LEVELS_DATA[1].batchId
              ? "border-[#6F7D61] bg-[#E2E8D8] ring-1 ring-[#6F7D61]"
              : "border-[#DADFCF] hover:border-[#69705E]"
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#EDF0E6] text-[#69705E] border border-[#DADFCF]">Processing</span>
            <span className="text-[12px] font-mono text-[#69705E]">{STAGE_LEVELS_DATA[1].batchId}</span>
          </div>
          <h4 className="text-[14px] font-medium text-[#283025] mb-1 truncate">{STAGE_LEVELS_DATA[1].productName}</h4>
          <p className="text-[13px] text-[#69705E] truncate">{STAGE_LEVELS_DATA[1].overview[0].value}</p>
          <div className="flex justify-between items-end mt-3">
              <span className="text-[12px] font-medium text-[#283025]">450 Liters</span>
              <span className="flex items-center gap-1 text-[11px] text-[#69705E]"><MapPin className="w-3 h-3" /> Mandya, KA</span>
          </div>
        </button>
      </div>

      {/* Connector to Level 3 */}
      <div className="w-16 flex flex-col justify-center">
          <div className="w-full h-0.5 bg-[#DADFCF]" />
      </div>

      {/* Level 3: Distributor */}
      <div className="flex flex-col justify-center relative z-10">
        <button
          onClick={() => setActiveModal(STAGE_LEVELS_DATA[2])}
          className={`w-[260px] p-4 bg-[#FFFCF5] rounded-lg border text-left transition-all ${
            activeModal?.batchId === STAGE_LEVELS_DATA[2].batchId
              ? "border-[#6F7D61] bg-[#E2E8D8] ring-1 ring-[#6F7D61]"
              : "border-[#DADFCF] hover:border-[#69705E]"
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#EDF0E6] text-[#69705E] border border-[#DADFCF]">Transport</span>
            <span className="text-[12px] font-mono text-[#69705E] truncate w-24">{STAGE_LEVELS_DATA[2].batchId}</span>
          </div>
          <h4 className="text-[14px] font-medium text-[#283025] mb-1 truncate">{STAGE_LEVELS_DATA[2].productName}</h4>
          <p className="text-[13px] text-[#69705E] truncate">{STAGE_LEVELS_DATA[2].overview[0].value}</p>
          <div className="flex justify-between items-end mt-3">
              <span className="text-[12px] font-medium text-[#283025]">In Transit</span>
              <span className="flex items-center gap-1 text-[11px] text-[#69705E]"><MapPin className="w-3 h-3" /> NH-48</span>
          </div>
        </button>
      </div>

      {/* Connector to Level 4 */}
      <div className="w-16 flex flex-col justify-center">
          <div className="w-full h-0.5 bg-[#DADFCF]" />
      </div>

      {/* Level 4: Retailer */}
      <div className="flex flex-col justify-center relative z-10">
        <button
          onClick={() => setActiveModal(STAGE_LEVELS_DATA[3])}
          className={`w-[260px] p-4 bg-[#FFFCF5] rounded-lg border text-left transition-all ${
            activeModal?.batchId === STAGE_LEVELS_DATA[3].batchId
              ? "border-[#6F7D61] bg-[#E2E8D8] ring-1 ring-[#6F7D61]"
              : "border-[#DADFCF] hover:border-[#69705E]"
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#EDF0E6] text-[#69705E] border border-[#DADFCF]">Retail</span>
            <span className="text-[12px] font-mono text-[#69705E] truncate w-24">{STAGE_LEVELS_DATA[3].batchId}</span>
          </div>
          <h4 className="text-[14px] font-medium text-[#283025] mb-1 truncate">{STAGE_LEVELS_DATA[3].productName}</h4>
          <p className="text-[13px] text-[#69705E] truncate">{STAGE_LEVELS_DATA[3].overview[0].value}</p>
          <div className="flex justify-between items-end mt-3">
              <span className="text-[12px] font-medium text-[#283025]">Available</span>
              <span className="flex items-center gap-1 text-[11px] text-[#69705E]"><MapPin className="w-3 h-3" /> Gurgaon</span>
          </div>
        </button>
      </div>
    </>
  );

  return (
    <>
    <div className="min-h-screen bg-[#F5F1E6] text-[#283025] font-sans pb-24 -mt-16 pt-16">
      <Head>
        <title>Batch Traceability | Seed2Shelf</title>
      </Head>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Hero Image Banner */}
        <div className="w-full h-48 md:h-64 lg:h-80 rounded-2xl overflow-hidden relative shadow-sm border border-[#DADFCF] bg-[#FFFCF5]">
          <img 
            src="/journey-banner.jpg" 
            alt="Agricultural Supply Chain Journey" 
            className="w-full h-full object-cover object-center"
          />
        </div>

        {/* Compact Header */}
        <div className="bg-[#FFFCF5] border border-[#DADFCF] rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-[28px] font-medium text-[#283025] tracking-tight">Batch Traceability</h1>
            <p className="text-[14px] text-[#69705E]">Explore where this batch came from and how it moved.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
            <select 
              value={batchId}
              onChange={(e) => {
                setBatchId(e.target.value);
                fetchTrace(e.target.value);
              }}
              className="bg-[#FFFCF5] border border-[#DADFCF] text-[#283025] text-[13px] rounded-lg px-3 py-2 focus:outline-none focus:border-[#6F7D61]"
            >
              <option value="BATCH2026000003">Sample: Processor (Merged)</option>
              <option value="BATCH2026000001">Sample: Farmer Harvest</option>
              <option value="BATCH2026000003-RTL">Sample: Retail Split</option>
            </select>

            <form onSubmit={handleSubmit} className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-grow sm:w-[200px]">
                <Search className="absolute inset-y-0 left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#69705E]" />
                <input
                  type="text"
                  required
                  placeholder="Enter Batch ID..."
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#FFFCF5] border border-[#DADFCF] rounded-lg text-[14px] text-[#283025] focus:outline-none focus:border-[#6F7D61] transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-[#7BA05B] hover:bg-[#688A4D] disabled:opacity-50 text-[#FFFCF5] font-medium px-4 py-2 rounded-lg text-[14px] transition flex items-center gap-2 shrink-0"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Search"}
              </button>
            </form>
          </div>
        </div>

        {/* Product Summary */}
        <div className="bg-[#FFFCF5] border border-[#DADFCF] rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
           <div className="flex flex-col gap-1">
             <div className="text-[12px] font-medium text-[#69705E] uppercase tracking-wider">Product Summary</div>
             <div className="text-[18px] font-medium text-[#283025]">Organic Alphonso Mango Pulp</div>
           </div>
           <div className="flex flex-wrap gap-x-8 gap-y-3">
             <div className="flex flex-col gap-1">
               <span className="text-[12px] text-[#69705E]">Batch ID</span>
               <span className="text-[14px] font-medium text-[#283025] font-mono">{batchId}</span>
             </div>
             <div className="flex flex-col gap-1">
               <span className="text-[12px] text-[#69705E]">Recorded Status</span>
               <span className="text-[14px] font-medium text-[#283025]">Aseptic Pulping Completed</span>
             </div>
             <div className="flex flex-col gap-1">
               <span className="text-[12px] text-[#69705E]">Current Custodian</span>
               <span className="text-[14px] font-medium text-[#283025]">Heritage Food Processing Corp</span>
             </div>
             <div className="flex flex-col gap-1">
               <span className="text-[12px] text-[#69705E]">Quantity</span>
               <span className="text-[14px] font-medium text-[#283025]">450 Liters</span>
             </div>
           </div>
        </div>

        {/* Main Workspace */}
        <div className="flex flex-col lg:flex-row gap-6 relative">
          
          <div className="flex-1 bg-[#FFFCF5] overflow-hidden flex flex-col relative min-h-[500px] border border-[#DADFCF] rounded-xl shadow-sm">
            {/* Graph Controls */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 bg-[#FFFCF5] border border-[#DADFCF] p-1 rounded-lg shadow-sm">
               <button onClick={handleZoomIn} title="Zoom in" className="p-1.5 hover:bg-[#EDF0E6] rounded text-[#69705E]"><ZoomIn className="w-4 h-4" /></button>
               <button onClick={handleResetZoom} title="Fit to view" className="p-1.5 hover:bg-[#EDF0E6] rounded text-[#69705E]"><Maximize className="w-4 h-4" /></button>
               <button onClick={handleZoomOut} title="Zoom out" className="p-1.5 hover:bg-[#EDF0E6] rounded text-[#69705E]"><ZoomOut className="w-4 h-4" /></button>
            </div>
            
            <div className="absolute top-4 right-4 z-10">
              <button onClick={toggleFullscreen} title="Expand lineage" className="p-2 bg-[#FFFCF5] hover:bg-[#EDF0E6] border border-[#DADFCF] rounded-lg shadow-sm text-[#69705E]">
                <Maximize className="w-5 h-5" />
              </button>
            </div>

            {/* Interactive Graph Canvas */}
            <div ref={containerRef} className="flex-1 overflow-auto p-8 md:pl-24 flex items-center justify-start bg-[#EDF0E6] cursor-grab active:cursor-grabbing relative">
              <div 
                ref={contentRef}
                className="flex items-center gap-0 transition-transform origin-left"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                {renderGraphNodes()}
              </div>
            </div>


          </div>
          <TraceDetailsModal
            isOpen={!!selectedStageModal}
            onClose={() => setSelectedStageModal(null)}
            data={selectedStageModal}
          />
          
        </div>
      </div>
    </div>


      {/* Expanded Viewport Overlay */}
      {isFullscreen && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] bg-[#FFFCF5] flex flex-col">
          {/* Expanded Controls */}
          <div className="absolute top-6 left-6 z-10 flex flex-col gap-1 bg-[#FFFCF5] border border-[#DADFCF] p-1 rounded-lg shadow-sm">
            <button onClick={handleZoomIn} title="Zoom in" className="p-1.5 hover:bg-[#EDF0E6] rounded text-[#69705E]"><ZoomIn className="w-4 h-4" /></button>
            <button onClick={handleResetZoom} title="Fit to view" className="p-1.5 hover:bg-[#EDF0E6] rounded text-[#69705E]"><Maximize className="w-4 h-4" /></button>
            <button onClick={handleZoomOut} title="Zoom out" className="p-1.5 hover:bg-[#EDF0E6] rounded text-[#69705E]"><ZoomOut className="w-4 h-4" /></button>
          </div>
          
          <div className="absolute top-6 right-6 z-10">
            <button onClick={toggleFullscreen} title="Exit full screen" className="p-3 bg-[#FFFCF5] hover:bg-[#EDF0E6] border border-[#DADFCF] rounded-lg shadow-lg text-[#69705E]">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div ref={containerRef} className="flex-1 overflow-auto p-8 md:pl-24 flex items-center justify-start bg-[#EDF0E6] cursor-grab active:cursor-grabbing relative">
            <div 
              ref={contentRef}
              className="flex items-center gap-0 transition-transform origin-left"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {renderGraphNodes()}
            </div>
          </div>
          
          <TraceDetailsModal
            isOpen={!!fullscreenStageModal}
            onClose={() => setFullscreenStageModal(null)}
            data={fullscreenStageModal}
          />
        </div>,
        document.body
      )}

    </>
  );
}
