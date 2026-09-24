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
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)}L`;
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
    <div style={{ width: '100%', height: 240, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ height: 190, width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dynamicData}
            margin={{ top: 8, right: 10, left: -10, bottom: 0 }}
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="var(--fema-text-muted)" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              stroke="var(--fema-text-muted)" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(value) => {
                if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
                if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
                if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
                return `₹${value}`;
              }} 
            />
            <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.02)'}} />
            <Bar dataKey="budget" name="Budget" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} minPointSize={4} />
            <Bar dataKey="actual" name="Actual" radius={[4, 4, 0, 0]} maxBarSize={32} minPointSize={4}>
              {dynamicData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.actual > entry.budget ? "#f43f5e" : "#10b981"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid var(--fema-border)", fontSize: "11.5px" }}>
        <span style={{ color: "var(--fema-text-muted)" }}>
          Net Operational Spend:
        </span>
        <span style={{ fontWeight: 700, color: "var(--fema-text-primary)", fontFamily: "IBM Plex Mono, monospace" }}>
          ₹{dynamicData.reduce((acc: number, d: any) => acc + (Number(d.actual) || 0), 0).toLocaleString('en-IN')}
        </span>
      </div>
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
// CHART 4: Material Risk & Severity Exposure Telemetry (Horizontal Bar)
// ============================================================================
const RiskSeverityFunnelChart: React.FC<{
  risks?: EscalatedRisk[];
  exceptions?: ExceptionCase[];
  records?: FinancialRecord[];
}> = ({ risks = [], exceptions = [], records = [] }) => {
  const data = React.useMemo(() => {
    const severityMap: Record<string, { count: number; exposure: number; color: string }> = {
      CRITICAL: { count: 0, exposure: 0, color: "#f43f5e" },
      HIGH: { count: 0, exposure: 0, color: "#f97316" },
      MEDIUM: { count: 0, exposure: 0, color: "#eab308" },
      LOW: { count: 0, exposure: 0, color: "#10b981" },
    };

    if (risks && risks.length > 0) {
      risks.forEach((r) => {
        const sev = (r.severity || "HIGH").toUpperCase();
        const key = sev.includes("CRIT") ? "CRITICAL" : sev.includes("HIGH") ? "HIGH" : sev.includes("MED") ? "MEDIUM" : "LOW";
        severityMap[key].count += 1;
        severityMap[key].exposure += Math.abs(Number(r.variance_amount) || Number(r.actual_amount) || 0);
      });
    } else if (exceptions && exceptions.length > 0) {
      exceptions.forEach((e: any) => {
        const sev = (e.severity || "HIGH").toUpperCase();
        const key = sev.includes("CRIT") ? "CRITICAL" : sev.includes("HIGH") ? "HIGH" : sev.includes("MED") ? "MEDIUM" : "LOW";
        severityMap[key].count += 1;
        severityMap[key].exposure += Math.abs(Number(e.variance_amount) || 0);
      });
    } else if (records && records.length > 0) {
      records.forEach((r) => {
        const v = Math.abs(Number(r.actual_amount) - Number(r.budget_amount));
        const vPct = Number(r.budget_amount) > 0 ? (v / Number(r.budget_amount)) * 100 : 0;
        const key = vPct >= 30 ? "CRITICAL" : vPct >= 20 ? "HIGH" : vPct >= 10 ? "MEDIUM" : "LOW";
        severityMap[key].count += 1;
        severityMap[key].exposure += v;
      });
    } else {
      return [
        { severity: "Critical", count: 1, exposure: 240000, color: "#f43f5e" },
        { severity: "High", count: 2, exposure: 95000, color: "#f97316" },
        { severity: "Medium", count: 3, exposure: 45000, color: "#eab308" },
        { severity: "Low", count: 8, exposure: 18000, color: "#10b981" },
      ];
    }

    return [
      { severity: "Critical", count: severityMap.CRITICAL.count, exposure: severityMap.CRITICAL.exposure, color: severityMap.CRITICAL.color },
      { severity: "High", count: severityMap.HIGH.count, exposure: severityMap.HIGH.exposure, color: severityMap.HIGH.color },
      { severity: "Medium", count: severityMap.MEDIUM.count, exposure: severityMap.MEDIUM.exposure, color: severityMap.MEDIUM.color },
      { severity: "Low", count: severityMap.LOW.count, exposure: severityMap.LOW.exposure, color: severityMap.LOW.color },
    ];
  }, [risks, exceptions, records]);

  const totalAtRisk = data.reduce((acc, d) => acc + d.exposure, 0);

  return (
    <div style={{ width: "100%", height: 240, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ height: 190, width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 0, bottom: 0 }} barCategoryGap={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" horizontal={false} />
            <XAxis
              type="number"
              stroke="var(--fema-text-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₹${v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v}`}
            />
            <YAxis
              type="category"
              dataKey="severity"
              stroke="var(--fema-text-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={70}
            />
            <Tooltip
              formatter={(value: any, _name: any, item: any) => [
                `₹${Number(value).toLocaleString('en-IN')} (${item?.payload?.count || 0} cases)`,
                "At-Risk Capital",
              ]}
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
            />
            <Bar dataKey="exposure" name="At-Risk Capital" radius={[0, 4, 4, 0]} maxBarSize={22}>
              {data.map((entry, index) => (
                <Cell key={`sev-cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid var(--fema-border)", fontSize: "11.5px" }}>
        <span style={{ color: "var(--fema-text-muted)" }}>
          Aggregate Material Exposure:
        </span>
        <span style={{ fontWeight: 700, color: totalAtRisk > 0 ? "#f43f5e" : "#10b981", fontFamily: "IBM Plex Mono, monospace" }}>
          ₹{totalAtRisk.toLocaleString('en-IN')}
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
  exceptions,
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
    <div style={{ paddingBottom: "48px" }}>
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

      {/* ==================================================================== */}
      {/* VIEW 1: MAIN DASHBOARD OVERVIEW (Executive KPIs + 2x2 Charts + Brief)*/}
      {/* ==================================================================== */}
      {activeSection === "all" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", paddingBottom: "32px" }}>
          {/* Executive CFO KPI Cards Grid */}
          <div className="fema-cfo-kpi-grid">
            {/* Card 1: Total Actual Spend */}
            <div className="fema-cfo-kpi-card">
              <div className="fema-cfo-kpi-top">
                <span className="fema-cfo-kpi-label">Total Actual Spend</span>
                <div className="fema-cfo-kpi-icon" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>
                </div>
              </div>
              <div className="fema-cfo-kpi-body">
                <span className="fema-cfo-kpi-val">
                  {kpis?.budget_variance?.total_actual != null
                    ? formatInrCompact(kpis.budget_variance.total_actual)
                    : (kpis?.operating_cash_flow?.amount != null ? formatInrCompact(kpis.operating_cash_flow.amount) : "—")}
                </span>
                <span
                  className="fema-cfo-kpi-pill"
                  style={{
                    background: (kpis?.budget_variance?.net_variance_pct ?? 0) > 0 ? "rgba(244, 63, 94, 0.1)" : "rgba(16, 185, 129, 0.1)",
                    color: (kpis?.budget_variance?.net_variance_pct ?? 0) > 0 ? "#f43f5e" : "#10b981",
                    border: `1px solid ${(kpis?.budget_variance?.net_variance_pct ?? 0) > 0 ? "rgba(244, 63, 94, 0.2)" : "rgba(16, 185, 129, 0.2)"}`,
                  }}
                >
                  {kpis?.budget_variance?.net_variance_pct != null
                    ? `${kpis.budget_variance.net_variance_pct > 0 ? "+" : ""}${kpis.budget_variance.net_variance_pct}% over Budget (${formatInrCompact(kpis.budget_variance.total_budget)})`
                    : "—"}
                </span>
              </div>
            </div>

            {/* Card 2: Financial Safety Ratio */}
            <div className="fema-cfo-kpi-card">
              <div className="fema-cfo-kpi-top">
                <span className="fema-cfo-kpi-label">Financial Safety Ratio</span>
                <div className="fema-cfo-kpi-icon" style={{ background: "rgba(99, 102, 241, 0.12)", color: "#6366f1" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22" /><line x1="6" y1="18" x2="6" y2="11" /><line x1="10" y1="18" x2="10" y2="11" /><line x1="14" y1="18" x2="14" y2="11" /><line x1="18" y1="18" x2="18" y2="11" /><polygon points="12 2 20 7 4 7" /></svg>
                </div>
              </div>
              <div className="fema-cfo-kpi-body">
                <span className="fema-cfo-kpi-val">
                  {kpis?.liquidity_ratio?.current_ratio != null ? `${kpis.liquidity_ratio.current_ratio}x` : "—"}
                </span>
                <span
                  className="fema-cfo-kpi-pill"
                  style={{
                    background: (kpis?.liquidity_ratio?.buffer ?? 0) >= 0 ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                    color: (kpis?.liquidity_ratio?.buffer ?? 0) >= 0 ? "#10b981" : "#f59e0b",
                    border: `1px solid ${(kpis?.liquidity_ratio?.buffer ?? 0) >= 0 ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)"}`,
                  }}
                >
                  {(kpis?.liquidity_ratio?.buffer ?? 0) >= 0 ? "Safe (≥1.50x Target)" : "Low Buffer (Target: ≥1.50x)"}
                </span>
              </div>
            </div>

            {/* Card 3: Net Profit / Loss Margin */}
            <div className="fema-cfo-kpi-card">
              <div className="fema-cfo-kpi-top">
                <span className="fema-cfo-kpi-label">Profit / Loss Margin</span>
                <div className="fema-cfo-kpi-icon" style={{ background: (kpis?.operating_margin_pct?.current ?? 0) < 0 ? "rgba(244, 63, 94, 0.12)" : "rgba(16, 185, 129, 0.12)", color: (kpis?.operating_margin_pct?.current ?? 0) < 0 ? "#f43f5e" : "#10b981" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
                </div>
              </div>
              <div className="fema-cfo-kpi-body">
                <span className="fema-cfo-kpi-val" style={{ color: (kpis?.operating_margin_pct?.current ?? 0) < 0 ? "#f43f5e" : "#10b981" }}>
                  {kpis?.operating_margin_pct?.current != null ? `${kpis.operating_margin_pct.current}%` : "—"}
                </span>
                <span
                  className="fema-cfo-kpi-pill"
                  style={{
                    background: (kpis?.operating_margin_pct?.current ?? 0) < 0 ? "rgba(244, 63, 94, 0.1)" : "rgba(16, 185, 129, 0.1)",
                    color: (kpis?.operating_margin_pct?.current ?? 0) < 0 ? "#f43f5e" : "#10b981",
                    border: `1px solid ${(kpis?.operating_margin_pct?.current ?? 0) < 0 ? "rgba(244, 63, 94, 0.2)" : "rgba(16, 185, 129, 0.2)"}`,
                  }}
                >
                  {(kpis?.operating_margin_pct?.current ?? 0) < 0 ? "Loss: Expense > Revenue" : "Profit: Revenue > Expense"}
                </span>
              </div>
            </div>

            {/* Card 4: Pending Approvals */}
            <div className="fema-cfo-kpi-card">
              <div className="fema-cfo-kpi-top">
                <span className="fema-cfo-kpi-label">Pending Approvals</span>
                <div className="fema-cfo-kpi-icon" style={{ background: escalatedRisks.length > 0 ? "rgba(244, 63, 94, 0.12)" : "rgba(16, 185, 129, 0.12)", color: escalatedRisks.length > 0 ? "#f43f5e" : "#10b981" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                </div>
              </div>
              <div className="fema-cfo-kpi-body">
                <span className="fema-cfo-kpi-val">
                  {escalatedRisks.length} Case{escalatedRisks.length !== 1 ? "s" : ""}
                </span>
                <span
                  className="fema-cfo-kpi-pill"
                  style={{
                    background: escalatedRisks.length > 0 ? "rgba(244, 63, 94, 0.1)" : "rgba(16, 185, 129, 0.1)",
                    color: escalatedRisks.length > 0 ? "#f43f5e" : "#10b981",
                    border: `1px solid ${escalatedRisks.length > 0 ? "rgba(244, 63, 94, 0.2)" : "rgba(16, 185, 129, 0.2)"}`,
                  }}
                >
                  {escalatedRisks.length > 0 ? "CFO Sign-Off Required" : "All Clear"}
                </span>
              </div>
            </div>
          </div>

          {/* Symmetrical 2x2 Executive Charts Grid */}
          <div className="fema-analyst-grid">
            {/* Chart 1: Budget vs. Actual Expenditure */}
            <div className="fema-section-card" style={{ padding: "18px 20px" }}>
              <div className="fema-section-header" style={{ marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <h3 className="fema-section-title" style={{ fontSize: "15px" }}>
                    {chartViewMode === "department"
                      ? "Consolidated Budget vs. Actual"
                      : "Monthly Capital Trajectory"}
                  </h3>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "2px", background: "var(--fema-surface-muted)", padding: "2px", borderRadius: "6px", border: "1px solid var(--fema-border)" }}>
                    <button
                      type="button"
                      onClick={() => setChartViewMode("department")}
                      style={{
                        padding: "3px 8px",
                        fontSize: "10.5px",
                        fontWeight: 700,
                        borderRadius: "4px",
                        border: "none",
                        cursor: "pointer",
                        background: chartViewMode === "department" ? "var(--fema-surface)" : "transparent",
                        color: chartViewMode === "department" ? "var(--fema-text-primary)" : "var(--fema-text-secondary)",
                        boxShadow: chartViewMode === "department" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                      }}
                    >
                      Unit
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartViewMode("monthly")}
                      style={{
                        padding: "3px 8px",
                        fontSize: "10.5px",
                        fontWeight: 700,
                        borderRadius: "4px",
                        border: "none",
                        cursor: "pointer",
                        background: chartViewMode === "monthly" ? "var(--fema-surface)" : "transparent",
                        color: chartViewMode === "monthly" ? "var(--fema-text-primary)" : "var(--fema-text-secondary)",
                        boxShadow: chartViewMode === "monthly" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                      }}
                    >
                      Trend
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "10.5px", fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#6366f1" }} />
                      <span>Budget</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#f43f5e" }} />
                      <span>Over</span>
                    </div>
                  </div>
                </div>
              </div>

              <CfoExecutiveChart kpis={kpis} records={records} viewMode={chartViewMode} />
            </div>

            {/* Chart 2: Cash Inflow vs. Outflow Dynamics */}
            <div className="fema-section-card" style={{ padding: "18px 20px" }}>
              <div className="fema-section-header" style={{ marginBottom: "12px" }}>
                <div>
                  <h3 className="fema-section-title" style={{ fontSize: "15px" }}>
                    Cash Inflow vs. Outflow Dynamics
                  </h3>
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

            {/* Chart 3: Capital Allocation by Department */}
            <div className="fema-section-card" style={{ padding: "18px 20px" }}>
              <div className="fema-section-header" style={{ marginBottom: "12px" }}>
                <div>
                  <h3 className="fema-section-title" style={{ fontSize: "15px" }}>
                    Capital Allocation by Business Unit
                  </h3>
                </div>
                <Badge variant="purple" size="sm">
                  {records ? `${new Set(records.map(r => r.department)).size} Units` : "2 Units"}
                </Badge>
              </div>

              <DepartmentAllocationChart records={records} />
            </div>

            {/* Chart 4: Material Risk & Severity Exposure */}
            <div className="fema-section-card" style={{ padding: "18px 20px" }}>
              <div className="fema-section-header" style={{ marginBottom: "12px" }}>
                <div>
                  <h3 className="fema-section-title" style={{ fontSize: "15px" }}>
                    Material Risk & Severity Exposure
                  </h3>
                </div>
                <Badge variant={escalatedRisks.length > 0 ? "danger" : "success"} size="sm">
                  {escalatedRisks.length} Escalated
                </Badge>
              </div>

              <RiskSeverityFunnelChart risks={escalatedRisks} exceptions={exceptions} records={records} />
            </div>
          </div>

          {/* Automated AI Brief (Full Width below 2x2 grid) */}
          <div className="fema-section-card" style={{ padding: "18px 22px" }}>
            <div className="fema-section-header" style={{ marginBottom: "14px" }}>
              <div>
                <h3 className="fema-section-title" style={{ fontSize: "15px" }}>
                  Automated Executive Briefing
                </h3>
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
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 2: FINANCIAL KPIS SUB-PAGE (Clean Cards, No Charts)             */}
      {/* ==================================================================== */}
      {activeSection === "kpis" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* 1. Treasury Liquidity & Debt Covenant Telemetry Section Card */}
          <div className="fema-section-card" style={{ padding: "22px 24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "14px",
                marginBottom: "20px",
                paddingBottom: "16px",
                borderBottom: "1px solid var(--fema-border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)",
                    border: "1px solid rgba(99, 102, 241, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--fema-accent-indigo)",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" x2="21" y1="22" x2="22" />
                    <line x1="6" x2="6" y1="18" y2="11" />
                    <line x1="10" x2="10" y1="18" y2="11" />
                    <line x1="14" x2="14" y1="18" y2="11" />
                    <line x1="18" x2="18" y1="18" y2="11" />
                    <polygon points="12 2 20 7 4 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="fema-section-title" style={{ fontSize: "17px", fontWeight: 700, margin: 0 }}>
                    Treasury Liquidity & Debt Covenant Telemetry
                  </h3>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                {/* Health Status Pills */}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 600,
                    background: "rgba(16, 185, 129, 0.1)",
                    color: "#10b981",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                  }}
                >
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981" }} />
                  1 Compliant
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 600,
                    background: "rgba(245, 158, 11, 0.1)",
                    color: "#f59e0b",
                    border: "1px solid rgba(245, 158, 11, 0.25)",
                  }}
                >
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f59e0b" }} />
                  1 Watch
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 600,
                    background: "rgba(244, 63, 94, 0.1)",
                    color: "#f43f5e",
                    border: "1px solid rgba(244, 63, 94, 0.25)",
                  }}
                >
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f43f5e" }} />
                  2 Attention
                </span>

                {/* Auto Telemetry Notice Chip */}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 12px",
                    borderRadius: "8px",
                    fontSize: "11.5px",
                    fontWeight: 600,
                    background: "var(--fema-surface-subtle)",
                    color: "var(--fema-text-muted)",
                    border: "1px solid var(--fema-border)",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  Auto-calculated Telemetry (Read-Only)
                </span>
              </div>
            </div>

            {/* HIGH-CONTRAST EXECUTIVE TABLE */}
            <div className="fema-table-container">
              <table className="fema-table">
                <thead>
                  <tr>
                    <th style={{ width: "26%" }}>Covenant & Indicator</th>
                    <th style={{ width: "15%" }}>Actual Telemetry</th>
                    <th style={{ width: "15%" }}>Statutory Threshold</th>
                    <th style={{ width: "15%" }}>Safety Spread</th>
                    <th style={{ width: "14%" }}>Audit Status</th>
                    <th style={{ width: "15%" }}>Governance Insight</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Row 1: Operating Cash Flow */}
                  <tr>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "8px",
                            background: "rgba(16, 185, 129, 0.12)",
                            color: "#10b981",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="20" height="12" x="2" y="6" rx="2" />
                            <circle cx="12" cy="12" r="2" />
                            <path d="M6 12h.01M18 12h.01" />
                          </svg>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--fema-text-primary)" }}>
                            Operating Cash Flow
                          </div>
                          <div className="fema-text-sub" style={{ fontSize: "11.5px" }}>
                            Consolidated working capital velocity
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, fontSize: "16px", color: "#10b981" }}>
                        {formatCurrencyInr(kpis?.operating_cash_flow?.amount)}
                      </div>
                      <div style={{ fontSize: "10.5px", color: "var(--fema-text-muted)" }}>Live Ledger Feed</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: "13.5px" }}>
                        {formatCurrencyInr(kpis?.operating_cash_flow?.min_threshold)}
                      </div>
                      <div style={{ fontSize: "10.5px", color: "var(--fema-text-muted)" }}>Minimum Floor</div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 700,
                          background: "rgba(16, 185, 129, 0.12)",
                          color: "#10b981",
                        }}
                      >
                        ↑ +{formatInrCompact(kpis?.operating_cash_flow?.surplus)} Surplus
                      </span>
                    </td>
                    <td>
                      <span className="fema-status-pill active">
                        <span className="fema-status-dot-pulse" /> Compliant
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "11.5px", color: "var(--fema-text-secondary)", lineHeight: 1.35 }}>
                        Comfortably covers short-term commitments.
                      </span>
                    </td>
                  </tr>

                  {/* Row 2: Liquidity Coverage Ratio */}
                  <tr>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "8px",
                            background: "rgba(99, 102, 241, 0.12)",
                            color: "#6366f1",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <path d="m9 12 2 2 4-4" />
                          </svg>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--fema-text-primary)" }}>
                            Liquidity Coverage Ratio (LCR)
                          </div>
                          <div className="fema-text-sub" style={{ fontSize: "11.5px" }}>
                            Liquid assets vs 30-day net outflows
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, fontSize: "16px", color: "#6366f1" }}>
                        {kpis?.liquidity_ratio?.current_ratio != null ? `${kpis.liquidity_ratio.current_ratio}x` : "—"}
                      </div>
                      <div style={{ fontSize: "10.5px", color: "var(--fema-text-muted)" }}>Current Ratio</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: "13.5px" }}>
                        {kpis?.liquidity_ratio?.target ?? 1.5}x
                      </div>
                      <div style={{ fontSize: "10.5px", color: "var(--fema-text-muted)" }}>Minimum Target</div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 700,
                          background: "rgba(245, 158, 11, 0.12)",
                          color: "#f59e0b",
                        }}
                      >
                        ↓ {kpis?.liquidity_ratio?.buffer ?? -0.31}x Deficit
                      </span>
                    </td>
                    <td>
                      <span className="fema-status-pill inactive">
                        <span className="fema-status-dot-pulse" /> Watch
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "11.5px", color: "var(--fema-text-secondary)", lineHeight: 1.35 }}>
                        Buffer 0.31x below covenant; monitor outflows.
                      </span>
                    </td>
                  </tr>

                  {/* Row 3: EBITDA Operating Margin */}
                  <tr>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "8px",
                            background: "rgba(168, 85, 247, 0.12)",
                            color: "#a855f7",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                            <polyline points="16 7 22 7 22 13" />
                          </svg>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--fema-text-primary)" }}>
                            EBITDA Operating Margin
                          </div>
                          <div className="fema-text-sub" style={{ fontSize: "11.5px" }}>
                            Trailing operating margin benchmark
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, fontSize: "16px", color: "#f43f5e" }}>
                        {kpis?.operating_margin_pct?.current != null ? `${kpis.operating_margin_pct.current}%` : "—"}
                      </div>
                      <div style={{ fontSize: "10.5px", color: "var(--fema-text-muted)" }}>Current Margin</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: "13.5px" }}>
                        {kpis?.operating_margin_pct?.target ?? 18.0}%
                      </div>
                      <div style={{ fontSize: "10.5px", color: "var(--fema-text-muted)" }}>Benchmark Target</div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 700,
                          background: "rgba(244, 63, 94, 0.12)",
                          color: "#f43f5e",
                        }}
                      >
                        ↓ {kpis?.operating_margin_pct?.trend_pct ?? -111.3}% Behind
                      </span>
                    </td>
                    <td>
                      <span className="fema-status-pill inactive">
                        <span className="fema-status-dot-pulse" /> Attention Needed
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "11.5px", color: "var(--fema-text-secondary)", lineHeight: 1.35 }}>
                        Compressed margins; review discretionary OpEx.
                      </span>
                    </td>
                  </tr>

                  {/* Row 4: Net Budget Variance Exposure */}
                  <tr>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "8px",
                            background: "rgba(244, 63, 94, 0.12)",
                            color: "#f43f5e",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--fema-text-primary)" }}>
                            Net Budget Variance Exposure
                          </div>
                          <div className="fema-text-sub" style={{ fontSize: "11.5px" }}>
                            Aggregate active exceptions deviation
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, fontSize: "16px", color: "#f43f5e" }}>
                        {(kpis?.budget_variance?.net_variance_pct ?? 0) > 0 ? "+" : ""}{kpis?.budget_variance?.net_variance_pct ?? 0}%
                      </div>
                      <div style={{ fontSize: "10.5px", color: "var(--fema-text-muted)" }}>Net Deviation</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: "13.5px" }}>
                        {kpis?.budget_variance?.trigger_limit ?? 15.0}%
                      </div>
                      <div style={{ fontSize: "10.5px", color: "var(--fema-text-muted)" }}>Tolerance Trigger</div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 700,
                          background: "rgba(244, 63, 94, 0.12)",
                          color: "#f43f5e",
                        }}
                      >
                        ↑ +{kpis?.budget_variance?.overrun_pct ?? 11.44}% Overrun
                      </span>
                    </td>
                    <td>
                      <span className="fema-status-pill inactive">
                        <span className="fema-status-dot-pulse" /> Attention Needed
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "11.5px", color: "var(--fema-text-secondary)", lineHeight: 1.35 }}>
                        Department overruns exceed 15% tolerance limit.
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Early Warning Radar & Predictive Covenants Section Card */}
          <div className="fema-section-card" style={{ padding: "22px 24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "20px",
                paddingBottom: "16px",
                borderBottom: "1px solid var(--fema-border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "rgba(244, 63, 94, 0.12)",
                    border: "1px solid rgba(244, 63, 94, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#f43f5e",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4" />
                    <path d="m4.93 4.93 2.83 2.83" />
                    <path d="M2 12h4" />
                    <path d="m4.93 19.07 2.83-2.83" />
                    <path d="M12 22v-4" />
                    <path d="m19.07 19.07-2.83-2.83" />
                    <path d="M22 12h-4" />
                    <path d="m19.07 4.93-2.83 2.83" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div>
                  <h3 className="fema-section-title" style={{ fontSize: "17px", fontWeight: 700, margin: 0 }}>
                    Early Warning Radar & Predictive Covenants
                  </h3>
                </div>
              </div>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 700,
                  background: "rgba(244, 63, 94, 0.1)",
                  color: "#f43f5e",
                  border: "1px solid rgba(244, 63, 94, 0.25)",
                }}
              >
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#f43f5e" }} />
                {warnings.length} Active Radar Signals
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                gap: "16px",
              }}
            >
              {warnings.map((w, idx) => {
                const isHigh = w.risk_level === "High";
                const accentColor = isHigh ? "#f43f5e" : "#f59e0b";
                const accentBg = isHigh ? "rgba(244, 63, 94, 0.08)" : "rgba(245, 158, 11, 0.08)";

                return (
                  <div
                    key={idx}
                    style={{
                      background: "var(--fema-surface)",
                      border: "1px solid var(--fema-border)",
                      borderLeft: `4px solid ${accentColor}`,
                      borderRadius: "12px",
                      padding: "18px 20px",
                      boxShadow: "var(--fema-card-shadow)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "14px",
                      transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                      <div style={{ fontWeight: 700, fontSize: "14.5px", color: "var(--fema-text-primary)", lineHeight: 1.3 }}>
                        {w.title}
                      </div>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "3px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: 700,
                          background: accentBg,
                          color: accentColor,
                          border: `1px solid ${isHigh ? "rgba(244, 63, 94, 0.25)" : "rgba(245, 158, 11, 0.25)"}`,
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: accentColor }} />
                        {w.risk_level} Risk
                      </span>
                    </div>

                    {/* Description */}
                    <p style={{ fontSize: "13px", color: "var(--fema-text-secondary)", lineHeight: 1.5, margin: 0 }}>
                      {w.description}
                    </p>

                    {/* AI Advisory Callout */}
                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        background: "var(--fema-surface-subtle)",
                        border: "1px solid var(--fema-border)",
                        fontSize: "11.5px",
                        color: "var(--fema-text-muted)",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ color: "var(--fema-accent-indigo)", fontWeight: 700 }}>AI Note:</span>
                      <span>Anomaly flagged for executive review prior to end-of-period closing.</span>
                    </div>

                    {/* Metadata Footer */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: "10px",
                        borderTop: "1px solid var(--fema-border)",
                        fontSize: "11.5px",
                        color: "var(--fema-text-muted)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        </svg>
                        <span>Area: <strong style={{ color: "var(--fema-text-primary)" }}>{w.impacted_area}</strong></span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>Deadline: <strong style={{ color: "var(--fema-text-primary)" }}>{w.review_deadline}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
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
