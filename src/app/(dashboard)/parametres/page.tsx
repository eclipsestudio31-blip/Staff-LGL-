"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  User,
  Palette,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Image,
  Monitor,
  Sun,
  Contrast,
  Type,
  LogOut,
  Check,
  X,
  Activity,
  Globe,
  Bell,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { hasMinRole } from "@/lib/roles";

interface LoginEntry {
  date: string;
  ip: string;
  userAgent: string;
  action: string;
}

const themes = [
  { id: "dark" as const, label: "Sombre", icon: Monitor },
  { id: "light" as const, label: "Clair", icon: Sun },
  { id: "high-contrast" as const, label: "Contraste élevé", icon: Contrast },
];

const fontSizes = [
  { id: "normal" as const, label: "Normal" },
  { id: "large" as const, label: "Grand" },
  { id: "x-large" as const, label: "Très grand" },
];

export default function ParametresPage() {
  const { theme, setTheme, user, setUser, notifSound, setNotifSound } = useAppStore();

  const allTabs = [
    { id: "profil", label: "Profil", icon: User },
    { id: "accessibilite", label: "Accessibilité", icon: Palette },
    { id: "securite", label: "Sécurité", icon: ShieldCheck },
    { id: "webhooks", label: "Webhooks", icon: Globe, minRole: "A" },
  ];

  const tabs = allTabs.filter((tab) => {
    if (!tab.minRole || !user) return true;
    return hasMinRole(user.role, tab.minRole);
  });

  const [activeTab, setActiveTab] = useState("profil");
  const [pendingTheme, setPendingTheme] = useState(theme);
  const [pendingNotifSound, setPendingNotifSound] = useState(notifSound);
  const [prefsSaved, setPrefsSaved] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || "");
  const [avatarSaved, setAvatarSaved] = useState(false);

  const [discordId, setDiscordId] = useState(user?.discordId || "");
  const [discordIdSaved, setDiscordIdSaved] = useState(false);

  const [loginHistory, setLoginHistory] = useState<LoginEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [webhooks, setWebhooks] = useState({
    webhook_rapport_ban: "",
    webhook_rapport_warn: "",
    webhook_rapport_jail: "",
    webhook_rapport_tig: "",
    webhook_rapport_bug: "",
    webhook_rapport_remboursement: "",
    webhook_rapport_remboursement_effectue: "",
    webhook_absence: "",
    webhook_surveillance: "",
    webhook_permanence: "",
    webhook_doorlock: "",
    webhook_service: "",
    webhook_service_semaine: "",
    webhook_bda: "",
    webhook_account_log: "",
  });
  const [webhooksSaved, setWebhooksSaved] = useState(false);
  const [webhooksLoading, setWebhooksLoading] = useState(false);

  useEffect(() => {
    if (user?.avatar) setAvatarUrl(user.avatar);
    if (user?.discordId) setDiscordId(user.discordId);
  }, [user?.avatar, user?.discordId]);

  useEffect(() => {
    setPendingTheme(theme);
    setPendingNotifSound(notifSound);
  }, [theme, notifSound]);

  useEffect(() => {
    if (activeTab === "securite") {
      setHistoryLoading(true);
      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((data) => {
          if (data.user?.loginHistory) {
            setLoginHistory(data.user.loginHistory);
          }
        })
        .catch(() => {})
        .finally(() => setHistoryLoading(false));
    }
    if (activeTab === "webhooks") {
      fetch("/api/webhooks")
        .then((r) => r.json())
        .then((data) => {
          if (data.webhooks) setWebhooks(data.webhooks);
        })
        .catch(() => {});
    }
  }, [activeTab]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Les mots de passe ne correspondent pas" });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMsg({ type: "success", text: "Mot de passe modifié avec succès" });
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMsg({ type: "error", text: data.error || "Erreur lors de la modification" });
      }
    } catch {
      setPasswordMsg({ type: "error", text: "Erreur serveur" });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarSave = async () => {
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: avatarUrl || null }),
      });
      if (res.ok) {
        const data = await res.json();
        if (user) {
          setUser({ ...user, avatar: data.user.avatar });
        }
      }
    } catch {}
    setAvatarSaved(true);
    setTimeout(() => setAvatarSaved(false), 2000);
  };

  const handleDiscordIdSave = async () => {
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId: discordId || null }),
      });
      if (res.ok) {
        const data = await res.json();
        if (user) {
          setUser({ ...user, discordId: data.user.discordId });
        }
      }
    } catch {}
    setDiscordIdSaved(true);
    setTimeout(() => setDiscordIdSaved(false), 2000);
  };

  const handleLogoutAll = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {}
  };

  const handleSavePrefs = () => {
    setTheme(pendingTheme);
    setNotifSound(pendingNotifSound);
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2000);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.6rem 0.8rem",
    borderRadius: "8px",
    border: "1px solid var(--border-color)",
    background: "var(--bg-tertiary)",
    color: "var(--text-primary)",
    fontSize: "0.9rem",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "var(--text-secondary)",
    marginBottom: "0.3rem",
    display: "block",
  };

  const passwordRequirements = [
    { label: "16 caractères minimum", test: (p: string) => p.length >= 16 },
    { label: "Une majuscule", test: (p: string) => /[A-Z]/.test(p) },
    { label: "Une minuscule", test: (p: string) => /[a-z]/.test(p) },
    { label: "Un chiffre", test: (p: string) => /[0-9]/.test(p) },
    { label: "Un caractère spécial", test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
  ];

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
        <Settings size={28} style={{ color: "var(--accent)" }} />
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          Paramètres
        </h1>
      </div>

      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "2rem", background: "var(--bg-secondary)", borderRadius: "12px", padding: "0.3rem", width: "fit-content" }}>
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
                padding: "0.6rem 1.2rem",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 600,
                background: isActive ? "var(--accent)" : "transparent",
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

      {activeTab === "profil" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <Image size={20} style={{ color: "var(--accent)" }} />
              <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                Avatar
              </h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--bg-tertiary)", border: "2px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <User size={32} style={{ color: "var(--text-muted)" }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: "250px" }}>
                <label style={labelStyle}>URL de l'avatar</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="url"
                    placeholder="https://example.com/avatar.png"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    style={inputStyle}
                  />
                  <button
                    onClick={handleAvatarSave}
                    style={{
                      padding: "0.6rem 1rem",
                      borderRadius: "8px",
                      border: "none",
                      background: avatarSaved ? "#22c55e" : "var(--accent)",
                      color: "#fff",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      whiteSpace: "nowrap",
                      transition: "background 0.2s",
                    }}
                  >
                    {avatarSaved ? <Check size={14} /> : null}
                    {avatarSaved ? "Sauvegardé" : "Sauvegarder"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <Globe size={20} style={{ color: "var(--accent)" }} />
              <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                ID Discord
              </h2>
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0 0 1rem 0" }}>
              Ton ID Discord pour être mentionné(e) dans les notifications webhook. Tu peux le trouver en activant le mode développeur Discord et en cliquant sur ton profil.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Ex: 123456789012345678"
                value={discordId}
                onChange={(e) => setDiscordId(e.target.value)}
                style={{ ...inputStyle, maxWidth: "350px" }}
              />
              <button
                onClick={handleDiscordIdSave}
                style={{
                  padding: "0.6rem 1rem",
                  borderRadius: "8px",
                  border: "none",
                  background: discordIdSaved ? "#22c55e" : "var(--accent)",
                  color: "#fff",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  whiteSpace: "nowrap",
                  transition: "background 0.2s",
                }}
              >
                {discordIdSaved ? <Check size={14} /> : null}
                {discordIdSaved ? "Sauvegardé" : "Sauvegarder"}
              </button>
            </div>
          </div>

          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <Lock size={20} style={{ color: "var(--accent)" }} />
              <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                Changer le mot de passe
              </h2>
            </div>

            <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Mot de passe actuel</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showOld ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    style={{ ...inputStyle, paddingRight: "2.5rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(!showOld)}
                    style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0 }}
                  >
                    {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Nouveau mot de passe</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={{ ...inputStyle, paddingRight: "2.5rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0 }}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Confirmer le mot de passe</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{ ...inputStyle, paddingRight: "2.5rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0 }}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ background: "var(--bg-tertiary)", borderRadius: "8px", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                  Exigences du mot de passe :
                </span>
                {passwordRequirements.map((req) => (
                  <div key={req.label} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem" }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: req.test(newPassword) ? "#22c55e" : "var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {req.test(newPassword) ? <Check size={10} style={{ color: "#fff" }} /> : <X size={10} style={{ color: "var(--text-muted)" }} />}
                    </div>
                    <span style={{ color: req.test(newPassword) ? "#22c55e" : "var(--text-muted)" }}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>

              {passwordMsg && (
                <div style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  background: passwordMsg.type === "success" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                  color: passwordMsg.type === "success" ? "#22c55e" : "#ef4444",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  border: `1px solid ${passwordMsg.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                }}>
                  {passwordMsg.text}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  disabled={passwordLoading || !oldPassword || !newPassword || !confirmPassword}
                  style={{
                    padding: "0.6rem 1.5rem",
                    borderRadius: "8px",
                    border: "none",
                    background: "var(--accent)",
                    color: "#fff",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: passwordLoading ? "not-allowed" : "pointer",
                    opacity: passwordLoading || !oldPassword || !newPassword || !confirmPassword ? 0.5 : 1,
                  }}
                >
                  {passwordLoading ? "Modification..." : "Modifier le mot de passe"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === "accessibilite" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <Palette size={20} style={{ color: "var(--accent)" }} />
              <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                Thème
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
              {themes.map((t) => {
                const Icon = t.icon;
                const isActive = pendingTheme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setPendingTheme(t.id)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "1.25rem",
                      borderRadius: "10px",
                      border: `2px solid ${isActive ? "var(--accent)" : "var(--border-color)"}`,
                      background: isActive ? "var(--accent-light)" : "var(--bg-tertiary)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <Icon size={24} style={{ color: isActive ? "var(--accent)" : "var(--text-muted)" }} />
                    <span style={{ fontSize: "0.9rem", fontWeight: 600, color: isActive ? "var(--accent)" : "var(--text-secondary)" }}>
                      {t.label}
                    </span>
                    {isActive && (
                      <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Check size={12} style={{ color: "#fff" }} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <Bell size={20} style={{ color: "var(--accent)" }} />
              <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                Son de notification
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
              {([
                { id: "classic" as const, label: "Classique", desc: "Beep aigu" },
                { id: "ding" as const, label: "Double Ding", desc: "Deux notes" },
                { id: "none" as const, label: "Aucun", desc: "Pas de son" },
              ]).map((s) => {
                const isActive = pendingNotifSound === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setPendingNotifSound(s.id)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "1.25rem",
                      borderRadius: "10px",
                      border: `2px solid ${isActive ? "var(--accent)" : "var(--border-color)"}`,
                      background: isActive ? "var(--accent-light)" : "var(--bg-tertiary)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <Bell size={24} style={{ color: isActive ? "var(--accent)" : "var(--text-muted)" }} />
                    <span style={{ fontSize: "0.9rem", fontWeight: 600, color: isActive ? "var(--accent)" : "var(--text-secondary)" }}>
                      {s.label}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {s.desc}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (s.id !== "none") {
                          const audio = new Audio(`/sounds/${s.id}.mp3`);
                          audio.volume = 0.5;
                          audio.play().catch(() => {});
                        }
                      }}
                      style={{
                        padding: "0.3rem 0.8rem",
                        borderRadius: "6px",
                        border: "1px solid var(--border-color)",
                        background: "var(--bg-primary)",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-color)")}
                    >
                      ▶ Aperçu
                    </button>
                    {isActive && (
                      <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Check size={12} style={{ color: "#fff" }} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleSavePrefs}
              disabled={pendingTheme === theme && pendingNotifSound === notifSound}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.65rem 1.5rem",
                borderRadius: "8px",
                border: "none",
                background: prefsSaved ? "#22c55e" : "var(--accent)",
                color: "#fff",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: pendingTheme === theme && pendingNotifSound === notifSound ? "not-allowed" : "pointer",
                opacity: pendingTheme === theme && pendingNotifSound === notifSound ? 0.5 : 1,
                transition: "background 0.2s",
              }}
            >
              {prefsSaved ? <Check size={16} /> : null}
              {prefsSaved ? "Préférences enregistrées" : "Enregistrer mes préférences"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "securite" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <ShieldCheck size={20} style={{ color: "var(--accent)" }} />
                <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                  Historique des connexions
                </h2>
              </div>
              <button
                onClick={handleLogoutAll}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid #ef4444",
                  background: "rgba(239,68,68,0.1)",
                  color: "#ef4444",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
              >
                <LogOut size={14} />
                Déconnexion de tous les appareils
              </button>
            </div>

            {historyLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "2rem", color: "var(--text-muted)" }}>
                <Activity size={24} style={{ animation: "spin 1s linear infinite" }} />
              </div>
            ) : loginHistory.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Aucun historique de connexion disponible
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                      {["Date", "Adresse IP", "User Agent", "Action"].map((h) => (
                        <th
                          key={h}
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
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loginHistory.map((entry, i) => (
                      <tr
                        key={i}
                        style={{ borderBottom: i < loginHistory.length - 1 ? "1px solid var(--border-color)" : "none" }}
                      >
                        <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                          {new Date(entry.date).toLocaleString("fr-FR")}
                        </td>
                        <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                          {entry.ip}
                        </td>
                        <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "var(--text-muted)", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {entry.userAgent}
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <span style={{
                            padding: "0.2rem 0.6rem",
                            borderRadius: "20px",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            background: entry.action === "login" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                            color: entry.action === "login" ? "#22c55e" : "#ef4444",
                            border: `1px solid ${entry.action === "login" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                          }}>
                            {entry.action === "login" ? "Connexion" : "Déconnexion"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "webhooks" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <Globe size={20} style={{ color: "var(--accent)" }} />
              <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                Webhooks Discord
              </h2>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 1.5rem 0" }}>
              Configurez les URLs des webhooks Discord pour recevoir les notifications automatiques.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                { key: "webhook_rapport_ban", label: "Rapport Ban", desc: "Nouveau rapport de ban" },
                { key: "webhook_rapport_warn", label: "Rapport Warn", desc: "Nouveau rapport de warn" },
                { key: "webhook_rapport_jail", label: "Rapport Jail", desc: "Nouveau rapport de jail" },
                { key: "webhook_rapport_tig", label: "Rapport TIG", desc: "Nouveau rapport de TIG" },
                { key: "webhook_rapport_bug", label: "Rapport Bug", desc: "Nouveau rapport de bug" },
                { key: "webhook_rapport_remboursement", label: "Demande de remboursement", desc: "Nouvelle demande de remboursement" },
                { key: "webhook_rapport_remboursement_effectue", label: "Remboursement effectué", desc: "Remboursement validé et effectué" },
                { key: "webhook_doorlock", label: "Doorlock", desc: "Consultation de code de porte" },
                { key: "webhook_service", label: "Service", desc: "Prise et fin de service" },
                { key: "webhook_service_semaine", label: "Service Semaine", desc: "Bilan service de la semaine" },
                { key: "webhook_bda", label: "Gestion BDA", desc: "Nouvelle personne en attente" },
                { key: "webhook_account_log", label: "Log Comptes", desc: "Création et suppression de comptes" },
                { key: "webhook_absence", label: "Absences", desc: "Déclaration d'absence" },
                { key: "webhook_surveillance", label: "Surveillance", desc: "Nouvelle mise en surveillance" },
                { key: "webhook_permanence", label: "Permanence", desc: "Prise de permanence" },
              ].map((wh) => (
                <div key={wh.key} style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "0.875rem", borderRadius: "8px", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.15rem" }}>{wh.label}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{wh.desc}</div>
                  </div>
                  <input
                    type="url"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={(webhooks as Record<string, string>)[wh.key] || ""}
                    onChange={(e) => setWebhooks((prev) => ({ ...prev, [wh.key]: e.target.value }))}
                    style={{ ...inputStyle, flex: 2, minWidth: "250px" }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button
                onClick={async () => {
                  setWebhooksLoading(true);
                  await fetch("/api/webhooks", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(webhooks),
                  });
                  setWebhooksSaved(true);
                  setWebhooksLoading(false);
                  setTimeout(() => setWebhooksSaved(false), 2000);
                }}
                disabled={webhooksLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.65rem 1.5rem",
                  borderRadius: "8px",
                  border: "none",
                  background: webhooksSaved ? "#22c55e" : "var(--accent)",
                  color: "#fff",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                {webhooksSaved ? <Check size={16} /> : null}
                {webhooksSaved ? "Webhooks enregistrés" : "Enregistrer les webhooks"}
              </button>
            </div>
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
