import React, { useState, useEffect } from "react";
import { CFO_ENDPOINTS, getAuthHeaders } from "../config/apiConfig";
import { StatCard } from "./StatCard";
import { Badge, getSeverityBadgeVariant } from "./Badge";
import { AiChatWidget } from "./AiChatWidget";

interface EarlyWarning {
  title: string;
  risk_level: string;
  description: string;
  impacted_area: string;
  review_deadline: string;
}

interface EscalatedRisk {
  id: number;
  financial_record_id: number;
  category: string;
  department: string;
  period: string;
  budget_amount: number;
  actual_amount: number;
  variance_amount: number;
  variance_percent: number;
  severity: string;
  possible_reason: string;
  status: string;
  escalation_level: number;
  owner_name: string;
  updated_at: string | null;
}

interface ExecutiveBrief {
  title: string;
  ai_summary: string;
  period_start: string | null;
  period_end: string | null;
  critical_count: number;
  overall_health_grade: string;
}

interface CfoDashboardProps {
  activeSection?: "all" | "kpis" | "warnings" | "risks" | "brief" | "chat";
}

export const CfoDashboard: React.FC<CfoDashboardProps> = ({
  activeSection = "all",
}) => {
  const [kpis, setKpis] = useState<any>(null);
  const [warnings, setWarnings] = useState<EarlyWarning[]>([]);
  const [escalatedRisks, setEscalatedRisks] = useState<EscalatedRisk[]>([]);
  const [brief, setBrief] = useState<ExecutiveBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatPrompt, setChatPrompt] = useState("");

  const fetchCfoData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [kpisRes, warningsRes, risksRes, briefRes] = await Promise.all([
        fetch(CFO_ENDPOINTS.KPIS, { headers: getAuthHeaders() }),
        fetch(CFO_ENDPOINTS.EARLY_WARNINGS, { headers: getAuthHeaders() }),
        fetch(CFO_ENDPOINTS.ESCALATED_RISKS, { headers: getAuthHeaders() }),
        fetch(CFO_ENDPOINTS.EXECUTIVE_BRIEF, { headers: getAuthHeaders() }),
      ]);

      const [kpisData, warningsData, risksData, briefData] = await Promise.all([
        kpisRes.json(),
        warningsRes.json(),
        risksRes.json(),
        briefRes.json(),
      ]);

      if (kpisData.success) setKpis(kpisData.kpis);
      if (warningsData.success) setWarnings(warningsData.warnings || []);
      if (risksData.success) setEscalatedRisks(risksData.risks || []);
      if (briefData.success) setBrief(briefData.brief);
    } catch (err: any) {
      setError("Failed to load CFO executive telemetry: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCfoData();
  }, []);

  return (
    <div className="fema-dashboard-view">
      {/* View Header */}
      <div className="fema-view-header">
        <div>
          <div className="fema-role-tag cfo">ROLE 2: FINANCE LEADERSHIP / EXECUTIVE (CFO)</div>
          <h1 className="fema-view-title">
            {activeSection === "kpis"
              ? "Strategic Financial Indicators & Cash Telemetry"
              : activeSection === "warnings"
              ? "Early Warning Signals & Covenant Breaches"
              : activeSection === "risks"
              ? "Escalated Material Risks Sign-off"
              : activeSection === "brief"
              ? "Automated AI Executive Briefing"
              : activeSection === "chat"
              ? "Executive Natural Language Financial Query"
              : "Executive Financial Overview & Risk Governance"}
          </h1>
          <p className="fema-view-desc">
            Strategic liquidity & cash flow metrics, early covenant warnings, escalated material exceptions, and AI executive briefings.
          </p>
        </div>
        <button
          className="fema-btn fema-btn-outline"
          onClick={fetchCfoData}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "↻ Refresh Telemetry"}
        </button>
      </div>

      {error && <div className="fema-error-banner">⚠️ {error}</div>}

      {/* Section 1: High-Level Financial KPIs */}
      {(activeSection === "all" || activeSection === "kpis") && (
        <div className="fema-stats-grid">
          <StatCard
            title="Operating Cash Flow"
            value="$12.85M"
            subtitle="Net cash generated from operations"
            trend={{ value: "8.4%", isPositive: true, label: "YoY" }}
            badgeText="HEALTHY"
            badgeVariant="success"
            icon="💵"
          />
          <StatCard
            title="Liquidity / Current Ratio"
            value="2.35x"
            subtitle="Target minimum threshold: 1.50x"
            trend={{ value: "0.2x", isPositive: true, label: "vs covenant" }}
            badgeText="SAFE"
            badgeVariant="info"
            icon="🏦"
          />
          <StatCard
            title="EBITDA / Operating Margin"
            value="19.2%"
            subtitle="Target margin: 18.0%"
            trend={{ value: "1.2%", isPositive: true, label: "spread" }}
            badgeText="EXCEEDING"
            badgeVariant="success"
            icon="📈"
          />
          <StatCard
            title="Net Budget Variance"
            value={kpis ? `${kpis.budget_variance?.net_variance_pct > 0 ? "+" : ""}${kpis.budget_variance?.net_variance_pct}%` : "+26.4%"}
            subtitle={`Total actual: $${kpis ? kpis.budget_variance?.total_actual?.toLocaleString() : "440,000"}`}
            badgeText="ATTENTION REQUIRED"
            badgeVariant="warning"
            icon="⚖️"
          />
        </div>
      )}

      {/* Two Column Grid */}
      <div className="fema-analyst-grid">
        {/* Left Column: Brief & Warnings */}
        {(activeSection === "all" || activeSection === "brief" || activeSection === "warnings") && (
          <div className="fema-analyst-col">
            {/* Section 4: Automated AI Executive Brief */}
            {(activeSection === "all" || activeSection === "brief") && (
              <div className="fema-section-card executive-brief-card">
                <div className="fema-section-header">
                  <div>
                    <h2 className="fema-section-title">4. Automated AI Executive Brief</h2>
                    <p className="fema-section-sub">
                      Synthesized weekly briefing of financial performance and risk exposure
                    </p>
                  </div>
                  <Badge variant="purple" size="md">
                    Grade: {brief?.overall_health_grade || "STABLE"}
                  </Badge>
                </div>

                <div className="fema-brief-content">
                  <div className="fema-brief-summary">
                    <span className="fema-brief-icon">✨</span>
                    <p>
                      {brief?.ai_summary ||
                        "Overall operating expenditures are tracking within expected volatility buffers with 3 high-priority exceptions flagged for executive review."}
                    </p>
                  </div>

                  <div className="fema-brief-meta-row">
                    <div className="meta-item">
                      <span className="lbl">Critical Escalations</span>
                      <span className="val urgent">{brief?.critical_count || escalatedRisks.length}</span>
                    </div>
                    <div className="meta-item">
                      <span className="lbl">Reporting Window</span>
                      <span className="val">Past 7 Days (Consolidated)</span>
                    </div>
                    <div className="meta-item">
                      <span className="lbl">AI Confidence</span>
                      <span className="val">96.8% Deterministic</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 2: Early Warning Signals & Covenants */}
            {(activeSection === "all" || activeSection === "warnings") && (
              <div className="fema-section-card">
                <div className="fema-section-header">
                  <div>
                    <h2 className="fema-section-title">2. Early Warning Signals & Covenants</h2>
                    <p className="fema-section-sub">
                      Predictive indicators for potential covenant breaches and cost overruns
                    </p>
                  </div>
                  <Badge variant="danger" size="sm">
                    Radar Active
                  </Badge>
                </div>

                <div className="fema-warnings-list">
                  {warnings.map((w, idx) => (
                    <div key={idx} className="fema-warning-item">
                      <div className="fema-warning-top">
                        <span className="fema-warning-title">{w.title}</span>
                        <Badge variant={w.risk_level === "High" ? "danger" : "warning"} size="sm">
                          {w.risk_level} Risk
                        </Badge>
                      </div>
                      <p className="fema-warning-desc">{w.description}</p>
                      <div className="fema-warning-foot">
                        <span>Impacted Area: <strong>{w.impacted_area}</strong></span>
                        <span>Review Deadline: <strong>{w.review_deadline}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right Column: Escalated Risks & Advanced AI Query */}
        {(activeSection === "all" || activeSection === "risks" || activeSection === "chat") && (
          <div className="fema-analyst-col">
            {/* Section 3: Escalated Material Risks Queue */}
            {(activeSection === "all" || activeSection === "risks") && (
              <div className="fema-section-card">
                <div className="fema-section-header">
                  <div>
                    <h2 className="fema-section-title">3. Escalated Material Risks</h2>
                    <p className="fema-section-sub">
                      Material variance exceptions escalated by analysts requiring executive sign-off
                    </p>
                  </div>
                  <Badge variant="danger" size="sm">
                    {escalatedRisks.length} Pending Sign-off
                  </Badge>
                </div>

                <div className="fema-escalated-list">
                  {escalatedRisks.length === 0 ? (
                    <div className="fema-empty-state">No unresolved escalated exceptions pending. All clear! 🎉</div>
                  ) : (
                    escalatedRisks.map((risk) => (
                      <div key={risk.id} className="fema-escalated-item">
                        <div className="fema-risk-head">
                          <div>
                            <span className="fema-risk-id">Case #{risk.id}</span>
                            <span className="fema-risk-dept"> • {risk.department} ({risk.category})</span>
                          </div>
                          <Badge variant={getSeverityBadgeVariant(risk.severity)} size="sm">
                            {risk.severity}
                          </Badge>
                        </div>

                        <div className="fema-risk-amounts">
                          <div className="var-col">
                            <span className="label">Variance</span>
                            <span className="val danger">
                              {risk.variance_percent > 0 ? "+" : ""}{risk.variance_percent}%
                            </span>
                          </div>
                          <div className="var-col">
                            <span className="label">Actual</span>
                            <span className="val">${risk.actual_amount.toLocaleString()}</span>
                          </div>
                          <div className="var-col">
                            <span className="label">Budget</span>
                            <span className="val">${risk.budget_amount.toLocaleString()}</span>
                          </div>
                        </div>

                        {risk.possible_reason && (
                          <div className="fema-risk-reason">
                            <strong>Analyst Note:</strong> {risk.possible_reason}
                          </div>
                        )}

                        <div className="fema-risk-actions">
                          <button
                            className="fema-btn fema-btn-xs fema-btn-success"
                            onClick={() => alert(`CFO Approval recorded for Exception Case #${risk.id}. Audit log updated.`)}
                          >
                            ✓ Approve Override
                          </button>
                          <button
                            className="fema-btn fema-btn-xs fema-btn-outline"
                            onClick={() =>
                              setChatPrompt(
                                `Analyze financial impact on quarterly EBITDA if we approve Exception #${risk.id} ($${risk.variance_amount.toLocaleString()} variance).`
                              )
                            }
                          >
                            Ask AI Impact
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Section 5: Advanced Conversational AI Query Window */}
            {(activeSection === "all" || activeSection === "chat") && (
              <div className="fema-section-card">
                <div className="fema-section-header">
                  <div>
                    <h2 className="fema-section-title">5. Advanced Conversational AI Query</h2>
                    <p className="fema-section-sub">
                      Query high-level financial parameters and scenario projections in natural language
                    </p>
                  </div>
                </div>

                <div className="fema-suggested-queries">
                  <span className="label">Suggested CFO Prompts:</span>
                  <button
                    className="fema-query-chip"
                    onClick={() => setChatPrompt("What was our biggest cash flow variance last week and what caused it?")}
                  >
                    "What was our biggest cash flow variance last week?"
                  </button>
                  <button
                    className="fema-query-chip"
                    onClick={() => setChatPrompt("Which business units have exceeded their quarterly operating expenditure by more than 15%?")}
                  >
                    "Which departments exceeded operating expenditure by &gt;15%?"
                  </button>
                </div>

                <AiChatWidget
                  roleName="Chief Financial Officer (Executive)"
                  placeholder="e.g. Summarize liquidity reserves and covenant risk..."
                  initialPrompt={chatPrompt}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
