"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import {
  Lock,
  Search,
  Eye,
  EyeOff,
  Shield,
  ChevronDown,
  X,
} from "lucide-react";

interface DoorLock {
  id: number;
  name: string;
  state: number;
  passcode: string | null;
  groups: Record<string, number> | string;
  maxDistance: number;
  coords?: { x: number; y: number; z: number };
}

const ALL_GROUPS = [
  "police", "gendarmerie", "municipale", "vigne", "dir", "gouvernement",
  "banks", "pompier", "tribunal", "pizzathis", "stanauto", "municipales",
  "autosud", "cardealer", "nightclub", "ambulancesandy", "autovert",
  "realestateagent", "roiburger", "samu", "police national",
];

const groupBadgeColors: Record<string, string> = {
  police: "#3b82f6",
  gendarmerie: "#8b5cf6",
  municipale: "#06b6d4",
  vigne: "#a855f7",
  dir: "#f59e0b",
  gouvernement: "#ef4444",
  banks: "#22c55e",
  pompier: "#f97316",
  tribunal: "#6366f1",
  pizzathis: "#ec4899",
  stanauto: "#14b8a6",
  autosud: "#10b981",
  cardealer: "#0ea5e9",
  nightclub: "#d946ef",
  ambulancesandy: "#f43f5e",
  autovert: "#84cc16",
  realestateagent: "#fbbf24",
  roiburger: "#fb923c",
  samu: "#dc2626",
};

