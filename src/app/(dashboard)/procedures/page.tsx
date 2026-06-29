"use client";

import { useEffect, useState } from "react";
import {
  ShieldAlert,
  Plus,
  Pencil,
  Trash2,
  X,
  GripVertical,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface ProcedureStep {
  id: string;
  title: string;
  content: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
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

export default function ProceduresPage() {
  const [steps, setSteps] = useState<ProcedureStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<ProcedureStep | null>(null);
  const [deletingStep, setDeletingStep] = useState<ProcedureStep | null>(null);
  const [form, setForm] = useState({ title: "", content: "" });
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/procedures")
      .then((res) => res.json())
      .then((data) => {
        setSteps(data.steps ?? data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const openAdd = () => {
    setEditingStep(null);
    setForm({ title: "", content: "" });
    setModalOpen(true);
  };

  const openEdit = (step: ProcedureStep) => {
    setEditingStep(step);
    setForm({ title: step.title, content: step.content });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.content) return;
    if (editingStep) {
      const res = await fetch("/api/procedures", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingStep.id, ...form, sortOrder: editingStep.sortOrder }),
      });
      const data = await res.json();
      setSteps((prev) => prev.map((s) => (s.id === editingStep.id ? data.step : s)));
    } else {
      const res = await fetch("/api/procedures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sortOrder: steps.length }),
      });
      const data = await res.json();
      setSteps((prev) => [...prev, data.step]);
    }
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deletingStep) return;
    await fetch("/api/procedures", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deletingStep.id }),
    });
    setSteps((prev) => prev.filter((s) => s.id !== deletingStep.id));
    setDeletingStep(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedSteps((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div style={{ padding: "2rem", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <ShieldAlert size={28} style={{ color: "var(--accent)" }} />
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Procédure de vérification cheater
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>
              {steps.length} étape{steps.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button
          onClick={openAdd}
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
          Ajouter une étape
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px", color: "var(--text-muted)" }}>Chargement...</div>
      ) : steps.length === 0 ? (
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
          Aucune étape définie. Ajoutez la première étape de la procédure.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {steps.map((step, i) => {
            const isExpanded = expandedSteps[step.id] !== false;
            return (
              <div key={step.id} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem 1.25rem" }}>
                  <GripVertical size={16} style={{ color: "var(--text-muted)", flexShrink: 0, cursor: "grab" }} />
                  <button
                    onClick={() => toggleExpand(step.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, textAlign: "left", padding: 0 }}
                  >
                    {isExpanded ? <ChevronDown size={16} style={{ color: "var(--text-muted)" }} /> : <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />}
                    <span style={{
                      width: "24px", height: "24px", borderRadius: "50%", background: "var(--accent)", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0,
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>{step.title}</span>
                  </button>
                  <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0 }}>
                    <button
                      onClick={() => openEdit(step)}
                      style={{
                        padding: "0.3rem", borderRadius: "6px", border: "none",
                        background: "transparent", color: "var(--text-muted)",
                        cursor: "pointer", display: "flex", transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeletingStep(step)}
                      style={{
                        padding: "0.3rem", borderRadius: "6px", border: "none",
                        background: "transparent", color: "var(--text-muted)",
                        cursor: "pointer", display: "flex", transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div style={{ padding: "0 1.25rem 1rem 3.5rem" }}>
                    <div style={{
                      fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                    }}>
                      {step.content}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "560px", position: "relative" }}>
            <button onClick={() => setModalOpen(false)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0.25rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 1.5rem 0" }}>
              {editingStep ? "Modifier l&apos;étape" : "Nouvelle étape"}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Titre</label>
                <input
                  type="text"
                  placeholder="Ex: Vérification des logs"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Contenu</label>
                <textarea
                  placeholder="Décrivez cette étape de la procédure..."
                  value={form.content}
                  onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                  rows={8}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    fontFamily: "inherit",
                    lineHeight: 1.5,
                  }}
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={() => setModalOpen(false)} style={{ padding: "0.6rem 1.2rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-tertiary)", color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 500, cursor: "pointer" }}>Annuler</button>
              <button onClick={handleSubmit} disabled={!form.title || !form.content} style={{ padding: "0.6rem 1.2rem", borderRadius: "8px", border: "none", background: "var(--accent)", color: "#fff", fontSize: "0.9rem", fontWeight: 600, cursor: !form.title || !form.content ? "not-allowed" : "pointer", opacity: !form.title || !form.content ? 0.5 : 1 }}>
                {editingStep ? "Modifier" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingStep && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeletingStep(null); }}
        >
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "400px", textAlign: "center" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <Trash2 size={24} style={{ color: "#ef4444" }} />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.5rem 0" }}>Supprimer l&apos;étape</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: 0 }}>
              Supprimer <strong style={{ color: "var(--text-primary)" }}>{deletingStep.title}</strong> ?
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={() => setDeletingStep(null)} style={{ padding: "0.6rem 1.2rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-tertiary)", color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 500, cursor: "pointer" }}>Annuler</button>
              <button onClick={handleDelete} style={{ padding: "0.6rem 1.2rem", borderRadius: "8px", border: "none", background: "#ef4444", color: "#fff", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
