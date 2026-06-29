"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { hasMinRole, ROLES, type RoleKey } from "@/lib/roles";
import {
  Users,
  MessageSquare,
  Activity,
  Send,
  Shield,
  ArrowUp,
  ArrowDown,
  UserX,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface ChatMessage {
  id: string;
  content: string;
  channel: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    role: string;
    avatar: string | null;
  };
}

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

interface StaffAction {
  id: string;
  action: string;
  targetId: string | null;
  details: string;
  createdAt: string;
  user: {
    username: string;
    role: string;
  };
}

const roleKeys = Object.keys(ROLES) as RoleKey[];

export default function GestionStaffPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const [activeTab, setActiveTab] = useState<"chat" | "effectifs" | "actions">("chat");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [staffActions, setStaffActions] = useState<StaffAction[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user && !hasMinRole(user.role, "R-S")) {
      router.push("/");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user || !hasMinRole(user.role, "R-S")) return;

    const fetchData = async () => {
      try {
        const [chatRes, usersRes] = await Promise.all([
          fetch("/api/chat"),
          fetch("/api/users"),
        ]);
        const chatData = await chatRes.json();
        const usersData = await usersRes.json();
        setMessages(chatData.messages || []);
        setUsers(usersData.users || []);
      } catch {
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    if (!user || !hasMinRole(user.role, "R-S")) return;
    if (activeTab !== "actions") return;

    const fetchActions = async () => {
      try {
        const res = await fetch("/api/staff-actions");
        const data = await res.json();
        setStaffActions(data.actions || []);
      } catch {}
    };

    fetchActions();
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab !== "chat") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/chat");
        const data = await res.json();
        setMessages(data.messages || []);
      } catch {}
    }, 5000);

    return () => clearInterval(interval);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "chat" && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    const content = chatInput.trim();
    setChatInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
      }
    } catch {}
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        const data = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: data.user.role } : u)));
      }
    } catch {} finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive: !isActive }),
      });
      if (res.ok) {
        const data = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isActive: data.user.isActive } : u)));
      }
    } catch {} finally {
      setActionLoading(null);
    }
  };

  const getRoleLevel = (role: string): number => {
    return ROLES[role as RoleKey]?.level ?? 0;
  };

  const canDemote = (targetRole: string): boolean => {
    if (!user) return false;
    const myLevel = getRoleLevel(user.role);
    const targetLevel = getRoleLevel(targetRole);
    return myLevel > targetLevel;
  };

  const getHigherRole = (currentRole: string): RoleKey | null => {
    const idx = roleKeys.indexOf(currentRole as RoleKey);
    if (idx < roleKeys.length - 1) return roleKeys[idx + 1];
    return null;
  };

  const getLowerRole = (currentRole: string): RoleKey | null => {
    const idx = roleKeys.indexOf(currentRole as RoleKey);
    if (idx > 0) return roleKeys[idx - 1];
    return null;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      create_user: "Création de compte",
      delete_user: "Suppression de compte",
      change_role: "Changement de rôle",
      toggle_active: "Activation/Désactivation",
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string): string => {
    const colors: Record<string, string> = {
      create_user: "#22c55e",
      delete_user: "#ef4444",
      change_role: "#3b82f6",
      toggle_active: "#f59e0b",
    };
    return colors[action] || "var(--text-muted)";
  };

  if (!user || !hasMinRole(user.role, "R-S")) {
    return null;
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "var(--text-primary)" }}>
        <Activity size={32} style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  const tabs = [
    { key: "chat" as const, label: "Chat", icon: MessageSquare },
    { key: "effectifs" as const, label: "Effectifs", icon: Users },
    { key: "actions" as const, label: "Actions", icon: Activity },
  ];

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
        <Shield size={28} style={{ color: "var(--accent)" }} />
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          Gestion du Staff
        </h1>
      </div>

      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.5rem", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "0.3rem" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              padding: "0.6rem 1rem",
              borderRadius: "8px",
              border: "none",
              background: activeTab === tab.key ? "var(--accent)" : "transparent",
              color: activeTab === tab.key ? "#fff" : "var(--text-secondary)",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "chat" && (
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", display: "flex", flexDirection: "column", height: "calc(100vh - 220px)", minHeight: "400px" }}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border-color)", background: "var(--bg-tertiary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <MessageSquare size={18} style={{ color: "var(--accent)" }} />
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Chat Staff</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "auto" }}>{messages.length} messages</span>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                Aucun message pour le moment.
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.user.id === user?.id;
                return (
                  <div key={msg.id} style={{ display: "flex", gap: "0.75rem", flexDirection: isMe ? "row-reverse" : "row" }}>
                    <div style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "var(--accent-light)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "var(--accent)",
                    }}>
                      {msg.user.avatar ? (
                        <img src={msg.user.avatar} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        msg.user.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div style={{ maxWidth: "70%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>{msg.user.username}</span>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{formatDate(msg.createdAt)}</span>
                      </div>
                      <div style={{
                        padding: "0.6rem 0.9rem",
                        borderRadius: "12px",
                        background: isMe ? "var(--accent)" : "var(--bg-tertiary)",
                        color: isMe ? "#fff" : "var(--text-primary)",
                        fontSize: "0.9rem",
                        lineHeight: 1.5,
                        borderTopLeftRadius: isMe ? "12px" : "4px",
                        borderTopRightRadius: isMe ? "4px" : "12px",
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border-color)", display: "flex", gap: "0.75rem" }}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
              placeholder="Écrire un message..."
              style={{
                flex: 1,
                padding: "0.65rem 1rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "var(--bg-tertiary)",
                color: "var(--text-primary)",
                fontSize: "0.9rem",
                outline: "none",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!chatInput.trim()}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.65rem 1rem",
                borderRadius: "8px",
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                cursor: chatInput.trim() ? "pointer" : "not-allowed",
                opacity: chatInput.trim() ? 1 : 0.5,
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {activeTab === "effectifs" && (
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "750px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)", background: "var(--bg-tertiary)" }}>
                  {["Membre", "Rôle", "Statut", "Dernière connexion", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "0.85rem 1rem", textAlign: "left", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const higher = getHigherRole(u.role);
                  const lower = getLowerRole(u.role);
                  const canUp = higher && canDemote(u.role) && getRoleLevel(u.role) < getRoleLevel(user?.role || "");
                  const canDown = lower && canDemote(u.role) && getRoleLevel(lower) >= getRoleLevel(user?.role || "") && getRoleLevel(u.role) > getRoleLevel(user?.role || "");
                  const isTargetHigher = getRoleLevel(u.role) >= getRoleLevel(user?.role || "");

                  return (
                    <tr
                      key={u.id}
                      style={{ borderBottom: i < users.length - 1 ? "1px solid var(--border-color)" : "none", transition: "background 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-tertiary)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "0.75rem 1rem", color: "var(--text-primary)", fontWeight: 500 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>
                            {u.avatar ? (
                              <img src={u.avatar} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                            ) : (
                              u.username.charAt(0).toUpperCase()
                            )}
                          </div>
                          {u.username}
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span style={{ padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 600, background: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--border-color)" }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 600, background: u.isActive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: u.isActive ? "#22c55e" : "#ef4444", border: `1px solid ${u.isActive ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}` }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: u.isActive ? "#22c55e" : "#ef4444" }} />
                          {u.isActive ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <Clock size={12} />
                          {u.lastLogin ? formatDate(u.lastLogin) : "Jamais"}
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ display: "flex", gap: "0.3rem" }}>
                          {canUp && higher && (
                            <button
                              onClick={() => handleRoleChange(u.id, higher)}
                              disabled={actionLoading === u.id}
                              title={`Promouvoir en ${higher}`}
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
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#22c55e")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                            >
                              <ArrowUp size={14} />
                            </button>
                          )}
                          {canDown && lower && (
                            <button
                              onClick={() => handleRoleChange(u.id, lower)}
                              disabled={actionLoading === u.id}
                              title={`Rétrograder en ${lower}`}
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
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#f59e0b")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                            >
                              <ArrowDown size={14} />
                            </button>
                          )}
                          {!isTargetHigher && (
                            <button
                              onClick={() => handleToggleActive(u.id, u.isActive)}
                              disabled={actionLoading === u.id}
                              title={u.isActive ? "Désactiver" : "Activer"}
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
                              onMouseEnter={(e) => (e.currentTarget.style.color = u.isActive ? "#ef4444" : "#22c55e")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                            >
                              {u.isActive ? <UserX size={14} /> : <Activity size={14} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "actions" && (
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)", background: "var(--bg-tertiary)" }}>
                  {["Date", "Action", "Détails"].map((h) => (
                    <th key={h} style={{ padding: "0.85rem 1rem", textAlign: "left", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staffActions.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                        <AlertTriangle size={20} />
                        Aucune action enregistrée. Les actions apparaîtront ici après création/modification/suppression de comptes.
                      </div>
                    </td>
                  </tr>
                ) : (
                  staffActions.map((a, i) => (
                    <tr
                      key={a.id}
                      style={{ borderBottom: i < staffActions.length - 1 ? "1px solid var(--border-color)" : "none", transition: "background 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-tertiary)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <Clock size={12} />
                          {formatDate(a.createdAt)}
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span style={{ padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 600, background: `${getActionColor(a.action)}20`, color: getActionColor(a.action), border: `1px solid ${getActionColor(a.action)}40` }}>
                          {getActionLabel(a.action)}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                        {a.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
