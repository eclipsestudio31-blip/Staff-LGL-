"use client";

import { useEffect, useState } from "react";
import {
  CalendarOff,
  Plus,
  Trash2,
  X,
  Search,
  AlertCircle,
  User,
} from "lucide-react";
import { useAppStore } from "@/lib/store";

interface Absence {
  id: string;
  userId: string;
  user: { username: string; role: string };
  date: string;
  endDate?: string;
  reason?: string;
  createdAt: string;
}

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

const labelStyle: React.CSSProperties = {
  fontSize: "0.85rem",
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: "0.3rem",
  display: "block",
};

export default function AbsencesPage() {
  const { user } = useAppStore();
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingAbsence, setDeletingAbsence] = useState<Absence | null>(null);
  const [form, setForm] = useState({ date: "", endDate: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/absences")
      .then((res) => res.json())
      .then((data) => {
        setAbsences(data.absences ?? data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = absences.filter(
    (a) =>
      a.user.username.toLowerCase().includes(search.toLowerCase()) ||
      a.reason?.toLowerCase().includes(search.toLowerCase()) ||
      new Date(a.date).toLocaleDateString("fr-FR").includes(search)
  );

  const handleSubmit = async () => {
    if (!form.date) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/absences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: form.date, endDate: form.endDate || null, reason: form.reason }),
      });
      const data = await res.json();
      setAbsences((prev) => [data.absence ?? data, ...prev]);
      setModalOpen(false);
      setForm({ date: "", endDate: "", reason: "" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAbsence) return;
    await fetch("/api/absences", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deletingAbsence.id }),
    });
    setAbsences((prev) => prev.filter((a) => a.id !== deletingAbsence.id));
    setDeletingAbsence(null);
  };

  return (
    <div style={{ padding: "2rem", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <CalendarOff size={28} style={{ color: "var(--accent)" }} />
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Absences</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>
              {absences.length} absence{absences.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Search size={18} style={{ position: "absolute", left: "12px", color: "var(--text-muted)", pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, width: "240px", paddingLeft: "2.5rem" }}
            />
          </div>
          <button
            onClick={() => { setForm({ date: "", endDate: "", reason: "" }); setModalOpen(true); }}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.6rem 1rem", borderRadius: "8px", border: "none",
              background: "var(--accent)", color: "#fff", fontSize: "0.9rem",
              fontWeight: 600, cursor: "pointer", transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <Plus size={16} />
            Déclarer une absence
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px", color: "var(--text-muted)" }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
          Aucune absence déclarée.
        </div>
      ) : (
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                {["MEMBRE", "DATE", "RAISON", "ACTIONS"].map((h) => (
                  <th key={h} style={{ padding: "0.85rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <User size={14} style={{ color: "var(--text-muted)" }} />
                      <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{a.user.username}</span>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", background: "var(--bg-tertiary)", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>{a.user.role}</span>
                    </div>
                  </td>
                  <td style={{ padding: "0.85rem 1rem", fontSize: "0.9rem" }}>
                    {a.endDate ? (
                      <>du {new Date(a.date).toLocaleDateString("fr-FR")} au {new Date(a.endDate).toLocaleDateString("fr-FR")}</>
                    ) : (
                      new Date(a.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
                    )}
                  </td>
                  <td style={{ padding: "0.85rem 1rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    {a.reason || "—"}
                  </td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    {user?.id === a.userId && (
                      <button
                        onClick={() => setDeletingAbsence(a)}
                        style={{
                          padding: "0.3rem", borderRadius: "6px", border: "none",
                          background: "transparent", color: "var(--text-muted)",
                          cursor: "pointer", display: "flex", transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "420px", position: "relative" }}>
            <button onClick={() => setModalOpen(false)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0.25rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 1.5rem 0" }}>Déclarer une absence</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Date de début</label>
                <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Date de fin (optionnel)</label>
                <input type="date" value={form.endDate} min={form.date || undefined} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Raison (optionnel)</label>
                <input type="text" placeholder="Ex: Rendez-vous médical" value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={() => setModalOpen(false)} style={{ padding: "0.6rem 1.2rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-tertiary)", color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 500, cursor: "pointer" }}>Annuler</button>
              <button onClick={handleSubmit} disabled={!form.date || submitting} style={{ padding: "0.6rem 1.2rem", borderRadius: "8px", border: "none", background: "var(--accent)", color: "#fff", fontSize: "0.9rem", fontWeight: 600, cursor: !form.date ? "not-allowed" : "pointer", opacity: !form.date ? 0.5 : 1 }}>
                {submitting ? "Envoi..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingAbsence && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeletingAbsence(null); }}
        >
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "400px", textAlign: "center" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <AlertCircle size={24} style={{ color: "#ef4444" }} />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.5rem 0" }}>Supprimer l&apos;absence</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: 0 }}>
              Absence du <strong>{new Date(deletingAbsence.date).toLocaleDateString("fr-FR")}{deletingAbsence.endDate ? ` au ${new Date(deletingAbsence.endDate).toLocaleDateString("fr-FR")}` : ""}</strong> ?
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={() => setDeletingAbsence(null)} style={{ padding: "0.6rem 1.2rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-tertiary)", color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 500, cursor: "pointer" }}>Annuler</button>
              <button onClick={handleDelete} style={{ padding: "0.6rem 1.2rem", borderRadius: "8px", border: "none", background: "#ef4444", color: "#fff", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
