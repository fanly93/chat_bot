"use client";

import { User, Bot, Globe, ExternalLink } from "lucide-react";
import MarkdownRenderer from "@/components/markdown/MarkdownRenderer";
import ThinkingBlock from "./ThinkingBlock";
import type { SearchSource } from "@/lib/api";

interface MessageBubbleProps {
  role: "user" | "assistant" | "system";
  content: string;
  reasoning_content?: string | null;
  sources?: SearchSource[];
  isStreaming?: boolean;
  isThinkingPhase?: boolean;
  streamingThinking?: string;
  isSearching?: boolean;
}

export default function MessageBubble({
  role,
  content,
  reasoning_content,
  sources,
  isStreaming = false,
  isThinkingPhase = false,
  streamingThinking,
  isSearching = false,
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
            {/* 搜索中状态 */}
            {isSearching && (
              <div className="flex items-center gap-2 text-sm text-blue-600 mb-3 px-3 py-2 bg-blue-50 rounded-lg">
                <Globe size={14} className="animate-spin flex-shrink-0" />
                <span>正在搜索网络...</span>
              </div>
            )}

            {/* 思考链 */}
            {thinkingContent && (
              <ThinkingBlock
                content={thinkingContent}
                isStreaming={isStreaming && isThinkingPhase}
              />
            )}

            {/* 正文 */}
            <div className="prose-container">
              <MarkdownRenderer content={content} />
              {isStreaming && !isThinkingPhase && (
                <span className="inline-block w-2 h-5 bg-gray-800 animate-pulse ml-0.5 align-text-bottom" />
              )}
            </div>

            {/* 搜索来源卡片 */}
            {sources && sources.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                  <Globe size={12} />
                  <span>搜索来源</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sources.map((source, i) => (
                    <a
                      key={i}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 max-w-[280px] px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors group"
                      title={source.content}
                    >
                      <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                        {i + 1}
                      </span>
                      <span className="text-xs text-gray-700 truncate leading-tight">
                        {source.title || new URL(source.url).hostname}
                      </span>
                      <ExternalLink size={10} className="flex-shrink-0 text-gray-400 group-hover:text-blue-500" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
