"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Brain } from "lucide-react";

interface ThinkingBlockProps {
  content: string;
  isStreaming?: boolean;
  thinkingDuration?: number;
}

export default function ThinkingBlock({
  content,
  isStreaming = false,
  thinkingDuration,
}: ThinkingBlockProps) {
  const [isExpanded, setIsExpanded] = useState(isStreaming);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (isStreaming) {
      setIsExpanded(true);
    } else {
      const timer = setTimeout(() => setIsExpanded(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isStreaming]);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [content, isExpanded]);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors group"
      >
        <Brain size={16} className={isStreaming ? "animate-pulse text-purple-500" : "text-gray-400"} />
        <span>
          {isStreaming
            ? "思考中..."
            : thinkingDuration
              ? `已深度思考 ${formatDuration(thinkingDuration)}`
              : "已深度思考"}
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isExpanded ? `${contentHeight + 20}px` : "0px" }}
      >
        <div
          ref={contentRef}
          className="mt-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-sm text-gray-500 italic leading-relaxed whitespace-pre-wrap"
        >
          {content}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-purple-400 animate-pulse ml-0.5 align-text-bottom" />
          )}
        </div>
      </div>
    </div>
  );
}
