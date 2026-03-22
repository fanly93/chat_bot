"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PanelLeftClose, PanelLeft, Plus, LogOut, User, Sun, Moon } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import ConversationList from "./ConversationList";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

export default function Sidebar({ isOpen, onToggle, isMobile = false }: SidebarProps) {
  const { addConversation } = useChatStore();
  const { user, logout } = useAuthStore();
  const { isDark, toggle: toggleTheme, init: initTheme } = useThemeStore();
  const router = useRouter();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  const handleNewChat = async () => {
    try {
      const id = await addConversation();
      router.push(`/chat/${id}`);
      if (isMobile) onToggle(); // Close drawer on mobile
    } catch (e) {
      console.error("Failed to create conversation:", e);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30"
          onClick={onToggle}
        />
      )}

      <aside
        className={`
          h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col
          transition-all duration-300 overflow-hidden
          ${isMobile
            ? `fixed left-0 top-0 z-40 ${isOpen ? "w-[260px]" : "w-0"}`
            : `${isOpen ? "w-[260px]" : "w-0"}`
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={handleNewChat}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-1"
          >
            <Plus size={18} />
            新对话
          </button>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        {/* Conversation list */}
        <ConversationList onSelect={isMobile ? onToggle : undefined} />

        {/* Footer */}
        {user && (
          <div className="mt-auto border-t border-gray-200 dark:border-gray-700 px-3 py-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-white" />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-200 font-medium truncate">
                  {user.username}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={toggleTheme}
                  title={isDark ? "切换到亮色" : "切换到深色"}
                  className="p-2 rounded-lg text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {isDark ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <button
                  onClick={handleLogout}
                  title="退出登录"
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Toggle button when sidebar is closed (desktop) */}
      {!isOpen && !isMobile && (
        <button
          onClick={onToggle}
          className="absolute top-3 left-3 z-10 p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <PanelLeft size={18} />
        </button>
      )}
    </>
  );
}
