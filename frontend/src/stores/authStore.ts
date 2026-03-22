"use client";

import { create } from "zustand";
import { apiLogin, apiRegister, apiGetMe, apiLogout, clearTokens } from "@/lib/api";

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;

  initialize: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("access_token");
    if (!token) {
      set({ initialized: true });
      return;
    }

    try {
      const user = await apiGetMe();
      set({ user, initialized: true });
    } catch {
      clearTokens();
      set({ user: null, initialized: true });
    }
  },

  login: async (username, password) => {
    set({ loading: true });
    try {
      await apiLogin(username, password);
      const user = await apiGetMe();
      set({ user, loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  register: async (username, email, password) => {
    set({ loading: true });
    try {
      await apiRegister(username, email, password);
      const user = await apiGetMe();
      set({ user, loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  logout: async () => {
    try {
      await apiLogout();
    } finally {
      set({ user: null });
    }
  },
}));
