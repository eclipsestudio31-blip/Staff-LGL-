"use client";
import { useAppStore } from "@/lib/store";
import { useEffect, useState, useRef } from "react";
import { Clock, Wifi, WifiOff, Bell, Check, Trash2 } from "lucide-react";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export default function Header() {
  const { timer, notifSound } = useAppStore();
  const [elapsed, setElapsed] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!timer.isOnService || !timer.startTime) {
      setElapsed(0);
      return;
    }
    const tick = () => setElapsed(Math.floor((Date.now() - timer.startTime!) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [timer.isOnService, timer.startTime]);

  const prevUnreadRef = useRef(0);
  const notifSoundRef = useRef<HTMLAudioElement | null>(null);

  const fetchNotifs = () => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => {
        const list = d.notifications ?? [];
        setNotifications(list);
        const unread = list.filter((n: Notification) => !n.read).length;
        if (prevUnreadRef.current > 0 && unread > prevUnreadRef.current && notifSound !== "none") {
          try {
            if (!notifSoundRef.current) notifSoundRef.current = new Audio(`/sounds/${notifSound}.wav`);
            notifSoundRef.current.src = `/sounds/${notifSound}.wav`;
            notifSoundRef.current.currentTime = 0;
            notifSoundRef.current.volume = 0.5;
            notifSoundRef.current.play().catch(() => {});
          } catch {}
        }
        prevUnreadRef.current = unread;
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read: true }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAll = async () => {
    await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifications([]);
  };

  const typeColors: Record<string, string> = {
    report: "#f59e0b",
    absence: "#ef4444",
    info: "var(--accent)",
  };

  return (
    <header style={{
      height: "56px",
      background: "var(--bg-secondary)",
      borderBottom: "1px solid var(--border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      padding: "0 1.5rem",
      position: "sticky",
      top: 0,
      zIndex: 30,
      gap: "1rem",
    }}>
      {timer.isOnService && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.625rem",
          background: "var(--success-bg)", padding: "0.375rem 0.875rem",
          borderRadius: "100px", border: "1px solid rgba(0,214,143,0.2)",
        }}>
          <div style={{
            width: "7px", height: "7px", borderRadius: "50%", background: "var(--success)",
            animation: "pulse 2s infinite", boxShadow: "0 0 6px rgba(0,214,143,0.5)",
          }} />
          <Clock size={13} style={{ color: "var(--success)" }} />
          <span style={{
            fontSize: "0.8125rem", fontWeight: 700, color: "var(--success)",
            fontVariantNumeric: "tabular-nums", fontFamily: "monospace", letterSpacing: "0.05em",
          }}>
            {formatTime(elapsed)}
          </span>
        </div>
      )}

      {!timer.isOnService && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          padding: "0.375rem 0.75rem", borderRadius: "100px",
          background: "var(--bg-tertiary)", border: "1px solid var(--border)",
          fontSize: "0.75rem", color: "var(--text-muted)",
        }}>
          <WifiOff size={12} />
          Hors service
        </div>
      )}

      <div ref={notifRef} style={{ position: "relative" }}>
        <button
          onClick={() => setShowNotifs(!showNotifs)}
          style={{
            position: "relative", background: "none", border: "none",
            color: "var(--text-muted)", cursor: "pointer", padding: "0.5rem",
            borderRadius: "8px", display: "flex", alignItems: "center",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-tertiary)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span style={{
              position: "absolute", top: "2px", right: "2px",
              width: "16px", height: "16px", borderRadius: "50%",
              background: "#ef4444", color: "#fff", fontSize: "0.6rem",
              fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {showNotifs && (
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0,
            width: "360px", maxHeight: "420px",
            background: "var(--bg-secondary)", border: "1px solid var(--border-color)",
            borderRadius: "12px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            overflow: "hidden", zIndex: 100,
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0.85rem 1rem", borderBottom: "1px solid var(--border-color)",
            }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, margin: 0 }}>Notifications</h3>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{
                    background: "none", border: "none", color: "var(--accent)",
                    cursor: "pointer", fontSize: "0.7rem", fontWeight: 600, padding: "0.2rem 0.4rem", borderRadius: "4px",
                  }}>Tout lire</button>
                )}
                {notifications.length > 0 && (
                  <button onClick={clearAll} style={{
                    background: "none", border: "none", color: "var(--text-muted)",
                    cursor: "pointer", fontSize: "0.7rem", fontWeight: 600, padding: "0.2rem 0.4rem", borderRadius: "4px",
                  }}><Trash2 size={12} /></button>
                )}
              </div>
            </div>
            <div style={{ overflowY: "auto", maxHeight: "340px" }}>
              {notifications.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  Aucune notification
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => { if (!n.read) markRead(n.id); if (n.link) window.location.href = n.link; }}
                    style={{
                      padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-color)",
                      cursor: "pointer", background: n.read ? "transparent" : "var(--bg-tertiary)",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = n.read ? "transparent" : "var(--bg-tertiary)")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                      <div style={{
                        width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0,
                        background: typeColors[n.type] || "var(--accent)",
                      }} />
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>{n.title}</span>
                      {!n.read && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />}
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>{n.message}</p>
                    <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", margin: "0.25rem 0 0", opacity: 0.7 }}>
                      {new Date(n.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
