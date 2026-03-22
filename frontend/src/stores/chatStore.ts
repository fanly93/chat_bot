"use client";

import { create } from "zustand";
import {
  type Conversation,
  type Message,
  mockConversations,
  mockMessagesMap,
  streamingMockContent,
  streamingMockThinking,
} from "@/lib/mock-data";

interface ChatState {
  conversations: Conversation[];
  currentId: string | null;
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  streamingThinking: string;
  isThinkingPhase: boolean;

  setCurrentId: (id: string | null) => void;
  loadMessages: (conversationId: string) => void;
  addConversation: () => string;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  sendMessage: (content: string) => void;
  stopStreaming: () => void;
}

let streamTimer: ReturnType<typeof setTimeout> | null = null;

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: mockConversations,
  currentId: null,
  messages: [],
  isStreaming: false,
  streamingContent: "",
  streamingThinking: "",
  isThinkingPhase: false,

  setCurrentId: (id) => {
    set({ currentId: id });
    if (id) get().loadMessages(id);
    else set({ messages: [] });
  },

  loadMessages: (conversationId) => {
    const msgs = mockMessagesMap[conversationId] || [];
    set({ messages: msgs });
  },

  addConversation: () => {
    const id = Date.now().toString();
    const newConv: Conversation = {
      id,
      title: "新对话",
      model: "deepseek-chat",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set((s) => ({
      conversations: [newConv, ...s.conversations],
      currentId: id,
      messages: [],
    }));
    return id;
  },

  deleteConversation: (id) => {
    set((s) => {
      const filtered = s.conversations.filter((c) => c.id !== id);
      const nextId = s.currentId === id ? (filtered[0]?.id ?? null) : s.currentId;
      return {
        conversations: filtered,
        currentId: nextId,
        messages: nextId ? (mockMessagesMap[nextId] || []) : [],
      };
    });
  },

  renameConversation: (id, title) => {
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, title } : c
      ),
    }));
  },

  sendMessage: (content) => {
    const { currentId, isStreaming } = get();
    if (isStreaming) return;

    let convId = currentId;
    if (!convId) {
      convId = get().addConversation();
    }

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
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
      conversations: s.conversations.map((c) =>
        c.id === convId
          ? { ...c, title: s.messages.length === 0 ? content.slice(0, 30) : c.title, updated_at: new Date().toISOString() }
          : c
      ),
    }));

    let thinkIdx = 0;
    let contentIdx = 0;

    const streamThinking = () => {
      if (thinkIdx < streamingMockThinking.length) {
        thinkIdx += Math.floor(Math.random() * 3) + 1;
        set({ streamingThinking: streamingMockThinking.slice(0, thinkIdx) });
        streamTimer = setTimeout(streamThinking, 20 + Math.random() * 30);
      } else {
        set({ isThinkingPhase: false });
        streamTimer = setTimeout(streamContent, 300);
      }
    };

    const streamContent = () => {
      if (contentIdx < streamingMockContent.length) {
        contentIdx += Math.floor(Math.random() * 3) + 1;
        set({ streamingContent: streamingMockContent.slice(0, contentIdx) });
        streamTimer = setTimeout(streamContent, 15 + Math.random() * 25);
      } else {
        const assistantMsg: Message = {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: streamingMockContent,
          reasoning_content: streamingMockThinking,
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
    };

    streamTimer = setTimeout(streamThinking, 500);
  },

  stopStreaming: () => {
    if (streamTimer) {
      clearTimeout(streamTimer);
      streamTimer = null;
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
