"use client";

import { User, Bot } from "lucide-react";
import MarkdownRenderer from "@/components/markdown/MarkdownRenderer";
import ThinkingBlock from "./ThinkingBlock";

interface MessageBubbleProps {
  role: "user" | "assistant" | "system";
  content: string;
  reasoning_content?: string | null;
  isStreaming?: boolean;
  isThinkingPhase?: boolean;
  streamingThinking?: string;
}

export default function MessageBubble({
  role,
  content,
  reasoning_content,
  isStreaming = false,
  isThinkingPhase = false,
  streamingThinking,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const thinkingContent = isStreaming ? streamingThinking : reasoning_content;

  return (
    <div className={`flex gap-3 px-4 py-6 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? "bg-blue-600" : "bg-gray-700"
        }`}
      >
        {isUser ? (
          <User size={18} className="text-white" />
        ) : (
          <Bot size={18} className="text-white" />
        )}
      </div>

      <div className={`flex-1 min-w-0 ${isUser ? "flex flex-col items-end" : ""}`}>
        {isUser ? (
          <div className="inline-block max-w-[85%] px-4 py-3 rounded-2xl bg-blue-600 text-white whitespace-pre-wrap">
            {content}
          </div>
        ) : (
          <div className="max-w-[85%]">
            {thinkingContent && (
              <ThinkingBlock
                content={thinkingContent}
                isStreaming={isStreaming && isThinkingPhase}
              />
            )}

            <div className="prose-container">
              <MarkdownRenderer content={content} />
              {isStreaming && !isThinkingPhase && (
                <span className="inline-block w-2 h-5 bg-gray-800 animate-pulse ml-0.5 align-text-bottom" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
