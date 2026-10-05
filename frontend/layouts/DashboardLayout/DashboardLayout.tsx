import { ReactNode } from "react";
import Navbar from "@/components/common/Navbar/Navbar";
import ChatAndNotifications from "@/components/shared/Chat/ChatAndNotifications";


interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div 
      className="min-h-screen flex flex-col pt-16 text-white selection:bg-[#00d26a] selection:text-black relative bg-black"
    >

      <Navbar />
      <main className="flex-grow relative z-10">{children}</main>
      <ChatAndNotifications />
    </div>
  );
}
