"use client";

import { useEffect, useRef } from "react";
import { useChatStore } from "@/stores/chatStore";
import MessageBubble from "./MessageBubble";

export default function MessageList() {
  const {
    messages,
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

  // Index of last assistant message (for regenerate button)
  const lastAssistantIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") return i;
    }
    return -1;
  })();

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
      <div className="max-w-3xl mx-auto divide-y divide-gray-100 dark:divide-gray-800">
        {messages.map((msg, idx) => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            reasoning_content={msg.reasoning_content}
            sources={msg.sources}
            isLastAssistant={!isStreaming && idx === lastAssistantIdx && msg.role === "assistant"}
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
