"use client";

import { create } from "zustand";
import {
  type Conversation,
  type Message,
  type Model,
  type SearchSource,
  apiListConversations,
  apiCreateConversation,
  apiGetConversation,
  apiDeleteConversation,
  apiUpdateConversation,
  apiStreamMessage,
  apiGetModels,
} from "@/lib/api";

interface ChatState {
  conversations: Conversation[];
  currentId: string | null;
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  streamingThinking: string;
  isThinkingPhase: boolean;
  conversationsLoaded: boolean;
  models: Model[];
  selectedModel: string;
  enableSearch: boolean;
  isSearching: boolean;
  pendingSources: SearchSource[];

  loadConversations: () => Promise<void>;
  loadModels: () => Promise<void>;
  setCurrentId: (id: string | null) => void;
  loadMessages: (conversationId: string) => Promise<void>;
  addConversation: () => Promise<string>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  setSelectedModel: (model: string) => void;
  toggleSearch: () => void;
  sendMessage: (content: string) => void;
  stopStreaming: () => void;
  reset: () => void;
}

let abortController: AbortController | null = null;

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentId: null,
  messages: [],
  isStreaming: false,
  streamingContent: "",
  streamingThinking: "",
  isThinkingPhase: false,
  conversationsLoaded: false,
  models: [],
  selectedModel: "deepseek-chat",
  enableSearch: false,
  isSearching: false,
  pendingSources: [],

  loadModels: async () => {
    try {
      const models = await apiGetModels();
      set({ models });
    } catch {
      // 加载失败时保持默认列表，静默处理
    }
  },

  loadConversations: async () => {
    try {
      const conversations = await apiListConversations();
      set({ conversations, conversationsLoaded: true });
    } catch {
      set({ conversationsLoaded: true });
    }
  },

  setCurrentId: (id) => {
    const { conversations } = get();
    const conv = conversations.find((c) => c.id === id);
    set({
      currentId: id,
      messages: [],
      ...(conv ? { selectedModel: conv.model } : {}),
    });
    if (id) get().loadMessages(id);
  },

  loadMessages: async (conversationId) => {
    try {
      const detail = await apiGetConversation(conversationId);
      set({ messages: detail.messages, selectedModel: detail.model });
    } catch {
      set({ messages: [] });
    }
  },

  addConversation: async () => {
    const { conversations, selectedModel } = get();
    const emptyConv = conversations.find((c) => c.title === "新对话");
    if (emptyConv) {
      // 如果当前选中模型与已有空对话的模型不同，更新模型
      if (emptyConv.model !== selectedModel) {
        await apiUpdateConversation(emptyConv.id, { model: selectedModel });
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === emptyConv.id ? { ...c, model: selectedModel } : c
          ),
        }));
      }
      set({ currentId: emptyConv.id, messages: [] });
      return emptyConv.id;
    }

    const conv = await apiCreateConversation("新对话", selectedModel);
    set((s) => ({
      conversations: [conv, ...s.conversations],
      currentId: conv.id,
      messages: [],
    }));
    return conv.id;
  },

  toggleSearch: () => set((s) => ({ enableSearch: !s.enableSearch })),

  setSelectedModel: (model) => {
    set({ selectedModel: model });
    // 同步更新当前对话的模型（不论是否已有标题）
    const { conversations, currentId } = get();
    const current = conversations.find((c) => c.id === currentId);
    if (current && current.model !== model) {
      apiUpdateConversation(current.id, { model }).catch(() => {});
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === currentId ? { ...c, model } : c
        ),
      }));
    }
  },

  deleteConversation: async (id) => {
    await apiDeleteConversation(id);
    set((s) => {
      const filtered = s.conversations.filter((c) => c.id !== id);
      const nextId = s.currentId === id ? (filtered[0]?.id ?? null) : s.currentId;
      return {
        conversations: filtered,
        currentId: nextId,
        messages: nextId === s.currentId ? s.messages : [],
      };
    });
    const { currentId } = get();
    if (currentId) get().loadMessages(currentId);
  },

  renameConversation: async (id, title) => {
    await apiUpdateConversation(id, { title });
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, title } : c
      ),
    }));
  },

  sendMessage: async (content) => {
    const { currentId, isStreaming, enableSearch, selectedModel } = get();
    if (isStreaming || !currentId) return;

    const convId = currentId;

    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };

    set((s) => ({
      messages: [...s.messages, userMsg],
      isStreaming: true,
      streamingContent: "",
      streamingThinking: "",
      isThinkingPhase: true,
      isSearching: false,
      pendingSources: [],
    }));

    abortController = new AbortController();

    await apiStreamMessage(
      convId!,
      content,
      {
        onThinking: (text) => {
          set((s) => ({ streamingThinking: s.streamingThinking + text }));
        },
        onContent: (text) => {
          const { isThinkingPhase } = get();
          if (isThinkingPhase) {
            set({ isThinkingPhase: false });
          }
          set((s) => ({ streamingContent: s.streamingContent + text }));
        },
        onDone: (reasoning_content, finalContent) => {
          const { pendingSources } = get();
          const assistantMsg: Message = {
            id: `msg-${Date.now()}`,
            role: "assistant",
            content: finalContent,
            reasoning_content: reasoning_content || undefined,
            sources: pendingSources.length > 0 ? pendingSources : undefined,
            created_at: new Date().toISOString(),
          };
          set((s) => ({
            messages: [...s.messages, assistantMsg],
            isStreaming: false,
            streamingContent: "",
            streamingThinking: "",
            isThinkingPhase: false,
            isSearching: false,
            pendingSources: [],
          }));
          abortController = null;
        },
        onTitleGenerated: (title) => {
          set((s) => ({
            conversations: s.conversations.map((c) =>
              c.id === convId ? { ...c, title } : c
            ),
          }));
        },
        onSearching: () => {
          set({ isSearching: true });
        },
        onSources: (sources) => {
          set({ isSearching: false, pendingSources: sources });
        },
        onError: (error) => {
          console.error("Stream error:", error);
          const { streamingContent, streamingThinking, pendingSources } = get();
          if (streamingContent || streamingThinking) {
            const assistantMsg: Message = {
              id: `msg-${Date.now()}`,
              role: "assistant",
              content: streamingContent || "（生成出错）",
              reasoning_content: streamingThinking || undefined,
              sources: pendingSources.length > 0 ? pendingSources : undefined,
              created_at: new Date().toISOString(),
            };
            set((s) => ({
              messages: [...s.messages, assistantMsg],
              isStreaming: false,
              streamingContent: "",
              streamingThinking: "",
              isThinkingPhase: false,
              isSearching: false,
              pendingSources: [],
            }));
          } else {
            set({
              isStreaming: false,
              streamingContent: "",
              streamingThinking: "",
              isThinkingPhase: false,
              isSearching: false,
              pendingSources: [],
            });
          }
          abortController = null;
        },
      },
      abortController.signal,
      enableSearch,
      selectedModel,
    );
  },

  stopStreaming: () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    const { streamingContent, streamingThinking } = get();
    if (streamingContent || streamingThinking) {
      const assistantMsg: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: streamingContent || "（已停止生成）",
        reasoning_content: streamingThinking || undefined,
        created_at: new Date().toISOString(),
      };
      set((s) => ({
        messages: [...s.messages, assistantMsg],
        isStreaming: false,
        streamingContent: "",
        streamingThinking: "",
        isThinkingPhase: false,
      }));
    }
  },

  reset: () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    set({
      conversations: [],
      currentId: null,
      messages: [],
      isStreaming: false,
      streamingContent: "",
      streamingThinking: "",
      isThinkingPhase: false,
      conversationsLoaded: false,
      isSearching: false,
      pendingSources: [],
    });
  },
}));
