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
  notifSound: "classic" | "ding" | "none";
  setNotifSound: (sound: "classic" | "ding" | "none") => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  bdaCount: number;
  setBDACount: (count: number) => void;
}

export function loadPrefs(): { theme: "dark" | "light" | "high-contrast"; fontSize: "normal" | "large" | "x-large"; notifSound: "classic" | "ding" | "none" } {
  if (typeof window === "undefined") return { theme: "light", fontSize: "large", notifSound: "classic" };
  try {
    const raw = localStorage.getItem("staff-rp-prefs");
    if (raw) {
      const p = JSON.parse(raw);
      return {
        theme: p.theme || "light",
        fontSize: "large",
        notifSound: p.notifSound || "classic",
      };
    }
  } catch {}
  return { theme: "light", fontSize: "large", notifSound: "classic" };
}

function savePrefs(theme: string, fontSize: string, notifSound: string) {
  try {
    localStorage.setItem("staff-rp-prefs", JSON.stringify({ theme, fontSize, notifSound }));
  } catch {}
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  timer: { isOnService: false, startTime: null, elapsed: 0 },
  setTimerOnService: (isOn, startTime) =>
    set((state) => ({
      timer: { ...state.timer, isOnService: isOn, startTime: startTime || null, elapsed: 0 },
    })),
  setTimerElapsed: (elapsed) =>
    set((state) => ({ timer: { ...state.timer, elapsed } })),
  theme: "light",
  setTheme: (theme) => {
    savePrefs(theme, "large", get().notifSound);
    set({ theme });
  },
  fontSize: "large",
  setFontSize: (fontSize) => {
    savePrefs(get().theme, "large", get().notifSound);
    set({ fontSize: "large" });
  },
  notifSound: "classic",
  setNotifSound: (notifSound) => {
    savePrefs(get().theme, get().fontSize, notifSound);
    set({ notifSound });
  },
  searchOpen: false,
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  bdaCount: 0,
  setBDACount: (bdaCount) => set({ bdaCount }),
}));
