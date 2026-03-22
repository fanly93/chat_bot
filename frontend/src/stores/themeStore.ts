"use client";

import { create } from "zustand";

interface ThemeState {
  isDark: boolean;
  init: () => void;
  toggle: () => void;
}

function applyTheme(isDark: boolean) {
  if (isDark) {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: false,

  init: () => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    set({ isDark });
    applyTheme(isDark);
  },

  toggle: () => {
    const isDark = !get().isDark;
    set({ isDark });
    applyTheme(isDark);
  },
}));
