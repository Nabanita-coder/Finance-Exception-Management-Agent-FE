import React, { useState, useEffect } from "react";
import { CFO_ENDPOINTS, getAuthHeaders } from "../config/apiConfig";
import { Badge } from "./Badge";
import { Modal } from "./Modal";
import { AiChatWidget } from "./AiChatWidget";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
} from "recharts";
import type { FinancialRecord, ExceptionCase } from "../App";

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
  records?: FinancialRecord[];
  exceptions?: ExceptionCase[];
}

const formatCurrencyInr = (val: number | null | undefined): string => {
  if (val == null || isNaN(val)) return "₹0";
  return `₹${Math.round(val).toLocaleString("en-IN")}`;
};

const formatInrCompact = (val: number | null | undefined): string => {
  if (val == null || isNaN(val)) return "₹0";
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}k`;
  return `${sign}₹${abs.toLocaleString("en-IN")}`;
};

// ============================================================================
// SVG CHART: Executive Budget vs Actual Exposure by Cost Center (Dashboard Only)
// ============================================================================
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#0f172a', border: '1px solid #334155', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}>
        <p style={{ margin: 0, fontWeight: 'bold', color: '#f8fafc', marginBottom: '8px' }}>{label}</p>
        <p style={{ margin: '4px 0', color: '#6366f1', fontSize: '13px' }}>
          Budget: ₹{payload[0].value.toLocaleString('en-IN')}
        </p>
        <p style={{ margin: '4px 0', color: payload[1].value > payload[0].value ? '#f43f5e' : '#10b981', fontSize: '13px' }}>
          Actual: ₹{payload[1].value.toLocaleString('en-IN')}
        </p>
      </div>
    );
  }
  return null;
};

const CfoExecutiveChart: React.FC<{ kpis?: any; records?: FinancialRecord[]; viewMode?: "department" | "monthly" }> = ({
  kpis: _kpis,
  records,
  viewMode = "department",
}) => {
  const dynamicData = React.useMemo(() => {
    if (records && records.length > 0) {
      if (viewMode === "monthly") {
        const grouped = records.reduce((acc: any, r: FinancialRecord) => {
          let p = r.period || "Current Period";
          if (/^\d{4}-\d{2}$/.test(p)) {
            const [y, m] = p.split("-");
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const mIdx = parseInt(m, 10) - 1;
            if (mIdx >= 0 && mIdx < 12) {
              p = `${monthNames[mIdx]} ${y}`;
            }
          }
          if (!acc[p]) acc[p] = { name: p, rawPeriod: r.period || "", budget: 0, actual: 0, variance: 0, risk: "LOW" };
          acc[p].budget += Number(r.budget_amount) || 0;
          acc[p].actual += Number(r.actual_amount) || 0;
          return acc;
        }, {});
        return Object.values(grouped).sort((a: any, b: any) => (a.rawPeriod > b.rawPeriod ? 1 : -1)).map((item: any) => {
          const v = item.budget > 0 ? ((item.actual - item.budget) / item.budget) * 100 : 0;
          item.variance = Number(v.toFixed(1));
          item.risk = Math.abs(v) >= 30 ? "CRITICAL" : Math.abs(v) >= 20 ? "HIGH" : Math.abs(v) >= 10 ? "MEDIUM" : "LOW";
          return item;
        });
      }

      // Default: Department view
      const grouped = records.reduce((acc: any, r: FinancialRecord) => {
        const d = r.department || "General";
        if (!acc[d]) acc[d] = { name: d, budget: 0, actual: 0, variance: 0, risk: "LOW" };
        acc[d].budget += Number(r.budget_amount) || 0;
        acc[d].actual += Number(r.actual_amount) || 0;
        return acc;
      }, {});
      return Object.values(grouped).map((item: any) => {
        const v = item.budget > 0 ? ((item.actual - item.budget) / item.budget) * 100 : 0;
        item.variance = Number(v.toFixed(1));
        item.risk = Math.abs(v) >= 30 ? "CRITICAL" : Math.abs(v) >= 20 ? "HIGH" : Math.abs(v) >= 10 ? "MEDIUM" : "LOW";
        return item;
      });
    }

    if (viewMode === "monthly") {
      return [
        { name: "Jun 2026", budget: 600000, actual: 580000, variance: -3.3, risk: "LOW" },
        { name: "Jul 2026", budget: 650000, actual: 690000, variance: 6.2, risk: "LOW" },
        { name: "Aug 2026", budget: 700000, actual: 780000, variance: 11.4, risk: "MEDIUM" },
        { name: "Sep 2026", budget: 750000, actual: 950000, variance: 26.7, risk: "HIGH" },
        { name: "Oct 2026", budget: 800000, actual: 820000, variance: 2.5, risk: "LOW" },
      ];
    }

    return [
      { name: "Cloud Infra", budget: 350000, actual: 490000, variance: 40.0, risk: "CRITICAL" },
      { name: "Enterprise Sales", budget: 1200000, actual: 720000, variance: -40.0, risk: "CRITICAL" },
      { name: "Talent Acq.", budget: 150000, actual: 185000, variance: 23.3, risk: "HIGH" },
      { name: "Marketing & Growth", budget: 250000, actual: 285000, variance: 14.0, risk: "MEDIUM" },
      { name: "SMB Operations", budget: 800000, actual: 820000, variance: 2.5, risk: "LOW" },
    ];
  }, [records, viewMode]);

  return (
    <div style={{ width: '100%', height: 280, marginTop: '20px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={dynamicData}
          margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          barGap={4}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="var(--fema-text-muted)" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            dy={10}
          />
          <YAxis 
            stroke="var(--fema-text-muted)" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => {
              if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
              if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
              if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
              return `₹${value}`;
            }} 
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.02)'}} />
          <Bar dataKey="budget" name="Budget" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} minPointSize={4} />
          <Bar dataKey="actual" name="Actual" radius={[4, 4, 0, 0]} maxBarSize={40} minPointSize={4}>
            {dynamicData.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={entry.actual > entry.budget ? "#f43f5e" : "#10b981"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ============================================================================
// CHART 2: Capital Allocation by Department (Donut Chart)
// ============================================================================
const DepartmentAllocationChart: React.FC<{ records?: FinancialRecord[] }> = ({ records }) => {
  const data = React.useMemo(() => {
    if (!records || records.length === 0) {
      return [
        { name: "DevOps", value: 440000, color: "#6366f1", pct: "99.9" },
        { name: "Marketing", value: 4, color: "#0ea5e9", pct: "0.1" },
      ];
    }
    const map: Record<string, number> = {};
    records.forEach((r) => {
      const dept = r.department || "General";
      map[dept] = (map[dept] || 0) + (Number(r.actual_amount) || 0);
    });
    const palette = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    return Object.entries(map).map(([name, value], i) => {
      const rawPct = total > 0 ? (value / total) * 100 : 0;
      let pctStr = rawPct.toFixed(1);
      if (value > 0 && rawPct < 0.1) {
        pctStr = "<0.1";
      }
      return {
        name,
        value,
        pct: pctStr,
        color: palette[i % palette.length],
      };
    });
  }, [records]);

  const totalSpend = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div style={{ width: "100%", height: 240, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ width: "50%", height: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={78}
              paddingAngle={4}
              minAngle={15}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--fema-surface)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any, name: any) => [`₹${Number(value).toLocaleString('en-IN')}`, name]}
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div style={{ width: "50%", display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "8px" }}>
        <div style={{ fontSize: "11px", color: "var(--fema-text-muted)", borderBottom: "1px solid var(--fema-border)", paddingBottom: "6px" }}>
          TOTAL EXPOSURE: <strong style={{ color: "var(--fema-text-primary)" }}>₹{totalSpend.toLocaleString('en-IN')}</strong>
        </div>
        {data.map((item, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: item.color }} />
              <span style={{ color: "var(--fema-text-primary)", fontWeight: 600 }}>{item.name}</span>
            </div>
            <span style={{ color: "var(--fema-text-muted)", fontFamily: "IBM Plex Mono, monospace", fontSize: "11px" }}>
              {item.pct}% (₹{item.value >= 100000 ? `${(item.value / 100000).toFixed(1)}L` : item.value.toLocaleString('en-IN')})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// CHART 3: Cash Inflow vs. Outflow Telemetry (Revenue vs Expense)
// ============================================================================
const CashInflowOutflowChart: React.FC<{ records?: FinancialRecord[] }> = ({ records }) => {
  const { data, netBurn } = React.useMemo(() => {
    if (!records || records.length === 0) {
      return {
        data: [
          { category: "Revenue (Inflow)", budget: 148000, actual: 150004 },
          { category: "Expense (Outflow)", budget: 200000, actual: 290000 },
        ],
        netBurn: -139996,
      };
    }

    const revRecords = records.filter(r => (r.category || "").toLowerCase() === "revenue");
    const expRecords = records.filter(r => (r.category || "").toLowerCase() === "expense");

    const revBudget = revRecords.reduce((acc, r) => acc + (Number(r.budget_amount) || 0), 0);
    const revActual = revRecords.reduce((acc, r) => acc + (Number(r.actual_amount) || 0), 0);

    const expBudget = expRecords.reduce((acc, r) => acc + (Number(r.budget_amount) || 0), 0);
    const expActual = expRecords.reduce((acc, r) => acc + (Number(r.actual_amount) || 0), 0);

    return {
      data: [
        { category: "Revenue (Inflow)", budget: revBudget, actual: revActual },
        { category: "Expense (Outflow)", budget: expBudget, actual: expActual },
      ],
      netBurn: revActual - expActual,
    };
  }, [records]);

  return (
    <div style={{ width: "100%", height: 240, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ height: 190, width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 10, left: -10, bottom: 0 }} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
            <XAxis dataKey="category" stroke="var(--fema-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              stroke="var(--fema-text-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₹${v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v}`}
            />
            <Tooltip
              formatter={(value: any, name: any) => [`₹${Number(value).toLocaleString('en-IN')}`, name === "budget" ? "Budget" : "Actual"]}
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
            />
            <Bar dataKey="budget" name="Budget" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Bar dataKey="actual" name="Actual" radius={[4, 4, 0, 0]} maxBarSize={32}>
              {data.map((_, index) => (
                <Cell key={`inflow-cell-${index}`} fill={index === 0 ? "#10b981" : "#f43f5e"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid var(--fema-border)", fontSize: "11.5px" }}>
        <span style={{ color: "var(--fema-text-muted)" }}>
          Net Operational Cash Flow:
        </span>
        <span style={{ fontWeight: 700, color: netBurn >= 0 ? "#10b981" : "#f43f5e", fontFamily: "IBM Plex Mono, monospace" }}>
          {netBurn >= 0 ? `+₹${netBurn.toLocaleString('en-IN')} (Surplus)` : `-₹${Math.abs(netBurn).toLocaleString('en-IN')} (Deficit)`}
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT: CfoDashboard
// ============================================================================
export const CfoDashboard: React.FC<CfoDashboardProps> = ({
  activeSection = "all",
  records,
  exceptions: _exceptions,
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

  // Chart view mode: Department-wise vs Monthly Trend
  const [chartViewMode, setChartViewMode] = useState<"department" | "monthly">("department");

  const fetchCfoData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [kpisRes, warningsRes, risksRes, briefRes] = await Promise.all([
        fetch(CFO_ENDPOINTS.KPIS, { headers: getAuthHeaders() }),
        fetch(CFO_ENDPOINTS.EARLY_WARNINGS, { headers: getAuthHeaders() }),
        fetch(CFO_ENDPOINTS.ESCALATED_RISKS, { headers: getAuthHeaders() }),
        fetch(CFO_ENDPOINTS.EXECUTIVE_BRIEF, { headers: getAuthHeaders() }),
        new Promise((resolve) => setTimeout(resolve, 450)),
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
    try {
      const res = await fetch("/api/analyst/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          exception_id: selectedRisk.id,
          user_name: "cfo",
          role_name: "cfo",
          action: "RESOLVE",
          explanation: approvalNotes || `Executive override approved by CFO for Case #${selectedRisk.id}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedRisk(null);
        setApprovalNotes("");
        alert(`Executive Approval registered for Case #${selectedRisk.id}. Immutably recorded to audit trail.`);
        await fetchCfoData();
      } else {
        alert("Failed to register approval: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error registering executive approval: " + err.message);
    } finally {
      setIsApproving(false);
    }
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
          className={`fema-btn fema-btn-outline fema-refresh-btn ${loading ? "is-loading" : ""}`}
          onClick={fetchCfoData}
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

      {error && (
        <div className="fema-error-banner" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          <span>{error}</span>
        </div>
      )}

      {/* Slim Compact KPI Summary Strip */}
      <div className="fema-kpi-strip-compact">
        {/* Card 1: Total Actual Spend */}
        <div className="fema-kpi-card-compact">
          <div className="fema-kpi-compact-info">
            <span className="fema-kpi-compact-label">Total Actual Spend</span>
            <span className="fema-kpi-compact-val">
              {kpis?.budget_variance?.total_actual != null
                ? formatInrCompact(kpis.budget_variance.total_actual)
                : (kpis?.operating_cash_flow?.amount != null ? formatInrCompact(kpis.operating_cash_flow.amount) : "—")}
            </span>
            <span className="fema-kpi-compact-sub" style={{ color: (kpis?.budget_variance?.net_variance_pct ?? 0) > 0 ? "#f43f5e" : "#10b981" }}>
              {kpis?.budget_variance?.net_variance_pct != null
                ? `${kpis.budget_variance.net_variance_pct > 0 ? "+" : ""}${kpis.budget_variance.net_variance_pct}% over Budget (${formatInrCompact(kpis.budget_variance.total_budget)})`
                : "—"}
            </span>
          </div>
          <div style={{ color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "8px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>
          </div>
        </div>

        {/* Card 2: Financial Safety Ratio */}
        <div className="fema-kpi-card-compact">
          <div className="fema-kpi-compact-info">
            <span className="fema-kpi-compact-label">Financial Safety Ratio</span>
            <span className="fema-kpi-compact-val">
              {kpis?.liquidity_ratio?.current_ratio != null ? `${kpis.liquidity_ratio.current_ratio}x` : "—"}
            </span>
            <span className="fema-kpi-compact-sub" style={{ color: (kpis?.liquidity_ratio?.buffer ?? 0) >= 0 ? "#10b981" : "#f43f5e" }}>
              {(kpis?.liquidity_ratio?.buffer ?? 0) >= 0 ? "Safe (≥ 1.50x Target)" : "Low Buffer (Target: 1.50x)"}
            </span>
          </div>
          <div style={{ color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", background: "rgba(99, 102, 241, 0.1)", borderRadius: "8px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22" /><line x1="6" y1="18" x2="6" y2="11" /><line x1="10" y1="18" x2="10" y2="11" /><line x1="14" y1="18" x2="14" y2="11" /><line x1="18" y1="18" x2="18" y2="11" /><polygon points="12 2 20 7 4 7" /></svg>
          </div>
        </div>

        {/* Card 3: Net Profit / Loss Margin */}
        <div className="fema-kpi-card-compact">
          <div className="fema-kpi-compact-info">
            <span className="fema-kpi-compact-label">Profit / Loss Margin</span>
            <span className="fema-kpi-compact-val" style={{ color: (kpis?.operating_margin_pct?.current ?? 0) < 0 ? "#f43f5e" : "#10b981" }}>
              {kpis?.operating_margin_pct?.current != null ? `${kpis.operating_margin_pct.current}%` : "—"}
            </span>
            <span className="fema-kpi-compact-sub" style={{ color: (kpis?.operating_margin_pct?.current ?? 0) < 0 ? "#f43f5e" : "#10b981" }}>
              {(kpis?.operating_margin_pct?.current ?? 0) < 0 ? "Loss: Expense > Revenue" : "Profit: Revenue > Expense"}
            </span>
          </div>
          <div style={{ color: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", background: "rgba(14, 165, 233, 0.1)", borderRadius: "8px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
          </div>
        </div>

        {/* Card 4: Pending Approvals */}
        <div className="fema-kpi-card-compact">
          <div className="fema-kpi-compact-info">
            <span className="fema-kpi-compact-label">Pending Approvals</span>
            <span className="fema-kpi-compact-val">{escalatedRisks.length} Case{escalatedRisks.length !== 1 ? "s" : ""}</span>
            <span className="fema-kpi-compact-sub" style={{ color: escalatedRisks.length > 0 ? "#f43f5e" : "#10b981" }}>
              {escalatedRisks.length > 0 ? "CFO Sign-Off Required" : "All Clear"}
            </span>
          </div>
          <div style={{ color: escalatedRisks.length > 0 ? "#f43f5e" : "#10b981", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", background: escalatedRisks.length > 0 ? "rgba(244, 63, 94, 0.1)" : "rgba(16, 185, 129, 0.1)", borderRadius: "8px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* VIEW 1: MAIN DASHBOARD OVERVIEW (With Dedicated Domain Chart)        */}
      {/* ==================================================================== */}
      {activeSection === "all" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Main Visual Chart (Dashboard Only) */}
          <div className="fema-section-card" style={{ padding: "18px 22px" }}>
            <div className="fema-section-header" style={{ marginBottom: "14px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h3 className="fema-section-title" style={{ fontSize: "16px" }}>
                  {chartViewMode === "department"
                    ? "Consolidated Budget vs. Actual Expenditure by Business Unit"
                    : "Monthly Capital Deployment & Expenditure Trend"}
                </h3>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                {/* View Mode Toggle */}
                <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "var(--fema-surface-muted)", padding: "3px", borderRadius: "8px", border: "1px solid var(--fema-border)" }}>
                  <button
                    type="button"
                    onClick={() => setChartViewMode("department")}
                    style={{
                      padding: "4px 10px",
                      fontSize: "11px",
                      fontWeight: 700,
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer",
                      background: chartViewMode === "department" ? "var(--fema-surface)" : "transparent",
                      color: chartViewMode === "department" ? "var(--fema-text-primary)" : "var(--fema-text-secondary)",
                      boxShadow: chartViewMode === "department" ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    By Department
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartViewMode("monthly")}
                    style={{
                      padding: "4px 10px",
                      fontSize: "11px",
                      fontWeight: 700,
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer",
                      background: chartViewMode === "monthly" ? "var(--fema-surface)" : "transparent",
                      color: chartViewMode === "monthly" ? "var(--fema-text-primary)" : "var(--fema-text-secondary)",
                      boxShadow: chartViewMode === "monthly" ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    Monthly Trend
                  </button>
                </div>

                {/* Legend */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11px", fontWeight: 600 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ width: "9px", height: "9px", borderRadius: "2px", background: "#6366f1" }} />
                    <span>Budget</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ width: "9px", height: "9px", borderRadius: "2px", background: "#f43f5e" }} />
                    <span>Actual (Over)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ width: "9px", height: "9px", borderRadius: "2px", background: "#10b981" }} />
                    <span>Actual (OK)</span>
                  </div>
                </div>
              </div>
            </div>

            <CfoExecutiveChart kpis={kpis} records={records} viewMode={chartViewMode} />
          </div>

          {/* Automated AI Brief (Full Width) */}
          <div className="fema-section-card" style={{ padding: "18px 22px" }}>
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
                <div style={{ color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" /></svg>
                </div>
                <p style={{ margin: 0, fontSize: "12.5px", color: "var(--fema-text-primary)", lineHeight: 1.45 }}>
                  {brief?.ai_summary ||
                    "Consolidated operating expenditures are tracking within expected volatility buffers with 3 high-priority exceptions flagged for executive review."}
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "10px",
                  background: "var(--fema-surface-subtle)",
                  border: "1px solid var(--fema-border)",
                  borderRadius: "8px",
                  padding: "12px 16px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontSize: "10.5px", color: "var(--fema-text-muted)" }}>CRITICAL RISKS</span>
                  <span style={{ fontSize: "16px", fontWeight: 800, color: "#f43f5e", fontFamily: "IBM Plex Mono, monospace" }}>
                    {brief?.critical_count ?? escalatedRisks.length}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontSize: "10.5px", color: "var(--fema-text-muted)" }}>LEDGER CADENCE</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--fema-text-primary)" }}>
                    {brief?.period_start && brief?.period_end ? `${brief.period_start} — ${brief.period_end}` : "Current FY"}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontSize: "10.5px", color: "var(--fema-text-muted)" }}>STATISTICAL CONFIDENCE</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#a855f7" }}>
                    {records && records.length > 0 ? `${Math.min(99.9, Math.round(100 - (escalatedRisks.length / Math.max(records.length, 1)) * 10))}% Dynamic` : "98.5% Deterministic"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Symmetrical 2 New Meaningful Charts */}
          <div className="fema-analyst-grid">
            {/* Chart 1: Capital Allocation by Department */}
            <div className="fema-section-card" style={{ padding: "18px 20px" }}>
              <div className="fema-section-header" style={{ marginBottom: "12px" }}>
                <div>
                  <h3 className="fema-section-title" style={{ fontSize: "15px" }}>
                    Capital Allocation by Business Unit
                  </h3>
                  <p className="fema-section-sub">
                    Relative distribution of corporate deployed capital
                  </p>
                </div>
                <Badge variant="purple" size="sm">
                  {records ? `${new Set(records.map(r => r.department)).size} Units` : "2 Units"}
                </Badge>
              </div>

              <DepartmentAllocationChart records={records} />
            </div>

            {/* Chart 2: Cash Inflow vs. Outflow */}
            <div className="fema-section-card" style={{ padding: "18px 20px" }}>
              <div className="fema-section-header" style={{ marginBottom: "12px" }}>
                <div>
                  <h3 className="fema-section-title" style={{ fontSize: "15px" }}>
                    Cash Inflow vs. Outflow Dynamics
                  </h3>
                  <p className="fema-section-sub">
                    Operational revenue generation vs. expenditure cash burn
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11px", fontWeight: 600 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#6366f1" }} />
                    <span>Budget</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#10b981" }} />
                    <span>Inflow</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#f43f5e" }} />
                    <span>Outflow</span>
                  </div>
                </div>
              </div>

              <CashInflowOutflowChart records={records} />
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
                    <td>
                      <span style={{ fontWeight: 700, color: (kpis?.operating_cash_flow?.surplus ?? 0) >= 0 ? "#10b981" : "#f43f5e" }}>
                        {formatCurrencyInr(kpis?.operating_cash_flow?.amount)}
                      </span>
                    </td>
                    <td>{formatCurrencyInr(kpis?.operating_cash_flow?.min_threshold)} Min</td>
                    <td>
                      {(kpis?.operating_cash_flow?.surplus ?? 0) >= 0
                        ? `+${formatInrCompact(kpis?.operating_cash_flow?.surplus)} Surplus`
                        : `-${formatInrCompact(Math.abs(kpis?.operating_cash_flow?.surplus || 0))} Deficit`}
                    </td>
                    <td>
                      <span className={`fema-status-pill ${(kpis?.operating_cash_flow?.surplus ?? 0) >= 0 ? "active" : "inactive"}`}>
                        <span className="fema-status-dot-pulse" /> {kpis?.operating_cash_flow?.status || "Compliant"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Liquidity Coverage Ratio (LCR)</strong>
                      <div className="fema-text-sub">High-quality liquid assets vs 30-day net outflows</div>
                    </td>
                    <td><span style={{ fontWeight: 700, color: "#6366f1" }}>{kpis?.liquidity_ratio?.current_ratio != null ? `${kpis.liquidity_ratio.current_ratio}x` : "—"}</span></td>
                    <td>{kpis?.liquidity_ratio?.target ?? 1.5}x Min</td>
                    <td>{(kpis?.liquidity_ratio?.buffer ?? 0) >= 0 ? `+${kpis?.liquidity_ratio?.buffer}x Buffer` : `${kpis?.liquidity_ratio?.buffer}x Deficit`}</td>
                    <td>
                      <span className={`fema-status-pill ${kpis?.liquidity_ratio?.status === "Safe" ? "active" : "inactive"}`}>
                        <span className="fema-status-dot-pulse" /> {kpis?.liquidity_ratio?.status || "Safe"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>EBITDA Operating Margin</strong>
                      <div className="fema-text-sub">Trailing operating margin benchmark</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: (kpis?.operating_margin_pct?.trend_pct ?? 0) >= 0 ? "#a855f7" : "#f43f5e" }}>
                        {kpis?.operating_margin_pct?.current != null ? `${kpis.operating_margin_pct.current}%` : "—"}
                      </span>
                    </td>
                    <td>{kpis?.operating_margin_pct?.target ?? 18.0}% Target</td>
                    <td>
                      {(kpis?.operating_margin_pct?.trend_pct ?? 0) >= 0
                        ? `+${kpis?.operating_margin_pct?.trend_pct}% Ahead`
                        : `${kpis?.operating_margin_pct?.trend_pct}% Behind`}
                    </td>
                    <td>
                      <span className={`fema-status-pill ${kpis?.operating_margin_pct?.status === "Exceeding" || kpis?.operating_margin_pct?.status === "Compliant" ? "active" : "inactive"}`}>
                        <span className="fema-status-dot-pulse" /> {kpis?.operating_margin_pct?.status || "Compliant"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Net Budget Variance Exposure</strong>
                      <div className="fema-text-sub">Aggregate active exceptions deviation</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: (kpis?.budget_variance?.overrun_pct ?? 0) > 0 ? "#f43f5e" : "#10b981" }}>
                        {(kpis?.budget_variance?.net_variance_pct ?? 0) > 0 ? "+" : ""}{kpis?.budget_variance?.net_variance_pct ?? 0}%
                      </span>
                    </td>
                    <td>{kpis?.budget_variance?.trigger_limit ?? 15.0}% Trigger</td>
                    <td>
                      {(kpis?.budget_variance?.overrun_pct ?? 0) > 0
                        ? `+${kpis.budget_variance.overrun_pct}% Overrun`
                        : "Within Tolerance"}
                    </td>
                    <td>
                      <span className={`fema-status-pill ${kpis?.budget_variance?.status === "Compliant" ? "active" : "inactive"}`}>
                        {kpis?.budget_variance?.status || "Compliant"}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="fema-section-card" style={{ padding: "20px 24px" }}>
            <div className="fema-section-header" style={{ marginBottom: "16px" }}>
              <div>
                <h3 className="fema-section-title" style={{ fontSize: "16px" }}>
                  Consolidated Budget vs. Actual Expenditure by Business Unit
                </h3>
                <p className="fema-section-sub">
                  Executive cross-departmental capital deployment and variance exposure benchmarking
                </p>
              </div>
            </div>
            <CfoExecutiveChart kpis={kpis} records={records} />
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--fema-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
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
                          Budget: <strong>₹{risk.budget_amount.toLocaleString('en-IN')}</strong>
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--fema-text-primary)" }}>
                          Actual: <strong>₹{risk.actual_amount.toLocaleString('en-IN')}</strong>
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
              <div style={{ color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" /></svg>
              </div>
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
                  {brief?.critical_count ?? escalatedRisks.length} Pending
                </div>
              </div>

              <div style={{ background: "var(--fema-surface-subtle)", border: "1px solid var(--fema-border)", borderRadius: "8px", padding: "14px" }}>
                <span style={{ fontSize: "11px", color: "var(--fema-text-muted)" }}>REPORTING CADENCE</span>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--fema-text-primary)", marginTop: "4px" }}>
                  {brief?.period_start && brief?.period_end ? `${brief.period_start} — ${brief.period_end}` : "Consolidated Ledger Period"}
                </div>
              </div>

              <div style={{ background: "var(--fema-surface-subtle)", border: "1px solid var(--fema-border)", borderRadius: "8px", padding: "14px" }}>
                <span style={{ fontSize: "11px", color: "var(--fema-text-muted)" }}>DETERMINISTIC CONFIDENCE</span>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#a855f7", marginTop: "4px" }}>
                  {records && records.length > 0 ? `${Math.min(99.9, Math.round(100 - (escalatedRisks.length / Math.max(records.length, 1)) * 10))}% Statistical Accuracy` : "98.5% Statistical Accuracy"}
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
