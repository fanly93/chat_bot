"use client";

import { PanelLeftClose, PanelLeft, Plus } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";
import ConversationList from "./ConversationList";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { addConversation, setCurrentId } = useChatStore();

  const handleNewChat = () => {
    const id = addConversation();
    setCurrentId(id);
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
