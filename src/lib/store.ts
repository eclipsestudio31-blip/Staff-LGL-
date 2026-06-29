import { create } from "zustand";

interface User {
  id: string;
  username: string;
  role: string;
  avatar: string | null;
  discordId: string | null;
  isFirstLogin: boolean;
}

interface TimerState {
  isOnService: boolean;
  startTime: number | null;
  elapsed: number;
}

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  timer: TimerState;
  setTimerOnService: (isOn: boolean, startTime?: number) => void;
  setTimerElapsed: (elapsed: number) => void;
  theme: "dark" | "light" | "high-contrast";
  setTheme: (theme: "dark" | "light" | "high-contrast") => void;
  fontSize: "normal" | "large" | "x-large";
  setFontSize: (size: "normal" | "large" | "x-large") => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

function loadPrefs(): { theme: "dark" | "light" | "high-contrast"; fontSize: "normal" | "large" | "x-large" } {
  if (typeof window === "undefined") return { theme: "dark", fontSize: "normal" };
  try {
    const raw = localStorage.getItem("staff-rp-prefs");
    if (raw) {
      const p = JSON.parse(raw);
      return {
        theme: p.theme || "dark",
        fontSize: p.fontSize || "normal",
      };
    }
  } catch {}
  return { theme: "dark", fontSize: "normal" };
}

function savePrefs(theme: string, fontSize: string) {
  try {
    localStorage.setItem("staff-rp-prefs", JSON.stringify({ theme, fontSize }));
  } catch {}
}

const initial = loadPrefs();

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  timer: { isOnService: false, startTime: null, elapsed: 0 },
  setTimerOnService: (isOn, startTime) =>
    set((state) => ({
      timer: { ...state.timer, isOnService: isOn, startTime: startTime || null, elapsed: 0 },
    })),
  setTimerElapsed: (elapsed) =>
    set((state) => ({ timer: { ...state.timer, elapsed } })),
  theme: initial.theme,
  setTheme: (theme) => {
    savePrefs(theme, useAppStore.getState().fontSize);
    set({ theme });
  },
  fontSize: initial.fontSize,
  setFontSize: (fontSize) => {
    savePrefs(useAppStore.getState().theme, fontSize);
    set({ fontSize });
  },
  searchOpen: false,
  setSearchOpen: (searchOpen) => set({ searchOpen }),
}));
