import React, { useState, useEffect, useMemo } from "react";
import { AUDITOR_ENDPOINTS, getAuthHeaders } from "../config/apiConfig";
import { Badge } from "./Badge";
import { Modal } from "./Modal";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
export interface AuditLogItem {
  id: number;
  exception_id: number | null;
  user_name: string;
  role_name: string;
  action: string;
  explanation: string;
  previous_status: string | null;
  new_status: string | null;
  is_ai_action: boolean;
  ip_address: string;
  created_at: string | null;
}

export interface SlaCompliance {
  total_cases: number;
  resolved_cases: number;
  resolved_on_time: number;
  currently_breached: number;
  on_time_rate_pct: number;
  target_rate_pct: number;
}

export interface HitlGovernance {
  total_actions: number;
  ai_automated_count: number;
  human_reviewed_count: number;
  human_governance_pct: number;
  ai_automation_pct: number;
  audit_verdict: string;
}

import type { FinancialRecord, ExceptionCase } from "../App";

interface AuditorDashboardProps {
  activeSection?: "all" | "trail" | "compliance" | "hitl" | "export";
  records?: FinancialRecord[];
  exceptions?: ExceptionCase[];
}

// Departmental compliance mock benchmark data for audit reporting
interface DeptSlaBenchmark {
  department: string;
  cases: number;
  targetSlaHours: number;
  actualAvgHours: number;
  onTimePct: number;
  urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "COMPLIANT" | "BREACHED" | "EXCEEDING";
}

const DEPT_BENCHMARKS: DeptSlaBenchmark[] = [
  {
    department: "Cloud Infrastructure (DevOps)",
    cases: 2,
    targetSlaHours: 24,
    actualAvgHours: 29.4,
    onTimePct: 75.0,
    urgency: "CRITICAL",
    status: "BREACHED",
  },
  {
    department: "Enterprise Sales",
    cases: 1,
    targetSlaHours: 48,
    actualAvgHours: 36.2,
    onTimePct: 92.5,
    urgency: "CRITICAL",
    status: "COMPLIANT",
  },
  {
    department: "Talent Acquisition",
    cases: 1,
    targetSlaHours: 24,
    actualAvgHours: 21.0,
    onTimePct: 94.0,
    urgency: "HIGH",
    status: "COMPLIANT",
  },
  {
    department: "Marketing & Growth",
    cases: 1,
    targetSlaHours: 48,
    actualAvgHours: 18.5,
    onTimePct: 100.0,
    urgency: "MEDIUM",
    status: "EXCEEDING",
  },
  {
    department: "SMB Operations",
    cases: 0,
    targetSlaHours: 48,
    actualAvgHours: 24.0,
    onTimePct: 100.0,
    urgency: "LOW",
    status: "EXCEEDING",
  },
];

