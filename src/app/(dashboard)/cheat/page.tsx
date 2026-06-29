"use client";

import { useEffect, useState } from "react";
import { Bug, Plus, Pencil, Trash2, X, Search, List } from "lucide-react";

const INITIAL_CHEATS = [
  {
    name: "SpeedHack",
    description: "Mouvement anormalement rapide",
    symptoms: ["Déplacement ultra rapide", "Téléportation"],
    verification: "Filmer le suspect",
    sanction: "Ban",
  },
  {
    name: "AimBot",
    description: "Visée automatisée",
    symptoms: ["Tirs toujours précis", "Rotation instantanée"],
    verification: "Analyser les replays et vérifier la précision des tirs",
    sanction: "Ban",
  },
  {
    name: "ESP/Wallhack",
    description: "Voir à travers les murs",
    symptoms: ["Réactions suspects derrière les murs", "Visée à travers les obstacles"],
    verification: "Vérifier les angles de vue suspects et les replays",
    sanction: "Warn + Jail",
  },
];

interface Cheat {
  id: string;
  name: string;
  description: string;
  symptoms: string[];
  verification: string;
  sanction: string;
}

export default function CheatPage() {
  const [cheats, setCheats] = useState<Cheat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCheat, setEditingCheat] = useState<Cheat | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    symptoms: "",
    verification: "",
    sanction: "",
  });

  const fetchCheats = () => {
    fetch("/api/cheats")
      .then((res) => res.json())
      .then(async (data) => {
        const list = data.cheats ?? data;
        if (!list || list.length === 0) {
          const seeded = await Promise.all(
            INITIAL_CHEATS.map((c) =>
              fetch("/api/cheats", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(c),
              }).then((r) => r.json())
            )
          );
          setCheats(seeded.map((s) => s.cheat ?? s));
        } else {
          setCheats(list);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchCheats();
  }, []);

  const filtered = cheats.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.sanction.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditingCheat(null);
    setForm({ name: "", description: "", symptoms: "", verification: "", sanction: "" });
    setModalOpen(true);
  };

  const openEdit = (c: Cheat) => {
    setEditingCheat(c);
    setForm({
      name: c.name,
      description: c.description,
      symptoms: Array.isArray(c.symptoms) ? c.symptoms.join("\n") : c.symptoms,
      verification: c.verification,
      sanction: c.sanction,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.description || !form.symptoms || !form.verification || !form.sanction) return;
    const payload = {
      name: form.name,
      description: form.description,
      symptoms: form.symptoms.split("\n").map((s) => s.trim()).filter(Boolean),
      verification: form.verification,
      sanction: form.sanction,
    };

    if (editingCheat) {
      const res = await fetch("/api/cheats", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingCheat.id, ...payload }),
      });
      const updated = await res.json();
      setCheats((prev) => prev.map((c) => (c.id === editingCheat.id ? (updated.cheat ?? updated) : c)));
    } else {
      const res = await fetch("/api/cheats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const created = await res.json();
      setCheats((prev) => [...prev, created.cheat ?? created]);
    }

    setModalOpen(false);
    setEditingCheat(null);
    setForm({ name: "", description: "", symptoms: "", verification: "", sanction: "" });
  };

  const handleDelete = async (id: string) => {
    await fetch("/api/cheats", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setCheats((prev) => prev.filter((c) => c.id !== id));
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

  const sanctionBadge = (sanction: string) => {
    const isBan = sanction.toLowerCase().includes("ban");
    const isWarn = sanction.toLowerCase().includes("warn");
    return {
      padding: "0.2rem 0.6rem",
      borderRadius: "20px",
      fontSize: "0.78rem",
      fontWeight: 600,
      background: isBan ? "rgba(255,71,87,0.15)" : isWarn ? "rgba(255,165,2,0.15)" : "rgba(108,92,231,0.15)",
      color: isBan ? "#ff4757" : isWarn ? "#ffa502" : "var(--accent)",
      border: `1px solid ${isBan ? "rgba(255,71,87,0.3)" : isWarn ? "rgba(255,165,2,0.3)" : "rgba(108,92,231,0.3)"}`,
    };
  };

  return (
    <div style={{ padding: "2rem", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Bug size={28} style={{ color: "var(--accent)" }} />
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Cheat
          </h1>
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

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px", color: "var(--text-muted)" }}>
          Chargement...
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1rem" }}>
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "var(--text-muted)", padding: "3rem" }}>
              Aucun cheat trouvé.
            </div>
          )}
          {filtered.map((c) => (
            <div
              key={c.id}
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "12px",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-color)")}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Bug size={16} style={{ color: "var(--accent)" }} />
                  <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {c.name}
                  </h3>
                </div>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button
                    onClick={() => openEdit(c)}
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
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
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
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#ff4757")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                {c.description}
              </p>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.3rem" }}>
                  <List size={12} style={{ color: "var(--text-muted)" }} />
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Symptômes
                  </span>
                </div>
                <ul style={{ margin: 0, paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                  {(Array.isArray(c.symptoms) ? c.symptoms : [c.symptoms]).map((s, i) => (
                    <li key={i} style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{
                padding: "0.5rem 0.7rem",
                borderRadius: "8px",
                background: "var(--bg-tertiary)",
                fontSize: "0.82rem",
                color: "var(--text-secondary)",
              }}>
                <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Vérification :</span> {c.verification}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Sanction :</span>
                <span style={sanctionBadge(c.sanction)}>
                  {c.sanction}
                </span>
              </div>
            </div>
          ))}
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
          <div style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "16px",
            padding: "2rem",
            width: "100%",
            maxWidth: "520px",
            position: "relative",
          }}>
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

            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 1.5rem 0" }}>
              {editingCheat ? "Modifier le cheat" : "Nouveau cheat"}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Nom</label>
                <input
                  type="text"
                  placeholder="Ex: SpeedHack"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  placeholder="Description du cheat..."
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                />
              </div>
              <div>
                <label style={labelStyle}>Symptômes (un par ligne)</label>
                <textarea
                  placeholder="Déplacement ultra rapide&#10;Téléportation"
                  value={form.symptoms}
                  onChange={(e) => setForm((p) => ({ ...p, symptoms: e.target.value }))}
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                />
              </div>
              <div>
                <label style={labelStyle}>Procédure de vérification</label>
                <textarea
                  placeholder="Comment vérifier ce cheat..."
                  value={form.verification}
                  onChange={(e) => setForm((p) => ({ ...p, verification: e.target.value }))}
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                />
              </div>
              <div>
                <label style={labelStyle}>Sanction recommandée</label>
                <input
                  type="text"
                  placeholder="Ex: Ban, Warn + Jail"
                  value={form.sanction}
                  onChange={(e) => setForm((p) => ({ ...p, sanction: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
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
                  opacity: !form.name || !form.description || !form.symptoms || !form.verification || !form.sanction ? 0.5 : 1,
                }}
                disabled={!form.name || !form.description || !form.symptoms || !form.verification || !form.sanction}
              >
                {editingCheat ? "Modifier" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
