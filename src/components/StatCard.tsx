import React from "react";
import { Badge, type BadgeVariant } from "./Badge";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badgeText?: string;
  badgeVariant?: BadgeVariant;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  badgeText,
  badgeVariant = "neutral",
  trend,
  icon,
  onClick,
  className = "",
}) => {
  return (
    <div
      className={`fema-stat-card ${onClick ? "fema-clickable" : ""} ${className}`}
      onClick={onClick}
    >
      <div className="fema-stat-header">
        <div className="fema-stat-title-wrap">
          <span className="fema-stat-title">{title}</span>
          {badgeText && (
            <Badge variant={badgeVariant} size="sm">
              {badgeText}
            </Badge>
          )}
        </div>
        {icon && <div className="fema-stat-icon">{icon}</div>}
      </div>

      <div className="fema-stat-body">
        <div className="fema-stat-value">{value}</div>
        {trend && (
          <div
            className={`fema-stat-trend ${
              trend.isPositive ? "fema-trend-up" : "fema-trend-down"
            }`}
          >
            <span>{trend.isPositive ? "▲" : "▼"} {trend.value}</span>
            {trend.label && <span className="fema-trend-label">{trend.label}</span>}
          </div>
        )}
      </div>

      {subtitle && <div className="fema-stat-subtitle">{subtitle}</div>}
    </div>
  );
};
