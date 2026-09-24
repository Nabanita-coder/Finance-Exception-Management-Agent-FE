import React, { useState, useRef, useEffect } from "react";
import type { UserSession } from "./AuthModal";

interface RoleNavbarProps {
  user: UserSession;
  activeRole: number;
  onSignOut: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onNavigateHome?: () => void;
  onRoleChange?: (newRole: number) => void;
}

export const RoleNavbar: React.FC<RoleNavbarProps> = ({
  user,
  activeRole,
  onSignOut,
  theme,
  onToggleTheme,
  onNavigateHome,
  onRoleChange,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const userInitial = (user.full_name || user.username || "C")[0].toUpperCase();
  const displayName = user.full_name || (user.username === "cfo" ? "Chief Financial Officer (Executive)" : user.username);
  const displayHandle = `@${user.username}`;

  return (
    <header className="fema-navbar">
      <div className="fema-navbar-left">
        <div
          className="fema-brand clickable"
          onClick={onNavigateHome}
          title="Return to Landing Overview"
        >
          <div className="fema-brand-logo">F</div>
          <div className="fema-brand-text">
            <div className="fema-brand-title">FEMA</div>
            <div className="fema-brand-subtitle">Finance Exception Agent</div>
          </div>
        </div>

        {activeRole !== 2 && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "3px 10px",
              borderRadius: "6px",
              background: "rgba(99, 102, 241, 0.12)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              fontSize: "11px",
              fontWeight: 700,
              color: "#818cf8",
              marginLeft: "12px",
            }}
          >
            {activeRole === 0 && "🛡️ Admin"}
            {activeRole === 1 && "📊 Finance Analyst"}
            {activeRole === 3 && "📜 Auditor"}
          </div>
        )}
      </div>

      <div className="fema-navbar-right">
        {/* Quick Role Switcher for Dynamic Exploration (Hidden in CFO view) */}
        {activeRole !== 2 && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginRight: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--fema-text-secondary)" }}>View Dashboard:</span>
            <select
              value={activeRole}
              onChange={(e) => onRoleChange?.(Number(e.target.value))}
              style={{
                padding: "5px 10px",
                borderRadius: "8px",
                background: "var(--fema-surface-subtle)",
                color: "var(--fema-text-primary)",
                border: "1px solid var(--fema-border)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                outline: "none",
              }}
              title="Switch perspective between roles"
            >
              <option value={0}>🛡️ 0 - Admin &amp; Compliance</option>
              <option value={1}>📊 1 - Finance Analyst</option>
              <option value={2}>🏛️ 2 - Executive (CFO)</option>
              <option value={3}>📜 3 - Auditor &amp; Compliance</option>
            </select>
          </div>
        )}
        {/* Dark/Light Mode Toggle */}
        <button
          onClick={onToggleTheme}
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            boxShadow: "none",
            cursor: "pointer",
            padding: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--fema-text-secondary)",
            borderRadius: "8px",
            fontSize: "18px",
            transition: "color 0.15s ease",
          }}
          title={`Switch to ${theme === "light" ? "Dark" : "Light"} mode`}
        >
          {theme === "light" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
          )}
        </button>

        {/* User Profile Avatar with Dropdown */}
        <div style={{ position: "relative" }} ref={dropdownRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "14px",
              border: menuOpen ? "2px solid var(--fema-accent-indigo)" : "2px solid transparent",
              boxShadow: menuOpen ? "0 0 0 3px rgba(99, 102, 241, 0.25)" : "0 2px 8px rgba(99, 102, 241, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              outline: "none",
            }}
            title="User Profile & Options"
            aria-label="User Profile"
          >
            {userInitial}
          </button>

          {menuOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                minWidth: "160px",
                backgroundColor: "var(--fema-surface)",
                border: "1px solid var(--fema-border-highlight)",
                borderRadius: "10px",
                padding: "8px 6px",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
                zIndex: 1000,
                animation: "femaFadeIn 0.15s ease",
              }}
            >
              {activeRole !== 2 && (
                <div
                  style={{
                    padding: "4px 8px 8px 8px",
                    borderBottom: "1px solid var(--fema-border, rgba(255, 255, 255, 0.08))",
                    marginBottom: "6px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--fema-text-primary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {displayName}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--fema-text-muted)",
                    }}
                  >
                    {displayHandle}
                  </div>
                </div>
              )}

              {/* Action: Log Out */}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onSignOut();
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: "8px",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "none",
                  background: "transparent",
                  color: "#f43f5e",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(244, 63, 94, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
