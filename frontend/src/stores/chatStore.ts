"use client";

import { create } from "zustand";
import {
  type Conversation,
  type Message,
  apiListConversations,
  apiCreateConversation,
  apiGetConversation,
  apiDeleteConversation,
  apiUpdateConversation,
  apiStreamMessage,
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

  loadConversations: () => Promise<void>;
  setCurrentId: (id: string | null) => void;
  loadMessages: (conversationId: string) => Promise<void>;
  addConversation: () => Promise<string>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  sendMessage: (content: string) => void;
  stopStreaming: () => void;
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

  loadConversations: async () => {
    try {
      const conversations = await apiListConversations();
      set({ conversations, conversationsLoaded: true });
    } catch {
      set({ conversationsLoaded: true });
    }
  },

  setCurrentId: (id) => {
    set({ currentId: id, messages: [] });
    if (id) get().loadMessages(id);
  },

  loadMessages: async (conversationId) => {
    try {
      const detail = await apiGetConversation(conversationId);
      set({ messages: detail.messages });
    } catch {
      set({ messages: [] });
    }
  },

  addConversation: async () => {
    const { conversations } = get();
    const emptyConv = conversations.find((c) => c.title === "新对话");
    if (emptyConv) {
      set({ currentId: emptyConv.id, messages: [] });
      return emptyConv.id;
    }

    const conv = await apiCreateConversation();
    set((s) => ({
      conversations: [conv, ...s.conversations],
      currentId: conv.id,
      messages: [],
    }));
    return conv.id;
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
    const { currentId, isStreaming } = get();
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
          const assistantMsg: Message = {
            id: `msg-${Date.now()}`,
            role: "assistant",
            content: finalContent,
            reasoning_content: reasoning_content || undefined,
            created_at: new Date().toISOString(),
          };
          set((s) => ({
            messages: [...s.messages, assistantMsg],
            isStreaming: false,
            streamingContent: "",
            streamingThinking: "",
            isThinkingPhase: false,
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
        onError: (error) => {
          console.error("Stream error:", error);
          const { streamingContent, streamingThinking } = get();
          if (streamingContent || streamingThinking) {
            const assistantMsg: Message = {
              id: `msg-${Date.now()}`,
              role: "assistant",
              content: streamingContent || "（生成出错）",
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
          } else {
            set({
              isStreaming: false,
              streamingContent: "",
              streamingThinking: "",
              isThinkingPhase: false,
            });
          }
          abortController = null;
        },
      },
      abortController.signal,
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
}));
