"use client";

import { useEffect, useRef } from "react";
import { useChatStore } from "@/stores/chatStore";
import MessageBubble from "./MessageBubble";
import { MessageSquarePlus } from "lucide-react";

export default function MessageList() {
  const {
    messages,
    currentId,
    isStreaming,
    streamingContent,
    streamingThinking,
    isThinkingPhase,
    isSearching,
    pendingSources,
  } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, streamingThinking]);

  if (!currentId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
        <MessageSquarePlus size={48} strokeWidth={1.5} />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-600 mb-2">开始新对话</h2>
          <p className="text-sm">在下方输入消息，开始与 AI 助手对话</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto divide-y divide-gray-100">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            reasoning_content={msg.reasoning_content}
            sources={msg.sources}
          />
        ))}

        {isStreaming && (
          <MessageBubble
            role="assistant"
            content={streamingContent}
            isStreaming
            isThinkingPhase={isThinkingPhase}
            streamingThinking={streamingThinking}
            isSearching={isSearching}
            sources={isSearching ? undefined : pendingSources.length > 0 ? pendingSources : undefined}
          />
        )}
      </div>
      <div ref={bottomRef} className="h-4" />
    </div>
  );
}
