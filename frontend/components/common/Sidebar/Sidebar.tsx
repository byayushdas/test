import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  User,
  MapPin,
  ShieldCheck,
  Wallet as WalletIcon,
  ArrowLeftRight,
  Receipt,
  BarChart3,
  LayoutDashboard,
  Sprout,
  Package,
  ClipboardList,
  Truck,
  GitBranch,
  LogOut,
  ChevronDown,
  ChevronRight,
  X,
  Factory,
  Store,
  Boxes,
  ShoppingCart,
  FileText,
  HelpCircle
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [profileExpanded, setProfileExpanded] = useState(true);
  const [walletExpanded, setWalletExpanded] = useState(true);
  const [hubExpanded, setHubExpanded] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [showProfileWarning, setShowProfileWarning] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/api/profile/${session.user.id}`)
        .then(res => res.json())
        .then(profileJson => {
          if (profileJson.success && profileJson.data) {
            const user = profileJson.data;
            let isProfileIncomplete = false;
            
            if (user.role === 'FARMER' && (!user.farmName || !user.farmLocation || !user.totalLandArea || !user.mainCultivatedCrops || user.mainCultivatedCrops.length === 0 || !user.farmingPractice)) {
              isProfileIncomplete = true;
            } else if (user.role === 'PROCESSOR' && (!user.facilityName || !user.facilityLocation || !user.processingCapacity || !user.mainProcessedProducts || !user.complianceStandards)) {
              isProfileIncomplete = true;
            } else if (user.role === 'DISTRIBUTOR' && (!user.companyName || !user.location || !user.storageCapacity || !user.operatingFacilities || !user.transportFleet)) {
              isProfileIncomplete = true;
            } else if (user.role === 'RETAILER' && (!user.storeName || !user.storeLocation || !user.shelfCapacity || !user.storeTypeFocus || !user.employeeCount)) {
              isProfileIncomplete = true;
            }

            const isVerificationPending = user.kycStatus !== 'Verified';
            
            if (isProfileIncomplete || isVerificationPending) {
              setShowProfileWarning(true);
            }
          }
        })
        .catch(console.error);
    }
  }, [session]);

  const userRole = session?.user?.role;
  const isProcessor = userRole === "PROCESSOR" || router.pathname.startsWith("/processor");
  const isDistributor = userRole === "DISTRIBUTOR" || router.pathname.startsWith("/distributor");
  const isRetailer = userRole === "RETAILER" || router.pathname.startsWith("/retailer");

  const isActive = (path: string) => router.pathname === path;

  const handleLogoutConfirm = async () => {
    try {
      setShowLogoutModal(false);
      const data = await signOut({ redirect: false, callbackUrl: "/" });
      window.location.href = data.url;
    } catch (err) {
      window.location.href = "/";
    }
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Right-Side Drawer */}
      <aside
        className={`fixed top-16 right-0 z-40 h-[calc(100vh-4rem)] w-72 bg-[#0c0d0e]/95 backdrop-blur-2xl border-l border-white/10 text-stone-200 transition-transform duration-300 ease-in-out overflow-y-auto custom-scrollbar flex flex-col justify-between p-4 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="space-y-4">
          
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/5 px-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#00d26a]">
              {isProcessor ? "Processor Navigation" : isDistributor ? "Distributor Navigation" : isRetailer ? "Retailer Navigation" : "Farmer Navigation"}
            </span>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1 text-xs font-semibold">

            {isProcessor ? (
              /* ==========================================================
                  PROCESSOR NAVIGATION
                 ========================================================== */
              <>
                {/* 2. Profile */}
                <Link
                  href="/processor/profile"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                    isActive("/processor/profile")
                      ? "bg-[#00d26a]/15 text-[#00d26a] border border-[#00d26a]/20 font-bold"
                      : "text-stone-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <User className="w-4 h-4 text-[#00d26a]" />
                  <span>Profile</span>
                  {showProfileWarning && (
                    <span className="ml-auto w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">!</span>
                  )}
                </Link>

                {/* 4. Processor Hub Dropdown */}
                <div>
                  <button
                    onClick={() => setHubExpanded(!hubExpanded)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-stone-300 hover:text-white hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-4 h-4 text-[#00d26a]" />
                      <span>Processor Hub</span>
                    </div>
                    {hubExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                    )}
                  </button>

                  <AnimatePresence>
                    {hubExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-6 pl-2 border-l border-white/10 space-y-1 mt-1"
                      >
                        <Link
                          href="/processor/processorHub/dashboard"
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                            isActive("/processor/processorHub/dashboard") || isActive("/processor/dashboard")
                              ? "bg-[#00d26a]/15 text-[#00d26a] font-bold"
                              : "text-stone-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <LayoutDashboard className="w-3.5 h-3.5" />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          href="/processor/processorHub/marketplace"
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                            isActive("/processor/processorHub/marketplace") || isActive("/processor/marketplace")
                              ? "bg-[#00d26a]/15 text-[#00d26a] font-bold"
                              : "text-stone-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <Store className="w-3.5 h-3.5" />
                          <span>Marketplace</span>
                        </Link>
                        <Link
                          href="/processor/processorHub/processedInventory"
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                            isActive("/processor/processorHub/processedInventory") || isActive("/processor/processedInventory")
                              ? "bg-[#00d26a]/15 text-[#00d26a] font-bold"
                              : "text-stone-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <Factory className="w-3.5 h-3.5" />
                          <span>Production Hub</span>
                        </Link>
                        <Link
                          href="/processor/processorHub/orders"
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                            isActive("/processor/processorHub/orders") || isActive("/processor/orders")
                              ? "bg-[#00d26a]/15 text-[#00d26a] font-bold"
                              : "text-stone-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          <span>Orders</span>
                        </Link>
                        <Link
                          href="/processor/processorHub/shipments"
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                            isActive("/processor/processorHub/shipments") || isActive("/processor/shipments")
                              ? "bg-[#00d26a]/15 text-[#00d26a] font-bold"
                              : "text-stone-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Shipments</span>
                        </Link>
                        <Link
                          href="/processor/processorHub/transactions"
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                            isActive("/processor/processorHub/transactions")
                              ? "bg-[#00d26a]/15 text-[#00d26a] font-bold"
                              : "text-stone-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          <span>Transactions</span>
                        </Link>
                        
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>




                {/* Trace Lineage */}
                <Link
                  href="/trace-lineage"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                    isActive("/trace-lineage")
                      ? "bg-[#00d26a]/15 text-[#00d26a] border border-[#00d26a]/20 font-bold"
                      : "text-stone-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <GitBranch className="w-4 h-4 text-[#00d26a]" />
                  <span>Trace Lineage</span>
                </Link>

                {/* 5. Support */}
                <Link
                  href="/support"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                    isActive("/support")
                      ? "bg-[#00d26a]/15 text-[#00d26a] border border-[#00d26a]/20 font-bold"
                      : "text-stone-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <HelpCircle className="w-4 h-4 text-[#00d26a]" />
                  <span>Support</span>
                </Link>
              </>
            ) : isDistributor ? (
              /* ==========================================================
                  DISTRIBUTOR NAVIGATION
                 ========================================================== */
              <>
                {/* 2. Profile */}
                <Link
                  href="/distributor/profile"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                    isActive("/distributor/profile")
                      ? "bg-[#00d26a]/15 text-[#00d26a] border border-[#00d26a]/20 font-bold"
                      : "text-stone-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <User className="w-4 h-4 text-[#00d26a]" />
                  <span>Profile</span>
                  {showProfileWarning && (
                    <span className="ml-auto w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">!</span>
                  )}
                </Link>

                {/* 4. Distributor Hub Dropdown */}
                <div>
                  <button
                    onClick={() => setHubExpanded(!hubExpanded)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-stone-300 hover:text-white hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-4 h-4 text-[#00d26a]" />
                      <span>Distributor Hub</span>
                    </div>
                    {hubExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                    )}
                  </button>

                  <AnimatePresence>
                    {hubExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-6 pl-2 border-l border-white/10 space-y-1 mt-1"
                      >
                        <Link
                          href="/distributor/distributorHub/dashboard"
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                            isActive("/distributor/distributorHub/dashboard")
                              ? "bg-[#00d26a]/15 text-[#00d26a] font-bold"
                              : "text-stone-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <LayoutDashboard className="w-3.5 h-3.5" />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          href="/distributor/distributorHub/marketplace"
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                            isActive("/distributor/distributorHub/marketplace")
                              ? "bg-[#00d26a]/15 text-[#00d26a] font-bold"
                              : "text-stone-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <Sprout className="w-3.5 h-3.5" />
                          <span>Marketplace</span>
                        </Link>
                        <Link
                          href="/distributor/distributorHub/supplyHub"
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                            isActive("/distributor/distributorHub/supplyHub")
                              ? "bg-[#00d26a]/15 text-[#00d26a] font-bold"
                              : "text-stone-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <Boxes className="w-3.5 h-3.5" />
                          <span>Supply Hub</span>
                        </Link>
                        <Link
                          href="/distributor/distributorHub/orders"
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                            isActive("/distributor/distributorHub/orders")
                              ? "bg-[#00d26a]/15 text-[#00d26a] font-bold"
                              : "text-stone-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          <span>Orders</span>
                        </Link>
                        <Link
                          href="/distributor/distributorHub/shipments"
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                            isActive("/distributor/distributorHub/shipments")
                              ? "bg-[#00d26a]/15 text-[#00d26a] font-bold"
                              : "text-stone-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Shipments</span>
                        </Link>
                        <Link
                          href="/distributor/distributorHub/transactions"
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                            isActive("/distributor/distributorHub/transactions")
                              ? "bg-[#00d26a]/15 text-[#00d26a] font-bold"
                              : "text-stone-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          <span>Transactions</span>
                        </Link>
                        
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>




                {/* Trace Lineage */}
                <Link
                  href="/trace-lineage"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                    isActive("/trace-lineage")
                      ? "bg-[#00d26a]/15 text-[#00d26a] border border-[#00d26a]/20 font-bold"
                      : "text-stone-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <GitBranch className="w-4 h-4 text-[#00d26a]" />
                  <span>Trace Lineage</span>
                </Link>

                {/* 5. Support */}
                <Link
                  href="/support"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                    isActive("/support")
                      ? "bg-[#00d26a]/15 text-[#00d26a] border border-[#00d26a]/20 font-bold"
                      : "text-stone-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <HelpCircle className="w-4 h-4 text-[#00d26a]" />
                  <span>Support</span>
                </Link>
              </>
            ) : isRetailer ? (
              /* ==========================================================
                  RETAILER NAVIGATION
                 ========================================================== */
              <>
                {/* 2. Profile */}
                <Link
                  href="/retailer/profile"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                    isActive("/retailer/profile")
                      ? "bg-[#00d26a]/15 text-[#00d26a] border border-[#00d26a]/20 font-bold"
                      : "text-stone-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <User className="w-4 h-4 text-[#00d26a]" />
                  <span>Profile</span>
                  {showProfileWarning && (
                    <span className="ml-auto w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">!</span>
                  )}
                </Link>

                {/* 4. Retailer Hub Dropdown */}
                <div>
                  <button
                    onClick={() => setHubExpanded(!hubExpanded)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-stone-300 hover:text-white hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-4 h-4 text-[#00d26a]" />
                      <span>Retailer Hub</span>
                    </div>
                    {hubExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                    )}
                  </button>

                  <AnimatePresence>
                    {hubExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-6 pl-2 border-l border-white/10 space-y-1 mt-1"
                      >
                        <Link
                          href="/retailer/retailerHub/dashboard"
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                            isActive("/retailer/retailerHub/dashboard")
                              ? "bg-[#00d26a]/15 text-[#00d26a] font-bold"
                              : "text-stone-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <LayoutDashboard className="w-3.5 h-3.5" />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          href="/retailer/retailerHub/marketplace"
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                            isActive("/retailer/retailerHub/marketplace")
                              ? "bg-[#00d26a]/15 text-[#00d26a] font-bold"
                              : "text-stone-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <Sprout className="w-3.5 h-3.5" />
                          <span>Marketplace</span>
                        </Link>

                        <Link
                          href="/retailer/retailerHub/orders"
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                            isActive("/retailer/retailerHub/orders")
                              ? "bg-[#00d26a]/15 text-[#00d26a] font-bold"
                              : "text-stone-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          <span>Orders</span>
                        </Link>
                        <Link
                          href="/retailer/retailerHub/shipments"
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                            isActive("/retailer/retailerHub/shipments")
                              ? "bg-[#00d26a]/15 text-[#00d26a] font-bold"
                              : "text-stone-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Shipments</span>
                        </Link>
                        <Link
                          href="/retailer/retailerHub/transactions"
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                            isActive("/retailer/retailerHub/transactions")
                              ? "bg-[#00d26a]/15 text-[#00d26a] font-bold"
                              : "text-stone-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          <span>Transactions</span>
                        </Link>
                        
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>




                {/* Trace Lineage */}
                <Link
                  href="/trace-lineage"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                    isActive("/trace-lineage")
                      ? "bg-[#00d26a]/15 text-[#00d26a] border border-[#00d26a]/20 font-bold"
                      : "text-stone-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <GitBranch className="w-4 h-4 text-[#00d26a]" />
                  <span>Trace Lineage</span>
                </Link>

                {/* 5. Support */}
                <Link
                  href="/support"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                    isActive("/support")
                      ? "bg-[#00d26a]/15 text-[#00d26a] border border-[#00d26a]/20 font-bold"
                      : "text-stone-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <HelpCircle className="w-4 h-4 text-[#00d26a]" />
                  <span>Support</span>
                </Link>
              </>
            ) : (
              /* ==========================================================
                  FARMER NAVIGATION
                 ========================================================== */
              <>
                {/* 2. Profile */}
                <Link
                  href="/farmer/profile"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                    isActive("/farmer/profile")
                      ? "bg-[#00d26a]/15 text-[#00d26a] border border-[#00d26a]/20 font-bold"
                      : "text-stone-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <User className="w-4 h-4 text-[#00d26a]" />
                  <span>Profile</span>
                  {showProfileWarning && (
                    <span className="ml-auto w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">!</span>
                  )}
                </Link>

                {/* 4. Farmer Hub Dropdown */}
                <div>
                  <button
                    onClick={() => setHubExpanded(!hubExpanded)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-stone-300 hover:text-white hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-4 h-4 text-[#00d26a]" />
                      <span>Farmer Hub</span>
                    </div>
                    {hubExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                    )}
                  </button>

                  <AnimatePresence>
                    {hubExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-6 pl-2 border-l border-white/10 space-y-1 mt-1"
                      >
                        <Link
                          href="/farmer/farmerHub/dashboard"
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                            isActive("/farmer/farmerHub/dashboard")
                              ? "bg-[#00d26a]/15 text-[#00d26a] font-bold"
                              : "text-stone-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <LayoutDashboard className="w-3.5 h-3.5" />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          href="/farmer/farmerHub/harvestHub"
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                            isActive("/farmer/farmerHub/harvestHub")
                              ? "bg-[#00d26a]/15 text-[#00d26a] font-bold"
                              : "text-stone-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <Sprout className="w-3.5 h-3.5" />
                          <span>Harvest Hub</span>
                        </Link>
                        <Link
                          href="/farmer/farmerHub/orders"
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                            isActive("/farmer/farmerHub/orders")
                              ? "bg-[#00d26a]/15 text-[#00d26a] font-bold"
                              : "text-stone-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          <span>Orders</span>
                        </Link>
                        <Link
                          href="/farmer/farmerHub/shipments"
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                            isActive("/farmer/farmerHub/shipments")
                              ? "bg-[#00d26a]/15 text-[#00d26a] font-bold"
                              : "text-stone-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Shipments</span>
                        </Link>
                        <Link
                          href="/farmer/farmerHub/transactions"
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                            isActive("/farmer/farmerHub/transactions")
                              ? "bg-[#00d26a]/15 text-[#00d26a] font-bold"
                              : "text-stone-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          <span>Transactions</span>
                        </Link>
                        
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Trace Lineage */}
                <Link
                  href="/trace-lineage"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                    isActive("/trace-lineage")
                      ? "bg-[#00d26a]/15 text-[#00d26a] border border-[#00d26a]/20 font-bold"
                      : "text-stone-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <GitBranch className="w-4 h-4 text-[#00d26a]" />
                  <span>Trace Lineage</span>
                </Link>

                {/* 5. Support */}
                <Link
                  href="/support"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                    isActive("/support")
                      ? "bg-[#00d26a]/15 text-[#00d26a] border border-[#00d26a]/20 font-bold"
                      : "text-stone-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <HelpCircle className="w-4 h-4 text-[#00d26a]" />
                  <span>Support</span>
                </Link>
              </>
            )}

          </nav>
        </div>

        {/* Bottom Logout */}
        <div className="pt-4 border-t border-white/5">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-bold transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutModal(false)}
              className="absolute inset-0 bg-stone-950/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 bg-stone-900/95 border border-stone-800 p-7 rounded-3xl max-w-sm w-full text-center space-y-5 shadow-2xl shadow-black/80 overflow-hidden"
            >
              {/* Subtle Ambient Red Glow */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mx-auto shadow-inner">
                <LogOut className="w-6 h-6" />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="text-xl font-extrabold text-white tracking-tight">Confirm Logout</h3>
                <p className="text-stone-400 text-xs font-medium leading-relaxed">
                  Are you sure you want to end your current session?
                </p>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-3 px-4 bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded-xl text-xs font-bold text-stone-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black transition shadow-lg shadow-red-950/40 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Yes, Log Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
