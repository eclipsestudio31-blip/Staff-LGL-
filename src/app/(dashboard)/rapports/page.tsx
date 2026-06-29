"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { hasMinRole, ROLES, type RoleKey } from "@/lib/roles";
import {
  Plus,
  X,
  Search,
  Ban,
  AlertTriangle,
  Lock,
  Wrench,
  Bug,
  Eye,
  Trash2,
  Banknote,
  CheckCircle,
} from "lucide-react";

interface Report {
  id: string;
  type: string;
  authorId: string;
  discord?: string;
  nomPrenom?: string;
  licence?: string;
  raison?: string;
  duree?: string;
  tigCount?: number;
  staffPresent?: string;
  preuves?: string;
  bugName?: string;
  bugSeverity?: string;
  bugCapture?: string;
  bugVideo?: string;
  bugAuthor?: string;
  createdAt: string;
}

const tabs = [
  { id: "ban", label: "Ban", icon: Ban, color: "#ef4444" },
  { id: "warn", label: "Warn", icon: AlertTriangle, color: "#f59e0b" },
  { id: "jail", label: "Jail", icon: Lock, color: "#8b5cf6" },
  { id: "tig", label: "TIG", icon: Wrench, color: "#3b82f6" },
  { id: "bug", label: "Bug", icon: Bug, color: "#22c55e" },
  { id: "remboursement", label: "Demande de remboursement", icon: Banknote, color: "#06b6d4" },
  { id: "remboursement_effectue", label: "Remboursement effectué", icon: CheckCircle, color: "#10b981" },
];

const badgeColors: Record<string, string> = {
  ban: "#ef4444",
  warn: "#f59e0b",
  jail: "#8b5cf6",
  tig: "#3b82f6",
  bug: "#22c55e",
  remboursement: "#06b6d4",
  remboursement_effectue: "#10b981",
};

const formFields: Record<string, { name: string; label: string; type?: string; options?: string[]; multiline?: boolean }[]> = {
  ban: [
    { name: "discord", label: "Discord" },
    { name: "nomPrenom", label: "Nom Prénom" },
    { name: "licence", label: "Licence" },
    { name: "raison", label: "Raison", multiline: true },
    { name: "duree", label: "Durée" },
    { name: "staffPresent", label: "Staff présent" },
    { name: "preuves", label: "Preuves" },
  ],
  warn: [
    { name: "discord", label: "Discord" },
    { name: "nomPrenom", label: "Nom Prénom" },
    { name: "licence", label: "Licence" },
    { name: "raison", label: "Raison", multiline: true },
    { name: "staffPresent", label: "Staff présent" },
    { name: "preuves", label: "Preuves" },
  ],
  jail: [
    { name: "discord", label: "Discord" },
    { name: "nomPrenom", label: "Nom Prénom" },
    { name: "licence", label: "Licence" },
    { name: "raison", label: "Raison", multiline: true },
    { name: "duree", label: "Durée" },
    { name: "staffPresent", label: "Staff présent" },
    { name: "preuves", label: "Preuves" },
  ],
  tig: [
    { name: "discord", label: "Discord" },
    { name: "nomPrenom", label: "Nom Prénom" },
    { name: "licence", label: "Licence" },
    { name: "raison", label: "Raison", multiline: true },
    { name: "nombreTig", label: "Nombre de TIG" },
    { name: "staffPresent", label: "Staff présent" },
    { name: "preuves", label: "Preuves" },
  ],
  bug: [
    { name: "nomBug", label: "Nom du bug" },
    { name: "description", label: "Description", multiline: true },
    { name: "gravite", label: "Gravité", type: "select", options: ["Mineur", "Majeur", "Critique"] },
    { name: "capture", label: "Capture (URL)" },
    { name: "video", label: "Vidéo (URL)" },
    { name: "auteurRapport", label: "Auteur du rapport" },
  ],
  remboursement: [
    { name: "discord", label: "Discord" },
    { name: "nomPrenom", label: "Nom Prénom" },
    { name: "licence", label: "Licence" },
    { name: "raison", label: "Raison du remboursement", multiline: true },
    { name: "preuves", label: "Preuves (URL)" },
    { name: "staffPresent", label: "Staff présent" },
  ],
  remboursement_effectue: [
    { name: "discord", label: "Discord" },
    { name: "nomPrenom", label: "Nom Prénom" },
    { name: "licence", label: "Licence" },
    { name: "raison", label: "Détails du remboursement", multiline: true },
    { name: "preuves", label: "Preuves (URL)" },
    { name: "staffPresent", label: "Staff présent" },
  ],
};

