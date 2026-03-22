"use client";

import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import Sidebar from "@/components/sidebar/Sidebar";
import { useChatStore } from "@/stores/chatStore";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { loadConversations, conversationsLoaded, loadModels, models } = useChatStore();

  // Detect mobile
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!conversationsLoaded) {
      loadConversations();
    }
  }, [loadConversations, conversationsLoaded]);

  useEffect(() => {
    if (models.length === 0) {
      loadModels();
    }
  }, [loadModels, models.length]);

  return (
    <div className="h-screen flex relative overflow-hidden bg-white dark:bg-gray-900">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        isMobile={isMobile}
      />

      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile menu button */}
        {isMobile && !sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-3 left-3 z-10 p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <Menu size={18} />
          </button>
        )}
        {children}
      </main>
    </div>
  );
}
