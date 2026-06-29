"use client";
import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { getRoleName } from "@/lib/roles";
import { Users, FileText, AlertTriangle, Eye, Clock, Activity, Shield } from "lucide-react";

interface Stats {
  totalUsers: number;
  activeServices: number;
  totalReports: number;
  totalSanctions: number;
  totalSurveillance: number;
  totalServiceTime: number;
  activeSessionUsers: { username: string; role: string; startTime: string }[];
}

export default function HomePage() {
  const { user } = useAppStore();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, reportsRes, serviceRes, sanctionsRes, survRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/reports"),
          fetch("/api/service"),
          fetch("/api/sanctions"),
          fetch("/api/surveillance"),
        ]);

        const usersData = await usersRes.json();
        const reportsData = await reportsRes.json();
        const serviceData = await serviceRes.json();
        const sanctionsData = await sanctionsRes.json();
        const survData = await survRes.json();

        const activeSessions = (serviceData.sessions || []).filter((s: { isActive: boolean }) => s.isActive);
        const totalTime = (serviceData.sessions || [])
          .filter((s: { duration: number | null }) => s.duration)
          .reduce((acc: number, s: { duration: number }) => acc + s.duration, 0);

        setStats({
          totalUsers: (usersData.users || []).length,
          activeServices: activeSessions.length,
          totalReports: (reportsData.reports || []).length,
          totalSanctions: (sanctionsData.sanctions || []).length,
          totalSurveillance: (survData.entries || []).length,
          totalServiceTime: totalTime,
          activeSessionUsers: activeSessions.map((s: { user: { username: string; role: string }; startTime: string }) => ({
            username: s.user.username,
            role: s.user.role,
            startTime: s.startTime,
          })),
        });
      } catch {}
    };
    fetchStats();
  }, []);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const statCards = [
    { label: "Membres", value: stats?.totalUsers ?? 0, icon: Users, color: "var(--accent)", bg: "var(--accent-subtle)" },
    { label: "En service", value: stats?.activeServices ?? 0, icon: Clock, color: "var(--success)", bg: "var(--success-bg)" },
    { label: "Rapports", value: stats?.totalReports ?? 0, icon: FileText, color: "var(--info)", bg: "var(--info-bg)" },
    { label: "Sanctions", value: stats?.totalSanctions ?? 0, icon: AlertTriangle, color: "var(--warning)", bg: "var(--warning-bg)" },
    { label: "Surveillés", value: stats?.totalSurveillance ?? 0, icon: Eye, color: "var(--danger)", bg: "var(--danger-bg)" },
    { label: "Temps total", value: formatDuration(stats?.totalServiceTime ?? 0), icon: Activity, color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
  ];

  const greetings = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bonjour";
    if (h < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <img src="/images/lgl-logo.png" alt="LGL" style={{ width: "56px", height: "56px", objectFit: "contain", flexShrink: 0 }} />
          <div>
            <h1 style={{ fontSize: "1.75rem" }}>
              {greetings()}, <span style={{ color: "var(--accent)" }}>{user?.username}</span>
            </h1>
            <p>Voici un aperçu de l&apos;activité du staff</p>
          </div>
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 1rem",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          fontSize: "0.8125rem",
          color: "var(--text-secondary)",
        }}>
          <Shield size={14} style={{ color: "var(--accent)" }} />
          {user ? getRoleName(user.role) : ""}
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: "0.75rem",
        marginBottom: "1.5rem",
      }}>
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="stat-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: card.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Icon size={18} style={{ color: card.color }} />
                </div>
              </div>
              <p style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                fontVariantNumeric: "tabular-nums",
              }}>{card.value}</p>
              <p style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                fontWeight: 500,
                marginTop: "0.125rem",
              }}>{card.label}</p>
            </div>
          );
        })}
      </div>

      {stats && stats.activeSessionUsers.length > 0 && (
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <div style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "var(--success)",
              animation: "pulse 2s infinite",
            }} />
            <h3 style={{ fontSize: "0.875rem", fontWeight: 700 }}>Membres en service</h3>
            <span className="badge badge-success" style={{ marginLeft: "0.25rem" }}>{stats.activeServices}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.5rem" }}>
            {stats.activeSessionUsers.map((m, i) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                padding: "0.625rem 0.875rem",
                background: "var(--bg-primary)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
              }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "white",
                  flexShrink: 0,
                }}>
                  {m.username.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.username}</p>
                  <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{getRoleName(m.role)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!stats || stats.activeSessionUsers.length === 0) && (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <Activity size={40} style={{ color: "var(--text-muted)", opacity: 0.3, margin: "0 auto 1rem" }} />
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Aucun membre en service actuellement</p>
        </div>
      )}
    </div>
  );
}
