import React, { useState } from "react";
import { Modal } from "./Modal";
import { AUTH_ENDPOINTS } from "../config/apiConfig";

export interface UserSession {
  id: number;
  username: string;
  email: string;
  role_id: number;
  role: string;
  full_name: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (token: string, user: UserSession) => void;
  initialMode?: "login" | "register";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = "login",
}) => {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [roleId, setRoleId] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const response = await fetch(AUTH_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.error || "Failed to log in. Please check credentials.");
        return;
      }

      onAuthSuccess(data.token, data.user);
      onClose();
    } catch (err: any) {
      setErrorMessage("Network error connecting to auth server: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const response = await fetch(AUTH_ENDPOINTS.REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          full_name: fullName || username,
          role_id: Number(roleId),
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.error || "Registration failed. Please verify details.");
        return;
      }

      onAuthSuccess(data.token, data.user);
      onClose();
    } catch (err: any) {
      setErrorMessage("Network error connecting to auth server: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillTestAccount = (user: string, pass: string) => {
    setIdentifier(user);
    setPassword(pass);
    setMode("login");
    setErrorMessage("");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "login" ? "Sign In to FEMA" : "Create FEMA Account"}
      subtitle={
        mode === "login"
          ? "Access your role-specific financial exception intelligence workspace."
          : "Register and select your organizational role."
      }
      maxWidth="500px"
    >
      {/* Mode Switcher Tabs */}
      <div className="fema-auth-tabs">
        <button
          type="button"
          className={`fema-auth-tab ${mode === "login" ? "active" : ""}`}
          onClick={() => {
            setMode("login");
            setErrorMessage("");
          }}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`fema-auth-tab ${mode === "register" ? "active" : ""}`}
          onClick={() => {
            setMode("register");
            setErrorMessage("");
          }}
        >
          Register Role
        </button>
      </div>

      {errorMessage && (
        <div className="fema-auth-error" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {mode === "login" ? (
        <form onSubmit={handleLogin} className="fema-auth-form">
          <div className="fema-form-group">
            <label className="fema-label">Username or Email</label>
            <input
              type="text"
              className="fema-input"
              placeholder="e.g. admin, analyst, cfo, auditor"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="fema-form-group">
            <label className="fema-label">Password</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type={showPassword ? "text" : "password"}
                className="fema-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: "42px", width: "100%" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--fema-text-muted)",
                  padding: "4px 8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  userSelect: "none",
                }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="fema-btn fema-btn-primary fema-btn-block"
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Sign In to Dashboard →"}
          </button>

          {/* Quick Demo Test Accounts */}
          <div className="fema-demo-accounts">
            <div className="fema-demo-label">Quick Test Sign-In (All 4 Roles):</div>
            <div className="fema-demo-grid">
              <button
                type="button"
                className="fema-demo-btn admin"
                onClick={() => fillTestAccount("admin", "admin123")}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>Admin (0)</span>
              </button>
              <button
                type="button"
                className="fema-demo-btn analyst"
                onClick={() => fillTestAccount("analyst", "analyst123")}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                <span>Analyst (1)</span>
              </button>
              <button
                type="button"
                className="fema-demo-btn cfo"
                onClick={() => fillTestAccount("cfo", "cfo123")}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22" /><line x1="6" y1="18" x2="6" y2="11" /><line x1="10" y1="18" x2="10" y2="11" /><line x1="14" y1="18" x2="14" y2="11" /><line x1="18" y1="18" x2="18" y2="11" /><polygon points="12 2 20 7 4 7" /></svg>
                <span>CFO (2)</span>
              </button>
              <button
                type="button"
                className="fema-demo-btn auditor"
                onClick={() => fillTestAccount("auditor", "auditor123")}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>
                <span>Auditor (3)</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="fema-auth-form">
          <div className="fema-form-group">
            <label className="fema-label">Full Name</label>
            <input
              type="text"
              className="fema-input"
              placeholder="e.g. Alex Henderson"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="fema-form-group">
            <label className="fema-label">Username</label>
            <input
              type="text"
              className="fema-input"
              placeholder="e.g. alex_cfo"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="fema-form-group">
            <label className="fema-label">Work Email</label>
            <input
              type="email"
              className="fema-input"
              placeholder="alex@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="fema-form-group">
            <label className="fema-label">Select System Role</label>
            <select
              className="fema-select"
              value={roleId}
              onChange={(e) => setRoleId(Number(e.target.value))}
            >
              <option value={0}>System Administrator (Role 0)</option>
              <option value={1}>Accountable Owner / Finance Analyst (Role 1)</option>
              <option value={2}>Finance Leadership / Executive CFO (Role 2)</option>
              <option value={3}>Auditor / Compliance Officer (Role 3)</option>
            </select>
          </div>

          <div className="fema-form-group">
            <label className="fema-label">Password</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type={showPassword ? "text" : "password"}
                className="fema-input"
                placeholder="Choose a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: "42px", width: "100%" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--fema-text-muted)",
                  padding: "4px 8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  userSelect: "none",
                }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="fema-btn fema-btn-primary fema-btn-block"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Complete Registration & Launch"}
          </button>
        </form>
      )}
    </Modal>
  );
};
