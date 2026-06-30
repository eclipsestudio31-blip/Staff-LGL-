"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { getRoleName } from "@/lib/roles";
import {
  Home, Calendar, Users, AlertTriangle, FileText, Eye, Clock,
  MessageSquare, Terminal, Car, Shield, Settings, LogOut, Search, ChevronLeft, ChevronRight, Zap, UserPlus, CalendarOff, ShieldAlert, Lock, Trophy
} from "lucide-react";
import { useState } from "react";

const navSections = [
  {
    title: "Général",
    items: [
      { href: "/", label: "Accueil", icon: Home },
      { href: "/planning", label: "Planning", icon: Calendar },
      { href: "/organigramme", label: "Organigramme", icon: Users },
      { href: "/service", label: "Service", icon: Clock },
      { href: "/classement-service", label: "Classement Service", icon: Trophy },
    ],
  },
  {
    title: "Staff",
    items: [
      { href: "/sanctions", label: "Sanctions", icon: AlertTriangle },
      { href: "/rapports", label: "Rapports", icon: FileText },
      { href: "/surveillance", label: "Surveillance", icon: Eye },
      { href: "/absences", label: "Absences", icon: CalendarOff },
      { href: "/permanence", label: "Permanence", icon: Shield },
      { href: "/gestion-comptes", label: "Gestion Comptes", icon: UserPlus, minRole: "A-T" },
      { href: "/gestion-staff", label: "Gestion Staff", icon: MessageSquare, minRole: "R-S" },
    ],
  },
  {
    title: "Outils",
    items: [
      { href: "/commandes-ig", label: "Commandes IG", icon: Terminal },
      { href: "/spawn-vl", label: "Spawn VL", icon: Car },
      { href: "/cheat", label: "Cheats", icon: Shield },
      { href: "/procedures", label: "Procédure Cheater", icon: ShieldAlert },
      { href: "/doorlock", label: "Doorlock", icon: Lock, minRole: "A-T" },
    ],
  },
  {
    title: "Système",
    items: [
      { href: "/admin", label: "Dashboard Admin", icon: Zap, minRole: "A-T" },
      { href: "/parametres", label: "Paramètres", icon: Settings },
    ],
  },
];

const ROLES: Record<string, { level: number }> = {
  "S-T": { level: 1 }, "S": { level: 2 }, "M-T": { level: 3 }, "M": { level: 4 },
  "A-T": { level: 5 }, "A": { level: 6 }, "R-S": { level: 7 }, "D": { level: 8 },
  "C-F": { level: 9 }, "F": { level: 10 },
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, setSearchOpen } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside style={{
      width: collapsed ? "72px" : "260px",
      minHeight: "100vh",
      background: "var(--bg-secondary)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      transition: "width 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      position: "sticky",
      top: 0,
      height: "100vh",
      zIndex: 40,
      flexShrink: 0,
    }}>
      <div style={{
        padding: collapsed ? "1.25rem 0.75rem" : "1.25rem 1.25rem",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        gap: "0.75rem",
        minHeight: "64px",
      }}>
        {!collapsed && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              overflow: "hidden",
              flexShrink: 0,
            }}>
              <img src="/images/lgl-logo.png" alt="LGL" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <div>
              <h1 style={{ fontSize: "0.9375rem", fontWeight: 700, lineHeight: 1.2 }}>Staff RP</h1>
              {user && (
                <p style={{
                  fontSize: "0.625rem",
                  color: "var(--text-muted)",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}>{getRoleName(user.role)}</p>
              )}
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            overflow: "hidden",
          }}>
            <img src="/images/lgl-logo.png" alt="LGL" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "0.375rem",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              transition: "all 0.15s",
            }}
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {collapsed && (
        <div style={{ padding: "0.75rem 0", display: "flex", justifyContent: "center" }}>
          <button
            onClick={() => setCollapsed(false)}
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "0.375rem",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {!collapsed && (
        <div style={{ padding: "0.75rem 1rem 0" }}>
          <button
            onClick={() => setSearchOpen(true)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 0.75rem",
              background: "var(--bg-primary)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "0.75rem",
              transition: "all 0.15s",
            }}
          >
            <Search size={13} />
            <span>Rechercher...</span>
            <span style={{
              marginLeft: "auto",
              fontSize: "0.625rem",
              background: "var(--bg-hover)",
              padding: "0.125rem 0.375rem",
              borderRadius: "4px",
              border: "1px solid var(--border)",
              fontFamily: "monospace",
            }}>Ctrl K</span>
          </button>
        </div>
      )}

      <nav style={{ flex: 1, padding: collapsed ? "0.5rem 0" : "0.5rem 0.75rem", overflowY: "auto", marginTop: "0.5rem" }}>
        {navSections.map((section) => {
          const visibleItems = section.items.filter((item) => {
            if (!item.minRole || !user) return true;
            const userLevel = ROLES[user.role]?.level ?? 0;
            const reqLevel = ROLES[item.minRole]?.level ?? 0;
            return userLevel >= reqLevel;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} style={{ marginBottom: "0.75rem" }}>
              {!collapsed && (
                <p style={{
                  fontSize: "0.625rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--text-muted)",
                  padding: "0.5rem 0.875rem 0.375rem",
                  opacity: 0.7,
                }}>{section.title}</p>
              )}
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link ${isActive ? "active" : ""}`}
                    style={{
                      marginBottom: "2px",
                      justifyContent: collapsed ? "center" : "flex-start",
                      padding: collapsed ? "0.625rem" : "0.5625rem 0.875rem",
                    }}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {user && (
        <div style={{
          padding: collapsed ? "0.75rem 0.5rem" : "0.75rem 1rem",
          borderTop: "1px solid var(--border)",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            padding: collapsed ? "0.5rem" : "0.5rem 0.625rem",
            borderRadius: "var(--radius-sm)",
            background: collapsed ? "transparent" : "var(--bg-primary)",
            border: collapsed ? "none" : "1px solid var(--border)",
          }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: user.avatar ? "transparent" : "linear-gradient(135deg, var(--accent), #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "white",
              flexShrink: 0,
              overflow: "hidden",
            }}>
              {user.avatar ? (
                <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
              ) : (
                user.username.charAt(0).toUpperCase()
              )}
            </div>
            {!collapsed && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    lineHeight: 1.2,
                  }}>{user.username}</p>
                </div>
                <button
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    window.location.href = "/login";
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: "0.25rem",
                    borderRadius: "4px",
                    display: "flex",
                    transition: "color 0.15s",
                  }}
                  title="Déconnexion"
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                >
                  <LogOut size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
