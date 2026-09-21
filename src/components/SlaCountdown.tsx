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
      <span className={`fema-sla-badge fema-sla-resolved ${className}`}>
        ✓ Resolved on Time
      </span>
    );
  }

  if (timeLeft.isOverdue) {
    return (
      <span className={`fema-sla-badge fema-sla-overdue animate-pulse ${className}`}>
        🚨 {timeLeft.label}
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
    >
      ⏱ {timeLeft.label}
    </span>
  );
};
