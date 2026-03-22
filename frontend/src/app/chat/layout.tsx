"use client";

import { useState } from "react";
import Sidebar from "@/components/sidebar/Sidebar";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-screen flex relative overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="flex-1 flex flex-col min-w-0">{children}</main>
    </div>
  );
}
