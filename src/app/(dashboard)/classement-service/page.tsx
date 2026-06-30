"use client";

import { useState, useEffect, useCallback } from "react";
import { Trophy, ChevronLeft, ChevronRight, Send, Clock, Medal } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { hasMinRole } from "@/lib/roles";

interface RankingEntry {
  position: number;
  username: string;
  role: string;
  avatar: string | null;
  totalFormatted: string;
  totalSeconds: number;
  sessionCount: number;
}

interface RankingData {
  week: number;
  year: number;
  startDate: string;
  endDate: string;
  ranking: RankingEntry[];
  totalSessions: number;
}

const MEDALS = ["🥇", "🥈", "🥉"];

const medalColors: Record<number, string> = {
  1: "#FFD700",
  2: "#C0C0C0",
  3: "#CD7F32",
};

export default function ClassementServicePage() {
  const { user } = useAppStore();
  const [weekOffset, setWeekOffset] = useState(0);
  const [data, setData] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/classement-service?week=${weekOffset}`);
      const json = await res.json();
      setData(json);
    } catch {
      console.error("Failed to fetch ranking");
    } finally {
      setLoading(false);
    }
  }, [weekOffset]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSendWebhook = async () => {
    setSending(true);
    try {
      await fetch("/api/service/semaine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekOffset }),
      });
    } catch (e) {
      console.error("Erreur envoi classement:", e);
    } finally {
      setSending(false);
    }
  };

  const startDate = data ? new Date(data.startDate) : new Date();
  const endDate = data ? new Date(data.endDate) : new Date();

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🏆</div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.25rem" }}>
          Classement du service
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Semaine {data?.week || "?"} ({data?.year || "?"})
        </p>
      </div>

      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "1rem",
        marginBottom: "2rem",
      }}>
        <button
          onClick={() => setWeekOffset((p) => p - 1)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.625rem 1.25rem",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: 600,
            transition: "all 0.15s",
          }}
        >
          <ChevronLeft size={16} />
          Semaine précédente
        </button>
        <span style={{
          fontSize: "0.8125rem",
          color: "var(--text-muted)",
          minWidth: "200px",
          textAlign: "center",
        }}>
          {startDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} →{" "}
          {endDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
        </span>
        <button
          onClick={() => setWeekOffset((p) => Math.min(p + 1, 0))}
          disabled={weekOffset >= 0}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.625rem 1.25rem",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            background: weekOffset >= 0 ? "var(--bg-tertiary)" : "var(--bg-secondary)",
            color: weekOffset >= 0 ? "var(--text-muted)" : "var(--text-primary)",
            cursor: weekOffset >= 0 ? "not-allowed" : "pointer",
            fontSize: "0.875rem",
            fontWeight: 600,
            opacity: weekOffset >= 0 ? 0.5 : 1,
            transition: "all 0.15s",
          }}
        >
          Semaine suivante
          <ChevronRight size={16} />
        </button>
      </div>

      {user && hasMinRole(user.role, "A-T") && (
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <button
            onClick={handleSendWebhook}
            disabled={sending}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.625rem 1.5rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--accent)",
              background: "var(--accent)",
              color: "white",
              cursor: sending ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
              opacity: sending ? 0.6 : 1,
              transition: "all 0.15s",
            }}
          >
            <Send size={14} />
            {sending ? "Envoi..." : "Envoyer le classement sur Discord"}
          </button>
        </div>
      )}

      {loading ? (
        <div style={{
          padding: "3rem",
          textAlign: "center",
          color: "var(--text-muted)",
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
        }}>
          <Clock size={32} style={{ animation: "spin 1s linear infinite", marginBottom: "1rem" }} />
          <p>Chargement du classement...</p>
        </div>
      ) : !data || data.ranking.length === 0 ? (
        <div style={{
          padding: "3rem",
          textAlign: "center",
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📋</div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem", fontWeight: 600 }}>
            Aucun service enregistré pour cette semaine
          </p>
        </div>
      ) : (
        <div style={{
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "1rem 1.5rem",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-tertiary)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
              Classement — Semaine {data.week}
            </span>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              {data.totalSessions} service(s) au total
            </span>
          </div>

          {data.ranking.map((entry, i) => (
            <div
              key={entry.username}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1rem 1.5rem",
                borderBottom: i < data.ranking.length - 1 ? "1px solid var(--border)" : "none",
                background: entry.position <= 3 ? `${medalColors[entry.position]}08` : "transparent",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = entry.position <= 3 ? `${medalColors[entry.position]}08` : "transparent")}
            >
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: entry.position <= 3 ? "1.5rem" : "0.875rem",
                fontWeight: 700,
                color: entry.position <= 3 ? medalColors[entry.position] : "var(--text-muted)",
                background: entry.position <= 3 ? `${medalColors[entry.position]}15` : "var(--bg-tertiary)",
                flexShrink: 0,
              }}>
                {entry.position <= 3 ? MEDALS[entry.position - 1] : `#${entry.position}`}
              </div>

              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
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

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: "0.9375rem", lineHeight: 1.2 }}>
                  {entry.username}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {entry.sessionCount} service{entry.sessionCount > 1 ? "s" : ""}
                </p>
              </div>

              <div style={{ textAlign: "right" }}>
                <p style={{
                  fontWeight: 700,
                  fontSize: "1.125rem",
                  color: entry.position <= 3 ? medalColors[entry.position] : "var(--text-primary)",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {entry.totalFormatted}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{
        marginTop: "1.5rem",
        padding: "0.75rem 1rem",
        background: "var(--bg-secondary)",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border)",
        fontSize: "0.75rem",
        color: "var(--text-muted)",
        textAlign: "center",
      }}>
        Pauses déduites — Demandé par lenky.ytb
      </div>
    </div>
  );
}
