import React from "react";

export type BadgeVariant =
  | "primary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "neutral"
  | "purple"
  | "amber";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  size = "sm",
  className = "",
}) => {
  return (
    <span className={`fema-badge fema-badge-${variant} fema-badge-${size} ${className}`}>
      {children}
    </span>
  );
};

export const getSeverityBadgeVariant = (severity?: string): BadgeVariant => {
  const s = (severity || "").toUpperCase();
  if (s === "CRITICAL") return "danger";
  if (s === "HIGH") return "danger";
  if (s === "MEDIUM") return "warning";
  if (s === "LOW") return "info";
  return "neutral";
};

export const getStatusBadgeVariant = (status?: string): BadgeVariant => {
  const s = (status || "").toUpperCase();
  if (s === "RESOLVED" || s === "ACTIVE" || s === "COMPLIANT" || s === "HEALTHY") return "success";
  if (s === "ESCALATED" || s === "BREACHED" || s === "FAILED") return "danger";
  if (s === "IN_REVIEW" || s === "WARNING" || s === "ATTENTION") return "warning";
  if (s === "OPEN" || s === "PENDING") return "info";
  return "neutral";
};

export const getRoleBadgeVariant = (roleId?: number | string): BadgeVariant => {
  const r = Number(roleId);
  if (r === 0) return "danger";   // Admin
  if (r === 1) return "primary";  // Analyst
  if (r === 2) return "purple";   // CFO
  if (r === 3) return "amber";    // Auditor
  return "neutral";
};
