"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded text-xs bg-white/10 hover:bg-white/20 text-gray-300 transition-colors"
    >
      {copied ? (
        <>
          <Check size={14} /> 已复制
        </>
      ) : (
        <>
          <Copy size={14} /> 复制
        </>
      )}
    </button>
  );
}

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-pre:p-0 prose-pre:bg-transparent">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const codeString = String(children).replace(/\n$/, "");

          if (match) {
            return (
              <div className="relative group not-prose">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-gray-400 text-xs rounded-t-lg border-b border-gray-700">
                  <span>{match[1]}</span>
                  <CopyButton code={codeString} />
                </div>
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    borderBottomLeftRadius: "0.5rem",
                    borderBottomRightRadius: "0.5rem",
                  }}
                >
                  {codeString}
                </SyntaxHighlighter>
              </div>
            );
          }

          return (
            <code
              className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 text-sm font-mono"
              {...props}
            >
              {children}
            </code>
          );
        },
        table({ children }) {
          return (
            <div className="overflow-x-auto">
              <table className="min-w-full">{children}</table>
            </div>
          );
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-600">
              {children}
            </blockquote>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
}
