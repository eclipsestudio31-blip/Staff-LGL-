"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore, loadPrefs } from "@/lib/store";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import SearchModal from "@/components/SearchModal";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setUser, theme, setTheme, notifSound, setNotifSound } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const prefs = loadPrefs();
    if (theme === "dark" && prefs.theme !== "dark") setTheme(prefs.theme);
    if (notifSound === "classic" && prefs.notifSound !== "classic") setNotifSound(prefs.notifSound);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          if (data.user.isFirstLogin) {
            router.push("/login");
            return;
          }
        } else {
          router.push("/login");
          return;
        }
      } catch {
        router.push("/login");
        return;
      }
      setLoading(false);
    };
    checkAuth();
  }, [router, setUser]);

  useEffect(() => {
    document.documentElement.className = "";
    if (theme === "light") document.documentElement.classList.add("theme-light");
    if (theme === "high-contrast") document.documentElement.classList.add("high-contrast");
    document.documentElement.style.fontSize = "16px";
  }, [theme]);

  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "var(--bg-primary)",
        flexDirection: "column",
        gap: "1rem",
      }}>
        <div style={{
          width: "48px",
          height: "48px",
          borderRadius: "14px",
          background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "pulse 2s infinite",
          boxShadow: "0 8px 32px rgba(108, 92, 231, 0.3)",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", fontWeight: 500 }}>Chargement...</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Header />
        <main style={{ flex: 1, padding: "1.5rem", overflowY: "auto" }}>
          {children}
        </main>
      </div>
      <SearchModal />
    </div>
  );
}
