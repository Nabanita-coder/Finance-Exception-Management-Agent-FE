import React, { useState, useEffect } from "react";
import { ANALYST_ENDPOINTS, getAuthHeaders } from "../config/apiConfig";
import { StatCard } from "./StatCard";
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

interface AnalystDashboardProps {
  activeSection?: "all" | "tasks" | "sla" | "insights" | "chat";
}

export const AnalystDashboard: React.FC<AnalystDashboardProps> = ({
  activeSection = "all",
}) => {
  const [tasks, setTasks] = useState<AnalystTask[]>([]);
  const [slaAlerts, setSlaAlerts] = useState<SlaAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const [chatPrompt, setChatPrompt] = useState("");

  const fetchAnalystData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksRes, alertsRes] = await Promise.all([
        fetch(ANALYST_ENDPOINTS.TASKS, { headers: getAuthHeaders() }),
        fetch(ANALYST_ENDPOINTS.SLA_ALERTS, { headers: getAuthHeaders() }),
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
        ? "Verified supplier invoice. Billing dispute resolved with retrospective credit note."
        : "Unbudgeted infrastructure variance exceeds authorized threshold. Escalating to CFO for executive review."
    );
    setActionModalOpen(true);
  };

  const criticalTasksCount = tasks.filter((t) => t.severity === "CRITICAL" || t.severity === "HIGH").length;
  const urgentSlaCount = slaAlerts.filter((a) => a.sla_status === "BREACHED" || a.sla_status === "CRITICAL_URGENT").length;

  return (
    <div className="fema-dashboard-view">
      {/* View Header */}
      <div className="fema-view-header">
        <div>
          <div className="fema-role-tag analyst">ROLE 1: FINANCE ANALYST & OWNER</div>
          <h1 className="fema-view-title">
            {activeSection === "tasks"
              ? "My Assigned Exceptions Queue"
              : activeSection === "sla"
              ? "SLA Tracker & Overdue Alerts"
              : activeSection === "insights"
              ? "AI Root-Cause Diagnostic & Quick Actions"
              : activeSection === "chat"
              ? "Financial Exception Copilot Chat"
              : "Action-Oriented Exception Workspace"}
          </h1>
          <p className="fema-view-desc">
            Resolve assigned budget deviations, track countdown SLA timers, review AI root-cause diagnostics, and escalate risks.
          </p>
        </div>
        <button
          className="fema-btn fema-btn-outline"
          onClick={fetchAnalystData}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "↻ Refresh Queue"}
        </button>
      </div>

      {error && <div className="fema-error-banner">⚠️ {error}</div>}

      {/* Top Stat Cards */}
      <div className="fema-stats-grid">
        <StatCard
          title="Assigned Exceptions"
          value={tasks.length}
          subtitle="Active items in your operational queue"
          badgeText="PRIORITY ORDERED"
          badgeVariant="primary"
          icon="📋"
        />
        <StatCard
          title="Urgent / High Priority"
          value={criticalTasksCount}
          subtitle="Variances > 25% requiring immediate action"
          badgeText={criticalTasksCount > 0 ? "ACTION REQUIRED" : "ON TRACK"}
          badgeVariant={criticalTasksCount > 0 ? "danger" : "success"}
          icon="🔥"
        />
        <StatCard
          title="SLA Breaches & Alerts"
          value={urgentSlaCount}
          subtitle="Countdowns nearing or past deadline"
          badgeText={urgentSlaCount > 0 ? "CRITICAL" : "HEALTHY"}
          badgeVariant={urgentSlaCount > 0 ? "danger" : "neutral"}
          icon="⏱️"
        />
        <StatCard
          title="AI Diagnostic Confidence"
          value="94.2%"
          subtitle="Hypothesis verified against historical trends"
          badgeText="COPILOT ACTIVE"
          badgeVariant="purple"
          icon="🤖"
        />
      </div>

      {/* Main Two-Column Layout */}
      <div className="fema-analyst-grid">
        {/* Left Column: Tasks Queue & SLA Tracker */}
        {(activeSection === "all" || activeSection === "tasks" || activeSection === "sla") && (
          <div className="fema-analyst-col">
            {/* Section 1: My Tasks (Assigned Exceptions) */}
            {(activeSection === "all" || activeSection === "tasks") && (
              <div className="fema-section-card">
                <div className="fema-section-header">
                  <div>
                    <h2 className="fema-section-title">1. My Tasks & Assigned Queue</h2>
                    <p className="fema-section-sub">
                      Assigned exception cases ordered from highest to lowest severity and variance
                    </p>
                  </div>
                  <span className="fema-count-pill">{tasks.length} cases</span>
                </div>

                <div className="fema-tasks-list">
                  {tasks.length === 0 ? (
                    <div className="fema-empty-state">No open exceptions in your queue! All cases resolved.</div>
                  ) : (
                    tasks.map((task) => {
                      const isSelected = selectedTask?.id === task.id;
                      return (
                        <div
                          key={task.id}
                          className={`fema-task-card ${isSelected ? "selected" : ""}`}
                          onClick={() => handleSelectTask(task)}
                        >
                          <div className="fema-task-top">
                            <div className="fema-task-dept-cat">
                              <span className="dept">{task.department}</span>
                              <span className="separator">•</span>
                              <span className="cat">{task.category}</span>
                            </div>
                            <Badge variant={getSeverityBadgeVariant(task.severity)} size="sm">
                              {task.severity}
                            </Badge>
                          </div>

                          <div className="fema-task-variance-row">
                            <div className="fema-task-var-pct">
                              {task.variance_percent > 0 ? "+" : ""}
                              {task.variance_percent.toFixed(1)}%
                            </div>
                            <div className="fema-task-amounts">
                              Actual: <strong>${task.actual_amount.toLocaleString()}</strong> / Budget: ${task.budget_amount.toLocaleString()}
                            </div>
                          </div>

                          <div className="fema-task-bottom">
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
            )}

            {/* Section 2: SLA Tracker & Red Alerts */}
            {(activeSection === "all" || activeSection === "sla") && (
              <div className="fema-section-card">
                <div className="fema-section-header">
                  <div>
                    <h2 className="fema-section-title">2. SLA Tracker & Alerts</h2>
                    <p className="fema-section-sub">Live countdowns and exceptions approaching resolution deadline</p>
                  </div>
                </div>

                <div className="fema-sla-list">
                  {slaAlerts.map((alert) => (
                    <div key={alert.id} className="fema-sla-item">
                      <div>
                        <div className="fema-sla-item-title">
                          #{alert.id} - {alert.department} ({alert.category})
                        </div>
                        <div className="fema-sla-item-sub">
                          Variance: <strong>{alert.variance_percent > 0 ? "+" : ""}{alert.variance_percent}%</strong>
                        </div>
                      </div>
                      <SlaCountdown deadline={alert.sla_deadline} status={alert.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right Column: AI Root-Cause Diagnostic & Quick Actions & Chat */}
        {(activeSection === "all" || activeSection === "insights" || activeSection === "chat") && (
          <div className="fema-analyst-col">
            {/* Section 3: AI Insights & Root-Cause Analysis */}
            {(activeSection === "all" || activeSection === "insights") && (
              <div className="fema-section-card highlight">
                <div className="fema-section-header">
                  <div>
                    <h2 className="fema-section-title">3. AI Insights & Root-Cause Diagnostics</h2>
                    <p className="fema-section-sub">
                      Root-cause evaluation and remediation advice for Case #{selectedTask?.id || "—"}
                    </p>
                  </div>
                  <Badge variant="purple" size="sm">
                    AI Confidence: 94%
                  </Badge>
                </div>

                {loadingInsight ? (
                  <div className="fema-ai-loading">Evaluating multivariate anomaly hypothesis...</div>
                ) : aiInsight ? (
                  <div className="fema-insight-body">
                    <div className="fema-insight-box primary">
                      <div className="fema-insight-title">AI Root-Cause Hypothesis:</div>
                      <p className="fema-insight-text">{aiInsight.primary_hypothesis}</p>
                    </div>

                    <div className="fema-insight-box">
                      <div className="fema-insight-title">Key Contributing Variance Drivers:</div>
                      <ul className="fema-insight-list">
                        {aiInsight.contributing_factors.map((f, idx) => (
                          <li key={idx}>{f}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="fema-insight-box">
                      <div className="fema-insight-title">Suggested Remediation Steps:</div>
                      <ul className="fema-insight-list">
                        {aiInsight.recommended_actions.map((act, idx) => (
                          <li key={idx}>{act}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Section 4: Quick Action Panel */}
                    <div className="fema-action-panel">
                      <div className="fema-action-panel-title">4. Quick Action Panel:</div>
                      <div className="fema-action-buttons">
                        <button
                          className="fema-btn fema-btn-success"
                          onClick={() => openActionDialog("RESOLVE")}
                        >
                          ✓ Resolve & Submit Explanation
                        </button>
                        <button
                          className="fema-btn fema-btn-danger"
                          onClick={() => openActionDialog("ESCALATE")}
                        >
                          ▲ Escalate to Level 2 (CFO)
                        </button>
                        <button
                          className="fema-btn fema-btn-outline"
                          onClick={() =>
                            setChatPrompt(
                              `Explain why ${selectedTask?.department} has a ${selectedTask?.variance_percent}% variance in ${selectedTask?.category}.`
                            )
                          }
                        >
                          Ask AI Copilot About This Case
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="fema-empty-state">Select an exception from the queue to inspect AI analysis.</div>
                )}
              </div>
            )}

            {/* Section 5: Conversational AI Copilot Widget */}
            {(activeSection === "all" || activeSection === "chat") && (
              <div className="fema-section-card">
                <div className="fema-section-header">
                  <div>
                    <h2 className="fema-section-title">5. Conversational AI Assistant</h2>
                    <p className="fema-section-sub">
                      Ask questions directly about exception history, invoices, or budget policies
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
          </div>
        )}
      </div>

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
                {actionType === "RESOLVE" ? "Justification & Resolution Notes" : "Escalation Reason for CFO"}
              </label>
              <textarea
                className="fema-textarea"
                rows={4}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Detail the audit explanation or reason for escalation..."
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
