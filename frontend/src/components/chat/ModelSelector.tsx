"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Sparkles, Zap, Brain } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";
import type { Model } from "@/lib/api";

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  deepseek: "DeepSeek",
  qwen: "通义千问",
  zhipu: "智谱 AI",
};

const PROVIDER_COLORS: Record<string, string> = {
  openai: "bg-emerald-100 text-emerald-700",
  deepseek: "bg-blue-100 text-blue-700",
  qwen: "bg-purple-100 text-purple-700",
  zhipu: "bg-orange-100 text-orange-700",
};

function groupByProvider(models: Model[]): Record<string, Model[]> {
  return models.reduce(
    (acc, m) => {
      if (!acc[m.provider]) acc[m.provider] = [];
      acc[m.provider].push(m);
      return acc;
    },
    {} as Record<string, Model[]>,
  );
}

const PROVIDER_ORDER = ["openai", "deepseek", "qwen", "zhipu"];

export default function ModelSelector({ disabled }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { models, selectedModel, setSelectedModel } = useChatStore();

  const current = models.find((m) => m.id === selectedModel);
  const grouped = groupByProvider(models);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelect = (modelId: string) => {
    setSelectedModel(modelId);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-gray-200 hover:border-gray-300"
      >
        <Sparkles size={14} className="text-blue-500" />
        <span className="font-medium">
          {current?.display_name ?? selectedModel}
        </span>
        {current?.supports_thinking && (
          <span className="flex items-center gap-0.5 text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">
            <Brain size={10} />
            思考
          </span>
        )}
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
          <div className="p-2 max-h-80 overflow-y-auto">
            {PROVIDER_ORDER.filter((p) => grouped[p]?.length).map((provider) => (
              <div key={provider} className="mb-2 last:mb-0">
                <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {PROVIDER_LABELS[provider]}
                </div>
                {grouped[provider].map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleSelect(model.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-3 transition-colors ${
                      selectedModel === model.id
                        ? "bg-blue-50 text-blue-700"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {model.display_name}
                        </span>
                        {model.supports_thinking && (
                          <span className="flex-shrink-0 flex items-center gap-0.5 text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">
                            <Brain size={10} />
                            深度思考
                          </span>
                        )}
                        {selectedModel === model.id && (
                          <span className="flex-shrink-0 ml-auto">
                            <Zap size={12} className="text-blue-500" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {model.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ))}
            {models.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                加载模型列表中...
              </p>
            )}
          </div>
          <div className="border-t border-gray-100 px-3 py-2 bg-gray-50">
            <p className="text-xs text-gray-400">
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${PROVIDER_COLORS[current?.provider ?? "deepseek"]}`}>
                {PROVIDER_LABELS[current?.provider ?? "deepseek"]}
              </span>
              {" "}{current?.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
