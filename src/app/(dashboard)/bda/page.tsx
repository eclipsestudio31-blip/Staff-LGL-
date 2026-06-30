"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Headphones, CheckCircle, XCircle, Clock, UserCheck } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { hasMinRole } from "@/lib/roles";

interface BDAEntry {
  id: string;
  discordId: string;
  username: string;
  avatar: string | null;
  joinedAt: string;
  status: string;
  handledBy: string | null;
  handledAt: string | null;
  leftAt: string | null;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  waiting: { label: "En attente", color: "#f59e0b", bg: "#f59e0b22", icon: "🟠" },
  handled: { label: "Pris en charge", color: "#22c55e", bg: "#22c55e22", icon: "🟢" },
  left: { label: "Parti", color: "#ef4444", bg: "#ef444422", icon: "🔴" },
};

export default function BDAPage() {
  const { user, setBDACount } = useAppStore();
  const [entries, setEntries] = useState<BDAEntry[]>([]);
  const [waitingCount, setWaitingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "waiting" | "handled" | "left">("all");
  const prevWaitingRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/bda");
      const data = await res.json();
      setEntries(data.entries || []);
      const newCount = data.waitingCount || 0;
      setWaitingCount(newCount);
      setBDACount(newCount);

      if (newCount > prevWaitingRef.current) {
        try {
          if (!audioRef.current) {
            audioRef.current = new Audio("/sounds/ding.mp3");
          }
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        } catch {}
      }
      prevWaitingRef.current = newCount;
    } catch {
      console.error("Failed to fetch BDA");
    } finally {
      setLoading(false);
    }
  }, [setBDACount]);

  useEffect(() => {
    fetchEntries();
    const interval = setInterval(fetchEntries, 5000);
    return () => clearInterval(interval);
  }, [fetchEntries]);

  const handleTakeInCharge = async (id: string) => {
    try {
      const res = await fetch("/api/bda", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setEntries((prev) =>
          prev.map((e) =>
            e.id === id
              ? { ...e, status: "handled", handledBy: user?.username || null, handledAt: new Date().toISOString() }
              : e
          )
        );
        setWaitingCount((p) => Math.max(0, p - 1));
        setBDACount(Math.max(0, waitingCount - 1));
      }
    } catch (err) {
      console.error("Erreur:", err);
    }
  };

  const filtered = activeTab === "all" ? entries : entries.filter((e) => e.status === activeTab);

  const getWaitTime = (joinedAt: string) => {
    const start = new Date(joinedAt).getTime();
    const now = Date.now();
    const diff = Math.floor((now - start) / 1000);
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `${m}m ${s}s`;
  };

  const tabs = [
    { id: "all" as const, label: "Tous", count: entries.length },
    { id: "waiting" as const, label: "En attente", count: entries.filter((e) => e.status === "waiting").length },
    { id: "handled" as const, label: "Pris en charge", count: entries.filter((e) => e.status === "handled").length },
    { id: "left" as const, label: "Partis", count: entries.filter((e) => e.status === "left").length },
  ];

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <Headphones size={28} style={{ color: "var(--accent)" }} />
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700 }}>Bureau d&apos;Accueil</h1>
        {waitingCount > 0 && (
          <span style={{
            padding: "0.25rem 0.75rem",
            borderRadius: "9999px",
            background: "#ef4444",
            color: "white",
            fontSize: "0.8125rem",
            fontWeight: 700,
          }}>
            {waitingCount} en attente
          </span>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "var(--radius-sm)",
              border: `1px solid ${activeTab === tab.id ? "var(--accent)" : "var(--border)"}`,
              background: activeTab === tab.id ? "var(--accent)" : "var(--bg-secondary)",
              color: activeTab === tab.id ? "white" : "var(--text-primary)",
              cursor: "pointer",
              fontSize: "0.8125rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                padding: "0.1rem 0.4rem",
                borderRadius: "9999px",
                background: activeTab === tab.id ? "rgba(255,255,255,0.2)" : "var(--bg-tertiary)",
                fontSize: "0.6875rem",
                fontWeight: 700,
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{
          padding: "3rem",
          textAlign: "center",
          color: "var(--text-muted)",
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
        }}>
          <Clock size={28} style={{ animation: "spin 1s linear infinite", marginBottom: "0.75rem" }} />
          <p>Chargement...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          padding: "3rem",
          textAlign: "center",
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎧</div>
          <p style={{ color: "var(--text-muted)", fontWeight: 600 }}>
            {activeTab === "waiting" ? "Aucune personne en attente" : "Aucune entrée"}
          </p>
        </div>
      ) : (
        <div style={{
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}>
          {filtered.map((entry, i) => {
            const cfg = statusConfig[entry.status] || statusConfig.waiting;
            return (
              <div
                key={entry.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1rem 1.5rem",
                  borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                  background: entry.status === "waiting" ? `${cfg.bg}` : "transparent",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = entry.status === "waiting" ? `${cfg.bg}` : "transparent")}
              >
                {/* Avatar */}
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  background: entry.avatar ? "transparent" : "linear-gradient(135deg, var(--accent), #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "white",
                  flexShrink: 0,
                }}>
                  {entry.avatar ? (
                    <img src={entry.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    entry.username.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{entry.username}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", gap: "0.75rem", marginTop: "0.125rem" }}>
                    <span>Arrivé à {new Date(entry.joinedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                    {entry.status === "waiting" && <span>⏱️ {getWaitTime(entry.joinedAt)}</span>}
                    {entry.handledBy && <span>Pris par {entry.handledBy}</span>}
                  </div>
                </div>

                {/* Statut */}
                <span style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  background: cfg.bg,
                  color: cfg.color,
                  border: `1px solid ${cfg.color}44`,
                  whiteSpace: "nowrap",
                }}>
                  {cfg.icon} {cfg.label}
                </span>

                {/* Bouton */}
                {entry.status === "waiting" && user && hasMinRole(user.role, "A-T") && (
                  <button
                    onClick={() => handleTakeInCharge(entry.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      padding: "0.375rem 0.875rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid #22c55e44",
                      background: "#22c55e15",
                      color: "#22c55e",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <UserCheck size={13} />
                    Prendre en charge
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div style={{
        marginTop: "1rem",
        padding: "0.5rem 1rem",
        fontSize: "0.6875rem",
        color: "var(--text-muted)",
        textAlign: "center",
      }}>
        Actualisation automatique toutes les 5 secondes
      </div>
    </div>
  );
}
