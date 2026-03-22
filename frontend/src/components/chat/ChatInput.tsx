"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, Square, Globe } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";
import ModelSelector from "./ModelSelector";

interface ChatInputProps {
  variant?: "bottom" | "centered";
}

export default function ChatInput({ variant = "bottom" }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const { sendMessage, isStreaming, stopStreaming, currentId, enableSearch, toggleSearch, isSearching } =
    useChatStore();

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [input, adjustHeight]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    if (!currentId) {
      try {
        const id = await useChatStore.getState().addConversation();
        router.push(`/chat/${id}`);
        useChatStore.getState().sendMessage(trimmed);
      } catch {
        return;
      }
    } else {
      sendMessage(trimmed);
    }
  }, [input, isStreaming, sendMessage, currentId, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isCentered = variant === "centered";

  return (
    <div
      className={
        isCentered
          ? "w-full"
          : "border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3"
      }
    >
      <div className={isCentered ? "w-full" : "max-w-3xl mx-auto"}>
        {/* Toolbar: ModelSelector + Search toggle */}
        <div className="flex items-center justify-between mb-2">
          <ModelSelector disabled={isStreaming} />
          <button
            onClick={toggleSearch}
            disabled={isStreaming}
            title={enableSearch ? "关闭联网搜索" : "开启联网搜索"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all disabled:opacity-50 ${
              enableSearch
                ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600"
                : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <Globe size={13} className={isSearching ? "animate-spin" : ""} />
            <span>{isSearching ? "搜索中..." : "联网搜索"}</span>
          </button>
        </div>

        {/* Textarea + Send button */}
        <div className="flex items-end gap-2 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600 px-4 py-2 focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/50 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Shift+Enter 换行)"
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 py-1.5 max-h-[200px] disabled:opacity-50"
          />

          {isStreaming ? (
            <button
              onClick={stopStreaming}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors"
              title="停止生成"
            >
              <Square size={16} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="发送"
            >
              <Send size={16} />
            </button>
          )}
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
          AI 可能会犯错，请核查重要信息
        </p>
      </div>
    </div>
  );
}
