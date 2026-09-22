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
        <div className="fema-auth-error">
          <span>⚠️ {errorMessage}</span>
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
            <input
              type="password"
              className="fema-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
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
              >
                🛠️ Admin (0)
              </button>
              <button
                type="button"
                className="fema-demo-btn analyst"
                onClick={() => fillTestAccount("analyst", "analyst123")}
              >
                📊 Analyst (1)
              </button>
              <button
                type="button"
                className="fema-demo-btn cfo"
                onClick={() => fillTestAccount("cfo", "cfo123")}
              >
                🏛️ CFO (2)
              </button>
              <button
                type="button"
                className="fema-demo-btn auditor"
                onClick={() => fillTestAccount("auditor", "auditor123")}
              >
                📋 Auditor (3)
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
              <option value={0}>🛠️ System Administrator</option>
              <option value={1}>📊 Accountable Owner / Finance Analyst</option>
              <option value={2}>🏛️ Finance Leadership / Executive CFO</option>
              <option value={3}>📋 Auditor / Compliance Officer</option>
            </select>
          </div>

          <div className="fema-form-group">
            <label className="fema-label">Password</label>
            <input
              type="password"
              className="fema-input"
              placeholder="Choose a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
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
