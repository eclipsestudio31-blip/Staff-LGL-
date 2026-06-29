"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  ShieldAlert,
} from "lucide-react";


interface Sanction {
  id: string;
  infraction: string;
  sanction1: string;
  sanction2: string;
  sanction3: string;
  description?: string;
}

export default function SanctionsPage() {
  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSanction, setEditingSanction] = useState<Sanction | null>(null);
  const [deletingSanction, setDeletingSanction] = useState<Sanction | null>(null);
  const [form, setForm] = useState({
    infraction: "",
    sanction1: "",
    sanction2: "",
    sanction3: "",
    description: "",
  });

  const fetchSanctions = () => {
    fetch("/api/sanctions")
      .then((res) => res.json())
      .then(async (raw: unknown) => {
        const data: Sanction[] = Array.isArray(raw) ? raw : (raw as { sanctions: Sanction[] }).sanctions || [];
        setSanctions(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchSanctions();
  }, []);

  const filtered = sanctions.filter(
    (s) =>
      s.infraction.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase()) ||
      s.sanction1.toLowerCase().includes(search.toLowerCase()) ||
      s.sanction2.toLowerCase().includes(search.toLowerCase()) ||
      s.sanction3.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditingSanction(null);
    setForm({ infraction: "", sanction1: "", sanction2: "", sanction3: "", description: "" });
    setModalOpen(true);
  };

  const openEdit = (s: Sanction) => {
    setEditingSanction(s);
    setForm({
      infraction: s.infraction,
      sanction1: s.sanction1,
      sanction2: s.sanction2,
      sanction3: s.sanction3,
      description: s.description || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.infraction || !form.sanction1 || !form.sanction2 || !form.sanction3) return;

    if (editingSanction) {
      const res = await fetch("/api/sanctions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: editingSanction.id }),
      });
      const { sanction: updated } = await res.json();
      setSanctions((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
    } else {
      const res = await fetch("/api/sanctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const { sanction: created } = await res.json();
      setSanctions((prev) => [...prev, created]);
    }

    setModalOpen(false);
    setForm({ infraction: "", sanction1: "", sanction2: "", sanction3: "", description: "" });
    setEditingSanction(null);
  };

  const handleDelete = async () => {
    if (!deletingSanction) return;
    await fetch("/api/sanctions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deletingSanction.id }),
    });
    setSanctions((prev) => prev.filter((s) => s.id !== deletingSanction.id));
    setDeletingSanction(null);
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

  const labelStyle: React.CSSProperties = {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "var(--text-secondary)",
    marginBottom: "0.3rem",
    display: "block",
  };

  const sanctionBadgeStyle = (level: number): React.CSSProperties => {
    const colors = [
      { bg: "rgba(234,179,8,0.12)", text: "#eab308", border: "rgba(234,179,8,0.3)" },
      { bg: "rgba(249,115,22,0.12)", text: "#f97316", border: "rgba(249,115,22,0.3)" },
      { bg: "rgba(239,68,68,0.12)", text: "#ef4444", border: "rgba(239,68,68,0.3)" },
    ];
    const c = colors[Math.min(level, 2)];
    return {
      padding: "0.25rem 0.65rem",
      borderRadius: "20px",
      fontSize: "0.78rem",
      fontWeight: 600,
      background: c.bg,
      color: c.text,
      border: `1px solid ${c.border}`,
      whiteSpace: "nowrap",
    };
  };

  return (
    <div style={{ padding: "2rem", minHeight: "100vh" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <ShieldAlert size={28} style={{ color: "var(--accent)" }} />
          <div>
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Barème des Sanctions
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>
              Tableau de référence des infractions et escalades
            </p>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "12px",
                color: "var(--text-muted)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                ...inputStyle,
                width: "240px",
                paddingLeft: "2.5rem",
              }}
            />
          </div>
          <button
            onClick={openAdd}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.6rem 1rem",
              borderRadius: "8px",
              border: "none",
              background: "var(--accent)",
              color: "#fff",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <Plus size={16} />
            Ajouter
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
          <span style={{ ...sanctionBadgeStyle(0), padding: "0.15rem 0.5rem", fontSize: "0.72rem" }}>Sanction 1</span>
          Première infraction
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
          <span style={{ ...sanctionBadgeStyle(1), padding: "0.15rem 0.5rem", fontSize: "0.72rem" }}>Sanction 2</span>
          Récidive
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
          <span style={{ ...sanctionBadgeStyle(2), padding: "0.15rem 0.5rem", fontSize: "0.72rem" }}>Sanction 3</span>
          Persistance
        </div>
      </div>

      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "300px",
            color: "var(--text-muted)",
          }}
        >
          Chargement...
        </div>
      ) : (
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "800px",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--border-color)",
                    background: "var(--bg-tertiary)",
                  }}
                >
                  {["Infraction", "Description", "Sanction 1", "Sanction 2", "Sanction 3", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: "0.85rem 1rem",
                          textAlign: "left",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: "2rem",
                        textAlign: "center",
                        color: "var(--text-muted)",
                      }}
                    >
                      Aucune infraction trouvée.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s, i) => (
                    <tr
                      key={s.id}
                      style={{
                        borderBottom:
                          i < filtered.length - 1
                            ? "1px solid var(--border-color)"
                            : "none",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "var(--bg-tertiary)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <td
                        style={{
                          padding: "0.75rem 1rem",
                          color: "var(--text-primary)",
                          fontWeight: 600,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <AlertTriangle size={14} style={{ color: "var(--accent)" }} />
                          {s.infraction}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "0.75rem 1rem",
                          color: "var(--text-secondary)",
                          fontSize: "0.88rem",
                          maxWidth: "220px",
                        }}
                      >
                        {s.description || "—"}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span style={sanctionBadgeStyle(0)}>{s.sanction1}</span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span style={sanctionBadgeStyle(1)}>{s.sanction2}</span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span style={sanctionBadgeStyle(2)}>{s.sanction3}</span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <button
                            onClick={() => openEdit(s)}
                            title="Modifier"
                            style={{
                              padding: "0.35rem",
                              borderRadius: "6px",
                              border: "1px solid var(--border-color)",
                              background: "var(--bg-tertiary)",
                              color: "var(--text-secondary)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "color 0.2s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.color = "var(--accent)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.color =
                                "var(--text-secondary)")
                            }
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeletingSanction(s)}
                            title="Supprimer"
                            style={{
                              padding: "0.35rem",
                              borderRadius: "6px",
                              border: "1px solid var(--border-color)",
                              background: "var(--bg-tertiary)",
                              color: "var(--text-secondary)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "color 0.2s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.color = "#ff4757")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.color =
                                "var(--text-secondary)")
                            }
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "16px",
              padding: "2rem",
              width: "100%",
              maxWidth: "520px",
              position: "relative",
            }}
          >
            <button
              onClick={() => setModalOpen(false)}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "0.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={20} />
            </button>

            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: "0 0 1.5rem 0",
              }}
            >
              {editingSanction ? "Modifier l'infraction" : "Nouvelle infraction"}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Infraction</label>
                <input
                  type="text"
                  placeholder="Ex: Freekill"
                  value={form.infraction}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, infraction: e.target.value }))
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  placeholder="Description de l'infraction..."
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  rows={2}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={labelStyle}>Sanction 1</label>
                  <input
                    type="text"
                    placeholder="1ère fois"
                    value={form.sanction1}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, sanction1: e.target.value }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Sanction 2</label>
                  <input
                    type="text"
                    placeholder="2ème fois"
                    value={form.sanction2}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, sanction2: e.target.value }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Sanction 3</label>
                  <input
                    type="text"
                    placeholder="3ème fois"
                    value={form.sanction3}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, sanction3: e.target.value }))
                    }
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
                marginTop: "1.5rem",
              }}
            >
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  padding: "0.6rem 1.2rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-tertiary)",
                  color: "var(--text-secondary)",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  padding: "0.6rem 1.2rem",
                  borderRadius: "8px",
                  border: "none",
                  background: "var(--accent)",
                  color: "#fff",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  opacity:
                    !form.infraction || !form.sanction1 || !form.sanction2 || !form.sanction3
                      ? 0.5
                      : 1,
                }}
                disabled={
                  !form.infraction || !form.sanction1 || !form.sanction2 || !form.sanction3
                }
              >
                {editingSanction ? "Modifier" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingSanction && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingSanction(null);
          }}
        >
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "16px",
              padding: "2rem",
              width: "100%",
              maxWidth: "400px",
              position: "relative",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "rgba(239,68,68,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                }}
              >
                <Trash2 size={24} style={{ color: "#ef4444" }} />
              </div>
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: "0 0 0.5rem 0",
                }}
              >
                Supprimer l&apos;infraction
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: 0 }}>
                Êtes-vous sûr de vouloir supprimer{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  {deletingSanction.infraction}
                </strong>{" "}
                du barème ?
              </p>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.8rem",
                  margin: "0.5rem 0 0 0",
                }}
              >
                Cette action est irréversible.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "0.75rem",
                marginTop: "1.5rem",
              }}
            >
              <button
                onClick={() => setDeletingSanction(null)}
                style={{
                  padding: "0.6rem 1.2rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-tertiary)",
                  color: "var(--text-secondary)",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: "0.6rem 1.2rem",
                  borderRadius: "8px",
                  border: "none",
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
