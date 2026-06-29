"use client";

import { useEffect, useState } from "react";
import { Car, Plus, Trash2, X, Search, ChevronDown, ChevronRight, Copy, Check } from "lucide-react";

interface Vehicle {
  id: string;
  name: string;
  category: string;
  command: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Audi: "#bb0a30",
  BMW: "#1c69d4",
  Citroen: "#6b4c9a",
  Corvette: "#c41230",
  Cupra: "#e2001a",
  Dodge: "#ba0c2f",
  Honda: "#cc0000",
  Hyundai: "#002c5f",
  Jaguar: "#1a1a1a",
  Lambo: "#ddb321",
  Mazda: "#910a2a",
  Mclaren: "#ff8000",
  Mercedes: "#222222",
  Mini: "#2b7a3d",
  Moto: "#ff6600",
  Nissan: "#c3002f",
  Peugeot: "#1f3c6d",
  Porsche: "#b12328",
  Range: "#005a22",
  Rolls: "#2e2e2e",
  Skoda: "#4ba82e",
  Subaru: "#013f7c",
  Toyota: "#eb0a1e",
  Volkswagen: "#001e50",
  Volvo: "#003057",
};

export default function SpawnVlPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", command: "" });
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);

  const fetchVehicles = () => {
    fetch("/api/vehicles")
      .then((res) => res.json())
      .then((data) => {
        setVehicles(data.vehicles ?? data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const filtered = vehicles.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.category.toLowerCase().includes(search.toLowerCase()) ||
      v.command.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, Vehicle[]>>((acc, v) => {
    if (!acc[v.category]) acc[v.category] = [];
    acc[v.category].push(v);
    return acc;
  }, {});

  const sortedCategories = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    if (search) {
      const expanded: Record<string, boolean> = {};
      sortedCategories.forEach((c) => (expanded[c] = true));
      setExpandedCategories(expanded);
    }
  }, [search]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.category || !form.command) return;
    const res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const created = await res.json();
    setVehicles((prev) => [...prev, created.vehicle ?? created]);
    setModalOpen(false);
    setForm({ name: "", category: "", command: "" });
  };

  const handleDelete = async () => {
    if (!deletingVehicle) return;
    await fetch("/api/vehicles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deletingVehicle.id }),
    });
    setVehicles((prev) => prev.filter((v) => v.id !== deletingVehicle.id));
    setDeletingVehicle(null);
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
          <Car size={28} style={{ color: "var(--accent)" }} />
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Spawn VL
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>
              {vehicles.length} véhicules dans {Object.keys(grouped).length} catégories
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
            onClick={() => { setForm({ name: "", category: "", command: "" }); setModalOpen(true); }}
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
            Ajouter
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px", color: "var(--text-muted)" }}>
          Chargement...
        </div>
      ) : sortedCategories.length === 0 ? (
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
          Aucun véhicule trouvé.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {sortedCategories.map((cat) => {
            const isExpanded = expandedCategories[cat] !== false;
            const vehiclesInCat = grouped[cat];
            const color = CATEGORY_COLORS[cat] || "var(--accent)";
            return (
              <div key={cat} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
                <button
                  onClick={() => toggleCategory(cat)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.85rem 1.25rem", border: "none", cursor: "pointer",
                    background: "var(--bg-tertiary)", textAlign: "left",
                  }}
                >
                  {isExpanded ? <ChevronDown size={18} style={{ color: "var(--text-muted)", flexShrink: 0 }} /> : <ChevronRight size={18} style={{ color: "var(--text-muted)", flexShrink: 0 }} />}
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>{cat}</span>
                  <span style={{
                    padding: "0.15rem 0.5rem", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 600,
                    background: `${color}20`, color: color, border: `1px solid ${color}40`,
                  }}>
                    {vehiclesInCat.length}
                  </span>
                </button>

                {isExpanded && (
                  <div style={{ padding: "0.5rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.5rem" }}>
                      {vehiclesInCat.map((v) => (
                        <div
                          key={v.id}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "0.6rem 0.85rem", borderRadius: "8px",
                            background: "var(--bg-primary)", border: "1px solid var(--border-color)",
                            transition: "border-color 0.15s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = color)}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-color)")}
                        >
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {v.name}
                            </p>
                            <button
                              onClick={() => copyCommand(v.command)}
                              style={{
                                display: "flex", alignItems: "center", gap: "0.3rem",
                                background: "none", border: "none", padding: 0, cursor: "pointer",
                                marginTop: "0.15rem",
                              }}
                            >
                              <code style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                                {v.command}
                              </code>
                              {copiedCmd === v.command ? (
                                <Check size={10} style={{ color: "#22c55e" }} />
                              ) : (
                                <Copy size={10} style={{ color: "var(--text-muted)" }} />
                              )}
                            </button>
                          </div>
                          <button
                            onClick={() => setDeletingVehicle(v)}
                            title="Supprimer"
                            style={{
                              padding: "0.25rem", borderRadius: "4px", border: "none",
                              background: "transparent", color: "var(--text-muted)",
                              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                              transition: "color 0.2s", flexShrink: 0, marginLeft: "0.5rem",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
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
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "480px", position: "relative" }}>
            <button onClick={() => setModalOpen(false)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0.25rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 1.5rem 0" }}>Nouveau véhicule</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Nom</label>
                <input type="text" placeholder="Ex: Tol M3 E92" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Catégorie</label>
                <input type="text" placeholder="Ex: BMW, Audi, Moto" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Commande de spawn</label>
                <input type="text" placeholder="Ex: tolm3e92" value={form.command} onChange={(e) => setForm((p) => ({ ...p, command: e.target.value }))} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={() => setModalOpen(false)} style={{ padding: "0.6rem 1.2rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-tertiary)", color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 500, cursor: "pointer" }}>
                Annuler
              </button>
              <button onClick={handleSubmit} disabled={!form.name || !form.category || !form.command} style={{ padding: "0.6rem 1.2rem", borderRadius: "8px", border: "none", background: "var(--accent)", color: "#fff", fontSize: "0.9rem", fontWeight: 600, cursor: !form.name || !form.category || !form.command ? "not-allowed" : "pointer", opacity: !form.name || !form.category || !form.command ? 0.5 : 1 }}>
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingVehicle && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeletingVehicle(null); }}
        >
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "400px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                <Trash2 size={24} style={{ color: "#ef4444" }} />
              </div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.5rem 0" }}>Supprimer le véhicule</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: 0 }}>
                Supprimer <strong style={{ color: "var(--text-primary)" }}>{deletingVehicle.name}</strong> ({deletingVehicle.command}) ?
              </p>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={() => setDeletingVehicle(null)} style={{ padding: "0.6rem 1.2rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-tertiary)", color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 500, cursor: "pointer" }}>
                Annuler
              </button>
              <button onClick={handleDelete} style={{ padding: "0.6rem 1.2rem", borderRadius: "8px", border: "none", background: "#ef4444", color: "#fff", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" }}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
