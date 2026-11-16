import { ReactNode } from "react";
import Navbar from "@/components/common/Navbar/Navbar";
import ChatAndNotifications from "@/components/shared/Chat/ChatAndNotifications";


interface DashboardLayoutProps {
  children: ReactNode;
}

import { useRouter } from "next/router";

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const isMarketplacePage = router.pathname.includes("marketplace");
  const isProfilePage = router.pathname.includes("profile");
  const isCreamThemePage = router.pathname.includes("trace-lineage") || 
                           router.pathname.includes("transactions") || 
                           router.pathname.includes("wallet") || 
                           router.pathname.includes("shipments") || 
                           router.pathname.includes("orders") ||
                           router.pathname.includes("harvestHub") ||
                           router.pathname.includes("processedInventory") ||
                           router.pathname.includes("supplyHub") ||
                           router.pathname.includes("dashboard");

  return (
    <div 
      className={`min-h-screen flex flex-col pt-16 selection:bg-[#00d26a] selection:text-black relative ${
        isMarketplacePage ? "bg-[#E9EDC9] text-[#283025]" : (isProfilePage || isCreamThemePage) ? "bg-[#F5F1E6] text-[#283025]" : "bg-black text-white"
      }`}
    >

      <Navbar />
      <main className="flex-grow relative z-10">{children}</main>
      <ChatAndNotifications />
    </div>
  );
}
