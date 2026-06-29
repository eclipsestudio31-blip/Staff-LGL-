"use client";

import { useEffect, useState } from "react";
import { Terminal, Plus, Trash2, X, Search } from "lucide-react";

const INITIAL_COMMANDS = [
  { name: "/revive", category: "Médical", description: "Réanime un joueur inconscient", usage: "/revive [id]" },
  { name: "/heal", category: "Médical", description: "Soigne complètement un joueur", usage: "/heal [id]" },
  { name: "/kick", category: "Moderation", description: "Expulse un joueur du serveur", usage: "/kick [id] [raison]" },
  { name: "/ban", category: "Moderation", description: "Bannit un joueur du serveur", usage: "/ban [id] [raison] [durée]" },
  { name: "/jail", category: "Moderation", description: "Enferme un joueur en jail", usage: "/jail [id] [durée]" },
  { name: "/warn", category: "Moderation", description: "Met un avertissement à un joueur", usage: "/warn [id] [raison]" },
  { name: "/tig", category: "Moderation", description: "Donne un tig à un joueur", usage: "/tig [id]" },
  { name: "/bring", category: "Utilitaire", description: "Téléporte un joueur à soi", usage: "/bring [id]" },
  { name: "/goto", category: "Utilitaire", description: "Se téléporte à un joueur", usage: "/goto [id]" },
  { name: "/freeze", category: "Moderation", description: "Gèle un joueur sur place", usage: "/freeze [id]" },
];

interface Command {
  id: string;
  name: string;
  category: string;
  description: string;
  usage: string;
}

export default function CommandesIgPage() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", description: "", usage: "" });

  const fetchCommands = () => {
    fetch("/api/commands")
      .then((res) => res.json())
      .then(async (data) => {
        const list = data.commands ?? data;
        if (!list || list.length === 0) {
          const seeded = await Promise.all(
            INITIAL_COMMANDS.map((c) =>
              fetch("/api/commands", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(c),
              }).then((r) => r.json())
            )
          );
          setCommands(seeded.map((s) => s.command ?? s));
        } else {
          setCommands(list);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchCommands();
  }, []);

  const filtered = commands.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, Command[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  const openAdd = () => {
    setForm({ name: "", category: "", description: "", usage: "" });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.category || !form.description || !form.usage) return;
    const res = await fetch("/api/commands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const created = await res.json();
    setCommands((prev) => [...prev, created.command ?? created]);
    setModalOpen(false);
    setForm({ name: "", category: "", description: "", usage: "" });
  };

  const handleDelete = async (id: string) => {
    await fetch("/api/commands", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setCommands((prev) => prev.filter((c) => c.id !== id));
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

  return (
    <div style={{ padding: "2rem", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Terminal size={28} style={{ color: "var(--accent)" }} />
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Commandes IG
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
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {Object.entries(grouped).length === 0 && (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "3rem" }}>
              Aucune commande trouvée.
            </div>
          )}
          {Object.entries(grouped).map(([category, cmds]) => (
            <div key={category}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <span style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "20px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  background: "rgba(108, 92, 231, 0.15)",
                  color: "var(--accent)",
                  border: "1px solid rgba(108, 92, 231, 0.3)",
                }}>
                  {category}
                </span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {cmds.length} commande{cmds.length > 1 ? "s" : ""}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
                {cmds.map((cmd) => (
                  <div
                    key={cmd.id}
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
                      <code style={{
                        padding: "0.2rem 0.6rem",
                        borderRadius: "6px",
                        background: "var(--bg-tertiary)",
                        color: "var(--accent)",
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        fontFamily: "monospace",
                      }}>
                        {cmd.name}
                      </code>
                      <button
                        onClick={() => handleDelete(cmd.id)}
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
                    <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                      {cmd.description}
                    </p>
                    <div style={{
                      padding: "0.4rem 0.6rem",
                      borderRadius: "6px",
                      background: "var(--bg-tertiary)",
                      fontSize: "0.82rem",
                      color: "var(--text-muted)",
                      fontFamily: "monospace",
                    }}>
                      {cmd.usage}
                    </div>
                  </div>
                ))}
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
            maxWidth: "480px",
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
              Nouvelle commande
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Nom</label>
                <input
                  type="text"
                  placeholder="Ex: /revive"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Catégorie</label>
                <input
                  type="text"
                  placeholder="Ex: Médical, Moderation, Utilitaire"
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  placeholder="Description de la commande..."
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                />
              </div>
              <div>
                <label style={labelStyle}>Usage</label>
                <input
                  type="text"
                  placeholder="Ex: /revive [id]"
                  value={form.usage}
                  onChange={(e) => setForm((p) => ({ ...p, usage: e.target.value }))}
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
                  opacity: !form.name || !form.category || !form.description || !form.usage ? 0.5 : 1,
                }}
                disabled={!form.name || !form.category || !form.description || !form.usage}
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
