"use client";
import { useAppStore } from "@/lib/store";
import { useEffect, useState, useRef } from "react";
import { Search, X, Users, FileText, AlertTriangle, Shield, Terminal, Car, Eye, ArrowRight } from "lucide-react";
import Link from "next/link";

interface SearchResults {
  users: { id: string; username: string; role: string }[];
  reports: { id: string; type: string; nomPrenom: string; discord: string; raison: string; createdAt: string }[];
  sanctions: { id: string; infraction: string; sanction1: string }[];
  cheats: { id: string; name: string; description: string }[];
  commands: { id: string; name: string; category: string; description: string }[];
  vehicles: { id: string; name: string; category: string; command: string }[];
  surveillance: { id: string; nomPrenom: string; discord: string; status: string }[];
}

export default function SearchModal() {
  const { searchOpen, setSearchOpen } = useAppStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [searchOpen, setSearchOpen]);

  useEffect(() => {
    if (searchOpen) {
      setQuery("");
      setResults(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!query.trim()) { setResults(null); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results);
      } catch {}
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  if (!searchOpen) return null;

  const sections: { key: keyof SearchResults; label: string; icon: React.ElementType; color: string; render: (item: Record<string, unknown>) => { title: string; subtitle?: string; href: string } }[] = [
    { key: "users", label: "Utilisateurs", icon: Users, color: "var(--accent)", render: (u) => ({ title: u.username as string, subtitle: u.role as string, href: "/organigramme" }) },
    { key: "reports", label: "Rapports", icon: FileText, color: "var(--info)", render: (r) => ({ title: r.nomPrenom as string, subtitle: r.type as string, href: "/rapports" }) },
    { key: "sanctions", label: "Sanctions", icon: AlertTriangle, color: "var(--warning)", render: (s) => ({ title: s.infraction as string, subtitle: s.sanction1 as string, href: "/sanctions" }) },
    { key: "cheats", label: "Cheats", icon: Shield, color: "var(--danger)", render: (c) => ({ title: c.name as string, subtitle: c.description as string, href: "/cheat" }) },
    { key: "commands", label: "Commandes", icon: Terminal, color: "var(--success)", render: (c) => ({ title: c.name as string, subtitle: c.category as string, href: "/commandes-ig" }) },
    { key: "vehicles", label: "Véhicules", icon: Car, color: "#a78bfa", render: (v) => ({ title: v.name as string, subtitle: v.command as string, href: "/spawn-vl" }) },
    { key: "surveillance", label: "Surveillance", icon: Eye, color: "var(--danger)", render: (s) => ({ title: s.nomPrenom as string, subtitle: s.status as string, href: "/surveillance" }) },
  ];

  return (
    <div className="modal-overlay" onClick={() => setSearchOpen(false)}>
      <div style={{
        width: "100%",
        maxWidth: "580px",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
        boxShadow: "var(--shadow-lg)",
        animation: "slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "1rem 1.25rem",
          borderBottom: "1px solid var(--border)",
        }}>
          <Search size={18} style={{ color: "var(--accent)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            placeholder="Rechercher un utilisateur, rapport, commande..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: "0.9375rem",
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={() => setSearchOpen(false)}
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              padding: "0.25rem",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
            }}
          >
            <X size={14} />
          </button>
        </div>

        <div style={{ maxHeight: "60vh", overflowY: "auto", padding: "0.5rem" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.8125rem" }}>
              <div className="animate-spin" style={{
                width: "20px", height: "20px", border: "2px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", margin: "0 auto 0.75rem",
              }} />
              Recherche en cours...
            </div>
          )}

          {!loading && results && (() => {
            const total = sections.reduce((acc, s) => acc + ((results[s.key] as unknown[])?.length || 0), 0);
            if (total === 0) return (
              <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                <Search size={32} style={{ opacity: 0.2, margin: "0 auto 0.75rem" }} />
                <p style={{ fontSize: "0.8125rem" }}>Aucun résultat pour &ldquo;{query}&rdquo;</p>
              </div>
            );

            return sections.map((section) => {
              const items = results[section.key] as unknown as Record<string, unknown>[];
              if (!items || items.length === 0) return null;
              const Icon = section.icon;

              return (
                <div key={section.key} style={{ marginBottom: "0.5rem" }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    padding: "0.5rem 0.75rem",
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--text-muted)",
                  }}>
                    <Icon size={11} style={{ color: section.color }} />
                    {section.label}
                    <span style={{
                      marginLeft: "0.25rem",
                      background: "var(--bg-hover)",
                      padding: "0.0625rem 0.375rem",
                      borderRadius: "100px",
                      fontSize: "0.5625rem",
                    }}>{items.length}</span>
                  </div>
                  {items.slice(0, 5).map((item) => {
                    const { title, subtitle, href } = section.render(item);
                    return (
                      <Link
                        key={item.id as string}
                        href={href}
                        onClick={() => setSearchOpen(false)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "var(--radius-xs)",
                          textDecoration: "none",
                          color: "var(--text-primary)",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <span style={{ fontWeight: 500, fontSize: "0.8125rem", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
                        {subtitle && (
                          <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", flexShrink: 0 }}>{subtitle}</span>
                        )}
                        <ArrowRight size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                      </Link>
                    );
                  })}
                </div>
              );
            });
          })()}

          {!results && !loading && (
            <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
              <Search size={32} style={{ opacity: 0.15, margin: "0 auto 0.75rem" }} />
              <p style={{ fontSize: "0.8125rem", marginBottom: "0.25rem" }}>Tapez pour rechercher</p>
              <p style={{ fontSize: "0.6875rem", opacity: 0.6 }}>Utilisateurs, rapports, sanctions, commandes...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
