"use client";

import { useState, useEffect, useCallback } from "react";
import { Trophy, ChevronLeft, ChevronRight, Send, Clock } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { hasMinRole } from "@/lib/roles";

interface RankingEntry {
  position: number;
  username: string;
  role: string;
  avatar: string | null;
  discordId: string | null;
  licence: string | null;
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
  totalMembres: number;
  totalFormatted: string;
}

const MEDALS = ["🥇", "🥈", "🥉"];

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

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{
        textAlign: "center",
        marginBottom: "1.5rem",
        padding: "1.5rem",
        background: "var(--bg-secondary)",
        borderRadius: "var(--radius)",
        border: "1px solid var(--border)",
      }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.25rem" }}>🏆</div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Classement du service — Semaine {data?.week || "?"} ({data?.year || "?"})
        </h1>
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "1.5rem",
          fontSize: "0.8125rem",
          color: "var(--text-muted)",
          flexWrap: "wrap",
        }}>
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>⏱️ {data?.totalFormatted || "00h00m00s"} cumulé</span>
          <span>👤 {data?.totalMembres || 0} actif(s)</span>
          <span>📋 {data?.totalSessions || 0} session(s)</span>
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "1rem",
        marginBottom: "1.5rem",
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
            fontSize: "0.8125rem",
            fontWeight: 600,
          }}
        >
          <ChevronLeft size={14} />
          Semaine précédente
        </button>
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
            fontSize: "0.8125rem",
            fontWeight: 600,
            opacity: weekOffset >= 0 ? 0.5 : 1,
          }}
        >
          Semaine suivante
          <ChevronRight size={14} />
        </button>
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
      ) : !data || data.ranking.length === 0 ? (
        <div style={{
          padding: "3rem",
          textAlign: "center",
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
        }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📋</div>
          <p style={{ color: "var(--text-muted)", fontWeight: 600 }}>
            Aucun service enregistré pour cette semaine
          </p>
        </div>
      ) : (
        <div style={{
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          overflow: "hidden",
          marginBottom: "1.5rem",
        }}>
          {data.ranking.map((entry, i) => (
            <div
              key={entry.username}
              style={{
                padding: "1rem 1.5rem",
                borderBottom: i < data.ranking.length - 1 ? "1px solid var(--border)" : "none",
                background: entry.position === 1 ? "rgba(245,158,11,0.05)" : "transparent",
              }}
            >
              {/* Ligne principale */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {/* Position */}
                <span style={{
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: entry.position <= 3 ? ["#FFD700", "#C0C0C0", "#CD7F32"][entry.position - 1] : "var(--text-muted)",
                  minWidth: "24px",
                }}>
                  #{entry.position}
                </span>

                {/* Avatar */}
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  background: entry.avatar ? "transparent" : "linear-gradient(135deg, var(--accent), #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
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

                {/* Nom + infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>
                    {entry.position === 1 && "🏆 "}{entry.username}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>
                    {entry.discordId && `@${entry.discordId}`}
                    {entry.discordId && entry.licence && " | "}
                    {entry.licence && entry.licence}
                  </span>
                </div>

                {/* Durée */}
                <span style={{
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  color: entry.position <= 3 ? ["#FFD700", "#C0C0C0", "#CD7F32"][entry.position - 1] : "var(--text-primary)",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {entry.totalFormatted}
                </span>
              </div>

              {/* Ligne détails */}
              <div style={{
                marginTop: "0.25rem",
                paddingLeft: "2.5rem",
                fontSize: "0.6875rem",
                color: "var(--text-muted)",
                display: "flex",
                gap: "0.75rem",
              }}>
                <span>Net: {entry.totalFormatted}</span>
                <span>||</span>
                <span>Pause: 0s</span>
                <span>|</span>
                <span>{entry.sessionCount} session(s)</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bouton envoyer */}
      {user && user.username === "Lenny" && data && data.ranking.length > 0 && (
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
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
              fontSize: "0.8125rem",
              fontWeight: 600,
              opacity: sending ? 0.6 : 1,
            }}
          >
            <Send size={14} />
            {sending ? "Envoi..." : "Envoyer le classement sur Discord"}
          </button>
        </div>
      )}

      {/* Footer */}
      <div style={{
        padding: "0.625rem 1rem",
        background: "var(--bg-secondary)",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border)",
        fontSize: "0.6875rem",
        color: "var(--text-muted)",
        textAlign: "center",
      }}>
        Pauses déduites — Demandé par lenky.ytb
      </div>
    </div>
  );
}