export default function RapportsPage() {
  const { user } = useAppStore();
  const [activeTab, setActiveTab] = useState("ban");
  const [reports, setReports] = useState<Report[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [deletingReport, setDeletingReport] = useState<Report | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(Array.isArray(data) ? data : data.reports || []);
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
      let payload: Record<string, string> = { type: activeTab, ...formData };
      if (activeTab === "bug") {
        payload = {
          ...payload,
          raison: formData.description || "",
          bugName: formData.nomBug || "",
          bugSeverity: formData.gravite || "",
          bugCapture: formData.capture || "",
          bugVideo: formData.video || "",
          bugAuthor: formData.auteurRapport || "",
        };
      }
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({});
        fetchReports();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openModal = () => {
    setFormData({});
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deletingReport) return;
    try {
      const res = await fetch("/api/reports", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: deletingReport.id }),
      });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== deletingReport.id));
        setDeletingReport(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const canDeleteReport = (report: Report): boolean => {
    if (!user) return false;
    if (hasMinRole(user.role, "A-T")) return true;
    return report.authorId === user.id;
  };

  const filteredReports = reports
    .filter((r) => r.type === activeTab)
    .filter((r) => {
      if (!searchTerm) return true;
      const values = [r.discord, r.nomPrenom, r.raison, r.staffPresent, r.bugName].join(" ").toLowerCase();
      return values.includes(searchTerm.toLowerCase());
    });

  const columns: Record<string, string[]> = {
    ban: ["Discord", "Nom Prénom", "Licence", "Raison", "Durée", "Staff", "Preuves"],
    warn: ["Discord", "Nom Prénom", "Licence", "Raison", "Staff", "Preuves"],
    jail: ["Discord", "Nom Prénom", "Licence", "Raison", "Durée", "Staff", "Preuves"],
    tig: ["Discord", "Nom Prénom", "Licence", "Raison", "Nb TIG", "Staff", "Preuves"],
    bug: ["Nom bug", "Description", "Gravité", "Capture", "Vidéo", "Auteur"],
    remboursement: ["Discord", "Nom Prénom", "Licence", "Raison", "Staff", "Preuves"],
    remboursement_effectue: ["Discord", "Nom Prénom", "Licence", "Détails", "Staff", "Preuves"],
  };

  const getRowData = (report: Report): string[] => {
    switch (report.type) {
      case "ban":
        return [report.discord || "", report.nomPrenom || "", report.licence || "", report.raison || "", report.duree || "", report.staffPresent || "", report.preuves || ""];
      case "warn":
        return [report.discord || "", report.nomPrenom || "", report.licence || "", report.raison || "", report.staffPresent || "", report.preuves || ""];
      case "jail":
        return [report.discord || "", report.nomPrenom || "", report.licence || "", report.raison || "", report.duree || "", report.staffPresent || "", report.preuves || ""];
      case "tig":
        return [report.discord || "", report.nomPrenom || "", report.licence || "", report.raison || "", String(report.tigCount || ""), report.staffPresent || "", report.preuves || ""];
      case "bug":
        return [report.bugName || "", report.raison || "", report.bugSeverity || "", report.bugCapture || "", report.bugVideo || "", report.bugAuthor || ""];
      case "remboursement":
      case "remboursement_effectue":
        return [report.discord || "", report.nomPrenom || "", report.licence || "", report.raison || "", report.staffPresent || "", report.preuves || ""];
      default:
        return [];
    }
  };

  return (
    <div style={{ padding: "2rem", minHeight: "100vh", background: "var(--bg-secondary)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Eye size={28} />
          Rapports
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
            onClick={openModal}
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
            Nouveau Rapport
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.5rem", background: "var(--bg-tertiary)", borderRadius: "0.75rem", padding: "0.25rem", width: "fit-content" }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                border: "none",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 600,
                background: isActive ? tab.color : "transparent",
                color: isActive ? "#fff" : "var(--text-secondary)",
                transition: "all 0.2s",
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ background: "var(--bg-tertiary)", borderRadius: "0.75rem", border: "1px solid var(--border-color)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
              {columns[activeTab]?.map((col) => (
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
              <th
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
                Date
              </th>
              <th
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
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns[activeTab]?.length ? columns[activeTab].length + 2 : 1}
                  style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}
                >
                  Chargement...
                </td>
              </tr>
            ) : filteredReports.length === 0 ? (
              <tr>
                <td
                  colSpan={columns[activeTab]?.length ? columns[activeTab].length + 2 : 1}
                  style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}
                >
                  Aucun rapport trouvé
                </td>
              </tr>
            ) : (
              filteredReports.map((report) => (
                <tr
                  key={report.id}
                  style={{ borderBottom: "1px solid var(--border-color)" }}
                >
                  {getRowData(report).map((cell, i) => (
                    <td
                      key={i}
                      style={{
                        padding: "0.75rem 1rem",
                        fontSize: "0.875rem",
                        color: "var(--text-primary)",
                        maxWidth: "200px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {cell || "-"}
                    </td>
                  ))}
                  <td
                    style={{
                      padding: "0.75rem 1rem",
                      fontSize: "0.875rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {new Date(report.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    {canDeleteReport(report) && (
                      <button
                        onClick={() => setDeletingReport(report)}
                        title="Supprimer"
                        style={{
                          padding: "0.35rem",
                          borderRadius: "6px",
                          border: "1px solid var(--border-color)",
                          background: "var(--bg-secondary)",
                          color: "var(--text-secondary)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
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
              maxWidth: "500px",
              maxHeight: "85vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "28px",
                    height: "28px",
                    borderRadius: "0.375rem",
                    background: badgeColors[activeTab],
                    color: "#fff",
                  }}
                >
                  {tabs.find((t) => t.id === activeTab) && (() => {
                    const Icon = tabs.find((t) => t.id === activeTab)!.icon;
                    return <Icon size={16} />;
                  })()}
                </span>
                Nouveau Rapport - {tabs.find((t) => t.id === activeTab)?.label}
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
              {formFields[activeTab]?.map((field) => (
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
                  {field.type === "select" ? (
                    <select
                      value={formData[field.name] || ""}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "0.5rem",
                        border: "1px solid var(--border-color)",
                        background: "var(--bg-secondary)",
                        color: "var(--text-primary)",
                        fontSize: "0.875rem",
                        outline: "none",
                      }}
                    >
                      <option value="">Sélectionner...</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.multiline ? (
                    <textarea
                      value={formData[field.name] || ""}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      required
                      rows={3}
                      style={{
                        width: "100%",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "0.5rem",
                        border: "1px solid var(--border-color)",
                        background: "var(--bg-secondary)",
                        color: "var(--text-primary)",
                        fontSize: "0.875rem",
                        outline: "none",
                        resize: "vertical",
                        fontFamily: "inherit",
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData[field.name] || ""}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "0.5rem",
                        border: "1px solid var(--border-color)",
                        background: "var(--bg-secondary)",
                        color: "var(--text-primary)",
                        fontSize: "0.875rem",
                        outline: "none",
                      }}
                    />
                  )}
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
                    background: badgeColors[activeTab],
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                  }}
                >
                  Envoyer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingReport && (
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
            if (e.target === e.currentTarget) setDeletingReport(null);
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
                Supprimer le rapport
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: 0 }}>
                Êtes-vous sûr de vouloir supprimer le rapport{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  {deletingReport.nomPrenom || deletingReport.bugName || deletingReport.type}
                </strong>{" "}
                ?
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
                onClick={() => setDeletingReport(null)}
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
