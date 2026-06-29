"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { hasMinRole, ROLES, getRoleName, type RoleKey } from "@/lib/roles";
import {
  UserPlus,
  Trash2,
  X,
  Search,
  Users,
  Clock,
  Copy,
  Check,
} from "lucide-react";

interface UserRecord {
  id: string;
  username: string;
  role: string;
  avatar: string | null;
  isActive: boolean;
  isFirstLogin: boolean;
  lastLogin: string | null;
  createdAt: string;
}

const ROLE_ORDER: RoleKey[] = ["F", "C-F", "D", "R-S", "A", "A-T", "M", "M-T", "S", "S-T"];

const ROLE_COLORS: Record<string, string> = {
  F: "#ff4757",
  "C-F": "#ff6348",
  D: "#ffa502",
  "R-S": "#eccc68",
  A: "#2ed573",
  "A-T": "#1e90ff",
  M: "#5352ed",
  "M-T": "#a55eea",
  S: "#00d2d3",
  "S-T": "#747d8c",
};

const roleKeys = Object.keys(ROLES) as RoleKey[];

export default function GestionComptesPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<UserRecord | null>(null);
  const [createForm, setCreateForm] = useState({ username: "", role: "S-T" });
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user && !hasMinRole(user.role, "A-T")) {
      router.push("/");
    }
  }, [user, router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && hasMinRole(user.role, "A-T")) {
      fetchUsers();
    }
  }, [user]);

  const getRoleLevel = (role: string): number =>
    ROLES[role as RoleKey]?.level ?? 0;

  const filtered = useMemo(() => {
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.role.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, UserRecord[]> = {};
    ROLE_ORDER.forEach((r) => (groups[r] = []));
    filtered.forEach((u) => {
      const key = u.role as RoleKey;
      if (groups[key]) groups[key].push(u);
      else {
        if (!groups["other"]) groups["other"] = [];
        groups["other"].push(u);
      }
    });
    return groups;
  }, [filtered]);

  const handleCreate = async () => {
    if (!createForm.username.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (res.ok) {
        setTempPassword(data.tempPassword);
        fetchUsers();
      }
    } catch {} finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteModal) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: showDeleteModal.id }),
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== showDeleteModal.id));
        setShowDeleteModal(null);
      }
    } catch {} finally {
      setDeleting(false);
    }
  };

  const copyPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const canDelete = (target: UserRecord): boolean => {
    if (!user) return false;
    if (target.id === user.id) return false;
    return getRoleLevel(target.role) < getRoleLevel(user.role);
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });

  if (!user || !hasMinRole(user.role, "A-T")) return null;

  return (
    <div style={{ padding: "2rem", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Users size={28} style={{ color: "var(--accent)" }} />
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Gestion des Comptes</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>Créer et gérer les comptes staff</p>
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
              style={{ padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-tertiary)", color: "var(--text-primary)", fontSize: "0.9rem", outline: "none", width: "220px", paddingLeft: "2.5rem", boxSizing: "border-box" }}
            />
          </div>
          <button
            onClick={() => { setCreateForm({ username: "", role: "S-T" }); setTempPassword(null); setShowCreateModal(true); }}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.6rem 1rem", borderRadius: "8px", border: "none", background: "var(--accent)", color: "#fff", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", transition: "opacity 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <UserPlus size={16} />
            Nouveau Compte
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px", color: "var(--text-muted)" }}>Chargement...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {ROLE_ORDER.map((roleKey) => {
            const members = grouped[roleKey] || [];
            if (members.length === 0) return null;
            const color = ROLE_COLORS[roleKey] || "#747d8c";
            const roleName = getRoleName(roleKey);

            return (
              <div key={roleKey}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: `2px solid ${color}30` }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color, margin: 0 }}>{roleName}</h2>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", background: `${color}15`, padding: "0.15rem 0.5rem", borderRadius: "12px", border: `1px solid ${color}30` }}>
                    {members.length}
                  </span>
                </div>
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-color)", background: "var(--bg-tertiary)" }}>
                          {["Membre", "Statut", "Créé le", "Dernière connexion", "Actions"].map((h) => (
                            <th key={h} style={{ padding: "0.7rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((u, i) => (
                          <tr
                            key={u.id}
                            style={{ borderBottom: i < members.length - 1 ? "1px solid var(--border-color)" : "none" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-tertiary)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <td style={{ padding: "0.7rem 1rem", color: "var(--text-primary)", fontWeight: 500 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: "#fff", flexShrink: 0, overflow: "hidden" }}>
                                  {u.avatar ? (
                                    <img src={u.avatar} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                                  ) : (
                                    u.username.charAt(0).toUpperCase()
                                  )}
                                </div>
                                {u.username}
                                {u.id === user?.id && (
                                  <span style={{ fontSize: "0.7rem", color: "var(--accent)", fontWeight: 600 }}>(vous)</span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: "0.7rem 1rem" }}>
                              <span style={{
                                display: "inline-flex", alignItems: "center", gap: "0.3rem",
                                padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 600,
                                background: u.isActive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                                color: u.isActive ? "#22c55e" : "#ef4444",
                                border: `1px solid ${u.isActive ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                              }}>
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: u.isActive ? "#22c55e" : "#ef4444" }} />
                                {u.isActive ? "Actif" : "Inactif"}
                              </span>
                            </td>
                            <td style={{ padding: "0.7rem 1rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>{formatDate(u.createdAt)}</td>
                            <td style={{ padding: "0.7rem 1rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                <Clock size={12} />
                                {u.lastLogin ? formatDate(u.lastLogin) : "Jamais"}
                              </div>
                            </td>
                            <td style={{ padding: "0.7rem 1rem" }}>
                              {canDelete(u) && (
                                <button
                                  onClick={() => setShowDeleteModal(u)}
                                  title="Supprimer le compte"
                                  style={{ padding: "0.35rem", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-tertiary)", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.2s" }}
                                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "3rem" }}>Aucun compte trouvé.</div>
          )}
        </div>
      )}

      {showCreateModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget && !tempPassword) setShowCreateModal(false); }}
        >
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "440px", position: "relative" }}>
            <button onClick={() => setShowCreateModal(false)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0.25rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={20} />
            </button>

            {tempPassword ? (
              <>
                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                    <Check size={24} style={{ color: "#22c55e" }} />
                  </div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.5rem 0" }}>Compte créé !</h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: 0 }}>Mot de passe temporaire pour <strong>{createForm.username}</strong></p>
                </div>
                <div style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "0.75rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <code style={{ fontSize: "0.9rem", color: "var(--accent)", fontWeight: 600, wordBreak: "break-all", userSelect: "all" }}>{tempPassword}</code>
                  <button onClick={copyPassword} style={{ padding: "0.35rem", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-tertiary)", color: copied ? "#22c55e" : "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: "0.5rem" }}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center", marginBottom: "1rem", lineHeight: 1.4 }}>Ce mot de passe ne sera plus affiché. Copiez-le avant de fermer.</p>
                <button onClick={() => { setShowCreateModal(false); setTempPassword(null); }} style={{ width: "100%", padding: "0.6rem", borderRadius: "8px", border: "none", background: "var(--accent)", color: "#fff", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" }}>Fermer</button>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 1.5rem 0" }}>Nouveau Compte</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem", display: "block" }}>Identifiant</label>
                    <input type="text" placeholder="Ex: Jean_Dupont" value={createForm.username} onChange={(e) => setCreateForm((p) => ({ ...p, username: e.target.value }))} style={{ padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-tertiary)", color: "var(--text-primary)", fontSize: "0.9rem", outline: "none", width: "100%", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem", display: "block" }}>Rôle</label>
                    <select value={createForm.role} onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value }))} style={{ padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-tertiary)", color: "var(--text-primary)", fontSize: "0.9rem", outline: "none", width: "100%", boxSizing: "border-box" }}>
                      {roleKeys.filter((r) => getRoleLevel(r) <= getRoleLevel(user?.role || "")).map((r) => (
                        <option key={r} value={r}>{ROLES[r].name} ({r})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                  <button onClick={() => setShowCreateModal(false)} style={{ padding: "0.6rem 1.2rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-tertiary)", color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 500, cursor: "pointer" }}>Annuler</button>
                  <button onClick={handleCreate} disabled={!createForm.username.trim() || creating} style={{ padding: "0.6rem 1.2rem", borderRadius: "8px", border: "none", background: "var(--accent)", color: "#fff", fontSize: "0.9rem", fontWeight: 600, cursor: !createForm.username.trim() || creating ? "not-allowed" : "pointer", opacity: !createForm.username.trim() || creating ? 0.5 : 1 }}>
                    {creating ? "Création..." : "Créer"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(null); }}
        >
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "400px", position: "relative" }}>
            <button onClick={() => setShowDeleteModal(null)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0.25rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={20} />
            </button>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                <Trash2 size={24} style={{ color: "#ef4444" }} />
              </div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.5rem 0" }}>Supprimer le compte</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: 0 }}>
                Êtes-vous sûr de vouloir supprimer <strong style={{ color: "var(--text-primary)" }}>{showDeleteModal.username}</strong> ({showDeleteModal.role}) ?
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: "0.5rem 0 0 0" }}>Cette action est irréversible.</p>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={() => setShowDeleteModal(null)} style={{ padding: "0.6rem 1.2rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-tertiary)", color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 500, cursor: "pointer" }}>Annuler</button>
              <button onClick={handleDelete} disabled={deleting} style={{ padding: "0.6rem 1.2rem", borderRadius: "8px", border: "none", background: "#ef4444", color: "#fff", fontSize: "0.9rem", fontWeight: 600, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.5 : 1 }}>
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
