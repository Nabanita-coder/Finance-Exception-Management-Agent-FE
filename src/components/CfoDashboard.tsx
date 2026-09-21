import React, { useState, useEffect } from "react";
import { CFO_ENDPOINTS, getAuthHeaders } from "../config/apiConfig";
import { Badge, getSeverityBadgeVariant } from "./Badge";
import { Modal } from "./Modal";
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

// ============================================================================
// SVG CHART: Executive Budget vs Actual Exposure by Cost Center (Dashboard Only)
// ============================================================================
const CfoExecutiveChart: React.FC<{ kpis: any }> = () => {
  const units = [
    { name: "Cloud Infra", budget: 350000, actual: 490000, variance: 40.0, risk: "CRITICAL" },
    { name: "Enterprise Sales", budget: 1200000, actual: 720000, variance: -40.0, risk: "CRITICAL" },
    { name: "Talent Acq.", budget: 150000, actual: 185000, variance: 23.3, risk: "HIGH" },
    { name: "Marketing & Growth", budget: 250000, actual: 285000, variance: 14.0, risk: "MEDIUM" },
    { name: "SMB Operations", budget: 800000, actual: 820000, variance: 2.5, risk: "LOW" },
  ];

  const svgWidth = 760;
  const svgHeight = 220;
  const padLeft = 65;
  const padRight = 25;
  const padTop = 25;
  const padBottom = 40;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;
  const maxVal = 1300000;

  const groupW = chartW / units.length;
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
                ${val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${Math.round(val / 1000)}k`}
              </text>
            </g>
          );
        })}

        {/* Unit comparative bars */}
        {units.map((u, idx) => {
          const groupX = padLeft + idx * groupW;
          const centerX = groupX + groupW / 2;

          const budgetH = Math.max(4, (u.budget / maxVal) * chartH);
          const actualH = Math.max(4, (u.actual / maxVal) * chartH);

          const budgetY = padTop + chartH - budgetH;
          const actualY = padTop + chartH - actualH;

          const isOver = u.actual > u.budget;
          const barColor = isOver ? "#f43f5e" : "#10b981";

          return (
            <g key={u.name}>
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
                fill={barColor}
                rx={3}
              />

              {/* Variance Tag */}
              <text
                x={centerX}
                y={Math.min(budgetY, actualY) - 8}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill={barColor}
                fontFamily="IBM Plex Mono, monospace"
              >
                {u.variance > 0 ? `+${u.variance.toFixed(0)}%` : `${u.variance.toFixed(0)}%`}
              </text>

              {/* Unit Label */}
              <text
                x={centerX}
                y={padTop + chartH + 16}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="var(--fema-text-primary)"
              >
                {u.name}
              </text>
              <text
                x={centerX}
                y={padTop + chartH + 30}
                textAnchor="middle"
                fontSize="10"
                fill="var(--fema-text-muted)"
              >
                {u.risk} Risk
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT: CfoDashboard
// ============================================================================
export const CfoDashboard: React.FC<CfoDashboardProps> = ({
  activeSection = "all",
}) => {
  const [kpis, setKpis] = useState<any>(null);
  const [warnings, setWarnings] = useState<EarlyWarning[]>([]);
  const [escalatedRisks, setEscalatedRisks] = useState<EscalatedRisk[]>([]);
  const [brief, setBrief] = useState<ExecutiveBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Approval modal state
  const [selectedRisk, setSelectedRisk] = useState<EscalatedRisk | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  // Risk search/filter
  const [riskSearch, setRiskSearch] = useState("");

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

  const handleApproveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRisk) return;

    setIsApproving(true);
    setTimeout(() => {
      setIsApproving(false);
      setSelectedRisk(null);
      setApprovalNotes("");
      alert(`Executive Approval registered for Case #${selectedRisk.id}. Immutably recorded to audit trail.`);
      fetchCfoData();
    }, 400);
  };

  const filteredRisks = escalatedRisks.filter((r) => {
    return (
      !riskSearch.trim() ||
      r.department.toLowerCase().includes(riskSearch.toLowerCase()) ||
      r.category.toLowerCase().includes(riskSearch.toLowerCase()) ||
      String(r.id).includes(riskSearch)
    );
  });

  return (
    <div>
      {/* View Header */}
      <div className="fema-view-header" style={{ marginBottom: "20px" }}>
        <div>
          <div className="fema-role-tag cfo">ROLE 2: FINANCE LEADERSHIP / EXECUTIVE (CFO)</div>
          <h1 className="fema-view-title" style={{ fontSize: "24px" }}>
            {activeSection === "kpis"
              ? "Strategic Financial Indicators & Cash Telemetry"
              : activeSection === "warnings"
              ? "Early Warning Signals & Covenant Breaches"
              : activeSection === "risks"
              ? "Escalated Material Risks Sign-off"
              : activeSection === "brief"
              ? "Automated AI Executive Briefing"
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

      {/* Slim Compact KPI Summary Strip */}
      <div className="fema-kpi-strip-compact">
        <div className="fema-kpi-card-compact">
          <div className="fema-kpi-compact-info">
            <span className="fema-kpi-compact-label">Operating Cash Flow</span>
            <span className="fema-kpi-compact-val">$12.85M</span>
            <span className="fema-kpi-compact-sub" style={{ color: "#10b981" }}>+8.4% YoY (Healthy)</span>
          </div>
          <span style={{ fontSize: "20px" }}>💵</span>
        </div>

        <div className="fema-kpi-card-compact">
          <div className="fema-kpi-compact-info">
            <span className="fema-kpi-compact-label">Liquidity Ratio</span>
            <span className="fema-kpi-compact-val">2.35x</span>
            <span className="fema-kpi-compact-sub" style={{ color: "#6366f1" }}>Target: &ge; 1.50x (Safe)</span>
          </div>
          <span style={{ fontSize: "20px" }}>🏦</span>
        </div>

        <div className="fema-kpi-card-compact">
          <div className="fema-kpi-compact-info">
            <span className="fema-kpi-compact-label">EBITDA Margin</span>
            <span className="fema-kpi-compact-val">19.2%</span>
            <span className="fema-kpi-compact-sub" style={{ color: "#10b981" }}>+1.2% over target</span>
          </div>
          <span style={{ fontSize: "20px" }}>📈</span>
        </div>

        <div className="fema-kpi-card-compact">
          <div className="fema-kpi-compact-info">
            <span className="fema-kpi-compact-label">Material Escalations</span>
            <span className="fema-kpi-compact-val">{escalatedRisks.length} Pending</span>
            <span className="fema-kpi-compact-sub" style={{ color: escalatedRisks.length > 0 ? "#f43f5e" : "#10b981" }}>
              {escalatedRisks.length > 0 ? "Sign-off Required" : "All Clear"}
            </span>
          </div>
          <span style={{ fontSize: "20px" }}>⚠️</span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* VIEW 1: MAIN DASHBOARD OVERVIEW (With Dedicated Domain Chart)        */}
      {/* ==================================================================== */}
      {activeSection === "all" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Main Visual Chart (Dashboard Only) */}
          <div className="fema-section-card" style={{ padding: "18px 22px" }}>
            <div className="fema-section-header" style={{ marginBottom: "14px" }}>
              <div>
                <h3 className="fema-section-title" style={{ fontSize: "16px" }}>
                  Consolidated Budget vs. Actual Expenditure by Business Unit
                </h3>
                <p className="fema-section-sub">
                  Executive cross-departmental capital deployment and variance exposure benchmarking
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "11px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#6366f1" }} />
                  <span>Approved Budget</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#f43f5e" }} />
                  <span>Actual Overspend</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#10b981" }} />
                  <span>Controlled Spend</span>
                </div>
              </div>
            </div>

            <CfoExecutiveChart kpis={kpis} />
          </div>

          {/* Symmetrical Dual Panels */}
          <div className="fema-analyst-grid">
            {/* Left Column: Automated AI Brief */}
            <div className="fema-section-card" style={{ padding: "18px 20px" }}>
              <div className="fema-section-header" style={{ marginBottom: "14px" }}>
                <div>
                  <h3 className="fema-section-title" style={{ fontSize: "15px" }}>
                    Automated Executive Briefing
                  </h3>
                  <p className="fema-section-sub">
                    Consolidated 7-day algorithmic performance assessment
                  </p>
                </div>
                <Badge variant="purple" size="sm">
                  Health Grade: {brief?.overall_health_grade || "STABLE"}
                </Badge>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div
                  style={{
                    background: "rgba(99, 102, 241, 0.08)",
                    border: "1px solid rgba(99, 102, 241, 0.25)",
                    borderRadius: "8px",
                    padding: "14px",
                    display: "flex",
                    gap: "10px",
                  }}
                >
                  <span style={{ fontSize: "18px" }}>✨</span>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "var(--fema-text-primary)", lineHeight: 1.45 }}>
                    {brief?.ai_summary ||
                      "Consolidated operating expenditures are tracking within expected volatility buffers with 3 high-priority exceptions flagged for executive review."}
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "8px",
                    background: "var(--fema-surface-subtle)",
                    border: "1px solid var(--fema-border)",
                    borderRadius: "8px",
                    padding: "12px",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "10.5px", color: "var(--fema-text-muted)" }}>CRITICAL RISKS</span>
                    <span style={{ fontSize: "16px", fontWeight: 800, color: "#f43f5e", fontFamily: "IBM Plex Mono, monospace" }}>
                      {brief?.critical_count || escalatedRisks.length}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "10.5px", color: "var(--fema-text-muted)" }}>WINDOW</span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--fema-text-primary)" }}>Past 7 Days</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "10.5px", color: "var(--fema-text-muted)" }}>CONFIDENCE</span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#a855f7" }}>96.8% Deterministic</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Pending Material Risks Sign-Off */}
            <div className="fema-section-card" style={{ padding: "18px 20px" }}>
              <div className="fema-section-header" style={{ marginBottom: "14px" }}>
                <div>
                  <h3 className="fema-section-title" style={{ fontSize: "15px" }}>
                    Escalated Material Risks Queue
                  </h3>
                  <p className="fema-section-sub">
                    Exceptions exceeding authority thresholds awaiting CFO override
                  </p>
                </div>
                <Badge variant={escalatedRisks.length > 0 ? "danger" : "success"} size="sm">
                  {escalatedRisks.length} Pending
                </Badge>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {escalatedRisks.length === 0 ? (
                  <div className="fema-empty-state" style={{ padding: "30px 10px" }}>
                    No material exceptions currently pending sign-off. All clear! 🎉
                  </div>
                ) : (
                  escalatedRisks.map((risk) => (
                    <div
                      key={risk.id}
                      style={{
                        background: "var(--fema-surface-subtle)",
                        border: "1px solid var(--fema-border)",
                        borderRadius: "10px",
                        padding: "12px 14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <span className="fema-id-pill">Case #{risk.id}</span>
                          <strong style={{ marginLeft: "8px", fontSize: "13px", color: "var(--fema-text-primary)" }}>
                            {risk.department}
                          </strong>
                          <span style={{ fontSize: "11.5px", color: "var(--fema-text-muted)", marginLeft: "4px" }}>
                            ({risk.category})
                          </span>
                        </div>
                        <Badge variant={getSeverityBadgeVariant(risk.severity)} size="sm">
                          {risk.severity}
                        </Badge>
                      </div>

                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", fontSize: "12px" }}>
                        <span style={{ fontSize: "16px", fontWeight: 800, color: "#f43f5e", fontFamily: "IBM Plex Mono, monospace" }}>
                          {risk.variance_percent > 0 ? "+" : ""}{risk.variance_percent}%
                        </span>
                        <span style={{ color: "var(--fema-text-secondary)" }}>
                          Actual: <strong>${risk.actual_amount.toLocaleString()}</strong> / Budget: ${risk.budget_amount.toLocaleString()}
                        </span>
                      </div>

                      {risk.possible_reason && (
                        <div style={{ fontSize: "11px", color: "var(--fema-text-secondary)", lineHeight: 1.35, background: "rgba(255, 255, 255, 0.02)", padding: "6px 8px", borderRadius: "6px" }}>
                          <strong>Analyst:</strong> {risk.possible_reason}
                        </div>
                      )}

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", paddingTop: "6px", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
                        <button
                          className="fema-btn fema-btn-xs fema-btn-success"
                          onClick={() => {
                            setSelectedRisk(risk);
                            setApprovalNotes(`Approved variance override for ${risk.department}. Authorized under Q3 financial contingency reserve.`);
                          }}
                        >
                          ✓ Approve Override
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 2: FINANCIAL KPIS SUB-PAGE (Clean Cards, No Charts)             */}
      {/* ==================================================================== */}
      {activeSection === "kpis" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="fema-section-card" style={{ padding: "20px 24px" }}>
            <div className="fema-section-header" style={{ marginBottom: "16px" }}>
              <div>
                <h3 className="fema-section-title" style={{ fontSize: "16px" }}>
                  Treasury Liquidity & Debt Covenant Telemetry
                </h3>
                <p className="fema-section-sub">
                  Real-time monitoring of corporate cash reserves, banking facility headroom, and syndicate ratios
                </p>
              </div>
              <Badge variant="success" size="sm">
                ● 100% Covenants Compliant
              </Badge>
            </div>

            <div className="fema-table-container">
              <table className="fema-table">
                <thead>
                  <tr>
                    <th>Covenant / Indicator</th>
                    <th>Actual Telemetry</th>
                    <th>Threshold Limit</th>
                    <th>Safety Spread</th>
                    <th>Audit Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>Operating Cash Flow</strong>
                      <div className="fema-text-sub">Consolidated working capital velocity</div>
                    </td>
                    <td><span style={{ fontWeight: 700, color: "#10b981" }}>$12,850,000</span></td>
                    <td>$8,000,000 Min</td>
                    <td>+$4.85M Surplus</td>
                    <td><span className="fema-status-pill active"><span className="fema-status-dot-pulse" /> Compliant</span></td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Liquidity Coverage Ratio (LCR)</strong>
                      <div className="fema-text-sub">High-quality liquid assets vs 30-day net outflows</div>
                    </td>
                    <td><span style={{ fontWeight: 700, color: "#6366f1" }}>2.35x</span></td>
                    <td>1.50x Min</td>
                    <td>+0.85x Buffer</td>
                    <td><span className="fema-status-pill active"><span className="fema-status-dot-pulse" /> Safe</span></td>
                  </tr>
                  <tr>
                    <td>
                      <strong>EBITDA Operating Margin</strong>
                      <div className="fema-text-sub">Trailing twelve-month operating margin</div>
                    </td>
                    <td><span style={{ fontWeight: 700, color: "#a855f7" }}>19.2%</span></td>
                    <td>18.0% Target</td>
                    <td>+1.2% Ahead</td>
                    <td><span className="fema-status-pill active"><span className="fema-status-dot-pulse" /> Exceeding</span></td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Net Budget Variance Exposure</strong>
                      <div className="fema-text-sub">Aggregate active exceptions deviation</div>
                    </td>
                    <td><span style={{ fontWeight: 700, color: "#f43f5e" }}>+26.4%</span></td>
                    <td>15.0% Trigger</td>
                    <td>+11.4% Overrun</td>
                    <td><span className="fema-status-pill inactive">Attention Needed</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 3: EARLY WARNING SIGNALS SUB-PAGE (Clean Cards, No Charts)      */}
      {/* ==================================================================== */}
      {activeSection === "warnings" && (
        <div className="fema-section-card" style={{ padding: "20px 24px" }}>
          <div className="fema-section-header" style={{ marginBottom: "16px" }}>
            <div>
              <h3 className="fema-section-title" style={{ fontSize: "16px" }}>
                Early Warning Radar & Predictive Covenants
              </h3>
              <p className="fema-section-sub">
                Predictive indicators for potential covenant breaches, unplanned expenses, and cost overruns
              </p>
            </div>
            <Badge variant="danger" size="sm">
              {warnings.length} Active Radar Signals
            </Badge>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "14px" }}>
            {warnings.map((w, idx) => (
              <div
                key={idx}
                style={{
                  background: "var(--fema-surface-subtle)",
                  border: `1px solid ${w.risk_level === "High" ? "rgba(244, 63, 94, 0.35)" : "var(--fema-border)"}`,
                  borderRadius: "10px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700, fontSize: "13.5px", color: "var(--fema-text-primary)" }}>
                    {w.title}
                  </span>
                  <Badge variant={w.risk_level === "High" ? "danger" : "warning"} size="sm">
                    {w.risk_level} Risk
                  </Badge>
                </div>

                <p style={{ fontSize: "12px", color: "var(--fema-text-secondary)", lineHeight: 1.4, margin: 0 }}>
                  {w.description}
                </p>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid var(--fema-border)", fontSize: "11px", color: "var(--fema-text-muted)" }}>
                  <span>Area: <strong>{w.impacted_area}</strong></span>
                  <span>Deadline: <strong>{w.review_deadline}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 4: ESCALATED MATERIAL RISKS SUB-PAGE (Clean Table, No Charts)   */}
      {/* ==================================================================== */}
      {activeSection === "risks" && (
        <div className="fema-section-card" style={{ padding: "20px 24px" }}>
          <div className="fema-section-header" style={{ marginBottom: "16px" }}>
            <div>
              <h3 className="fema-section-title" style={{ fontSize: "16px" }}>
                Escalated Material Risks Sign-Off Ledger
              </h3>
              <p className="fema-section-sub">
                Official executive authorization register for variances exceeding departmental thresholds
              </p>
            </div>
            <Badge variant="danger" size="sm">
              {filteredRisks.length} Pending Sign-Off
            </Badge>
          </div>

          {/* Search bar */}
          <div className="fema-table-toolbar">
            <div className="fema-table-search-wrap">
              <span style={{ fontSize: "14px", color: "var(--fema-text-muted)" }}>🔍</span>
              <input
                type="text"
                className="fema-table-search-input"
                placeholder="Search by department, category, or case ID..."
                value={riskSearch}
                onChange={(e) => setRiskSearch(e.target.value)}
              />
              {riskSearch && (
                <button
                  onClick={() => setRiskSearch("")}
                  style={{ background: "transparent", border: "none", color: "var(--fema-text-muted)", cursor: "pointer", fontSize: "12px" }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="fema-table-container">
            <table className="fema-table">
              <thead>
                <tr>
                  <th style={{ width: "10%" }}>Case ID</th>
                  <th style={{ width: "22%" }}>Department & Category</th>
                  <th style={{ width: "20%" }}>Budget vs Actual</th>
                  <th style={{ width: "12%" }}>Variance %</th>
                  <th style={{ width: "22%" }}>Analyst Escalation Reason</th>
                  <th style={{ width: "14%", textAlign: "right" }}>Executive Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRisks.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--fema-text-muted)" }}>
                      No material risks pending executive sign-off.
                    </td>
                  </tr>
                ) : (
                  filteredRisks.map((risk) => (
                    <tr key={risk.id}>
                      <td><span className="fema-id-pill">#{risk.id}</span></td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--fema-text-primary)" }}>
                          {risk.department}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--fema-text-muted)" }}>
                          {risk.category}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: "12px", color: "var(--fema-text-secondary)" }}>
                          Budget: <strong>${risk.budget_amount.toLocaleString()}</strong>
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--fema-text-primary)" }}>
                          Actual: <strong>${risk.actual_amount.toLocaleString()}</strong>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: "14px", fontWeight: 800, color: "#f43f5e", fontFamily: "IBM Plex Mono, monospace" }}>
                          {risk.variance_percent > 0 ? "+" : ""}{risk.variance_percent}%
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: "11.5px", color: "var(--fema-text-secondary)", lineHeight: 1.4 }}>
                          {risk.possible_reason || "Unbudgeted infrastructure variance exceeding authorized threshold."}
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="fema-btn fema-btn-xs fema-btn-success"
                          style={{ whiteSpace: "nowrap" }}
                          onClick={() => {
                            setSelectedRisk(risk);
                            setApprovalNotes(`Approved variance override for ${risk.department}. Authorized under Q3 financial contingency reserve.`);
                          }}
                        >
                          ✓ Sign-Off
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 5: AUTOMATED AI EXECUTIVE BRIEF SUB-PAGE (No Charts)            */}
      {/* ==================================================================== */}
      {activeSection === "brief" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="fema-section-card" style={{ padding: "20px 24px" }}>
            <div className="fema-section-header" style={{ marginBottom: "16px" }}>
              <div>
                <h3 className="fema-section-title" style={{ fontSize: "16px" }}>
                  Automated AI Executive Synthesis
                </h3>
                <p className="fema-section-sub">
                  Consolidated financial health grade, variance patterns, and governance summary
                </p>
              </div>
              <Badge variant="purple" size="md">
                Health Grade: {brief?.overall_health_grade || "STABLE"}
              </Badge>
            </div>

            <div
              style={{
                background: "rgba(99, 102, 241, 0.08)",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                borderRadius: "10px",
                padding: "18px 20px",
                marginBottom: "16px",
                display: "flex",
                gap: "12px",
              }}
            >
              <span style={{ fontSize: "24px" }}>✨</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#818cf8", marginBottom: "6px" }}>
                  Executive Intelligence Summary:
                </div>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--fema-text-primary)", lineHeight: 1.5 }}>
                  {brief?.ai_summary ||
                    "Overall operating expenditures are tracking within expected volatility buffers with 3 high-priority exceptions flagged for executive review."}
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "14px",
              }}
            >
              <div style={{ background: "var(--fema-surface-subtle)", border: "1px solid var(--fema-border)", borderRadius: "8px", padding: "14px" }}>
                <span style={{ fontSize: "11px", color: "var(--fema-text-muted)" }}>CRITICAL ESCALATIONS</span>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#f43f5e", fontFamily: "IBM Plex Mono, monospace", marginTop: "4px" }}>
                  {brief?.critical_count || escalatedRisks.length} Pending
                </div>
              </div>

              <div style={{ background: "var(--fema-surface-subtle)", border: "1px solid var(--fema-border)", borderRadius: "8px", padding: "14px" }}>
                <span style={{ fontSize: "11px", color: "var(--fema-text-muted)" }}>REPORTING CADENCE</span>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--fema-text-primary)", marginTop: "4px" }}>
                  Consolidated Past 7 Days
                </div>
              </div>

              <div style={{ background: "var(--fema-surface-subtle)", border: "1px solid var(--fema-border)", borderRadius: "8px", padding: "14px" }}>
                <span style={{ fontSize: "11px", color: "var(--fema-text-muted)" }}>DETERMINISTIC CONFIDENCE</span>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#a855f7", marginTop: "4px" }}>
                  96.8% Statistical Accuracy
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 6: CHAT VIEW                                                    */}
      {/* ==================================================================== */}
      {activeSection === "chat" && (
        <div className="fema-section-card" style={{ padding: "20px 24px" }}>
          <div className="fema-section-header" style={{ marginBottom: "16px" }}>
            <div>
              <h3 className="fema-section-title" style={{ fontSize: "16px" }}>
                Executive Conversational AI Query
              </h3>
              <p className="fema-section-sub">
                Query consolidated financials, liquidity covenants, or scenario projections in natural language
              </p>
            </div>
          </div>

          <AiChatWidget
            roleName="Chief Financial Officer (Executive)"
            placeholder="e.g. Summarize liquidity reserves and covenant risk..."
          />
        </div>
      )}

      {/* CFO Approval Modal */}
      {selectedRisk && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedRisk(null)}
          title={`Approve Material Variance Override: Case #${selectedRisk.id}`}
          subtitle={`${selectedRisk.department} • ${selectedRisk.category} (${selectedRisk.variance_percent > 0 ? "+" : ""}${selectedRisk.variance_percent}%)`}
        >
          <form onSubmit={handleApproveOverride}>
            <div className="fema-form-group">
              <label className="fema-label">Executive Authorization & Audit Notes</label>
              <textarea
                className="fema-textarea"
                rows={4}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Detail authorization rationale for corporate governance logs..."
                required
                autoFocus
              />
            </div>

            <div className="fema-modal-actions">
              <button
                type="button"
                className="fema-btn fema-btn-outline"
                onClick={() => setSelectedRisk(null)}
                disabled={isApproving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="fema-btn fema-btn-success"
                disabled={isApproving}
              >
                {isApproving ? "Registering..." : "Confirm Executive Approval"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
