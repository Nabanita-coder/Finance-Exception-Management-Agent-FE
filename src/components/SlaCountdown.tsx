import React, { useEffect, useState } from "react";

interface SlaCountdownProps {
  deadline: string | null;
  status?: string;
  className?: string;
}

export const SlaCountdown: React.FC<SlaCountdownProps> = ({
  deadline,
  status,
  className = "",
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isOverdue: boolean;
    label: string;
  }>({ hours: 0, minutes: 0, seconds: 0, isOverdue: false, label: "No SLA" });

  useEffect(() => {
    if (!deadline) {
      setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isOverdue: false, label: "N/A" });
      return;
    }

    const calculate = () => {
      const target = new Date(deadline).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        const overdueHours = Math.floor(Math.abs(diff) / (1000 * 60 * 60));
        const overdueMins = Math.floor((Math.abs(diff) % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft({
          hours: overdueHours,
          minutes: overdueMins,
          seconds: 0,
          isOverdue: true,
          label: `Breached (${overdueHours}h ${overdueMins}m ago)`,
        });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({
          hours,
          minutes,
          seconds,
          isOverdue: false,
          label: `${hours}h ${minutes}m ${seconds}s left`,
        });
      }
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (status === "RESOLVED") {
    return (
      <span className={`fema-sla-badge fema-sla-resolved ${className}`} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <span>Resolved on Time</span>
      </span>
    );
  }

  if (timeLeft.isOverdue) {
    return (
      <span className={`fema-sla-badge fema-sla-overdue animate-pulse ${className}`} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
        <span>{timeLeft.label}</span>
      </span>
    );
  }

  const isUrgent = timeLeft.hours < 6;
  const isWarning = timeLeft.hours < 24;

  return (
    <span
      className={`fema-sla-badge ${
        isUrgent
          ? "fema-sla-urgent"
          : isWarning
          ? "fema-sla-warning"
          : "fema-sla-normal"
      } ${className}`}
      style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      <span>{timeLeft.label}</span>
    </span>
  );
};
