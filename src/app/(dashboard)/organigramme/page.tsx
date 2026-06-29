"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, Users, Shield, Calendar, Circle } from "lucide-react";
import { ROLES, getRoleName, type RoleKey } from "@/lib/roles";

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

interface User {
  id: string;
  username: string;
  role: string;
  avatar?: string;
  joinDate?: string;
  isActive?: boolean;
}

export default function OrganigrammePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : data.users || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      u.username.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, User[]> = {};
    ROLE_ORDER.forEach((r) => (groups[r] = []));
    filteredUsers.forEach((u) => {
      const key = u.role as RoleKey;
      if (groups[key]) groups[key].push(u);
      else {
        if (!groups["other"]) groups["other"] = [];
        groups["other"].push(u);
      }
    });
    return groups;
  }, [filteredUsers]);

  const getInitial = (name: string) => name.charAt(0).toUpperCase();
  const getRoleColor = (role: string) => ROLE_COLORS[role] ?? "#747d8c";

  const formatDate = (date?: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  return (
    <div style={{ padding: "2rem", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Users size={28} style={{ color: "var(--accent)" }} />
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Organigramme</h1>
        </div>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <Search size={18} style={{ position: "absolute", left: "12px", color: "var(--text-muted)", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Rechercher un membre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "0.6rem 1rem 0.6rem 2.5rem", borderRadius: "8px",
              border: "1px solid var(--border-color)", background: "var(--bg-tertiary)",
              color: "var(--text-primary)", fontSize: "0.9rem", outline: "none", width: "280px",
            }}
          />
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
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                  {members.map((user) => (
                    <div
                      key={user.id}
                      style={{
                        background: "var(--bg-secondary)", border: "1px solid var(--border-color)",
                        borderRadius: "12px", padding: "1.25rem", display: "flex", flexDirection: "column",
                        gap: "0.75rem", transition: "transform 0.2s, box-shadow 0.2s", cursor: "default",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{
                          width: "48px", height: "48px", borderRadius: "50%", background: color,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "1.1rem", fontWeight: 700, color: "#fff", flexShrink: 0, overflow: "hidden",
                        }}>
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.username} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                          ) : (
                            getInitial(user.username)
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {user.username}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.3rem" }}>
                            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: user.isActive ? "#2ed573" : "var(--text-muted)" }} />
                            <span style={{ fontSize: "0.75rem", color: user.isActive ? "#2ed573" : "var(--text-muted)" }}>
                              {user.isActive ? "Actif" : "Inactif"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {filteredUsers.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "3rem" }}>Aucun membre trouvé.</div>
          )}
        </div>
      )}
    </div>
  );
}
