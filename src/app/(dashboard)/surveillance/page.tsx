"use client";

import { useState, useEffect } from "react";
import { Plus, X, Search, Eye, Shield, ShieldOff, Trash2 } from "lucide-react";

interface SurveillanceEntry {
  id: string;
  discord: string;
  nomPrenom: string;
  licence: string;
  raison: string;
  staffPresent: string;
  status: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  surveilled: { label: "Surveillé", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  removed: { label: "Retiré", color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
};

export default function SurveillancePage() {
  const [entries, setEntries] = useState<SurveillanceEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    discord: "",
    nomPrenom: "",
    licence: "",
    raison: "",
    staffPresent: "",
  });
  const [deletingEntry, setDeletingEntry] = useState<SurveillanceEntry | null>(null);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/surveillance");
      if (res.ok) {
        const data = await res.json();
        setEntries(Array.isArray(data) ? data : data.entries || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/surveillance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ discord: "", nomPrenom: "", licence: "", raison: "", staffPresent: "" });
        fetchEntries();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "surveilled" ? "removed" : "surveilled";
    try {
      const res = await fetch("/api/surveillance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        fetchEntries();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDelete = async () => {
    if (!deletingEntry) return;
    try {
      const res = await fetch("/api/surveillance", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletingEntry.id }),
      });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== deletingEntry.id));
        setDeletingEntry(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredEntries = entries.filter((entry) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      entry.discord.toLowerCase().includes(search) ||
      entry.nomPrenom.toLowerCase().includes(search) ||
      entry.licence.toLowerCase().includes(search) ||
      entry.raison.toLowerCase().includes(search) ||
      entry.staffPresent.toLowerCase().includes(search)
    );
  });

  const inputStyle = {
    width: "100%",
    padding: "0.5rem 0.75rem",
    borderRadius: "0.5rem",
    border: "1px solid var(--border-color)",
    background: "var(--bg-secondary)",
    color: "var(--text-primary)",
    fontSize: "0.875rem",
    outline: "none",
  };

  return (
    <div style={{ padding: "2rem", minHeight: "100vh", background: "var(--bg-secondary)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Eye size={28} />
          Personnes à Surveiller
        </h1>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "0.5rem 0.75rem 0.5rem 2.25rem",
                borderRadius: "0.5rem",
                border: "1px solid var(--border-color)",
                background: "var(--bg-tertiary)",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
                outline: "none",
                width: "220px",
              }}
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            <Plus size={16} />
            Ajouter
          </button>
        </div>
      </div>

      <div style={{ background: "var(--bg-tertiary)", borderRadius: "0.75rem", border: "1px solid var(--border-color)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
              {["Discord", "Nom Prénom", "Licence", "Raison", "Staff Présent", "Statut", "Date", "Actions"].map((col) => (
                <th
                  key={col}
                  style={{
                    padding: "0.75rem 1rem",
                    textAlign: "left",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                  Chargement...
                </td>
              </tr>
            ) : filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                  Aucune personne trouvée
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => {
                const status = statusConfig[entry.status] || statusConfig.surveilled;
                return (
                  <tr key={entry.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "var(--text-primary)" }}>
                      {entry.discord}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "var(--text-primary)" }}>
                      {entry.nomPrenom}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "var(--text-primary)" }}>
                      {entry.licence}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "var(--text-primary)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {entry.raison}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                      {entry.staffPresent}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.375rem",
                          padding: "0.25rem 0.625rem",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: status.color,
                          background: status.bg,
                        }}
                      >
                        {entry.status === "surveilled" ? <Shield size={12} /> : <ShieldOff size={12} />}
                        {status.label}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                      {new Date(entry.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => toggleStatus(entry.id, entry.status)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.375rem",
                          padding: "0.375rem 0.75rem",
                          borderRadius: "0.375rem",
                          border: `1px solid ${entry.status === "surveilled" ? "#f59e0b" : "#22c55e"}`,
                          background: "transparent",
                          color: entry.status === "surveilled" ? "#f59e0b" : "#22c55e",
                          cursor: "pointer",
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                        }}
                      >
                        {entry.status === "surveilled" ? (
                          <>
                            <ShieldOff size={14} />
                            Retirer
                          </>
                        ) : (
                          <>
                            <Shield size={14} />
                            Surveiller
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setDeletingEntry(entry)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "0.375rem",
                          borderRadius: "0.375rem",
                          border: "1px solid #ef4444",
                          background: "transparent",
                          color: "#ef4444",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "var(--bg-tertiary)",
              borderRadius: "0.75rem",
              border: "1px solid var(--border-color)",
              padding: "1.5rem",
              width: "100%",
              maxWidth: "450px",
              maxHeight: "85vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Eye size={20} />
                Ajouter une personne
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "0.25rem",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                { name: "discord", label: "Discord" },
                { name: "nomPrenom", label: "Nom Prénom" },
                { name: "licence", label: "Licence" },
                { name: "raison", label: "Raison" },
                { name: "staffPresent", label: "Staff Présent" },
              ].map((field) => (
                <div key={field.name}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      marginBottom: "0.375rem",
                    }}
                  >
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={formData[field.name as keyof typeof formData]}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>
              ))}

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-secondary)",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.5rem",
                    border: "none",
                    background: "var(--accent)",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                  }}
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingEntry && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeletingEntry(null); }}
        >
          <div
            style={{
              background: "var(--bg-tertiary)",
              borderRadius: "0.75rem",
              border: "1px solid var(--border-color)",
              padding: "1.5rem",
              width: "100%",
              maxWidth: "400px",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <Trash2 size={24} style={{ color: "#ef4444" }} />
            </div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.5rem 0" }}>
              Supprimer cette entrée ?
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 1.5rem 0" }}>
              <strong>{deletingEntry.nomPrenom}</strong> ({deletingEntry.discord})
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button
                onClick={() => setDeletingEntry(null)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-secondary)",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  background: "#ef4444",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 600,
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
