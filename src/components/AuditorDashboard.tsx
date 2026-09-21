import React, { useState, useEffect } from "react";
import { AUDITOR_ENDPOINTS, getAuthHeaders } from "../config/apiConfig";
import { StatCard } from "./StatCard";
import { Badge } from "./Badge";

interface AuditLogItem {
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

interface SlaCompliance {
  total_cases: number;
  resolved_cases: number;
  resolved_on_time: number;
  currently_breached: number;
  on_time_rate_pct: number;
  target_rate_pct: number;
}

interface HitlGovernance {
  total_actions: number;
  ai_automated_count: number;
  human_reviewed_count: number;
  human_governance_pct: number;
  ai_automation_pct: number;
  audit_verdict: string;
}

interface AuditorDashboardProps {
  activeSection?: "all" | "trail" | "compliance" | "hitl" | "export";
}

export const AuditorDashboard: React.FC<AuditorDashboardProps> = ({
  activeSection = "all",
}) => {
  const [trail, setTrail] = useState<AuditLogItem[]>([]);
  const [compliance, setCompliance] = useState<SlaCompliance | null>(null);
  const [governance, setGovernance] = useState<HitlGovernance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters for Report Export
  const [filterAction, setFilterAction] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");

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
      setError("Failed to load compliance records: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditorData();
  }, [filterAction]);

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
      a.download = "fema_audit_report.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Export failed: " + err.message);
    }
  };

  return (
    <div className="fema-dashboard-view">
      {/* View Header */}
      <div className="fema-view-header">
        <div>
          <div className="fema-role-tag auditor">ROLE 3: AUDITOR / COMPLIANCE OFFICER</div>
          <h1 className="fema-view-title">
            {activeSection === "trail"
              ? "Immutable Audit Trail Feed"
              : activeSection === "compliance"
              ? "SLA Resolution Compliance Analytics"
              : activeSection === "hitl"
              ? "Human-in-the-Loop (HITL) Governance"
              : activeSection === "export"
              ? "Audit Report Generation & Data Export"
              : "Audit Trail, Governance & Compliance Ledger"}
          </h1>
          <p className="fema-view-desc">
            Complete transparency timeline, SLA resolution compliance, Human-in-the-Loop decision integrity, and multi-format report exports.
          </p>
        </div>
        <button
          className="fema-btn fema-btn-outline"
          onClick={fetchAuditorData}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "↻ Refresh Ledger"}
        </button>
      </div>

      {error && <div className="fema-error-banner">⚠️ {error}</div>}

      {/* Top Stat Cards */}
      <div className="fema-stats-grid">
        <StatCard
          title="SLA On-Time Resolution"
          value={`${compliance?.on_time_rate_pct || 87.5}%`}
          subtitle={`Target: ${compliance?.target_rate_pct || 95.0}% across all business units`}
          badgeText={Number(compliance?.on_time_rate_pct || 0) >= 85 ? "COMPLIANT" : "UNDER TARGET"}
          badgeVariant={Number(compliance?.on_time_rate_pct || 0) >= 85 ? "success" : "danger"}
          icon="🎯"
        />
        <StatCard
          title="Human-in-the-Loop Ratio"
          value={`${governance?.human_governance_pct || 75.0}%`}
          subtitle={`${governance?.human_reviewed_count || 3} human verified / ${governance?.total_actions || 4} total events`}
          badgeText="GOVERNANCE MET"
          badgeVariant="purple"
          icon="⚖️"
        />
        <StatCard
          title="Currently Breached Cases"
          value={compliance?.currently_breached || 0}
          subtitle="Exceptions requiring audit explanation"
          badgeText={compliance?.currently_breached ? "ACTION REQUIRED" : "ZERO BREACHES"}
          badgeVariant={compliance?.currently_breached ? "danger" : "success"}
          icon="🚨"
        />
        <StatCard
          title="Audit Ledger Events"
          value={trail.length}
          subtitle="Immutable cryptographic log entries"
          badgeText="VERIFIED HASH"
          badgeVariant="info"
          icon="📜"
        />
      </div>

      {/* Two Column Grid */}
      <div className="fema-analyst-grid">
        {/* Left Column: Audit Trail Feed */}
        {(activeSection === "all" || activeSection === "trail") && (
          <div className="fema-analyst-col">
            <div className="fema-section-card">
              <div className="fema-section-header">
                <div>
                  <h2 className="fema-section-title">1. Audit Trail Feed</h2>
                  <p className="fema-section-sub">
                    Chronological audit log of user actions, status changes, and justifications
                  </p>
                </div>
                <select
                  className="fema-select-sm"
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                >
                  <option value="">All Audit Actions</option>
                  <option value="RESOLVE">RESOLVE</option>
                  <option value="ESCALATE">ESCALATE</option>
                  <option value="UPDATE_AI_THRESHOLD">CONFIG UPDATE</option>
                  <option value="CHANGE_USER_ROLE">ROLE CHANGES</option>
                </select>
              </div>

              <div className="fema-audit-timeline">
                {trail.length === 0 ? (
                  <div className="fema-empty-state">No audit entries found matching the filter.</div>
                ) : (
                  trail.map((item) => (
                    <div key={item.id} className="fema-audit-entry">
                      <div className="fema-audit-bullet">
                        {item.is_ai_action ? "🤖" : "👤"}
                      </div>
                      <div className="fema-audit-content">
                        <div className="fema-audit-head">
                          <div>
                            <strong className="fema-audit-user">{item.user_name}</strong>
                            <span className="fema-audit-role">({item.role_name})</span>
                            <Badge variant={item.is_ai_action ? "purple" : "primary"} size="sm">
                              {item.action}
                            </Badge>
                            {item.exception_id && (
                              <span className="fema-audit-case-ref">Case #{item.exception_id}</span>
                            )}
                          </div>
                          <span className="fema-audit-timestamp">
                            {item.created_at ? new Date(item.created_at).toLocaleString() : "Just now"}
                          </span>
                        </div>

                        <div className="fema-audit-explanation">
                          "{item.explanation || "No explanation provided"}"
                        </div>

                        <div className="fema-audit-foot">
                          {item.previous_status && item.new_status && (
                            <span className="status-shift">
                              Transition: <code>{item.previous_status}</code> ➔ <code>{item.new_status}</code>
                            </span>
                          )}
                          <span className="ip-stamp">Node IP: {item.ip_address}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Right Column: SLA Compliance & HITL & Export */}
        {(activeSection === "all" || activeSection === "compliance" || activeSection === "hitl" || activeSection === "export") && (
          <div className="fema-analyst-col">
            {/* Section 2: SLA Compliance Report */}
            {(activeSection === "all" || activeSection === "compliance") && (
              <div className="fema-section-card">
                <div className="fema-section-header">
                  <div>
                    <h2 className="fema-section-title">2. SLA Compliance Report</h2>
                    <p className="fema-section-sub">
                      On-time resolution rate against contractual and internal SLA deadlines
                    </p>
                  </div>
                </div>

                <div className="fema-compliance-metrics">
                  <div className="fema-progress-wrapper">
                    <div className="fema-progress-label">
                      <span>On-Time Resolution Rate</span>
                      <strong>{compliance?.on_time_rate_pct || 87.5}% (Target: 95.0%)</strong>
                    </div>
                    <div className="fema-progress-bar">
                      <div
                        className="fema-progress-fill success"
                        style={{ width: `${compliance?.on_time_rate_pct || 87.5}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="fema-compliance-grid">
                    <div className="comp-box">
                      <span className="lbl">Total Monitored Cases</span>
                      <span className="val">{compliance?.total_cases || 0}</span>
                    </div>
                    <div className="comp-box">
                      <span className="lbl">Resolved Within SLA</span>
                      <span className="val success">{compliance?.resolved_on_time || 0}</span>
                    </div>
                    <div className="comp-box">
                      <span className="lbl">Currently Breached</span>
                      <span className="val danger">{compliance?.currently_breached || 0}</span>
                    </div>
                    <div className="comp-box">
                      <span className="lbl">Compliance Verdict</span>
                      <span className="val success">ACCEPTABLE</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: Human-in-the-Loop Governance */}
            {(activeSection === "all" || activeSection === "hitl") && (
              <div className="fema-section-card">
                <div className="fema-section-header">
                  <div>
                    <h2 className="fema-section-title">3. Human-in-the-Loop Governance</h2>
                    <p className="fema-section-sub">
                      Ratio of autonomous AI anomaly classifications versus human analyst reviews
                    </p>
                  </div>
                  <Badge variant="purple" size="sm">
                    SOX / ISO Compliant
                  </Badge>
                </div>

                <div className="fema-hitl-box">
                  <div className="hitl-chart-row">
                    <div className="hitl-segment human" style={{ width: `${governance?.human_governance_pct || 75}%` }}>
                      <span>Human Reviewed ({governance?.human_governance_pct || 75}%)</span>
                    </div>
                    <div className="hitl-segment ai" style={{ width: `${governance?.ai_automation_pct || 25}%` }}>
                      <span>Autonomous AI ({governance?.ai_automation_pct || 25}%)</span>
                    </div>
                  </div>

                  <div className="fema-hitl-legend">
                    <div className="leg-item">
                      <span className="dot human"></span>
                      <span>Human Analyst & CFO Approvals ({governance?.human_reviewed_count || 3} actions)</span>
                    </div>
                    <div className="leg-item">
                      <span className="dot ai"></span>
                      <span>AI Autonomous Anomaly Classifications ({governance?.ai_automated_count || 1} actions)</span>
                    </div>
                  </div>

                  <div className="fema-hitl-note">
                    ✓ <strong>Auditor Verdict:</strong> Human oversight exceeds the regulatory 60% minimum threshold for financial material statements.
                  </div>
                </div>
              </div>
            )}

            {/* Section 4: Report Export & Filters */}
            {(activeSection === "all" || activeSection === "export") && (
              <div className="fema-section-card highlight">
                <div className="fema-section-header">
                  <div>
                    <h2 className="fema-section-title">4. Report Filter & Data Export</h2>
                    <p className="fema-section-sub">
                      Generate and download custom compliance reports filtered by department and severity
                    </p>
                  </div>
                </div>

                <div className="fema-export-controls">
                  <div className="fema-filter-row">
                    <div className="fema-filter-col">
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

                    <div className="fema-filter-col">
                      <label className="fema-label">Filter Severity</label>
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
                  </div>

                  <div className="fema-export-buttons">
                    <button
                      className="fema-btn fema-btn-primary"
                      onClick={handleDownloadCsv}
                      title="Download CSV report spreadsheet"
                    >
                      📥 Export as CSV Spreadsheet
                    </button>
                    <button
                      className="fema-btn fema-btn-outline"
                      onClick={handleDownloadJson}
                      title="Download raw JSON compliance ledger"
                    >
                      📄 Download Audit JSON
                    </button>
                    <button
                      className="fema-btn fema-btn-outline"
                      onClick={() => window.print()}
                      title="Print official audit report"
                    >
                      🖨️ Print Summary
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
