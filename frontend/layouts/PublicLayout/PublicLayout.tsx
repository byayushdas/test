import { ReactNode } from "react";
import Navbar from "@/components/common/Navbar/Navbar";
import ChatAndNotifications from "@/components/shared/Chat/ChatAndNotifications";

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#070908] text-white selection:bg-[#00d26a] selection:text-black">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <ChatAndNotifications />
    </div>
  );
}