export default function DoorlockPage() {
  const { user } = useAppStore();
  const [doors, setDoors] = useState<DoorLock[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("");
  const [revealedCodes, setRevealedCodes] = useState<Record<number, string>>({});
  const [showModal, setShowModal] = useState<number | null>(null);
  const [discordInput, setDiscordInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const fetchDoors = useCallback(async () => {
    try {
      const res = await fetch("/api/doorlocks");
      if (!res.ok) {
        setDoors([]);
        return;
      }
      const text = await res.text();
      if (!text) {
        setDoors([]);
        return;
      }
      const data = JSON.parse(text);
      setDoors(data.doors || []);
    } catch (err) {
      console.error("Failed to fetch doorlocks:", err);
      setDoors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoors();
  }, [fetchDoors]);

  const filteredDoors = useMemo(() => {
    let result = doors;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((d) => d.name.toLowerCase().includes(q));
    }
    if (groupFilter) {
      result = result.filter((d) => {
        const g = d.groups;
        if (!g || typeof g !== "object") return false;
        return groupFilter in (g as Record<string, unknown>);
      });
    }
    return result;
  }, [doors, search, groupFilter]);

  const handleReveal = async (doorId: number) => {
    if (revealedCodes[doorId]) {
      setRevealedCodes((prev) => {
        const next = { ...prev };
        delete next[doorId];
        return next;
      });
      return;
    }

    if (user?.discordId) {
      setVerifying(true);
      setVerifyError("");
      try {
        const res = await fetch("/api/doorlocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ doorlockId: doorId, discordId: user.discordId }),
        });
        const data = await res.json();
        if (res.ok) {
          setRevealedCodes((prev) => ({ ...prev, [doorId]: data.passcode }));
        } else {
          setVerifyError(data.error || "Erreur");
        }
      } catch {
        setVerifyError("Erreur réseau");
      } finally {
        setVerifying(false);
      }
    } else {
      setShowModal(doorId);
      setDiscordInput("");
      setVerifyError("");
    }
  };

  const handleModalSubmit = async () => {
    if (!discordInput.trim() || !showModal) return;
    setVerifying(true);
    setVerifyError("");
    try {
      const res = await fetch("/api/doorlocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doorlockId: showModal, discordId: discordInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setRevealedCodes((prev) => ({ ...prev, [showModal]: data.passcode }));
        setShowModal(null);
      } else {
        setVerifyError(data.error || "Erreur");
      }
    } catch {
      setVerifyError("Erreur réseau");
    } finally {
      setVerifying(false);
    }
  };

  const parseGroups = (groups: Record<string, number> | string): string[] => {
    if (typeof groups === "string") {
      try {
        groups = JSON.parse(groups);
      } catch {
        return [];
      }
    }
    if (groups && typeof groups === "object") {
      return Object.keys(groups);
    }
    return [];
  };

  const usedGroups = Array.from(
    new Set(doors.flatMap((d) => parseGroups(d.groups)))
  ).sort();

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <Lock size={28} style={{ color: "var(--accent)" }} />
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700 }}>Doorlock</h1>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Base de données des portes ox_doorlock. Les codes sont masqués par défaut.
        </p>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div style={{
          flex: 1,
          minWidth: "250px",
          position: "relative",
        }}>
          <Search size={16} style={{
            position: "absolute",
            left: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
          }} />
          <input
            type="text"
            placeholder="Rechercher une porte..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.625rem 0.75rem 0.625rem 2.25rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              background: "var(--bg-primary)",
              color: "var(--text-primary)",
              fontSize: "0.875rem",
              outline: "none",
            }}
          />
        </div>

        <div style={{ position: "relative", minWidth: "180px" }}>
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            style={{
              width: "100%",
              padding: "0.625rem 2rem 0.625rem 0.75rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              background: "var(--bg-primary)",
              color: "var(--text-primary)",
              fontSize: "0.875rem",
              appearance: "none",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="">Tous les groupes</option>
            {usedGroups.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <ChevronDown size={16} style={{
            position: "absolute",
            right: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
            pointerEvents: "none",
          }} />
        </div>
      </div>

      <div style={{
        background: "var(--bg-secondary)",
        borderRadius: "var(--radius)",
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            Chargement...
          </div>
        ) : filteredDoors.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            Aucune porte trouvée
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Nom</th>
                  <th style={thStyle}>Groupe(s)</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Distance</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Position</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Code</th>
                </tr>
              </thead>
              <tbody>
                {filteredDoors.map((door) => {
                  const groups = parseGroups(door.groups);
                  const isRevealed = door.id in revealedCodes;
                  const code = revealedCodes[door.id];

                  return (
                    <tr
                      key={door.id}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={tdStyle}>{door.id}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{door.name}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                          {groups.map((g) => (
                            <span
                              key={g}
                              style={{
                                padding: "0.125rem 0.5rem",
                                borderRadius: "9999px",
                                fontSize: "0.6875rem",
                                fontWeight: 600,
                                background: `${groupBadgeColors[g] || "#6b7280"}22`,
                                color: groupBadgeColors[g] || "#6b7280",
                                border: `1px solid ${groupBadgeColors[g] || "#6b7280"}44`,
                              }}
                            >
                              {g}
                            </span>
                          ))}
                          {groups.length === 0 && (
                            <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                              Aucun
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>{door.maxDistance}</td>
                      <td style={{ ...tdStyle, textAlign: "center", fontFamily: "monospace", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {door.coords ? `${door.coords.x}, ${door.coords.y}, ${door.coords.z}` : "—"}
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        {door.passcode ? (
                          <button
                            onClick={() => handleReveal(door.id)}
                            disabled={verifying}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.375rem",
                              padding: "0.25rem 0.625rem",
                              borderRadius: "var(--radius-sm)",
                              border: `1px solid ${isRevealed ? "#22c55e44" : "var(--border)"}`,
                              background: isRevealed ? "#22c55e15" : "var(--bg-primary)",
                              color: isRevealed ? "#22c55e" : "var(--text-muted)",
                              cursor: "pointer",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              fontFamily: "monospace",
                              transition: "all 0.15s",
                            }}
                          >
                            {isRevealed ? (
                              <>
                                <Eye size={13} />
                                {code}
                              </>
                            ) : (
                              <>
                                <EyeOff size={13} />
                                ••••••
                              </>
                            )}
                          </button>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{
        marginTop: "1rem",
        padding: "0.75rem 1rem",
        background: "var(--bg-secondary)",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border)",
        fontSize: "0.8125rem",
        color: "var(--text-muted)",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
      }}>
        <Shield size={14} />
        {filteredDoors.length} / {doors.length} porte(s). Codes masqués — entrez votre ID Discord pour les consulter.
      </div>

      {showModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
        }}>
          <div style={{
            background: "var(--bg-secondary)",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            padding: "2rem",
            width: "400px",
            maxWidth: "90vw",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>ID Discord requis</h2>
              <button
                onClick={() => setShowModal(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "0.25rem",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1rem" }}>
              Entrez votre ID Discord pour révéler le code de cette porte.
            </p>

            <input
              type="text"
              placeholder="Ex: 698156151765991495"
              value={discordInput}
              onChange={(e) => setDiscordInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleModalSubmit()}
              style={{
                width: "100%",
                padding: "0.625rem 0.75rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
                outline: "none",
                marginBottom: "1rem",
                fontFamily: "monospace",
              }}
            />

            {verifyError && (
              <p style={{ color: "#ef4444", fontSize: "0.8125rem", marginBottom: "1rem" }}>
                {verifyError}
              </p>
            )}

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowModal(null)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleModalSubmit}
                disabled={!discordInput.trim() || verifying}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: "var(--accent)",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  opacity: !discordInput.trim() || verifying ? 0.5 : 1,
                }}
              >
                {verifying ? "Vérification..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  textAlign: "left",
  fontWeight: 700,
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--text-muted)",
  borderBottom: "1px solid var(--border)",
};

const tdStyle: React.CSSProperties = {
  padding: "0.625rem 1rem",
  verticalAlign: "middle",
};
