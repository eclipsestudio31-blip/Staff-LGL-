"use client";

import { useState, useEffect, useRef } from "react";
import { Shield, Play, Square, Clock, Activity } from "lucide-react";
import { useAppStore } from "@/lib/store";

interface ServiceSession {
  id: string;
  userId: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  isActive: boolean;
  user: {
    username: string;
    role: string;
    avatar: string | null;
  };
}

export default function ServicePage() {
  const { user, timer, setTimerOnService, setTimerElapsed } = useAppStore();
  const [sessions, setSessions] = useState<ServiceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch("/api/service");
        const data = await res.json();
        setSessions(data.sessions || []);

        const myActive = (data.sessions || []).find(
          (s: ServiceSession) => s.userId === user?.id && s.isActive
        );
        if (myActive && !timer.isOnService) {
          const start = new Date(myActive.startTime).getTime();
          setTimerOnService(true, start);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchSessions();
  }, [user, timer.isOnService, setTimerOnService]);

  useEffect(() => {
    if (timer.isOnService && timer.startTime) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - timer.startTime!) / 1000);
        setTimerElapsed(elapsed);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timer.isOnService, timer.startTime, setTimerElapsed]);

  const toggleService = async () => {
    if (!user || toggling) return;
    setToggling(true);
    try {
      if (timer.isOnService) {
        const res = await fetch("/api/service", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "stop" }),
        });
        if (res.ok) {
          setTimerOnService(false);
          const refreshed = await fetch("/api/service");
          const data = await refreshed.json();
          setSessions(data.sessions || []);
        }
      } else {
        const res = await fetch("/api/service", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "start" }),
        });
        if (res.ok) {
          const data = await res.json();
          const start = new Date(data.session.startTime).getTime();
          setTimerOnService(true, start);
          const refreshed = await fetch("/api/service");
          const rData = await refreshed.json();
          setSessions(rData.sessions || []);
        }
      }
    } catch {
    } finally {
      setToggling(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const inputStyle: React.CSSProperties = {
    padding: "0.6rem 0.8rem",
    borderRadius: "8px",
    border: "1px solid var(--border-color)",
    background: "var(--bg-tertiary)",
    color: "var(--text-primary)",
    fontSize: "0.9rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "var(--text-primary)" }}>
        <Activity size={32} style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
        <Shield size={28} style={{ color: "var(--accent)" }} />
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          Service
        </h1>
      </div>

      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "2rem", marginBottom: "2rem", textAlign: "center" }}>
        <button
          onClick={toggleService}
          disabled={toggling}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "1rem 2.5rem",
            borderRadius: "12px",
            border: "none",
            background: timer.isOnService ? "#ef4444" : "#22c55e",
            color: "#fff",
            fontSize: "1.1rem",
            fontWeight: 700,
            cursor: toggling ? "not-allowed" : "pointer",
            opacity: toggling ? 0.6 : 1,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { if (!toggling) e.currentTarget.style.opacity = "0.85"; }}
          onMouseLeave={(e) => { if (!toggling) e.currentTarget.style.opacity = "1"; }}
        >
          {timer.isOnService ? <Square size={20} /> : <Play size={20} />}
          {timer.isOnService ? "Quitter son service" : "Prendre son service"}
        </button>

        {timer.isOnService && timer.startTime && (
          <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              <Clock size={16} />
              Service commencé le {new Date(timer.startTime).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" })} à {new Date(timer.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--accent)", fontVariantNumeric: "tabular-nums", letterSpacing: "0.05em" }}>
              {formatDuration(timer.elapsed)}
            </div>
          </div>
        )}
      </div>

      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border-color)", background: "var(--bg-tertiary)" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
            Historique des services
          </h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", background: "var(--bg-tertiary)" }}>
                {["Membre", "Date début", "Date fin", "Durée", "Statut"].map((h) => (
                  <th key={h} style={{ padding: "0.85rem 1rem", textAlign: "left", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                    Aucun service enregistré.
                  </td>
                </tr>
              ) : (
                sessions.map((s, i) => (
                  <tr
                    key={s.id}
                    style={{ borderBottom: i < sessions.length - 1 ? "1px solid var(--border-color)" : "none", transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-tertiary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "0.75rem 1rem", color: "var(--text-primary)", fontWeight: 500 }}>
                      {s.user.username}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                      {formatDateTime(s.startTime)}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                      {s.endTime ? formatDateTime(s.endTime) : "—"}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", fontSize: "0.88rem", fontVariantNumeric: "tabular-nums" }}>
                      {s.duration != null ? formatDuration(s.duration) : "—"}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span
                        style={{
                          padding: "0.2rem 0.6rem",
                          borderRadius: "20px",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          background: s.isActive ? "rgba(34,197,94,0.15)" : "rgba(107,114,128,0.15)",
                          color: s.isActive ? "#22c55e" : "#6b7280",
                          border: `1px solid ${s.isActive ? "rgba(34,197,94,0.3)" : "rgba(107,114,128,0.3)"}`,
                        }}
                      >
                        {s.isActive ? "En cours" : "Terminé"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
