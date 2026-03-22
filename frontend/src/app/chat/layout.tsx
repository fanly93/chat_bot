"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import { useChatStore } from "@/stores/chatStore";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { loadConversations, conversationsLoaded } = useChatStore();

  useEffect(() => {
    if (!conversationsLoaded) {
      loadConversations();
    }
  }, [loadConversations, conversationsLoaded]);

  return (
    <div className="h-screen flex relative overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="flex-1 flex flex-col min-w-0">{children}</main>
    </div>
  );
}