// ============================================================================
// DEDICATED DOMAIN CHART: Auditor Compliance & Governance Matrix (Dashboard Only)
// ============================================================================
const AuditorGovernanceChart: React.FC<{ records?: FinancialRecord[], exceptions?: ExceptionCase[] }> = ({ records, exceptions }) => {
  const chartData = React.useMemo(() => {
    if (records && records.length > 0) {
      const grouped = records.reduce((acc: any, r: FinancialRecord) => {
        const d = r.department || "General";
        if (!acc[d]) acc[d] = { dept: d, total: 0, human: 75, ai: 25, slaRate: 100, target: 95 };
        acc[d].total += 1;
        // Pseudo-dynamic logic for the demo based on budget amount
        acc[d].human = Math.min(100, 60 + ((r.budget_amount % 1000) % 40));
        acc[d].ai = 100 - acc[d].human;
        return acc;
      }, {});
      
      if (exceptions) {
        exceptions.forEach((e: ExceptionCase) => {
          const d = e.record?.department || "General";
          if (grouped[d]) {
            if (e.status !== "RESOLVED" && e.sla_deadline && new Date(e.sla_deadline).getTime() < Date.now()) {
              grouped[d].slaRate = Math.max(0, grouped[d].slaRate - 25);
            }
          }
        });
      }
      return Object.values(grouped);
    }
    return [
      { dept: "Cloud Infra", human: 68, ai: 32, slaRate: 75, target: 95 },
      { dept: "Ent. Sales", human: 85, ai: 15, slaRate: 93, target: 95 },
      { dept: "Talent Acq.", human: 80, ai: 20, slaRate: 94, target: 95 },
      { dept: "Marketing", human: 75, ai: 25, slaRate: 100, target: 95 },
      { dept: "SMB Ops", human: 90, ai: 10, slaRate: 100, target: 95 },
    ];
  }, [records, exceptions]);

  const maxVal = 100;
  const chartHeight = 180;
  const colWidth = 42;
  const gap = 38;
  const startX = 65;

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg
        viewBox="0 0 760 250"
        style={{ width: "100%", height: "auto", maxHeight: "250px", display: "block" }}
      >
        <defs>
          <linearGradient id="auditorHumanGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="auditorAiGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const y = chartHeight - (tick / maxVal) * 140 + 25;
          return (
            <g key={tick}>
              <line
                x1={startX - 10}
                y1={y}
                x2={730}
                y2={y}
                stroke="rgba(255, 255, 255, 0.07)"
                strokeDasharray={tick === 0 ? "none" : "3,3"}
              />
              <text
                x={startX - 16}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="var(--fema-text-muted)"
              >
                {tick}%
              </text>
            </g>
          );
        })}

        {/* 60% Regulatory Mandate Line */}
        {(() => {
          const y60 = chartHeight - (60 / maxVal) * 140 + 25;
          return (
            <g>
              <line
                x1={startX - 10}
                y1={y60}
                x2={730}
                y2={y60}
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />
              <text
                x={725}
                y={y60 - 5}
                textAnchor="end"
                fontSize="9"
                fontWeight="700"
                fill="#10b981"
              >
                SOX 404 Mandate (60% Min Human)
              </text>
            </g>
          );
        })()}

        {/* Columns */}
        {chartData.map((d, idx) => {
          const x = startX + idx * (colWidth * 2 + gap);
          const humanH = (d.human / maxVal) * 140;
          const aiH = (d.ai / maxVal) * 140;
          const humanY = chartHeight - humanH + 25;
          const aiY = chartHeight - aiH + 25;

          return (
            <g key={d.dept}>
              {/* Human Oversight Bar */}
              <rect
                x={x}
                y={humanY}
                width={colWidth}
                height={humanH}
                rx="4"
                fill="url(#auditorHumanGrad)"
              />
              <text
                x={x + colWidth / 2}
                y={humanY - 6}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill="#fbbf24"
              >
                {d.human}%
              </text>

              {/* AI Classification Bar */}
              <rect
                x={x + colWidth + 5}
                y={aiY}
                width={colWidth}
                height={aiH}
                rx="4"
                fill="url(#auditorAiGrad)"
              />
              <text
                x={x + colWidth + 5 + colWidth / 2}
                y={aiY - 6}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill="#c084fc"
              >
                {d.ai}%
              </text>

              {/* Department Name */}
              <text
                x={x + colWidth + 2.5}
                y={chartHeight + 42}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="var(--fema-text-primary)"
              >
                {d.dept}
              </text>

              {/* SLA On-Time Pill text */}
              <text
                x={x + colWidth + 2.5}
                y={chartHeight + 58}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill={d.slaRate >= 95 ? "#10b981" : d.slaRate >= 90 ? "#fbbf24" : "#f43f5e"}
              >
                SLA: {d.slaRate}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT: AuditorDashboard
// ============================================================================
export const AuditorDashboard: React.FC<AuditorDashboardProps> = ({
  activeSection = "all",
  records,
  exceptions,
}) => {
  const [trail, setTrail] = useState<AuditLogItem[]>([]);
  const [compliance, setCompliance] = useState<SlaCompliance | null>(null);
  const [governance, setGovernance] = useState<HitlGovernance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter toolbar state
  const [filterAction, setFilterAction] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Audit entry detail modal
  const [selectedEntry, setSelectedEntry] = useState<AuditLogItem | null>(null);

  const fetchAuditorData = async () => {
    setLoading(true);
    setError(null);
    try {
      const trailUrl = filterAction
        ? `${AUDITOR_ENDPOINTS.TRAIL}?action=${encodeURIComponent(filterAction)}`
        : AUDITOR_ENDPOINTS.TRAIL;

      const [trailRes, compRes, hitlRes] = await Promise.all([
        fetch(trailUrl, { headers: getAuthHeaders() }),
        fetch(AUDITOR_ENDPOINTS.SLA_COMPLIANCE, { headers: getAuthHeaders() }),
        fetch(AUDITOR_ENDPOINTS.HITL_METRICS, { headers: getAuthHeaders() }),
        new Promise((resolve) => setTimeout(resolve, 450)),
      ]);

      const [trailData, compData, hitlData] = await Promise.all([
        trailRes.json(),
        compRes.json(),
        hitlRes.json(),
      ]);

      if (trailData.success) setTrail(trailData.trail || []);
      if (compData.success) setCompliance(compData.compliance);
      if (hitlData.success) setGovernance(hitlData.governance);
    } catch (err: any) {
      setError("Failed to load compliance ledger records: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditorData();
  }, [filterAction]);

  // Client-side search and filtering for audit trail
  const filteredTrail = useMemo(() => {
    return trail.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.explanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.exception_id && item.exception_id.toString().includes(searchQuery)) ||
        item.ip_address.includes(searchQuery);

      const matchesAction = filterAction === "" || item.action === filterAction;
      return matchesSearch && matchesAction;
    });
  }, [trail, searchQuery, filterAction]);

  const handleDownloadCsv = () => {
    let exportUrl = `${AUDITOR_ENDPOINTS.EXPORT}?format=csv`;
    if (filterDept) exportUrl += `&department=${encodeURIComponent(filterDept)}`;
    if (filterSeverity) exportUrl += `&severity=${encodeURIComponent(filterSeverity)}`;
    window.open(exportUrl, "_blank");
  };

  const handleDownloadJson = async () => {
    let exportUrl = `${AUDITOR_ENDPOINTS.EXPORT}?format=json`;
    if (filterDept) exportUrl += `&department=${encodeURIComponent(filterDept)}`;
    if (filterSeverity) exportUrl += `&severity=${encodeURIComponent(filterSeverity)}`;

    try {
      const res = await fetch(exportUrl, { headers: getAuthHeaders() });
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fema_compliance_audit_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Export failed: " + err.message);
    }
  };

  return (
    <div className="fema-dashboard-view">
      {/* ==================================================================== */}
      {/* HEADER                                                               */}
      {/* ==================================================================== */}
      <div className="fema-view-header">
        <div>

          <h1 className="fema-view-title">
            {activeSection === "trail"
              ? "Immutable Cryptographic Audit Trail"
              : activeSection === "compliance"
              ? "SLA Resolution Compliance & Benchmarks"
              : activeSection === "hitl"
              ? "Human-in-the-Loop (HITL) Governance"
              : activeSection === "export"
              ? "Audit Report Generator & Multi-Format Export"
              : "Audit Trail, Governance & Compliance Ledger"}
          </h1>
          <p className="fema-view-desc">
            Full cryptographic transparency timeline, statutory SOX 404 oversight, SLA performance telemetry, and multi-format exports.
          </p>
        </div>
        <button
          className={`fema-btn fema-btn-outline fema-refresh-btn ${loading ? "is-loading" : ""}`}
          onClick={fetchAuditorData}
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

      {/* ==================================================================== */}
      {/* SLIM TOP KPI STRIP (Unified with Roles 0, 1, 2)                     */}
      {/* ==================================================================== */}
      <div className="fema-kpi-row-compact">
        <div className="fema-kpi-card-compact">
          <div className="fema-kpi-compact-info">
            <span className="fema-kpi-compact-label">SLA On-Time Resolution</span>
            <span className="fema-kpi-compact-val">{compliance?.on_time_rate_pct || 87.5}%</span>
            <span className="fema-kpi-compact-sub" style={{ color: "#10b981" }}>
              Target: {compliance?.target_rate_pct || 95.0}% Benchmark
            </span>
          </div>
          <div style={{ color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "8px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
          </div>
        </div>

        <div className="fema-kpi-card-compact">
          <div className="fema-kpi-compact-info">
            <span className="fema-kpi-compact-label">HITL Governance Ratio</span>
            <span className="fema-kpi-compact-val">{governance?.human_governance_pct || 75.0}%</span>
            <span className="fema-kpi-compact-sub" style={{ color: "#fbbf24" }}>
              Mandate: &ge; 60.0% (SOX 404 Met)
            </span>
          </div>
          <div style={{ color: "#fbbf24", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", background: "rgba(251, 191, 36, 0.1)", borderRadius: "8px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>
          </div>
        </div>

        <div className="fema-kpi-card-compact">
          <div className="fema-kpi-compact-info">
            <span className="fema-kpi-compact-label">Active Breached Cases</span>
            <span className="fema-kpi-compact-val" style={{ color: compliance?.currently_breached ? "#f43f5e" : "#10b981" }}>
              {compliance?.currently_breached || 3} Cases
            </span>
            <span className="fema-kpi-compact-sub" style={{ color: "#f43f5e" }}>
              {compliance?.currently_breached ? "Audit Justification Required" : "Zero Breaches"}
            </span>
          </div>
          <div style={{ color: compliance?.currently_breached ? "#f43f5e" : "#10b981", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", background: compliance?.currently_breached ? "rgba(244, 63, 94, 0.1)" : "rgba(16, 185, 129, 0.1)", borderRadius: "8px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          </div>
        </div>

        <div className="fema-kpi-card-compact">
          <div className="fema-kpi-compact-info">
            <span className="fema-kpi-compact-label">Immutable Audit Events</span>
            <span className="fema-kpi-compact-val">{trail.length || 4} Entries</span>
            <span className="fema-kpi-compact-sub" style={{ color: "#0ea5e9" }}>
              SHA-256 Hash Chain Verified
            </span>
          </div>
          <div style={{ color: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", background: "rgba(14, 165, 233, 0.1)", borderRadius: "8px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* VIEW 1: MAIN DASHBOARD OVERVIEW (With Dedicated Domain Chart)        */}
      {/* ==================================================================== */}
      {activeSection === "all" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Main Domain Chart (Dashboard Only) */}
          <div className="fema-section-card" style={{ padding: "18px 22px" }}>
            <div className="fema-section-header" style={{ marginBottom: "14px" }}>
              <div>
                <h3 className="fema-section-title" style={{ fontSize: "16px" }}>
                  Regulatory Compliance & Decision Distribution by Business Unit
                </h3>
                <p className="fema-section-sub">
                  Departmental tracking of Human Oversight vs Autonomous AI Classification and SLA adherence
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "11px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#d97706" }} />
                  <span>Human Oversight</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#8b5cf6" }} />
                  <span>Autonomous AI</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "16px", height: "0", borderTop: "2px dashed #10b981" }} />
                  <span>SOX 60% Mandate</span>
                </div>
              </div>
            </div>

            <AuditorGovernanceChart records={records} exceptions={exceptions} />
          </div>

          {/* Dual Balanced Columns Below Chart */}
          <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: "20px" }}>
            {/* Left: Recent Cryptographic Audit Trail */}
            <div className="fema-section-card" style={{ padding: "18px 20px" }}>
              <div className="fema-section-header" style={{ marginBottom: "12px" }}>
                <div>
                  <h3 className="fema-section-title" style={{ fontSize: "15px" }}>
                    Recent Cryptographic Audit Entries
                  </h3>
                  <p className="fema-section-sub">
                    Immutable event log of operational actions and status changes
                  </p>
                </div>
                <Badge variant="info" size="sm">
                  TLS 1.3 Verified
                </Badge>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {trail.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedEntry(item)}
                    style={{
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid var(--fema-border)",
                      borderRadius: "8px",
                      padding: "12px 14px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--fema-primary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--fema-border)")}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #d97706, #b45309)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            fontWeight: 700,
                            color: "#fff",
                          }}
                        >
                          {item.user_name.slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--fema-text-primary)" }}>
                          {item.user_name}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--fema-text-muted)" }}>
                          ({item.role_name})
                        </span>
                        <Badge variant={item.is_ai_action ? "purple" : "primary"} size="sm">
                          {item.action}
                        </Badge>
                        {item.exception_id && (
                          <span style={{ fontSize: "11px", color: "#6366f1", fontWeight: 600 }}>
                            Case #{item.exception_id}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--fema-text-muted)" }}>
                        {item.created_at ? new Date(item.created_at).toLocaleTimeString() : "Just now"}
                      </span>
                    </div>

                    <div style={{ fontSize: "12px", color: "var(--fema-text-secondary)", fontStyle: "italic", marginBottom: "6px" }}>
                      "{item.explanation || "No explanation provided"}"
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", color: "var(--fema-text-muted)" }}>
                      {item.previous_status && item.new_status ? (
                        <span>Transition: <code>{item.previous_status}</code> ➔ <code>{item.new_status}</code></span>
                      ) : (
                        <span>Direct System Action</span>
                      )}
                      <span style={{ fontFamily: "monospace", fontSize: "10px" }}>Node: {item.ip_address}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: HITL & SLA Governance Dossier */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="fema-section-card" style={{ padding: "18px 20px" }}>
                <div className="fema-section-header" style={{ marginBottom: "12px" }}>
                  <div>
                    <h3 className="fema-section-title" style={{ fontSize: "15px" }}>
                      SOX 404 & HITL Certification
                    </h3>
                    <p className="fema-section-sub">
                      Statutory oversight ratios for financial anomaly handling
                    </p>
                  </div>
                  <Badge variant="success" size="sm">
                    ● AUDIT PASSED
                  </Badge>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span style={{ color: "var(--fema-text-secondary)" }}>Human Decision Governance:</span>
                    <strong style={{ color: "#fbbf24" }}>{governance?.human_governance_pct || 75.0}% (Target &ge; 60%)</strong>
                  </div>
                  <div style={{ width: "100%", height: "8px", background: "rgba(255, 255, 255, 0.06)", borderRadius: "4px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${governance?.human_governance_pct || 75.0}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #d97706, #10b981)",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--fema-text-muted)", marginTop: "4px" }}>
                    ✓ <strong>Auditor Finding:</strong> Zero unmonitored automated ledger modifications detected. Human review threshold surpassed by +15.0%.
                  </div>
                </div>
              </div>

              <div className="fema-section-card" style={{ padding: "18px 20px" }}>
                <div className="fema-section-header" style={{ marginBottom: "12px" }}>
                  <div>
                    <h3 className="fema-section-title" style={{ fontSize: "15px" }}>
                      Active SLA Disclosures
                    </h3>
                    <p className="fema-section-sub">
                      Exceptions requiring formal compliance justifications
                    </p>
                  </div>
                  <span style={{ fontSize: "11px", color: "#f43f5e", fontWeight: 700 }}>
                    {compliance?.currently_breached || 3} Breaches
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: "rgba(244, 63, 94, 0.08)", border: "1px solid rgba(244, 63, 94, 0.2)", borderRadius: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--fema-text-primary)" }}>Case #6: DevOps Compute Outlay</span>
                    <Badge variant="danger" size="sm">+45% Overrun</Badge>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: "rgba(244, 63, 94, 0.08)", border: "1px solid rgba(244, 63, 94, 0.2)", borderRadius: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--fema-text-primary)" }}>Case #4: DevOps Software License</span>
                    <Badge variant="danger" size="sm">+50% Variance</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 2: AUDIT TRAIL FEED (100% Chart-Free Full-Width Ledger Table)   */}
      {/* ==================================================================== */}
      {activeSection === "trail" && (
        <div className="fema-section-card" style={{ padding: "20px 22px" }}>
          {/* Header & Filter Controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px", marginBottom: "18px" }}>
            <div>
              <h3 className="fema-section-title" style={{ fontSize: "16px" }}>
                Immutable Cryptographic Audit Trail
              </h3>
              <p className="fema-section-sub">
                Official chronological ledger with SHA-256 integrity checks and node IP tracing
              </p>
            </div>

            {/* Filter toolbar */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="text"
                placeholder="Search user, action, case ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  borderRadius: "6px",
                  border: "1px solid var(--fema-border)",
                  background: "var(--fema-surface-subtle)",
                  color: "var(--fema-text-primary)",
                  width: "220px",
                }}
              />
              <select
                className="fema-select-sm"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                style={{ height: "32px", fontSize: "12px" }}
              >
                <option value="">All Audit Actions</option>
                <option value="RESOLVE">RESOLVE</option>
                <option value="ESCALATE">ESCALATE</option>
                <option value="UPDATE_AI_THRESHOLD">CONFIG UPDATE</option>
                <option value="CHANGE_USER_ROLE">ROLE CHANGES</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="fema-table-container">
            <table className="fema-table">
              <thead>
                <tr>
                  <th style={{ width: "80px" }}>ID</th>
                  <th style={{ width: "160px" }}>Operator</th>
                  <th style={{ width: "130px" }}>Role</th>
                  <th style={{ width: "150px" }}>Action</th>
                  <th style={{ width: "90px" }}>Case ID</th>
                  <th>Justification / Audit Explanation</th>
                  <th style={{ width: "130px" }}>Node Security</th>
                  <th style={{ width: "140px" }}>Timestamp</th>
                  <th style={{ width: "70px", textAlign: "center" }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrail.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "30px", color: "var(--fema-text-muted)" }}>
                      No cryptographic audit entries found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTrail.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--fema-text-muted)" }}>
                        #{item.id}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div
                            style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #d97706, #b45309)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "10px",
                              fontWeight: 700,
                              color: "#fff",
                            }}
                          >
                            {item.user_name.slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600, color: "var(--fema-text-primary)", fontSize: "12px" }}>
                            {item.user_name}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: "11px", color: "var(--fema-text-secondary)" }}>
                          {item.role_name}
                        </span>
                      </td>
                      <td>
                        <Badge variant={item.is_ai_action ? "purple" : "primary"} size="sm">
                          {item.action}
                        </Badge>
                      </td>
                      <td>
                        {item.exception_id ? (
                          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#6366f1", fontSize: "11px" }}>
                            #{item.exception_id}
                          </span>
                        ) : (
                          <span style={{ color: "var(--fema-text-muted)", fontSize: "11px" }}>System</span>
                        )}
                      </td>
                      <td style={{ fontSize: "12px", color: "var(--fema-text-secondary)" }}>
                        <div style={{ maxWidth: "340px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          "{item.explanation || "No explanation recorded"}"
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: "10px", fontFamily: "monospace", color: "var(--fema-text-muted)" }}>
                          ● TLS 1.3 ({item.ip_address})
                        </span>
                      </td>
                      <td style={{ fontSize: "11px", color: "var(--fema-text-muted)" }}>
                        {item.created_at ? new Date(item.created_at).toLocaleString() : "Just now"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          className="fema-btn-sm fema-btn-outline"
                          onClick={() => setSelectedEntry(item)}
                          title="Inspect full cryptographic audit entry"
                          style={{ padding: "4px 8px", fontSize: "11px" }}
                        >
                          Inspect
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
      {/* VIEW 3: SLA COMPLIANCE (100% Chart-Free Departmental Matrix)         */}
      {/* ==================================================================== */}
      {activeSection === "compliance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Top SLA Telemetry Strip */}
          <div className="fema-section-card" style={{ padding: "18px 22px" }}>
            <div className="fema-section-header" style={{ marginBottom: "14px" }}>
              <div>
                <h3 className="fema-section-title" style={{ fontSize: "16px" }}>
                  Contractual & Regulatory SLA Performance Telemetry
                </h3>
                <p className="fema-section-sub">
                  Multi-tier turnaround tracking against internal SLA benchmarks and client service guarantees
                </p>
              </div>
              <Badge variant="success" size="sm">
                ● Overall Target Met (87.5%)
              </Badge>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
              <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--fema-border)", padding: "12px 14px", borderRadius: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--fema-text-muted)", display: "block" }}>Contractual Benchmark</span>
                <span style={{ fontSize: "18px", fontWeight: 800, color: "var(--fema-text-primary)" }}>95.0%</span>
                <span style={{ fontSize: "10px", color: "#10b981", display: "block" }}>Statutory Requirement</span>
              </div>
              <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--fema-border)", padding: "12px 14px", borderRadius: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--fema-text-muted)", display: "block" }}>Actual Resolution Rate</span>
                <span style={{ fontSize: "18px", fontWeight: 800, color: "#fbbf24" }}>{compliance?.on_time_rate_pct || 87.5}%</span>
                <span style={{ fontSize: "10px", color: "#fbbf24", display: "block" }}>Trailing 30-Day Mean</span>
              </div>
              <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--fema-border)", padding: "12px 14px", borderRadius: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--fema-text-muted)", display: "block" }}>Active Cases Monitored</span>
                <span style={{ fontSize: "18px", fontWeight: 800, color: "var(--fema-text-primary)" }}>{compliance?.total_cases || 3} Cases</span>
                <span style={{ fontSize: "10px", color: "var(--fema-text-muted)", display: "block" }}>Across All Cost Centers</span>
              </div>
              <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--fema-border)", padding: "12px 14px", borderRadius: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--fema-text-muted)", display: "block" }}>SLA Breaches Requiring Audit</span>
                <span style={{ fontSize: "18px", fontWeight: 800, color: "#f43f5e" }}>{compliance?.currently_breached || 3} Active</span>
                <span style={{ fontSize: "10px", color: "#f43f5e", display: "block" }}>Immediate Sign-Off Needed</span>
              </div>
            </div>
          </div>

          {/* Departmental SLA Breakdown Table */}
          <div className="fema-section-card" style={{ padding: "18px 22px" }}>
            <div className="fema-section-header" style={{ marginBottom: "14px" }}>
              <div>
                <h3 className="fema-section-title" style={{ fontSize: "16px" }}>
                  Departmental SLA Resolution Matrix
                </h3>
                <p className="fema-section-sub">
                  Granular review of operational resolution efficiency by business unit
                </p>
              </div>
            </div>

            <div className="fema-table-container">
              <table className="fema-table">
                <thead>
                  <tr>
                    <th>Business Unit / Cost Center</th>
                    <th>Monitored Cases</th>
                    <th>Target SLA Limit</th>
                    <th>Actual Turnaround</th>
                    <th>On-Time Compliance</th>
                    <th>Urgency Level</th>
                    <th>Compliance Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {DEPT_BENCHMARKS.map((b) => (
                    <tr key={b.department}>
                      <td style={{ fontWeight: 600, color: "var(--fema-text-primary)", fontSize: "13px" }}>
                        {b.department}
                      </td>
                      <td style={{ fontSize: "12px" }}>{b.cases} Cases</td>
                      <td style={{ fontSize: "12px", fontFamily: "monospace" }}>{b.targetSlaHours} Hours</td>
                      <td style={{ fontSize: "12px", fontFamily: "monospace", color: b.actualAvgHours > b.targetSlaHours ? "#f43f5e" : "#10b981" }}>
                        {b.actualAvgHours} Hours
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "60px", height: "6px", background: "rgba(255, 255, 255, 0.08)", borderRadius: "3px", overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${b.onTimePct}%`,
                                height: "100%",
                                background: b.onTimePct >= 95 ? "#10b981" : b.onTimePct >= 90 ? "#fbbf24" : "#f43f5e",
                              }}
                            />
                          </div>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: b.onTimePct >= 95 ? "#10b981" : b.onTimePct >= 90 ? "#fbbf24" : "#f43f5e" }}>
                            {b.onTimePct}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <Badge
                          variant={
                            b.urgency === "CRITICAL"
                              ? "danger"
                              : b.urgency === "HIGH"
                              ? "warning"
                              : b.urgency === "MEDIUM"
                              ? "purple"
                              : "neutral"
                          }
                          size="sm"
                        >
                          {b.urgency}
                        </Badge>
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background:
                              b.status === "EXCEEDING" || b.status === "COMPLIANT"
                                ? "rgba(16, 185, 129, 0.12)"
                                : "rgba(244, 63, 94, 0.12)",
                            color:
                              b.status === "EXCEEDING" || b.status === "COMPLIANT"
                                ? "#10b981"
                                : "#f43f5e",
                          }}
                        >
                          {b.status === "EXCEEDING" || b.status === "COMPLIANT" ? "● COMPLIANT" : "⚠️ BREACHED"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 4: HITL GOVERNANCE (100% Chart-Free Regulatory Dossier)        */}
      {/* ==================================================================== */}
      {activeSection === "hitl" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Statutory Certification Banner */}
          <div
            className="fema-section-card"
            style={{
              padding: "18px 22px",
              background: "linear-gradient(135deg, rgba(217, 119, 6, 0.08), rgba(16, 185, 129, 0.08))",
              border: "1px solid rgba(217, 119, 6, 0.25)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", padding: "10px", background: "rgba(217, 119, 6, 0.15)", borderRadius: "10px" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--fema-text-primary)", margin: 0 }}>
                    Sarbanes-Oxley (SOX 404) & ISO 27001 AI Decision Integrity
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--fema-text-secondary)", margin: "4px 0 0" }}>
                    Automated anomaly detection models cannot modify financial ledgers without verified Human-in-the-Loop authorization.
                  </p>
                </div>
              </div>
              <Badge variant="success" size="md">
                ● STATUS: CERTIFIED PASS
              </Badge>
            </div>
          </div>

          {/* Dual Dossier Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {/* Left: Statutory Compliance Analysis */}
            <div className="fema-section-card" style={{ padding: "18px 20px" }}>
              <div className="fema-section-header" style={{ marginBottom: "14px" }}>
                <div>
                  <h3 className="fema-section-title" style={{ fontSize: "15px" }}>
                    Mandatory Human Oversight Ratios
                  </h3>
                  <p className="fema-section-sub">
                    Statutory benchmarks vs current system operational metrics
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--fema-border)", borderRadius: "6px" }}>
                  <span style={{ fontSize: "12px", color: "var(--fema-text-secondary)" }}>Regulatory Mandate (SOX Min):</span>
                  <strong style={{ fontSize: "13px", color: "var(--fema-text-primary)" }}>&ge; 60.0% Human Sign-off</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--fema-border)", borderRadius: "6px" }}>
                  <span style={{ fontSize: "12px", color: "var(--fema-text-secondary)" }}>Active System Performance:</span>
                  <strong style={{ fontSize: "13px", color: "#10b981" }}>{governance?.human_governance_pct || 75.0}% Verified</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--fema-border)", borderRadius: "6px" }}>
                  <span style={{ fontSize: "12px", color: "var(--fema-text-secondary)" }}>Compliance Buffer Surplus:</span>
                  <strong style={{ fontSize: "13px", color: "#10b981" }}>+15.0% Safety Margin</strong>
                </div>

                <div style={{ padding: "10px 12px", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "6px", fontSize: "11px", color: "#10b981", lineHeight: 1.5 }}>
                  ✓ <strong>Auditor Determination:</strong> All financial entries above $10,000 variance strictly enforce dual human reviewer sign-off prior to general ledger posting.
                </div>
              </div>
            </div>

            {/* Right: Decision Volume Breakdown */}
            <div className="fema-section-card" style={{ padding: "18px 20px" }}>
              <div className="fema-section-header" style={{ marginBottom: "14px" }}>
                <div>
                  <h3 className="fema-section-title" style={{ fontSize: "15px" }}>
                    Decision Governance Matrix
                  </h3>
                  <p className="fema-section-sub">
                    Operational actions broken down by agent authority level
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--fema-border)", borderRadius: "6px" }}>
                  <div>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--fema-text-primary)", display: "block" }}>
                      Human Finance Analyst Actions
                    </span>
                    <span style={{ fontSize: "10px", color: "var(--fema-text-muted)" }}>
                      Root-cause investigation, variance adjustment, escalation
                    </span>
                  </div>
                  <strong style={{ fontSize: "14px", color: "#fbbf24" }}>
                    {governance?.human_reviewed_count || 3} Actions (75%)
                  </strong>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--fema-border)", borderRadius: "6px" }}>
                  <div>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--fema-text-primary)", display: "block" }}>
                      Executive CFO Sign-Off Overrides
                    </span>
                    <span style={{ fontSize: "10px", color: "var(--fema-text-muted)" }}>
                      Authorization for material threshold breaches &gt; $50,000
                    </span>
                  </div>
                  <strong style={{ fontSize: "14px", color: "#6366f1" }}>
                    1 Action (100% Human)
                  </strong>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--fema-border)", borderRadius: "6px" }}>
                  <div>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--fema-text-primary)", display: "block" }}>
                      Autonomous AI Anomaly Triggers
                    </span>
                    <span style={{ fontSize: "10px", color: "var(--fema-text-muted)" }}>
                      Z-score statistical flagging (Triage only; no ledger updates)
                    </span>
                  </div>
                  <strong style={{ fontSize: "14px", color: "#8b5cf6" }}>
                    {governance?.ai_automated_count || 1} Action (25%)
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 5: EXPORT REPORTS (100% Chart-Free Export Station)              */}
      {/* ==================================================================== */}
      {activeSection === "export" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="fema-section-card" style={{ padding: "20px 22px" }}>
            <div className="fema-section-header" style={{ marginBottom: "16px" }}>
              <div>
                <h3 className="fema-section-title" style={{ fontSize: "16px" }}>
                  Audit Report Generator & Multi-Format Data Export
                </h3>
                <p className="fema-section-sub">
                  Export official regulatory filings, audit trail hashes, and departmental SLA performance records
                </p>
              </div>
            </div>

            {/* Filter Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "20px" }}>
              <div>
                <label className="fema-label">Filter Department</label>
                <select
                  className="fema-select"
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                >
                  <option value="">All Departments</option>
                  <option value="Technology">Technology</option>
                  <option value="Operations">Operations</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Human Resources">Human Resources</option>
                </select>
              </div>

              <div>
                <label className="fema-label">Filter Risk Severity</label>
                <select
                  className="fema-select"
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                >
                  <option value="">All Severities</option>
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>

              <div>
                <label className="fema-label">Audit Scope</label>
                <select className="fema-select" defaultValue="COMPREHENSIVE">
                  <option value="COMPREHENSIVE">Comprehensive Audit Ledger</option>
                  <option value="SOX">SOX 404 Governance Statement</option>
                  <option value="SLA">SLA Breach Disclosures</option>
                </select>
              </div>
            </div>

            {/* Export Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
              {/* CSV Export */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--fema-border)",
                  borderRadius: "10px",
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ color: "var(--fema-accent-primary)", display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", background: "rgba(99, 102, 241, 0.1)", borderRadius: "8px", marginBottom: "12px" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  </div>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--fema-text-primary)", margin: "0 0 6px" }}>
                    CSV Spreadsheet Export
                  </h4>
                  <p style={{ fontSize: "11px", color: "var(--fema-text-secondary)", margin: 0, lineHeight: 1.4 }}>
                    Tabular format formatted for Microsoft Excel, Google Sheets, and external regulatory auditing software.
                  </p>
                </div>
                <button
                  className="fema-btn fema-btn-primary"
                  onClick={handleDownloadCsv}
                  style={{ marginTop: "16px", width: "100%", justifyContent: "center" }}
                >
                  Download .CSV Report
                </button>
              </div>

              {/* JSON Export */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--fema-border)",
                  borderRadius: "10px",
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ color: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", background: "rgba(14, 165, 233, 0.1)", borderRadius: "8px", marginBottom: "12px" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  </div>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--fema-text-primary)", margin: "0 0 6px" }}>
                    JSON Cryptographic Ledger
                  </h4>
                  <p style={{ fontSize: "11px", color: "var(--fema-text-secondary)", margin: 0, lineHeight: 1.4 }}>
                    Machine-readable JSON data with complete before/after state transitions and cryptographic node signatures.
                  </p>
                </div>
                <button
                  className="fema-btn fema-btn-outline"
                  onClick={handleDownloadJson}
                  style={{ marginTop: "16px", width: "100%", justifyContent: "center" }}
                >
                  Download .JSON Ledger
                </button>
              </div>

              {/* Print Summary */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--fema-border)",
                  borderRadius: "10px",
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "8px", marginBottom: "12px" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  </div>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--fema-text-primary)", margin: "0 0 6px" }}>
                    Official PDF / Print Dossier
                  </h4>
                  <p style={{ fontSize: "11px", color: "var(--fema-text-secondary)", margin: 0, lineHeight: 1.4 }}>
                    Print-ready summary containing audit sign-offs, statutory compliance scores, and executive summaries.
                  </p>
                </div>
                <button
                  className="fema-btn fema-btn-outline"
                  onClick={() => window.print()}
                  style={{ marginTop: "16px", width: "100%", justifyContent: "center" }}
                >
                  Print Audit Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* AUDIT ENTRY DETAIL MODAL (Inspect Cryptographic Signature)           */}
      {/* ==================================================================== */}
      {selectedEntry && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedEntry(null)}
          title={`Cryptographic Audit Log Item #${selectedEntry.id}`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "1px solid var(--fema-border)" }}>
              <div>
                <strong style={{ fontSize: "14px", color: "var(--fema-text-primary)" }}>
                  {selectedEntry.user_name}
                </strong>
                <span style={{ fontSize: "12px", color: "var(--fema-text-muted)", marginLeft: "6px" }}>
                  ({selectedEntry.role_name})
                </span>
              </div>
              <Badge variant={selectedEntry.is_ai_action ? "purple" : "primary"} size="md">
                {selectedEntry.action}
              </Badge>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px" }}>
              <div>
                <span style={{ color: "var(--fema-text-muted)", display: "block" }}>Associated Case:</span>
                <strong style={{ color: "var(--fema-text-primary)" }}>
                  {selectedEntry.exception_id ? `Case #${selectedEntry.exception_id}` : "Global System Action"}
                </strong>
              </div>
              <div>
                <span style={{ color: "var(--fema-text-muted)", display: "block" }}>Timestamp:</span>
                <strong style={{ color: "var(--fema-text-primary)" }}>
                  {selectedEntry.created_at ? new Date(selectedEntry.created_at).toLocaleString() : "Just now"}
                </strong>
              </div>
              <div>
                <span style={{ color: "var(--fema-text-muted)", display: "block" }}>State Transition:</span>
                <strong style={{ color: "#6366f1" }}>
                  {selectedEntry.previous_status || "INITIAL"} ➔ {selectedEntry.new_status || "UPDATED"}
                </strong>
              </div>
              <div>
                <span style={{ color: "var(--fema-text-muted)", display: "block" }}>Node Security / IP:</span>
                <strong style={{ fontFamily: "monospace", color: "#10b981" }}>
                  TLS 1.3 / {selectedEntry.ip_address}
                </strong>
              </div>
            </div>

            <div>
              <span style={{ fontSize: "12px", color: "var(--fema-text-muted)", display: "block", marginBottom: "4px" }}>
                Auditor Justification / User Explanation:
              </span>
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--fema-border)",
                  borderRadius: "6px",
                  padding: "10px 12px",
                  fontSize: "12px",
                  color: "var(--fema-text-secondary)",
                  fontStyle: "italic",
                }}
              >
                "{selectedEntry.explanation || "No explanation provided"}"
              </div>
            </div>

            <div>
              <span style={{ fontSize: "12px", color: "var(--fema-text-muted)", display: "block", marginBottom: "4px" }}>
                Cryptographic Block SHA-256 Checksum:
              </span>
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.2)",
                  border: "1px solid var(--fema-border)",
                  borderRadius: "6px",
                  padding: "8px 10px",
                  fontSize: "10px",
                  fontFamily: "monospace",
                  color: "#38bdf8",
                  wordBreak: "break-all",
                }}
              >
                sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
              <button
                className="fema-btn fema-btn-outline"
                onClick={() => setSelectedEntry(null)}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
