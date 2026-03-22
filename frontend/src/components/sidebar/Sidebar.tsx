"use client";

import { useRouter } from "next/navigation";
import { PanelLeftClose, PanelLeft, Plus, LogOut, User } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import ConversationList from "./ConversationList";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { addConversation } = useChatStore();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleNewChat = async () => {
    try {
      const id = await addConversation();
      router.push(`/chat/${id}`);
    } catch (e) {
      console.error("Failed to create conversation:", e);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <aside
        className={`h-full bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300 ${
          isOpen ? "w-[260px]" : "w-0"
        } overflow-hidden`}
      >
        <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200">
          <button
            onClick={handleNewChat}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors flex-1"
          >
            <Plus size={18} />
            新对话
          </button>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        <ConversationList />

        {user && (
          <div className="mt-auto border-t border-gray-200 px-3 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-white" />
                </div>
                <span className="text-sm text-gray-700 font-medium truncate">
                  {user.username}
                </span>
              </div>
              <button
                onClick={handleLogout}
                title="退出登录"
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-200 transition-colors flex-shrink-0"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )}
      </aside>

      {!isOpen && (
        <button
          onClick={onToggle}
          className="absolute top-3 left-3 z-10 p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors bg-white shadow-sm border border-gray-200"
        >
          <PanelLeft size={18} />
        </button>
      )}
    </>
  );
}
