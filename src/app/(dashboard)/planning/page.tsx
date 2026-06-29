"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";

interface PlanningEntry {
  id: string;
  userId: string;
  user?: { username: string; role: string };
  date: string;
  startTime: string;
  endTime?: string;
  status: string;
}

interface User {
  id: string;
  username: string;
  role: string;
}

const DAYS_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6);

function getWeekDates(offset: number): Date[] {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatHour(h: number): string {
  return `${String(h).padStart(2, "0")}:00`;
}

export default function PlanningPage() {
  const [entries, setEntries] = useState<PlanningEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<"my" | "all">("my");
  const [submittingCell, setSubmittingCell] = useState<string | null>(null);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [planningRes, usersRes, meRes] = await Promise.all([
          fetch("/api/planning"),
          fetch("/api/users"),
          fetch("/api/auth/me"),
        ]);
        const planningData = await planningRes.json();
        const usersData = await usersRes.json();
        const meData = await meRes.json();
        setEntries(Array.isArray(planningData) ? planningData : planningData.entries || []);
        setUsers(Array.isArray(usersData) ? usersData : usersData.users || []);
        if (meData.user) setCurrentUser(meData.user);
      } catch (error) {
        console.error("Failed to fetch planning data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredEntries = useMemo(() => {
    if (viewMode === "my" && currentUser) {
      return entries.filter((e) => e.userId === currentUser.id);
    }
    return entries;
  }, [entries, viewMode, currentUser]);

  const cellMap = useMemo(() => {
    const map: Record<string, PlanningEntry> = {};
    filteredEntries.forEach((e) => {
      const key = `${e.date.split("T")[0]}_${e.startTime}`;
      if (!map[key]) map[key] = e;
    });
    return map;
  }, [filteredEntries]);

  const userColorMap = useMemo(() => {
    const colors = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#8b5cf6", "#14b8a6", "#f97316", "#3b82f6"];
    const map: Record<string, string> = {};
    const userIds = [...new Set(entries.map((e) => e.userId))];
    userIds.forEach((id, i) => { map[id] = colors[i % colors.length]; });
    return map;
  }, [entries]);

  const handleToggleCell = async (dateStr: string, hour: number) => {
    if (!currentUser) return;
    const startTime = formatHour(hour);
    const cellKey = `${dateStr}_${startTime}`;
    const existing = cellMap[cellKey];

    if (existing && existing.userId === currentUser.id) {
      setSubmittingCell(cellKey);
      await fetch("/api/planning", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: existing.id }),
      });
      setEntries((prev) => prev.filter((e) => e.id !== existing.id));
      setSubmittingCell(null);
    } else if (!existing) {
      setSubmittingCell(cellKey);
      try {
        const res = await fetch("/api/planning", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: dateStr,
            startTime,
            endTime: formatHour(hour + 1),
          }),
        });
        const data = await res.json();
        const newEntry = data.entry || data;
        setEntries((prev) => [...prev, { ...newEntry, user: { username: currentUser.username, role: currentUser.role } }]);
      } finally {
        setSubmittingCell(null);
      }
    }
  };

  const weekLabel = useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[6];
    return `${start.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`;
  }, [weekDates]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "var(--text-primary)" }}>
        <Calendar size={32} style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Emploi du temps</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: "0.375rem 0 0" }}>
            Cliquez sur une case pour indiquer votre disponibilité
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            onClick={() => setViewMode("my")}
            style={{
              padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)",
              background: viewMode === "my" ? "var(--accent)" : "var(--bg-secondary)",
              color: viewMode === "my" ? "#fff" : "var(--text-secondary)",
              fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
            }}
          >
            Mon emploi du temps
          </button>
          <button
            onClick={() => setViewMode("all")}
            style={{
              padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)",
              background: viewMode === "all" ? "var(--accent)" : "var(--bg-secondary)",
              color: viewMode === "all" ? "#fff" : "var(--text-secondary)",
              fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
            }}
          >
            Tous les membres
          </button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={() => setWeekOffset((p) => p - 1)}
            style={{
              background: "var(--bg-secondary)", border: "1px solid var(--border-color)",
              borderRadius: "8px", padding: "0.5rem", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", color: "var(--text-primary)",
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontWeight: 600, color: "var(--text-primary)", minWidth: "200px", textAlign: "center" }}>
            {weekLabel}
          </span>
          <button
            onClick={() => setWeekOffset((p) => p + 1)}
            style={{
              background: "var(--bg-secondary)", border: "1px solid var(--border-color)",
              borderRadius: "8px", padding: "0.5rem", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", color: "var(--text-primary)",
            }}
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            style={{
              background: "var(--bg-tertiary)", border: "1px solid var(--border-color)",
              borderRadius: "8px", padding: "0.5rem 1rem", cursor: "pointer",
              fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)",
            }}
          >
            Aujourd&apos;hui
          </button>
        </div>
      </div>

      <div style={{
        background: "var(--bg-secondary)", border: "1px solid var(--border-color)",
        borderRadius: "12px", overflow: "hidden",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)", borderBottom: "1px solid var(--border-color)" }}>
          <div style={{ padding: "0.75rem 0.5rem", textAlign: "center", borderRight: "1px solid var(--border-color)" }} />
          {weekDates.map((date, i) => {
            const key = formatDate(date);
            const isToday = key === formatDate(new Date());
            return (
              <div key={key} style={{
                padding: "0.75rem 0.5rem", textAlign: "center",
                borderRight: i < 6 ? "1px solid var(--border-color)" : "none",
                background: isToday ? "var(--accent-bg)" : "transparent",
              }}>
                <div style={{
                  fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase",
                  letterSpacing: "0.05em", color: isToday ? "var(--accent)" : "var(--text-muted)",
                  marginBottom: "0.2rem",
                }}>
                  {DAYS_FR[i]}
                </div>
                <div style={{
                  fontSize: "1rem", fontWeight: 700,
                  color: isToday ? "var(--accent)" : "var(--text-primary)",
                }}>
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {HOURS.map((hour) => (
          <div key={hour} style={{
            display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)",
            borderBottom: hour < 23 ? "1px solid var(--border-color)" : "none",
          }}>
            <div style={{
              padding: "0.5rem", textAlign: "center", fontSize: "0.75rem",
              fontWeight: 600, color: "var(--text-muted)",
              borderRight: "1px solid var(--border-color)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {formatHour(hour)}
            </div>
            {weekDates.map((date, di) => {
              const dateStr = formatDate(date);
              const cellKey = `${dateStr}_${formatHour(hour)}`;
              const entry = cellMap[cellKey];
              const isMine = entry?.userId === currentUser?.id;
              const isSubmitting = submittingCell === cellKey;
              const color = entry ? (userColorMap[entry.userId] || "var(--accent)") : undefined;

              return (
                <div
                  key={cellKey}
                  onClick={() => !isSubmitting && handleToggleCell(dateStr, hour)}
                  style={{
                    padding: "0.25rem",
                    borderRight: di < 6 ? "1px solid var(--border-color)" : "none",
                    minHeight: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: isSubmitting ? "wait" : "pointer",
                    background: entry ? `${color}15` : "transparent",
                    borderLeft: entry ? `3px solid ${color}` : "3px solid transparent",
                    transition: "all 0.15s",
                    opacity: isSubmitting ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!entry) e.currentTarget.style.background = "var(--bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (!entry) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {entry && viewMode === "all" && (
                    <span style={{
                      fontSize: "0.6rem", fontWeight: 600, color,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      maxWidth: "100%",
                    }}>
                      {entry.user?.username || "?"}
                    </span>
                  )}
                  {entry && viewMode === "my" && (
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {viewMode === "all" && Object.keys(userColorMap).length > 0 && (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: "0.75rem",
          marginTop: "1rem", padding: "0.75rem 1rem",
          background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px",
        }}>
          {Object.entries(userColorMap).map(([userId, color]) => {
            const u = users.find((u) => u.id === userId);
            return (
              <div key={userId} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: color }} />
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                  {u?.username || "Inconnu"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
