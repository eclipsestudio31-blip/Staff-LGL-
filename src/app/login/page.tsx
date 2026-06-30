"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, ArrowRight, Lock, User, AlertCircle, Check } from "lucide-react";
import { loadPrefs } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tempUserId, setTempUserId] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [discordId, setDiscordId] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prefs = loadPrefs();
    document.documentElement.className = "";
    if (prefs.theme === "light") document.documentElement.classList.add("theme-light");
    if (prefs.theme === "high-contrast") document.documentElement.classList.add("high-contrast");
    document.documentElement.style.fontSize = "16px";
  }, []);

  const passwordChecks = [
    { label: "16 caractères minimum", valid: newPassword.length >= 16 },
    { label: "Une majuscule", valid: /[A-Z]/.test(newPassword) },
    { label: "Une minuscule", valid: /[a-z]/.test(newPassword) },
    { label: "Un chiffre", valid: /[0-9]/.test(newPassword) },
    { label: "Un caractère spécial", valid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Identifiants incorrects");
        setLoading(false);
        return;
      }

      if (data.isFirstLogin) {
        setTempUserId(data.user.id);
        setShowPasswordModal(true);
        setLoading(false);
        return;
      }

      router.push("/");
    } catch {
      setError("Erreur de connexion au serveur");
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (newPassword.length < 16) {
      setError("Le mot de passe doit contenir au moins 16 caractères");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, userId: tempUserId, discordId: discordId || null }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors du changement de mot de passe");
        setLoading(false);
        return;
      }

      router.push("/");
    } catch {
      setError("Erreur de connexion au serveur");
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-primary)",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "url(/images/login-bg.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        opacity: 1,
        pointerEvents: "none",
      }} />

      <div style={{
        width: "100%",
        maxWidth: "420px",
        padding: "0 1.5rem",
        position: "relative",
        zIndex: 1,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{
            width: "72px",
            height: "72px",
            borderRadius: "20px",
            overflow: "hidden",
            margin: "0 auto 1.5rem",
            boxShadow: "0 8px 32px rgba(108, 92, 231, 0.2)",
          }}>
            <img src="/images/lgl-logo.png" alt="LGL" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <h1 style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            marginBottom: "0.375rem",
            color: "#000",
          }}>Staff Le Grand Light RP V2</h1>
          <p style={{
            fontSize: "0.875rem",
            fontWeight: 700,
            color: "#000",
          }}>Panel de Gestion du Staff</p>
        </div>

        <div style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "2rem",
          boxShadow: "var(--shadow-md)",
        }}>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <User size={12} /> Identifiant
              </label>
              <div style={{ position: "relative" }}>
                <input
                  className="input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Entrez votre identifiant"
                  required
                  autoFocus
                  style={{ paddingLeft: "2.75rem" }}
                />
                <User size={16} style={{
                  position: "absolute",
                  left: "0.875rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }} />
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <Lock size={12} /> Mot de passe
              </label>
              <div style={{ position: "relative" }}>
                <input
                  className="input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  required
                  style={{ paddingLeft: "2.75rem", paddingRight: "2.75rem" }}
                />
                <Lock size={16} style={{
                  position: "absolute",
                  left: "0.875rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: "0.25rem",
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius-sm)",
                background: "var(--danger-bg)",
                border: "1px solid rgba(255,61,113,0.2)",
                marginBottom: "1rem",
                fontSize: "0.8125rem",
                color: "var(--danger)",
              }}>
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.75rem",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              {loading ? (
                <div className="animate-spin" style={{
                  width: "18px",
                  height: "18px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                }} />
              ) : (
                <>
                  Se connecter
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        <p style={{
          textAlign: "center",
          fontSize: "0.75rem",
          color: "var(--text-muted)",
          marginTop: "1.5rem",
        }}>
          Accès réservé aux membres du staff
        </p>
      </div>

      <div style={{
        position: "fixed",
        bottom: "1rem",
        right: "1.5rem",
        fontSize: "0.6875rem",
        color: "rgba(255,255,255,0.5)",
        fontWeight: 500,
        zIndex: 10,
      }}>
        Développé par <span style={{ fontWeight: 700 }}>Lenny</span> & <span style={{ fontWeight: 700 }}>OpenCode</span>
      </div>

      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: "460px" }}>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: "var(--warning-bg)",
                border: "1px solid rgba(255,170,0,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem",
              }}>
                <Lock size={24} style={{ color: "var(--warning)" }} />
              </div>
              <h2>Changement de mot de passe</h2>
              <p>Pour des raisons de sécurité, vous devez définir un nouveau mot de passe.</p>
            </div>

            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label>Nouveau mot de passe</label>
                <div style={{ position: "relative" }}>
                  <input
                    className="input"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 16 caractères"
                    required
                    autoFocus
                    style={{ paddingRight: "2.75rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                    }}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {newPassword.length > 0 && (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.375rem",
                  marginBottom: "1rem",
                  padding: "0.875rem",
                  background: "var(--bg-primary)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                }}>
                  {passwordChecks.map((check) => (
                    <div key={check.label} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      fontSize: "0.6875rem",
                      color: check.valid ? "var(--success)" : "var(--text-muted)",
                    }}>
                      <div style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        border: `1.5px solid ${check.valid ? "var(--success)" : "var(--border)"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "all 0.2s",
                      }}>
                        {check.valid && <Check size={8} />}
                      </div>
                      {check.label}
                    </div>
                  ))}
                </div>
              )}

              <div className="form-group">
                <label>Confirmer le mot de passe</label>
                <input
                  className="input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmez votre mot de passe"
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  ID Discord (optionnel)
                </label>
                <input
                  className="input"
                  type="text"
                  value={discordId}
                  onChange={(e) => setDiscordId(e.target.value)}
                  placeholder="Ex: 123456789012345678"
                />
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "0.3rem 0 0" }}>
                  Pour être mentionné(e) dans les notifications webhook.
                </p>
              </div>

              {error && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--danger-bg)",
                  border: "1px solid rgba(255,61,113,0.2)",
                  marginBottom: "1rem",
                  fontSize: "0.8125rem",
                  color: "var(--danger)",
                }}>
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: "100%", padding: "0.75rem" }}
              >
                {loading ? (
                  <div className="animate-spin" style={{
                    width: "18px", height: "18px",
                    border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%",
                  }} />
                ) : "Changer le mot de passe"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
