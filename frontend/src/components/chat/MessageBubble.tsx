"use client";

import { User, Bot, Globe, ExternalLink, RefreshCw, Copy, Check } from "lucide-react";
import { useState } from "react";
import MarkdownRenderer from "@/components/markdown/MarkdownRenderer";
import ThinkingBlock from "./ThinkingBlock";
import { useChatStore } from "@/stores/chatStore";
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
  isLastAssistant?: boolean;
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
  isLastAssistant = false,
}: MessageBubbleProps) {
  const { regenerate } = useChatStore();
  const [copied, setCopied] = useState(false);
  const isUser = role === "user";
  const thinkingContent = isStreaming ? streamingThinking : reasoning_content;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className={`flex gap-3 px-4 py-6 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? "bg-blue-600" : "bg-gray-700 dark:bg-gray-600"
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
          <div className="max-w-full">
            {/* 搜索中状态 */}
            {isSearching && (
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 mb-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
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
            <div className="prose-container text-gray-800 dark:text-gray-100">
              <MarkdownRenderer content={content} />
              {isStreaming && !isThinkingPhase && (
                <span className="inline-block w-2 h-5 bg-gray-800 dark:bg-gray-300 animate-pulse ml-0.5 align-text-bottom" />
              )}
            </div>

            {/* 搜索来源卡片 */}
            {sources && sources.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-2">
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
                      className="flex items-center gap-1.5 max-w-[280px] px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 transition-colors group"
                      title={source.content}
                    >
                      <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                        {i + 1}
                      </span>
                      <span className="text-xs text-gray-700 dark:text-gray-300 truncate leading-tight">
                        {source.title || new URL(source.url).hostname}
                      </span>
                      <ExternalLink size={10} className="flex-shrink-0 text-gray-400 group-hover:text-blue-500" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons: copy + regenerate */}
            {!isStreaming && content && (
              <div className="flex items-center gap-1 mt-3">
                <button
                  onClick={handleCopy}
                  title="复制内容"
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                  <span>{copied ? "已复制" : "复制"}</span>
                </button>

                {isLastAssistant && (
                  <button
                    onClick={regenerate}
                    title="重新生成"
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <RefreshCw size={13} />
                    <span>重新生成</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
