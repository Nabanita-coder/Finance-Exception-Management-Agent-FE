import React, { useState, useEffect, useMemo } from "react";
import { ANALYST_ENDPOINTS, getAuthHeaders } from "../config/apiConfig";
import { Badge, getSeverityBadgeVariant, getStatusBadgeVariant } from "./Badge";
import { SlaCountdown } from "./SlaCountdown";
import { Modal } from "./Modal";
import { AiChatWidget } from "./AiChatWidget";

interface AnalystTask {
  id: number;
  financial_record_id: number;
  category: string;
  period: string;
  department: string;
  budget_amount: number;
  actual_amount: number;
  variance_amount: number;
  variance_percent: number;
  severity: string;
  possible_reason: string;
  status: string;
  owner_id: number;
  owner_name: string;
  sla_deadline: string | null;
  sla_remaining_minutes: number;
  escalation_level: number;
  created_at: string | null;
}

interface SlaAlert {
  id: number;
  severity: string;
  department: string;
  category: string;
  variance_percent: number;
  status: string;
  sla_deadline: string | null;
  sla_status: string;
}

interface RootCauseInsight {
  exception_id: number;
  category: string;
  department: string;
  variance_percent: number;
  severity: string;
  primary_hypothesis: string;
  contributing_factors: string[];
  recommended_actions: string[];
  confidence_score: number;
}

import type { FinancialRecord, ExceptionCase } from "../App";

interface AnalystDashboardProps {
  activeSection?: "all" | "tasks" | "sla" | "insights" | "chat";
  records?: FinancialRecord[];
  exceptions?: ExceptionCase[];
}

