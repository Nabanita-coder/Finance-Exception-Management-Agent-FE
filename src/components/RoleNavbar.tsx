import React from "react";
import type { UserSession } from "./AuthModal";
import { Badge, getRoleBadgeVariant } from "./Badge";

interface RoleNavbarProps {
  user: UserSession;
  activeRole: number;
  onSignOut: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onNavigateHome?: () => void;
}

export const RoleNavbar: React.FC<RoleNavbarProps> = ({
  user,
  activeRole,
  onSignOut,
  theme,
  onToggleTheme,
  onNavigateHome,
}) => {
  const roleNames: Record<number, { title: string; icon: string }> = {
    0: { title: "System Administrator", icon: "🛠️" },
    1: { title: "Finance Analyst", icon: "📊" },
    2: { title: "Executive (CFO)", icon: "🏛️" },
    3: { title: "Auditor & Compliance", icon: "📋" },
  };

  const currentRoleInfo = roleNames[activeRole] || roleNames[1];

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


      </div>

      <div className="fema-navbar-right">


        {/* Dark/Light Mode Toggle */}
        <button
          className="fema-icon-btn theme-toggle-btn"
          onClick={onToggleTheme}
          title={`Switch to ${theme === "light" ? "Dark" : "Light"} mode`}
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>

        {/* User Profile Pill & Sign Out */}
        <div className="fema-user-profile-pill">
          <div className="fema-user-avatar">
            {(user.full_name || user.username || "U")[0].toUpperCase()}
          </div>
          <div className="fema-user-meta">
            <span className="fema-user-name">{user.full_name || user.username}</span>
            <span className="fema-user-role-sub">@{user.username}</span>
          </div>
          <button
            className="fema-signout-btn"
            onClick={onSignOut}
            title="Sign out of FEMA"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};
