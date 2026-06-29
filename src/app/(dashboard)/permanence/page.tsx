"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
  Clock,
  CheckSquare,
  Save,
} from "lucide-react";

interface Permanence {
  id: string;
  userId: string;
  user?: { username: string; role: string };
  date: string;
  startTime: string;
  endTime: string;
}

interface User {
  id: string;
  username: string;
  role: string;
}

const SLOTS = [
  { start: "20:00", end: "21:00" },
  { start: "21:00", end: "22:00" },
  { start: "22:00", end: "23:00" },
  { start: "23:00", end: "00:00" },
  { start: "00:00", end: "01:00" },
  { start: "01:00", end: "02:00" },
  { start: "02:00", end: "03:00" },
];

const DAYS_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

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

const SLOT_COLORS = ["#22c55e", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];

export default function PermanencePage() {
  const [permanences, setPermanences] = useState<Permanence[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<"my" | "all">("my");
  const [deletingPerm, setDeletingPerm] = useState<Permanence | null>(null);
  const [submittingCell, setSubmittingCell] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchSaving, setBatchSaving] = useState(false);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [permRes, meRes] = await Promise.all([
          fetch("/api/permanence"),
          fetch("/api/auth/me"),
        ]);
        const permData = await permRes.json();
        const meData = await meRes.json();
        setPermanences(permData.permanences ?? []);
        if (meData.user) setCurrentUser(meData.user);
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    if (viewMode === "my" && currentUser) {
      return permanences.filter((p) => p.userId === currentUser.id);
    }
    return permanences;
  }, [permanences, viewMode, currentUser]);

  const cellMap = useMemo(() => {
    const map: Record<string, Permanence> = {};
    filtered.forEach((p) => {
      const key = `${p.date.split("T")[0]}_${p.startTime}`;
      if (!map[key]) map[key] = p;
    });
    return map;
  }, [filtered]);

  const weekLabel = useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[6];
    return `${start.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`;
  }, [weekDates]);

  const handleToggle = async (dateStr: string, startTime: string, endTime: string) => {
    const cellKey = `${dateStr}_${startTime}`;
    const existing = cellMap[cellKey];

    if (existing && existing.userId === currentUser?.id) {
      setSubmittingCell(cellKey);
      await fetch("/api/permanence", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: existing.id }),
      });
      setPermanences((prev) => prev.filter((p) => p.id !== existing.id));
      setSubmittingCell(null);
    } else if (!existing) {
      setSubmittingCell(cellKey);
      try {
        const res = await fetch("/api/permanence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: dateStr, startTime, endTime }),
        });
        const data = await res.json();
        if (data.permanence) {
          setPermanences((prev) => [...prev, { ...data.permanence, user: { username: currentUser!.username, role: currentUser!.role } }]);
        }
      } catch {} finally {
        setSubmittingCell(null);
      }
    }
  };

  const handleDelete = async () => {
    if (!deletingPerm) return;
    await fetch("/api/permanence", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deletingPerm.id }),
    });
    setPermanences((prev) => prev.filter((p) => p.id !== deletingPerm.id));
    setDeletingPerm(null);
  };

  const toggleSelect = (cellKey: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cellKey)) next.delete(cellKey);
      else next.add(cellKey);
      return next;
    });
  };

  const handleBatchSave = async () => {
    setBatchSaving(true);
    const slots = Array.from(selected);
    for (const slot of slots) {
      const [dateStr, startTime] = slot.split("_");
      const slotDef = SLOTS.find((s) => s.start === startTime);
      if (!slotDef) continue;
      const existing = cellMap[slot];
      if (existing) continue;
      try {
        const res = await fetch("/api/permanence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: dateStr, startTime: slotDef.start, endTime: slotDef.end }),
        });
        const data = await res.json();
        if (data.permanence) {
          setPermanences((prev) => [...prev, { ...data.permanence, user: { username: currentUser!.username, role: currentUser!.role } }]);
        }
      } catch {}
    }
    setSelected(new Set());
    setBatchSaving(false);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "var(--text-primary)" }}>
        <Clock size={32} style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <ShieldCheck size={28} style={{ color: "var(--accent)" }} />
            Permanence
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: "0.375rem 0 0" }}>
            Permanences du soir à partir de 20h
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {selectMode && selected.size > 0 && (
            <button
              onClick={handleBatchSave}
              disabled={batchSaving}
              style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "none", background: "#22c55e", color: "#fff", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              <Save size={14} />
              {batchSaving ? "Enregistrement..." : `Enregistrer (${selected.size})`}
            </button>
          )}
          <button
            onClick={() => { setSelectMode(!selectMode); setSelected(new Set()); }}
            style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: selectMode ? "#8b5cf6" : "var(--bg-secondary)", color: selectMode ? "#fff" : "var(--text-secondary)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <CheckSquare size={14} />
            {selectMode ? "Annuler" : "Sélection multiple"}
          </button>
          <button onClick={() => setViewMode("my")} style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: viewMode === "my" ? "var(--accent)" : "var(--bg-secondary)", color: viewMode === "my" ? "#fff" : "var(--text-secondary)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
            Mon planning
          </button>
          <button onClick={() => setViewMode("all")} style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: viewMode === "all" ? "var(--accent)" : "var(--bg-secondary)", color: viewMode === "all" ? "#fff" : "var(--text-secondary)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
            Tous les membres
          </button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <button onClick={() => setWeekOffset((p) => p - 1)} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "0.5rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-primary)" }}>
          <ChevronLeft size={18} />
        </button>
        <span style={{ fontWeight: 600, color: "var(--text-primary)", minWidth: "200px", textAlign: "center" }}>{weekLabel}</span>
        <button onClick={() => setWeekOffset((p) => p + 1)} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "0.5rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-primary)" }}>
          <ChevronRight size={18} />
        </button>
        <button onClick={() => setWeekOffset(0)} style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "0.5rem 1rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)" }}>
          Aujourd&apos;hui
        </button>
      </div>

      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "80px repeat(7, 1fr)", borderBottom: "1px solid var(--border-color)" }}>
          <div style={{ padding: "0.75rem 0.5rem", borderRight: "1px solid var(--border-color)" }} />
          {weekDates.map((date, i) => {
            const key = formatDate(date);
            const isToday = key === formatDate(new Date());
            return (
              <div key={key} style={{ padding: "0.75rem 0.5rem", textAlign: "center", borderRight: i < 6 ? "1px solid var(--border-color)" : "none", background: isToday ? "rgba(99,102,241,0.08)" : "transparent" }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: isToday ? "var(--accent)" : "var(--text-muted)", marginBottom: "0.2rem" }}>{DAYS_FR[i]}</div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: isToday ? "var(--accent)" : "var(--text-primary)" }}>{date.getDate()}</div>
              </div>
            );
          })}
        </div>

        {SLOTS.map((slot, si) => (
          <div key={slot.start} style={{ display: "grid", gridTemplateColumns: "80px repeat(7, 1fr)", borderBottom: si < SLOTS.length - 1 ? "1px solid var(--border-color)" : "none" }}>
            <div style={{ padding: "0.6rem 0.5rem", textAlign: "center", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", borderRight: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem" }}>
              <Clock size={10} />
              {slot.start}
            </div>
            {weekDates.map((date, di) => {
              const dateStr = formatDate(date);
              const cellKey = `${dateStr}_${slot.start}`;
              const entry = cellMap[cellKey];
              const isMine = entry?.userId === currentUser?.id;
              const isSubmitting = submittingCell === cellKey;
              const slotColor = SLOT_COLORS[si];

              return (
                <div
                  key={cellKey}
                  onClick={() => {
                    if (selectMode && !entry) toggleSelect(cellKey);
                    else if (!selectMode) !isSubmitting && !entry && handleToggle(dateStr, slot.start, slot.end);
                  }}
                  style={{
                    padding: "0.35rem", borderRight: di < 6 ? "1px solid var(--border-color)" : "none",
                    minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: selectMode && !entry ? "pointer" : isSubmitting ? "wait" : entry && isMine ? "pointer" : entry ? "default" : "pointer",
                    background: selected.has(cellKey) ? "rgba(139,92,246,0.25)" : entry ? `${slotColor}15` : "transparent",
                    borderLeft: selected.has(cellKey) ? "3px solid #8b5cf6" : entry ? `3px solid ${slotColor}` : "3px solid transparent",
                    transition: "all 0.15s", opacity: isSubmitting ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => { if (!entry) e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={(e) => { if (!entry) e.currentTarget.style.background = "transparent"; }}
                >
                  {selectMode && selected.has(cellKey) && (
                    <CheckSquare size={16} style={{ color: "#8b5cf6" }} />
                  )}
                  {!selectMode && entry && viewMode === "all" && (
                    <span style={{ fontSize: "0.65rem", fontWeight: 600, color: slotColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
                      {entry.user?.username || "?"}
                    </span>
                  )}
                  {entry && viewMode === "my" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: slotColor }} />
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeletingPerm(entry); }}
                        style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0.1rem", display: "flex", transition: "color 0.2s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
        <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", margin: "0 0 0.5rem 0" }}>Code couleur</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          {SLOTS.map((slot, si) => (
            <div key={slot.start} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: SLOT_COLORS[si] }} />
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}>{slot.start} - {slot.end}</span>
            </div>
          ))}
        </div>
      </div>

      {deletingPerm && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeletingPerm(null); }}
        >
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "400px", textAlign: "center" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <Trash2 size={24} style={{ color: "#ef4444" }} />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.5rem 0" }}>Supprimer la permanence</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: 0 }}>
              {deletingPerm.startTime} - {deletingPerm.endTime} le {new Date(deletingPerm.date).toLocaleDateString("fr-FR")} ?
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={() => setDeletingPerm(null)} style={{ padding: "0.6rem 1.2rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-tertiary)", color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 500, cursor: "pointer" }}>Annuler</button>
              <button onClick={handleDelete} style={{ padding: "0.6rem 1.2rem", borderRadius: "8px", border: "none", background: "#ef4444", color: "#fff", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