// ============================================================================
// SVG CHART: Analyst Variance & Financial Exposure (Dashboard Overview Only)
// ============================================================================
const AnalystVarianceChart: React.FC<{ tasks: AnalystTask[] }> = ({ tasks }) => {
  if (tasks.length === 0) {
    return (
      <div className="fema-empty-state" style={{ padding: "40px 20px" }}>
        No open exceptions currently assigned to your queue.
      </div>
    );
  }

  const svgWidth = 760;
  const svgHeight = 220;
  const padLeft = 65;
  const padRight = 25;
  const padTop = 25;
  const padBottom = 40;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const maxVal = Math.max(
    ...tasks.map((t) => Math.max(t.budget_amount || 0, t.actual_amount || 0)),
    1000
  );

  const groupW = chartW / tasks.length;
  const barW = Math.min(22, (groupW - 24) / 2);

  return (
    <div className="fema-grouped-chart-wrap">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ width: "100%", height: "220px", display: "block" }}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padTop + chartH - ratio * chartH;
          const val = Math.round(maxVal * ratio);
          return (
            <g key={idx}>
              <line
                x1={padLeft}
                y1={y}
                x2={padLeft + chartW}
                y2={y}
                stroke="rgba(255, 255, 255, 0.07)"
                strokeDasharray="3 3"
              />
              <text
                x={padLeft - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="var(--fema-text-muted)"
                fontFamily="IBM Plex Mono, monospace"
              >
                ${val >= 1000 ? `${Math.round(val / 1000)}k` : val}
              </text>
            </g>
          );
        })}

        {/* Task comparative bars */}
        {tasks.map((t, idx) => {
          const groupX = padLeft + idx * groupW;
          const centerX = groupX + groupW / 2;

          const budgetH = Math.max(4, ((t.budget_amount || 0) / maxVal) * chartH);
          const actualH = Math.max(4, ((t.actual_amount || 0) / maxVal) * chartH);

          const budgetY = padTop + chartH - budgetH;
          const actualY = padTop + chartH - actualH;

          const isCritical = (t.variance_percent && Math.abs(t.variance_percent) >= 30) || t.severity === "CRITICAL";
          const actualColor = isCritical ? "#f43f5e" : t.variance_percent > 0 ? "#f59e0b" : "#10b981";

          return (
            <g key={t.id}>
              {/* Budget Bar */}
              <rect
                x={centerX - barW - 2}
                y={budgetY}
                width={barW}
                height={budgetH}
                fill="#6366f1"
                rx={3}
                opacity={0.85}
              />
              {/* Actual Bar */}
              <rect
                x={centerX + 2}
                y={actualY}
                width={barW}
                height={actualH}
                fill={actualColor}
                rx={3}
              />

              {/* Variance Tag */}
              <text
                x={centerX}
                y={Math.min(budgetY, actualY) - 8}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill={actualColor}
                fontFamily="IBM Plex Mono, monospace"
              >
                {t.variance_percent > 0 ? `+${t.variance_percent.toFixed(0)}%` : `${t.variance_percent.toFixed(0)}%`}
              </text>

              {/* Department Label */}
              <text
                x={centerX}
                y={padTop + chartH + 16}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="var(--fema-text-primary)"
              >
                #{t.id} {t.department}
              </text>
              <text
                x={centerX}
                y={padTop + chartH + 30}
                textAnchor="middle"
                fontSize="10"
                fill="var(--fema-text-muted)"
              >
                {t.category}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT: AnalystDashboard
// ============================================================================
export const AnalystDashboard: React.FC<AnalystDashboardProps> = ({
  activeSection = "all",
  records: propRecords,
  exceptions: propExceptions,
}) => {
  const [tasks, setTasks] = useState<AnalystTask[]>([]);
  const [slaAlerts, setSlaAlerts] = useState<SlaAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states for Tasks View
  const [taskSearch, setTaskSearch] = useState("");
  const [taskSeverityFilter, setTaskSeverityFilter] = useState("all");
  const [taskStatusFilter, setTaskStatusFilter] = useState("all");

  // Selected exception for AI root-cause panel
  const [selectedTask, setSelectedTask] = useState<AnalystTask | null>(null);
  const [aiInsight, setAiInsight] = useState<RootCauseInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Quick action modal state
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"RESOLVE" | "ESCALATE">("RESOLVE");
  const [explanation, setExplanation] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Chat prefill state
  const [chatPrompt] = useState("");

  useEffect(() => {
    if (propExceptions && propExceptions.length > 0) {
      const mappedTasks = propExceptions.map((e: any) => ({
        ...e,
        department: e.record?.department || e.financial_record?.department || "General",
        category: e.record?.category || e.financial_record?.category || "Uncategorized",
        budget_amount: e.record?.budget_amount || e.financial_record?.budget_amount || 0,
        actual_amount: e.record?.actual_amount || e.financial_record?.actual_amount || 0,
      }));
      setTasks(mappedTasks);
      if (!selectedTask) setSelectedTask(mappedTasks[0]);
    }
  }, [propExceptions]);

  const fetchAnalystData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksRes, alertsRes] = await Promise.all([
        fetch(ANALYST_ENDPOINTS.TASKS, { headers: getAuthHeaders() }),
        fetch(ANALYST_ENDPOINTS.SLA_ALERTS, { headers: getAuthHeaders() }),
        new Promise((resolve) => setTimeout(resolve, 450)),
      ]);

      const [tasksData, alertsData] = await Promise.all([
        tasksRes.json(),
        alertsRes.json(),
      ]);

      if (tasksData.success) {
        const fetchedTasks = tasksData.tasks || [];
        setTasks(fetchedTasks);
        if (fetchedTasks.length > 0 && !selectedTask) {
          handleSelectTask(fetchedTasks[0]);
        }
      }
      if (alertsData.success) setSlaAlerts(alertsData.alerts || []);
    } catch (err: any) {
      setError("Failed to load analyst workflow: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalystData();
  }, []);

  const handleSelectTask = async (task: AnalystTask) => {
    setSelectedTask(task);
    setLoadingInsight(true);
    try {
      const res = await fetch(ANALYST_ENDPOINTS.INSIGHT(task.id), {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setAiInsight(data.insight);
      }
    } catch (err) {
      console.error("Error fetching AI insight:", err);
    } finally {
      setLoadingInsight(false);
    }
  };

  const handleExecuteQuickAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !explanation.trim()) return;

    setIsSubmittingAction(true);
    try {
      const res = await fetch(ANALYST_ENDPOINTS.ACTION, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          exception_id: selectedTask.id,
          user_name: "analyst",
          role_name: "analyst",
          action: actionType,
          explanation: explanation.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionModalOpen(false);
        setExplanation("");
        fetchAnalystData();
      } else {
        alert("Action failed: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const openActionDialog = (type: "RESOLVE" | "ESCALATE") => {
    setActionType(type);
    setExplanation(
      type === "RESOLVE"
        ? "Verified invoice line-items. Budget deviation substantiated with audit justification."
        : "Unbudgeted infrastructure variance exceeds authorized threshold. Escalating to CFO for executive review."
    );
    setActionModalOpen(true);
  };

  const criticalTasksCount = tasks.filter((t) => t.severity === "CRITICAL" || t.severity === "HIGH").length;
  const urgentSlaCount = slaAlerts.filter((a) => a.sla_status === "BREACHED" || a.sla_status === "CRITICAL_URGENT").length;

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        !taskSearch.trim() ||
        t.department.toLowerCase().includes(taskSearch.toLowerCase()) ||
        t.category.toLowerCase().includes(taskSearch.toLowerCase()) ||
        (t.possible_reason || "").toLowerCase().includes(taskSearch.toLowerCase()) ||
        String(t.id).includes(taskSearch);

      const matchesSeverity =
        taskSeverityFilter === "all" || t.severity.toUpperCase() === taskSeverityFilter.toUpperCase();

      const matchesStatus =
        taskStatusFilter === "all" || t.status.toUpperCase() === taskStatusFilter.toUpperCase();

      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [tasks, taskSearch, taskSeverityFilter, taskStatusFilter]);

  return (
    <div>
      {/* View Header */}
      <div className="fema-view-header" style={{ marginBottom: "20px" }}>
        <div>

          <h1 className="fema-view-title" style={{ fontSize: "24px" }}>
            {activeSection === "tasks"
              ? "My Assigned Exceptions Queue"
              : activeSection === "sla"
              ? "SLA Resolution Countdown & Alerts"
              : activeSection === "insights"
              ? "AI Root-Cause Diagnostic & Remediation"
              : activeSection === "chat"
              ? "Financial Exception Copilot Chat"
              : "Financial Exception Workspace & Resolution Hub"}
          </h1>
          <p className="fema-view-desc">
            Investigate budget variances, track SLA deadlines, inspect AI root-cause diagnostics, and execute corrective sign-offs.
          </p>
        </div>
        <button
          className={`fema-btn fema-btn-outline fema-refresh-btn ${loading ? "is-loading" : ""}`}
          onClick={fetchAnalystData}
          disabled={loading}
          title="Refresh"
          aria-label="Refresh"
          style={{
            width: "36px",
            height: "36px",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "10px",
            flexShrink: 0,
          }}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
        </button>
      </div>

      {error && <div className="fema-error-banner">⚠️ {error}</div>}

      {/* Slim Compact KPI Summary Strip */}
      <div className="fema-kpi-strip-compact">
        <div className="fema-kpi-card-compact">
          <div className="fema-kpi-compact-info">
            <span className="fema-kpi-compact-label">Active Cases</span>
            <span className="fema-kpi-compact-val">{tasks.length} Cases</span>
            <span className="fema-kpi-compact-sub" style={{ color: "#6366f1" }}>● In Operational Queue</span>
          </div>
          <div style={{ color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", background: "rgba(99, 102, 241, 0.1)", borderRadius: "8px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
          </div>
        </div>

        <div className="fema-kpi-card-compact">
          <div className="fema-kpi-compact-info">
            <span className="fema-kpi-compact-label">High / Critical Urgency</span>
            <span className="fema-kpi-compact-val">{criticalTasksCount} Items</span>
            <span className="fema-kpi-compact-sub" style={{ color: criticalTasksCount > 0 ? "#f43f5e" : "#10b981" }}>
              {criticalTasksCount > 0 ? "Requires Immediate Action" : "Within Baseline"}
            </span>
          </div>
          <div style={{ color: criticalTasksCount > 0 ? "#f43f5e" : "#10b981", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", background: criticalTasksCount > 0 ? "rgba(244, 63, 94, 0.1)" : "rgba(16, 185, 129, 0.1)", borderRadius: "8px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          </div>
        </div>

        <div className="fema-kpi-card-compact">
          <div className="fema-kpi-compact-info">
            <span className="fema-kpi-compact-label">SLA Countdown Alerts</span>
            <span className="fema-kpi-compact-val">{urgentSlaCount} Breaches</span>
            <span className="fema-kpi-compact-sub" style={{ color: urgentSlaCount > 0 ? "#f43f5e" : "#10b981" }}>
              {urgentSlaCount > 0 ? "Countdown Expired / Nearing" : "100% Within Target"}
            </span>
          </div>
          <div style={{ color: urgentSlaCount > 0 ? "#f43f5e" : "#10b981", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", background: urgentSlaCount > 0 ? "rgba(244, 63, 94, 0.1)" : "rgba(16, 185, 129, 0.1)", borderRadius: "8px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          </div>
        </div>

        <div className="fema-kpi-card-compact">
          <div className="fema-kpi-compact-info">
            <span className="fema-kpi-compact-label">AI Diagnostic Confidence</span>
            <span className="fema-kpi-compact-val">94.2%</span>
            <span className="fema-kpi-compact-sub" style={{ color: "#a855f7" }}>Multivariate Hypothesis</span>
          </div>
          <div style={{ color: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", background: "rgba(168, 85, 247, 0.1)", borderRadius: "8px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" /></svg>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* VIEW 1: DASHBOARD OVERVIEW (With Dedicated Chart)                    */}
      {/* ==================================================================== */}
      {activeSection === "all" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Main Visual Chart (Dashboard Only) */}
          <div className="fema-section-card" style={{ padding: "18px 22px" }}>
            <div className="fema-section-header" style={{ marginBottom: "14px" }}>
              <div>
                <h3 className="fema-section-title" style={{ fontSize: "16px" }}>
                  Assigned Exceptions: Departmental Variance & Financial Exposure
                </h3>
                <p className="fema-section-sub">
                  Direct comparison of budget allocations versus actual expenditures across your assigned queue
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "11px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#6366f1" }} />
                  <span>Budget Allocation</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#f43f5e" }} />
                  <span>Actual Spend (Over)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#10b981" }} />
                  <span>Favorable Spend</span>
                </div>
              </div>
            </div>

            <AnalystVarianceChart tasks={tasks} />
          </div>

          {/* Symmetrical Two-Column Operational Workbench */}
          <div className="fema-analyst-grid">
            {/* Left Column: Operational Queue */}
            <div className="fema-section-card" style={{ padding: "18px 20px" }}>
              <div className="fema-section-header" style={{ marginBottom: "14px" }}>
                <div>
                  <h3 className="fema-section-title" style={{ fontSize: "15px" }}>
                    Active Exception Queue
                  </h3>
                  <p className="fema-section-sub">
                    Click any exception to inspect AI diagnostic hypothesis
                  </p>
                </div>
                <Badge variant="primary" size="sm">
                  {tasks.length} Cases
                </Badge>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {tasks.length === 0 ? (
                  <div className="fema-empty-state">No open exceptions in your queue! All cases resolved.</div>
                ) : (
                  tasks.map((task) => {
                    const isSelected = selectedTask?.id === task.id;
                    const isPositive = task.variance_percent > 0;

                    return (
                      <div
                        key={task.id}
                        className={`fema-task-card ${isSelected ? "selected" : ""}`}
                        onClick={() => handleSelectTask(task)}
                        style={{
                          borderRadius: "10px",
                          padding: "12px 14px",
                          marginBottom: 0,
                          border: isSelected ? "1.5px solid #6366f1" : "1px solid var(--fema-border)",
                          background: isSelected ? "rgba(99, 102, 241, 0.08)" : "var(--fema-surface-subtle)",
                        }}
                      >
                        <div className="fema-task-top" style={{ marginBottom: "6px" }}>
                          <div className="fema-task-dept-cat">
                            <span style={{ fontWeight: 700, color: "var(--fema-text-primary)" }}>#{task.id}</span>
                            <span className="dept">{task.department}</span>
                            <span className="separator">•</span>
                            <span className="cat" style={{ color: "var(--fema-text-secondary)", fontSize: "11.5px" }}>{task.category}</span>
                          </div>
                          <Badge variant={getSeverityBadgeVariant(task.severity)} size="sm">
                            {task.severity}
                          </Badge>
                        </div>

                        <div className="fema-task-variance-row" style={{ marginBottom: "8px" }}>
                          <div
                            className="fema-task-var-pct"
                            style={{
                              fontSize: "18px",
                              fontWeight: 800,
                              color: isPositive ? "#f43f5e" : "#10b981",
                              fontFamily: "IBM Plex Mono, monospace",
                            }}
                          >
                            {isPositive ? "+" : ""}
                            {task.variance_percent.toFixed(1)}%
                          </div>
                          <div className="fema-task-amounts" style={{ fontSize: "11.5px" }}>
                            Actual: <strong>${task.actual_amount.toLocaleString()}</strong> / Budget: ${task.budget_amount.toLocaleString()}
                          </div>
                        </div>

                        <div className="fema-task-bottom" style={{ paddingTop: "6px" }}>
                          <SlaCountdown deadline={task.sla_deadline} status={task.status} />
                          <Badge variant={getStatusBadgeVariant(task.status)} size="sm">
                            {task.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: AI Root-Cause Diagnostic & Quick Actions */}
            <div className="fema-section-card" style={{ padding: "18px 20px" }}>
              <div className="fema-section-header" style={{ marginBottom: "14px" }}>
                <div>
                  <h3 className="fema-section-title" style={{ fontSize: "15px" }}>
                    AI Root-Cause Diagnostic
                  </h3>
                  <p className="fema-section-sub">
                    Automated hypothesis for Case #{selectedTask?.id || "—"} ({selectedTask?.department || "None"})
                  </p>
                </div>
                <Badge variant="purple" size="sm">
                  AI Confidence: {aiInsight?.confidence_score ? `${Math.round(aiInsight.confidence_score * 100)}%` : "94%"}
                </Badge>
              </div>

              {loadingInsight ? (
                <div className="fema-ai-loading" style={{ padding: "30px 10px", textAlign: "center" }}>
                  Evaluating multivariate anomaly hypothesis...
                </div>
              ) : aiInsight && selectedTask ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Primary Hypothesis */}
                  <div
                    style={{
                      background: "rgba(99, 102, 241, 0.08)",
                      border: "1px solid rgba(99, 102, 241, 0.25)",
                      borderRadius: "8px",
                      padding: "12px 14px",
                    }}
                  >
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#818cf8", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" /></svg>
                      Primary Root-Cause Hypothesis:
                    </div>
                    <p style={{ fontSize: "12.5px", color: "var(--fema-text-primary)", lineHeight: 1.45, margin: 0 }}>
                      {aiInsight.primary_hypothesis}
                    </p>
                  </div>

                  {/* Key Contributing Factors */}
                  <div
                    style={{
                      background: "var(--fema-surface-subtle)",
                      border: "1px solid var(--fema-border)",
                      borderRadius: "8px",
                      padding: "12px 14px",
                    }}
                  >
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--fema-text-primary)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      Key Variance Drivers:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "var(--fema-text-secondary)", lineHeight: 1.4 }}>
                      {aiInsight.contributing_factors.map((f, idx) => (
                        <li key={idx} style={{ marginBottom: "3px" }}>{f}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Remediation Steps */}
                  <div
                    style={{
                      background: "var(--fema-surface-subtle)",
                      border: "1px solid var(--fema-border)",
                      borderRadius: "8px",
                      padding: "12px 14px",
                    }}
                  >
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--fema-text-primary)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                      Suggested Remediation:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "var(--fema-text-secondary)", lineHeight: 1.4 }}>
                      {aiInsight.recommended_actions.map((act, idx) => (
                        <li key={idx} style={{ marginBottom: "3px" }}>{act}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Quick Action Buttons */}
                  <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                    <button
                      className="fema-btn fema-btn-success"
                      style={{ flex: 1, padding: "8px 12px", fontSize: "12px" }}
                      onClick={() => openActionDialog("RESOLVE")}
                    >
                      ✓ Resolve Case
                    </button>
                    <button
                      className="fema-btn fema-btn-danger"
                      style={{ flex: 1, padding: "8px 12px", fontSize: "12px" }}
                      onClick={() => openActionDialog("ESCALATE")}
                    >
                      ▲ Escalate to CFO
                    </button>
                  </div>
                </div>
              ) : (
                <div className="fema-empty-state" style={{ padding: "30px 10px" }}>
                  Select an exception from the queue to inspect AI analysis.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 2: MY TASKS QUEUE SUB-PAGE (Clean Table, No Charts)              */}
      {/* ==================================================================== */}
      {activeSection === "tasks" && (
        <div className="fema-section-card" style={{ padding: "20px 24px" }}>
          <div className="fema-section-header" style={{ marginBottom: "16px" }}>
            <div>
              <h3 className="fema-section-title" style={{ fontSize: "16px" }}>
                My Assigned Exceptions Directory
              </h3>
              <p className="fema-section-sub">
                Comprehensive operational ledger of budget deviations assigned to your cost center
              </p>
            </div>
            <Badge variant="primary" size="sm">
              {filteredTasks.length} Assigned Cases
            </Badge>
          </div>

          {/* Table Toolbar */}
          <div className="fema-table-toolbar">
            <div className="fema-table-search-wrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--fema-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                className="fema-table-search-input"
                placeholder="Search by department, category, or case ID..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
              />
              {taskSearch && (
                <button
                  onClick={() => setTaskSearch("")}
                  style={{ background: "transparent", border: "none", color: "var(--fema-text-muted)", cursor: "pointer", fontSize: "12px" }}
                >
                  ✕
                </button>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <select
                className="fema-select"
                style={{ padding: "6px 12px", fontSize: "12px" }}
                value={taskSeverityFilter}
                onChange={(e) => setTaskSeverityFilter(e.target.value)}
              >
                <option value="all">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
              </select>

              <select
                className="fema-select"
                style={{ padding: "6px 12px", fontSize: "12px" }}
                value={taskStatusFilter}
                onChange={(e) => setTaskStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="ESCALATED">Escalated</option>
              </select>

              <span style={{ fontSize: "12px", color: "var(--fema-text-secondary)" }}>
                Showing <strong>{filteredTasks.length}</strong> of {tasks.length} cases
              </span>
            </div>
          </div>

          {/* High Density Table */}
          <div className="fema-table-container">
            <table className="fema-table">
              <thead>
                <tr>
                  <th style={{ width: "10%" }}>Case ID</th>
                  <th style={{ width: "24%" }}>Department & Category</th>
                  <th style={{ width: "20%" }}>Budget vs. Actual</th>
                  <th style={{ width: "12%" }}>Variance %</th>
                  <th style={{ width: "12%" }}>Severity</th>
                  <th style={{ width: "12%" }}>SLA Countdown</th>
                  <th style={{ width: "10%", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "var(--fema-text-muted)" }}>
                      No exception cases match your filters.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => {
                    const isPositive = task.variance_percent > 0;
                    return (
                      <tr key={task.id}>
                        <td>
                          <span className="fema-id-pill">#{task.id}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: "var(--fema-text-primary)", fontSize: "13px" }}>
                            {task.department}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--fema-text-muted)" }}>
                            {task.category}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: "12px", color: "var(--fema-text-secondary)" }}>
                            Budget: <strong>${task.budget_amount.toLocaleString()}</strong>
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--fema-text-primary)" }}>
                            Actual: <strong>${task.actual_amount.toLocaleString()}</strong>
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: 800,
                              fontFamily: "IBM Plex Mono, monospace",
                              color: isPositive ? "#f43f5e" : "#10b981",
                            }}
                          >
                            {isPositive ? "+" : ""}{task.variance_percent.toFixed(1)}%
                          </span>
                        </td>
                        <td>
                          <Badge variant={getSeverityBadgeVariant(task.severity)} size="sm">
                            {task.severity}
                          </Badge>
                        </td>
                        <td>
                          <SlaCountdown deadline={task.sla_deadline} status={task.status} />
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="fema-btn fema-btn-xs fema-btn-primary"
                            style={{ padding: "4px 8px", fontSize: "11px", whiteSpace: "nowrap" }}
                            onClick={() => {
                              setSelectedTask(task);
                              openActionDialog("RESOLVE");
                            }}
                          >
                            Action
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 3: SLA TRACKER SUB-PAGE (Clean Cards, No Charts)                */}
      {/* ==================================================================== */}
      {activeSection === "sla" && (
        <div className="fema-section-card" style={{ padding: "20px 24px" }}>
          <div className="fema-section-header" style={{ marginBottom: "16px" }}>
            <div>
              <h3 className="fema-section-title" style={{ fontSize: "16px" }}>
                SLA Compliance & Resolution Deadlines
              </h3>
              <p className="fema-section-sub">
                Live countdown timers and escalation thresholds for active exception cases
              </p>
            </div>
            <Badge variant={urgentSlaCount > 0 ? "danger" : "success"} size="sm">
              {urgentSlaCount > 0 ? `⚠️ ${urgentSlaCount} Breaches` : "✓ 100% On Track"}
            </Badge>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "14px" }}>
            {slaAlerts.map((alert) => {
              const isBreached = alert.sla_status === "BREACHED" || alert.sla_status === "CRITICAL_URGENT";
              return (
                <div
                  key={alert.id}
                  style={{
                    background: "var(--fema-surface-subtle)",
                    border: `1px solid ${isBreached ? "rgba(244, 63, 94, 0.4)" : "var(--fema-border)"}`,
                    borderRadius: "10px",
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="fema-id-pill">Case #{alert.id}</span>
                    <Badge variant={getSeverityBadgeVariant(alert.severity)} size="sm">
                      {alert.severity}
                    </Badge>
                  </div>

                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--fema-text-primary)" }}>
                      {alert.department}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--fema-text-secondary)" }}>
                      {alert.category} • Variance: <strong style={{ color: "#f43f5e" }}>{alert.variance_percent > 0 ? "+" : ""}{alert.variance_percent}%</strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid var(--fema-border)" }}>
                    <SlaCountdown deadline={alert.sla_deadline} status={alert.status} />
                    <button
                      className="fema-btn fema-btn-xs fema-btn-outline"
                      onClick={() => {
                        const matched = tasks.find((t) => t.id === alert.id);
                        if (matched) setSelectedTask(matched);
                        openActionDialog("ESCALATE");
                      }}
                    >
                      Escalate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 4: AI INSIGHTS SUB-PAGE (Diagnostic Workbench, No Charts)       */}
      {/* ==================================================================== */}
      {activeSection === "insights" && (
        <div className="fema-analyst-grid">
          {/* Case Selector */}
          <div className="fema-section-card" style={{ padding: "18px 20px" }}>
            <div className="fema-section-header" style={{ marginBottom: "14px" }}>
              <div>
                <h3 className="fema-section-title" style={{ fontSize: "15px" }}>Select Case to Inspect</h3>
                <p className="fema-section-sub">Assigned operational cases</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleSelectTask(task)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    border: selectedTask?.id === task.id ? "1.5px solid #6366f1" : "1px solid var(--fema-border)",
                    background: selectedTask?.id === task.id ? "rgba(99, 102, 241, 0.1)" : "var(--fema-surface-subtle)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--fema-text-primary)" }}>
                      #{task.id} {task.department}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--fema-text-secondary)" }}>
                      {task.category} ({task.variance_percent > 0 ? "+" : ""}{task.variance_percent.toFixed(1)}%)
                    </div>
                  </div>
                  <Badge variant={getSeverityBadgeVariant(task.severity)} size="sm">
                    {task.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Diagnostic Details */}
          <div className="fema-section-card" style={{ padding: "20px 24px" }}>
            <div className="fema-section-header" style={{ marginBottom: "14px" }}>
              <div>
                <h3 className="fema-section-title" style={{ fontSize: "16px" }}>
                  AI Root-Cause Dossier & Remediation
                </h3>
                <p className="fema-section-sub">
                  Case #{selectedTask?.id || "—"}: {selectedTask?.department}
                </p>
              </div>
              <Badge variant="purple" size="sm">
                Confidence: {aiInsight?.confidence_score ? `${Math.round(aiInsight.confidence_score * 100)}%` : "94%"}
              </Badge>
            </div>

            {loadingInsight ? (
              <div className="fema-ai-loading" style={{ padding: "40px", textAlign: "center" }}>
                Running AI diagnostic models...
              </div>
            ) : aiInsight && selectedTask ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.25)", borderRadius: "8px", padding: "14px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#818cf8", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" /></svg>
                    Primary Root-Cause Hypothesis:
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--fema-text-primary)", lineHeight: 1.45, margin: 0 }}>
                    {aiInsight.primary_hypothesis}
                  </p>
                </div>

                <div style={{ background: "var(--fema-surface-subtle)", border: "1px solid var(--fema-border)", borderRadius: "8px", padding: "14px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--fema-text-primary)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    Key Variance Drivers:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12.5px", color: "var(--fema-text-secondary)", lineHeight: 1.45 }}>
                    {aiInsight.contributing_factors.map((f, idx) => (
                      <li key={idx} style={{ marginBottom: "4px" }}>{f}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ background: "var(--fema-surface-subtle)", border: "1px solid var(--fema-border)", borderRadius: "8px", padding: "14px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--fema-text-primary)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                    Recommended Corrective Actions:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12.5px", color: "var(--fema-text-secondary)", lineHeight: 1.45 }}>
                    {aiInsight.recommended_actions.map((act, idx) => (
                      <li key={idx} style={{ marginBottom: "4px" }}>{act}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "6px" }}>
                  <button
                    className="fema-btn fema-btn-success"
                    style={{ flex: 1, padding: "9px 14px", fontSize: "12.5px" }}
                    onClick={() => openActionDialog("RESOLVE")}
                  >
                    ✓ Resolve & Sign-Off
                  </button>
                  <button
                    className="fema-btn fema-btn-danger"
                    style={{ flex: 1, padding: "9px 14px", fontSize: "12.5px" }}
                    onClick={() => openActionDialog("ESCALATE")}
                  >
                    ▲ Escalate to CFO
                  </button>
                </div>
              </div>
            ) : (
              <div className="fema-empty-state">Select an exception to inspect AI diagnostics.</div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 5: CHAT VIEW                                                    */}
      {/* ==================================================================== */}
      {activeSection === "chat" && (
        <div className="fema-section-card" style={{ padding: "20px 24px" }}>
          <div className="fema-section-header" style={{ marginBottom: "16px" }}>
            <div>
              <h3 className="fema-section-title" style={{ fontSize: "16px" }}>
                Financial Exception Copilot
              </h3>
              <p className="fema-section-sub">
                Ask questions directly about variance drivers, accounting rules, or GL reconciliation history
              </p>
            </div>
          </div>

          <AiChatWidget
            roleName="Finance Analyst"
            placeholder="e.g. Compare actuals vs budget for Technology Q3..."
            initialPrompt={chatPrompt}
          />
        </div>
      )}

      {/* Quick Action Modal */}
      {actionModalOpen && selectedTask && (
        <Modal
          isOpen={true}
          onClose={() => setActionModalOpen(false)}
          title={
            actionType === "RESOLVE"
              ? `Resolve Exception #${selectedTask.id}`
              : `Escalate Exception #${selectedTask.id} to Executive CFO`
          }
          subtitle={`${selectedTask.department} • ${selectedTask.category} (${selectedTask.variance_percent > 0 ? "+" : ""}${selectedTask.variance_percent}%)`}
        >
          <form onSubmit={handleExecuteQuickAction}>
            <div className="fema-form-group">
              <label className="fema-label">
                {actionType === "RESOLVE" ? "Audit Justification & Resolution Notes" : "Escalation Rationale for CFO"}
              </label>
              <textarea
                className="fema-textarea"
                rows={4}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Detail the root-cause justification or reason for CFO escalation..."
                required
                autoFocus
              />
            </div>

            <div className="fema-modal-actions">
              <button
                type="button"
                className="fema-btn fema-btn-outline"
                onClick={() => setActionModalOpen(false)}
                disabled={isSubmittingAction}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`fema-btn ${actionType === "RESOLVE" ? "fema-btn-success" : "fema-btn-danger"}`}
                disabled={isSubmittingAction}
              >
                {isSubmittingAction ? "Processing..." : `Confirm ${actionType}`}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
