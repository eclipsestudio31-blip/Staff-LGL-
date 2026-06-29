"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Shield,
  Clock,
  FileText,
  AlertTriangle,
  Eye,
  Activity,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { hasMinRole } from "@/lib/roles";

interface Stats {
  totalMembres: number;
  membresEnService: number;
  tempsServiceTotal: number;
  rapports: number;
  sanctions: number;
  personnesSurveillees: number;
}

interface Report {
  id: string;
  type: string;
  nomPrenom?: string;
  bugName?: string;
  createdAt: string;
}

interface Sanction {
  id: string;
  infraction: string;
  sanction1: string;
  sanction2: string;
  sanction3: string;
  description?: string;
}

const reportTypeColors: Record<string, string> = {
  ban: "#ef4444",
  warn: "#f59e0b",
  jail: "#8b5cf6",
  tig: "#3b82f6",
  bug: "#22c55e",
};

const reportTypeLabels: Record<string, string> = {
  ban: "Ban",
  warn: "Warn",
  jail: "Jail",
  tig: "TIG",
  bug: "Bug",
};

export default function AdminPage() {
  const { user } = useAppStore();
  const [stats, setStats] = useState<Stats>({
    totalMembres: 0,
    membresEnService: 0,
    tempsServiceTotal: 0,
    rapports: 0,
    sanctions: 0,
    personnesSurveillees: 0,
  });
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [recentSanctions, setRecentSanctions] = useState<Sanction[]>([]);
  const [reportsByType, setReportsByType] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !hasMinRole(user.role, "A-T")) return;

    const fetchData = async () => {
      try {
        const [usersRes, reportsRes, serviceRes, surveillanceRes, sanctionsRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/reports"),
          fetch("/api/service"),
          fetch("/api/surveillance"),
          fetch("/api/sanctions"),
        ]);

        const usersData = await usersRes.json();
        const reportsData = await reportsRes.json();
        const serviceData = await serviceRes.json();
        const surveillanceData = await surveillanceRes.json();
        const sanctionsData = await sanctionsRes.json();

        const usersList = Array.isArray(usersData) ? usersData : usersData.users || [];
        const reportsList = Array.isArray(reportsData) ? reportsData : reportsData.reports || [];
        const serviceList = Array.isArray(serviceData) ? serviceData : serviceData.sessions || [];
        const surveillanceList = Array.isArray(surveillanceData) ? surveillanceData : surveillanceData.entries || [];
        const sanctionsList = Array.isArray(sanctionsData) ? sanctionsData : sanctionsData.sanctions || [];

        const activeSessions = serviceList.filter(
          (s: { isActive: boolean; endTime: string | null }) => s.isActive && !s.endTime
        );

        const totalHours = serviceList.reduce((acc: number, s: { duration: number | null }) => {
          if (s.duration) return acc + s.duration / 3600;
          return acc;
        }, 0);

        const byType: Record<string, number> = {};
        reportsList.forEach((r: Report) => {
          byType[r.type] = (byType[r.type] || 0) + 1;
        });

        setStats({
          totalMembres: usersList.length || 0,
          membresEnService: activeSessions.length,
          tempsServiceTotal: Math.round(totalHours * 10) / 10,
          rapports: reportsList.length || 0,
          sanctions: sanctionsList.length || 0,
          personnesSurveillees: surveillanceList.length || 0,
        });
        setRecentReports(reportsList.slice(0, 5));
        setRecentSanctions(sanctionsList.slice(0, 5));
        setReportsByType(byType);
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (!user || !hasMinRole(user.role, "A-T")) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: "1rem" }}>
        <Shield size={48} style={{ color: "#ef4444" }} />
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>Accès refusé</h1>
        <p style={{ color: "var(--text-muted)" }}>Vous n&apos;avez pas les permissions nécessaires.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Activity size={32} style={{ color: "var(--accent)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  const maxReportType = Math.max(...Object.values(reportsByType), 1);

  const statCards = [
    { icon: Users, value: stats.totalMembres, label: "Total membres", color: "var(--accent)" },
    { icon: Shield, value: stats.membresEnService, label: "Membres connectés", color: "#22c55e" },
    { icon: Clock, value: `${stats.tempsServiceTotal}h`, label: "Temps de service cumulé", color: "#8b5cf6" },
    { icon: FileText, value: stats.rapports, label: "Nombre de rapports", color: "#3b82f6" },
    { icon: AlertTriangle, value: stats.sanctions, label: "Nombre de sanctions", color: "#ef4444" },
    { icon: Eye, value: stats.personnesSurveillees, label: "Personnes surveillées", color: "#f59e0b" },
  ];

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <BarChart3 size={28} style={{ color: "var(--accent)" }} />
          Administration
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem" }}>
          Vue d&apos;ensemble du système
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
        {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: `${card.color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <card.icon size={22} style={{ color: card.color }} />
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
              {card.value}
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <FileText size={20} style={{ color: "#3b82f6" }} />
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              Derniers rapports
            </h2>
          </div>
          {recentReports.length === 0 ? (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Aucun rapport
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {recentReports.map((report) => (
                <div
                  key={report.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.6rem 0.75rem",
                    borderRadius: "8px",
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: reportTypeColors[report.type] || "var(--text-muted)" }} />
                    <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-primary)" }}>
                      {report.nomPrenom || report.bugName || report.type}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{
                      padding: "0.15rem 0.5rem",
                      borderRadius: "12px",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      background: `${reportTypeColors[report.type]}20`,
                      color: reportTypeColors[report.type],
                    }}>
                      {reportTypeLabels[report.type] || report.type}
                    </span>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {new Date(report.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <AlertTriangle size={20} style={{ color: "#ef4444" }} />
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              Dernières sanctions
            </h2>
          </div>
          {recentSanctions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Aucune sanction
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {recentSanctions.map((sanction) => (
                <div
                  key={sanction.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.6rem 0.75rem",
                    borderRadius: "8px",
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} />
                    <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-primary)" }}>
                      {sanction.infraction}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{
                      padding: "0.15rem 0.5rem",
                      borderRadius: "12px",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      background: "rgba(245,158,11,0.15)",
                      color: "#f59e0b",
                    }}>
                      {sanction.sanction1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <BarChart3 size={20} style={{ color: "var(--accent)" }} />
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
            Rapports par type
          </h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {Object.entries(reportsByType).map(([type, count]) => (
            <div key={type} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: "80px", display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: reportTypeColors[type] || "var(--text-muted)" }} />
                <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)" }}>
                  {reportTypeLabels[type] || type}
                </span>
              </div>
              <div style={{ flex: 1, height: "28px", background: "var(--bg-tertiary)", borderRadius: "6px", overflow: "hidden", position: "relative" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${(count / maxReportType) * 100}%`,
                    background: `${reportTypeColors[type] || "var(--accent)"}40`,
                    borderRadius: "6px",
                    transition: "width 0.6s ease",
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: reportTypeColors[type] || "var(--accent)" }}>
                    {count}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {Object.keys(reportsByType).length === 0 && (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Aucun rapport enregistré
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
