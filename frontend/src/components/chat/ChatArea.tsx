"use client";

import { useCallback } from "react";
import { useChatStore } from "@/stores/chatStore";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import { Bot } from "lucide-react";
import { useRouter } from "next/navigation";

const SUGGESTIONS = [
  "帮我写一份工作总结",
  "解释一下量子计算",
  "推荐几本好书",
  "用 Python 实现快速排序",
  "今天北京天气怎么样",
  "写一首关于秋天的诗",
];

export default function ChatArea() {
  const { messages, isStreaming, currentId } = useChatStore();
  const router = useRouter();
  const hasContent = messages.length > 0 || isStreaming;

  const handleSuggestion = useCallback(
    async (text: string) => {
      if (!currentId) {
        try {
          const id = await useChatStore.getState().addConversation();
          router.push(`/chat/${id}`);
          // Wait for navigation, then send
          setTimeout(() => {
            useChatStore.getState().sendMessage(text);
          }, 100);
        } catch {
          return;
        }
      } else {
        useChatStore.getState().sendMessage(text);
      }
    },
    [currentId, router]
  );

  if (!hasContent) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 overflow-y-auto">
        <div className="w-full max-w-2xl space-y-8">
          {/* Greeting */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Bot size={32} className="text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              今天有什么可以帮到你？
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              选择一个模型，开始你的智能对话
            </p>
          </div>

          {/* Centered Input */}
          <ChatInput variant="centered" />

          {/* Quick Suggestions */}
          <div className="flex flex-wrap gap-2 justify-center">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestion(s)}
                className="px-4 py-2 text-sm rounded-full border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <MessageList />
      <ChatInput />
    </div>
  );
}
