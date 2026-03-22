"use client";

import { useState } from "react";
import { useChatStore } from "@/stores/chatStore";
import { MessageSquare, Trash2, Pencil, Check, X } from "lucide-react";

function groupByDate(conversations: { id: string; updated_at: string }[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; items: typeof conversations }[] = [
    { label: "今天", items: [] },
    { label: "昨天", items: [] },
    { label: "最近7天", items: [] },
    { label: "更早", items: [] },
  ];

  for (const conv of conversations) {
    const d = new Date(conv.updated_at);
    if (d >= today) groups[0].items.push(conv);
    else if (d >= yesterday) groups[1].items.push(conv);
    else if (d >= weekAgo) groups[2].items.push(conv);
    else groups[3].items.push(conv);
  }

  return groups.filter((g) => g.items.length > 0);
}

export default function ConversationList() {
  const { conversations, currentId, setCurrentId, deleteConversation, renameConversation } =
    useChatStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const groups = groupByDate(conversations);

  const startRename = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
  };

  const confirmRename = () => {
    if (editingId && editTitle.trim()) {
      renameConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex-1 overflow-y-auto px-2 py-2">
      {groups.map((group) => (
        <div key={group.label} className="mb-4">
          <p className="px-3 py-1 text-xs font-medium text-gray-400 uppercase">
            {group.label}
          </p>
          {group.items.map((conv) => {
            const full = conversations.find((c) => c.id === conv.id)!;
            const isActive = currentId === conv.id;

            return (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer mb-0.5 transition-colors ${
                  isActive
                    ? "bg-gray-200 text-gray-900"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                onClick={() => setCurrentId(conv.id)}
              >
                <MessageSquare size={16} className="flex-shrink-0 text-gray-400" />

                {editingId === conv.id ? (
                  <div className="flex-1 flex items-center gap-1">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && confirmRename()}
                      className="flex-1 px-1 py-0.5 text-sm bg-white border border-gray-300 rounded outline-none focus:border-blue-400"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); confirmRename(); }}
                      className="p-0.5 text-green-600 hover:text-green-700"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                      className="p-0.5 text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm truncate">{full.title}</span>
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); startRename(conv.id, full.title); }}
                        className="p-1 rounded hover:bg-gray-300/50 text-gray-400 hover:text-gray-600"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                        className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
