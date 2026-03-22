"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Send, Square } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";

export default function ChatInput() {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, isStreaming, stopStreaming } = useChatStore();

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

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    sendMessage(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, isStreaming, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-2 bg-gray-50 rounded-2xl border border-gray-200 px-4 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Shift+Enter 换行)"
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none bg-transparent outline-none text-gray-800 placeholder-gray-400 py-1.5 max-h-[200px] disabled:opacity-50"
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
        <p className="text-xs text-gray-400 text-center mt-2">
          AI 可能会犯错，请核查重要信息
        </p>
      </div>
    </div>
  );
}
