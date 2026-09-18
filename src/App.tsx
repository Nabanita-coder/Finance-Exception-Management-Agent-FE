import React, { useState, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';

export interface FinancialRecord {
  id: number;
  category: 'Revenue' | 'Expense';
  period: string;
  department: string;
  budget_amount: number;
  actual_amount: number;
  variance_percent?: number;
  created_at?: string;
}

export interface Owner {
  id: number;
  name: string;
  email: string;
  role: string;
  level: number;
}

export interface ExceptionCase {
  id: number;
  financial_record_id: number;
  record?: FinancialRecord;
  variance_percent: number;
  severity: Severity;
  possible_reason: string;
  status: CaseStatus;
  owner?: Owner;
  owner_id?: number;
  sla_deadline: string;
  escalation_level: number;
  created_at: string;
  updated_at?: string;
}

export interface DashboardSummary {
  total_records: number;
  total_exceptions: number;
  open_exceptions: number;
  overdue_exceptions: number;
  exceptions_by_severity: Record<Severity, number>;
  exceptions_by_status: Record<CaseStatus, number>;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  sources?: string[];
}

interface FemaAppProps {
  apiBaseUrl?: string; // e.g. "http://localhost:5000/api"
}

// ============================================================================
// INITIAL MOCK DATA (Enables standalone execution anywhere without backend)
// ============================================================================
const INITIAL_RECORDS: FinancialRecord[] = [
  { id: 1, category: 'Revenue', period: '2026-09', department: 'Enterprise Sales', budget_amount: 1200000, actual_amount: 720000, variance_percent: -40.0, created_at: '2026-09-15 10:00:00' },
  { id: 2, category: 'Expense', period: '2026-09', department: 'Cloud Infrastructure', budget_amount: 350000, actual_amount: 490000, variance_percent: 40.0, created_at: '2026-09-16 11:30:00' },
  { id: 3, category: 'Expense', period: '2026-09', department: 'Talent Acquisition', budget_amount: 150000, actual_amount: 185000, variance_percent: 23.33, created_at: '2026-09-17 09:15:00' },
  { id: 4, category: 'Revenue', period: '2026-08', department: 'SMB Operations', budget_amount: 800000, actual_amount: 820000, variance_percent: 2.5, created_at: '2026-08-31 16:00:00' },
  { id: 5, category: 'Expense', period: '2026-09', department: 'Marketing & Growth', budget_amount: 250000, actual_amount: 285000, variance_percent: 14.0, created_at: '2026-09-18 08:45:00' },
];

const INITIAL_OWNERS: Owner[] = [
  { id: 1, name: 'Asha Verma', email: 'asha@company.com', role: 'Finance Executive', level: 1 },
  { id: 2, name: 'Rohit Sharma', email: 'rohit@company.com', role: 'Finance Manager', level: 2 },
  { id: 3, name: 'Neha Kapoor', email: 'neha@company.com', role: 'Senior Finance Manager', level: 3 },
  { id: 4, name: 'CFO Office', email: 'cfo@company.com', role: 'CFO', level: 4 },
];

const INITIAL_EXCEPTIONS: ExceptionCase[] = [
  {
    id: 101,
    financial_record_id: 1,
    variance_percent: -40.0,
    severity: 'CRITICAL',
    possible_reason: 'Enterprise contract deferred to Q4; renewal rate slipped by 18%.',
    status: 'OPEN',
    owner: INITIAL_OWNERS[2],
    owner_id: 3,
    sla_deadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    escalation_level: 0,
    created_at: '2026-09-15 10:05:00',
  },
  {
    id: 102,
    financial_record_id: 2,
    variance_percent: 40.0,
    severity: 'CRITICAL',
    possible_reason: 'Unbudgeted compute cluster spun up for AI workload testing in us-east.',
    status: 'IN_PROGRESS',
    owner: INITIAL_OWNERS[2],
    owner_id: 3,
    sla_deadline: new Date(Date.now() - 12 * 3600 * 1000).toISOString(), // Overdue
    escalation_level: 1,
    created_at: '2026-09-16 11:35:00',
  },
  {
    id: 103,
    financial_record_id: 3,
    variance_percent: 23.33,
    severity: 'HIGH',
    possible_reason: 'External recruiter success fees booked ahead of schedule.',
    status: 'OPEN',
    owner: INITIAL_OWNERS[1],
    owner_id: 2,
    sla_deadline: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
    escalation_level: 0,
    created_at: '2026-09-17 09:20:00',
  },
  {
    id: 104,
    financial_record_id: 5,
    variance_percent: 14.0,
    severity: 'MEDIUM',
    possible_reason: 'Paid search spend increased for seasonal conversion promo.',
    status: 'RESOLVED',
    owner: INITIAL_OWNERS[0],
    owner_id: 1,
    sla_deadline: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
    escalation_level: 0,
    created_at: '2026-09-18 09:00:00',
  },
];

// ============================================================================
// ICONS (Clean, zero-dependency inline SVGs)
// ============================================================================
const Icons = {
  Dashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
  ),
  Records: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
  ),
  Exceptions: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
  ),
  Chat: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  ),
  AlertCircle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
  ),
  CheckCircle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
  ),
  TrendingUp: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
  ),
  TrendingDown: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>
  ),
  Refresh: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
  ),
  Escalate: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/></svg>
  ),
  Send: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
  ),
  Bot: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="12" x="3" y="6" rx="2"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M12 2v4"/><path d="M2 12h1"/><path d="M21 12h1"/></svg>
  ),
  User: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  ),
};

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================
export const FemaApp: React.FC<FemaAppProps> = ({ apiBaseUrl = 'http://localhost:5000/api' }) => {
  // Navigation
  const [currentView, setCurrentView] = useState<'dashboard' | 'records' | 'exceptions' | 'chat'>('dashboard');

  // Backend connection state
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);

  // Core Data
  const [records, setRecords] = useState<FinancialRecord[]>(INITIAL_RECORDS);
  const [exceptions, setExceptions] = useState<ExceptionCase[]>(INITIAL_EXCEPTIONS);
  const [owners] = useState<Owner[]>(INITIAL_OWNERS);

  // Modals & Panels
  const [selectedCase, setSelectedCase] = useState<ExceptionCase | null>(null);

  // Filters
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showOverdueOnly, setShowOverdueOnly] = useState<boolean>(false);

  // Forms
  const [formData, setFormData] = useState({
    category: 'Revenue' as 'Revenue' | 'Expense',
    period: '2026-09',
    department: '',
    budget_amount: '',
    actual_amount: '',
  });
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Hello! I am FEMA Intelligence. Ask me anything about your revenue deviations, cloud expenses, or open SLA cases.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatThinking, setIsChatThinking] = useState(false);

  // --------------------------------------------------------------------------
  // API Health Check & Data Fetching (Gracefully defaults to mock if backend off)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/health`, { signal: AbortSignal.timeout(2500) });
        if (res.ok) {
          setIsBackendConnected(true);
          // Fetch real data from backend
          fetchBackendData();
        } else {
          setIsBackendConnected(false);
        }
      } catch {
        setIsBackendConnected(false);
      }
    };
    checkBackend();
  }, [apiBaseUrl]);

  const fetchBackendData = async () => {
    try {
      const [recordsRes, exceptionsRes] = await Promise.all([
        fetch(`${apiBaseUrl}/financial-records`),
        fetch(`${apiBaseUrl}/exceptions`),
      ]);
      if (recordsRes.ok) {
        const data = await recordsRes.json();
        setRecords(data);
      }
      if (exceptionsRes.ok) {
        const data = await exceptionsRes.json();
        setExceptions(data);
      }
    } catch (err) {
      console.warn('Using local fallback state:', err);
    }
  };

  // --------------------------------------------------------------------------
  // COMPUTED STATS
  // --------------------------------------------------------------------------
  const summary: DashboardSummary = useMemo(() => {
    const by_severity: Record<Severity, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    const by_status: Record<CaseStatus, number> = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, ESCALATED: 0 };
    let overdue = 0;
    const now = new Date().getTime();

    exceptions.forEach((e) => {
      by_severity[e.severity] = (by_severity[e.severity] || 0) + 1;
      by_status[e.status] = (by_status[e.status] || 0) + 1;
      if (e.status !== 'RESOLVED' && new Date(e.sla_deadline).getTime() < now) {
        overdue += 1;
      }
    });

    return {
      total_records: records.length,
      total_exceptions: exceptions.length,
      open_exceptions: (by_status.OPEN || 0) + (by_status.IN_PROGRESS || 0) + (by_status.ESCALATED || 0),
      overdue_exceptions: overdue,
      exceptions_by_severity: by_severity,
      exceptions_by_status: by_status,
    };
  }, [records, exceptions]);

  // Filtered Exceptions
  const filteredExceptions = useMemo(() => {
    const now = new Date().getTime();
    return exceptions.filter((item) => {
      if (filterSeverity && item.severity !== filterSeverity) return false;
      if (filterStatus && item.status !== filterStatus) return false;
      if (showOverdueOnly) {
        return item.status !== 'RESOLVED' && new Date(item.sla_deadline).getTime() < now;
      }
      return true;
    });
  }, [exceptions, filterSeverity, filterStatus, showOverdueOnly]);

  // --------------------------------------------------------------------------
  // ACTIONS & HANDLERS
  // --------------------------------------------------------------------------
  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const budget = parseFloat(formData.budget_amount);
    const actual = parseFloat(formData.actual_amount);

    if (isNaN(budget) || isNaN(actual)) {
      setFormFeedback({ type: 'error', message: 'Please enter valid numerical amounts.' });
      return;
    }

    const variance = budget !== 0 ? ((actual - budget) / budget) * 100 : 0;

    const newRecord: FinancialRecord = {
      id: records.length ? Math.max(...records.map((r) => r.id)) + 1 : 1,
      category: formData.category,
      period: formData.period,
      department: formData.department || 'General Finance',
      budget_amount: budget,
      actual_amount: actual,
      variance_percent: parseFloat(variance.toFixed(2)),
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    if (isBackendConnected) {
      try {
        const res = await fetch(`${apiBaseUrl}/financial-records`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: newRecord.category,
            period: newRecord.period,
            department: newRecord.department,
            budget_amount: newRecord.budget_amount,
            actual_amount: newRecord.actual_amount,
          }),
        });
        if (res.ok) {
          fetchBackendData();
        }
      } catch (err) {
        console.error('Backend save error, fallback to local', err);
      }
    }

    setRecords((prev) => [newRecord, ...prev]);
    setFormFeedback({ type: 'success', message: `Record #${newRecord.id} successfully recorded (${variance > 0 ? '+' : ''}${variance.toFixed(1)}% variance).` });
    setFormData({
      category: 'Revenue',
      period: '2026-09',
      department: '',
      budget_amount: '',
      actual_amount: '',
    });
    setTimeout(() => setFormFeedback(null), 4000);
  };

  const handleRunMonitoring = async () => {
    setIsMonitoring(true);
    if (isBackendConnected) {
      try {
        await fetch(`${apiBaseUrl}/monitor`, { method: 'POST' });
        await fetchBackendData();
        setIsMonitoring(false);
        return;
      } catch (err) {
        console.warn('Backend monitor failed, running local detector', err);
      }
    }

    // Local client-side detection simulation
    setTimeout(() => {
      const existingRecordIds = new Set(exceptions.map((e) => e.financial_record_id));
      const newFoundCases: ExceptionCase[] = [];

      records.forEach((r) => {
        if (!existingRecordIds.has(r.id)) {
          const variance = r.budget_amount !== 0 ? ((r.actual_amount - r.budget_amount) / r.budget_amount) * 100 : 0;
          const absVar = Math.abs(variance);

          if (absVar >= 10) {
            let severity: Severity = 'LOW';
            let slaDays = 7;
            let assignedOwner = owners[0];

            if (absVar > 30) {
              severity = 'CRITICAL';
              slaDays = 1;
              assignedOwner = owners[2];
            } else if (absVar > 20) {
              severity = 'HIGH';
              slaDays = 3;
              assignedOwner = owners[1];
            } else {
              severity = 'MEDIUM';
              slaDays = 5;
            }

            const deadline = new Date(Date.now() + slaDays * 24 * 3600 * 1000).toISOString();

            newFoundCases.push({
              id: 100 + exceptions.length + newFoundCases.length + 1,
              financial_record_id: r.id,
              record: r,
              variance_percent: parseFloat(variance.toFixed(2)),
              severity,
              possible_reason: `Discrepancy detected in ${r.category} (${r.department || 'Operations'}) with ${variance > 0 ? '+' : ''}${variance.toFixed(1)}% variance.`,
              status: 'OPEN',
              owner: assignedOwner,
              owner_id: assignedOwner.id,
              sla_deadline: deadline,
              escalation_level: 0,
              created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
            });
          }
        }
      });

      if (newFoundCases.length > 0) {
        setExceptions((prev) => [...newFoundCases, ...prev]);
      }
      setIsMonitoring(false);
    }, 600);
  };

  const handleEscalateCase = async (caseId: number) => {
    if (isBackendConnected) {
      try {
        await fetch(`${apiBaseUrl}/exceptions/${caseId}/escalate`, { method: 'POST' });
        await fetchBackendData();
      } catch (err) {
        console.warn('API escalation fallback', err);
      }
    }

    setExceptions((prev) =>
      prev.map((c) => {
        if (c.id === caseId) {
          const nextLevel = Math.min(4, c.escalation_level + 1);
          const nextOwner = owners.find((o) => o.level === nextLevel) || owners[owners.length - 1];
          const updated = {
            ...c,
            status: 'ESCALATED' as CaseStatus,
            escalation_level: nextLevel,
            owner: nextOwner,
            owner_id: nextOwner.id,
            updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
          };
          if (selectedCase?.id === caseId) setSelectedCase(updated);
          return updated;
        }
        return c;
      })
    );
  };

  const handleStatusUpdate = async (caseId: number, newStatus: CaseStatus) => {
    if (isBackendConnected) {
      try {
        await fetch(`${apiBaseUrl}/exceptions/${caseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        await fetchBackendData();
      } catch (err) {
        console.warn('Status update API error', err);
      }
    }

    setExceptions((prev) =>
      prev.map((c) => {
        if (c.id === caseId) {
          const updated = { ...c, status: newStatus, updated_at: new Date().toISOString() };
          if (selectedCase?.id === caseId) setSelectedCase(updated);
          return updated;
        }
        return c;
      })
    );
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = chatInput.trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatThinking(true);

    if (isBackendConnected) {
      try {
        const res = await fetch(`${apiBaseUrl}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: query }),
        });
        if (res.ok) {
          const data = await res.json();
          const botReply: ChatMessage = {
            id: String(Date.now() + 1),
            sender: 'bot',
            text: data.answer || data.message || 'No direct reasoning returned.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sources: data.sources || [],
          };
          setChatMessages((prev) => [...prev, botReply]);
          setIsChatThinking(false);
          return;
        }
      } catch (err) {
        console.warn('Backend chat offline, generating intelligent fallback', err);
      }
    }

    // Dynamic intelligent standalone response
    setTimeout(() => {
      let botResponse = `I reviewed our active ledger. We currently have ${summary.total_records} financial records and ${summary.open_exceptions} active exceptions.`;
      const qLower = query.toLowerCase();

      if (qLower.includes('revenue')) {
        const revRecords = records.filter((r) => r.category === 'Revenue');
        botResponse = `Revenue Analysis: You have ${revRecords.length} revenue entries. The biggest variance is in Enterprise Sales with an actual of ₹720,000 vs budget of ₹1,200,000 (-40.0% variance). Case #101 is actively open with Senior Finance Manager Neha Kapoor.`;
      } else if (qLower.includes('critical') || qLower.includes('severity')) {
        botResponse = `Severity Breakdown: There are currently ${summary.exceptions_by_severity.CRITICAL} CRITICAL, ${summary.exceptions_by_severity.HIGH} HIGH, and ${summary.exceptions_by_severity.MEDIUM} MEDIUM cases. Critical items require resolution within 24 hours under SLA policy.`;
      } else if (qLower.includes('overdue') || qLower.includes('sla')) {
        botResponse = `SLA Alert: ${summary.overdue_exceptions} exception case is past its SLA deadline (Cloud Infrastructure, Case #102). It has already been escalated to Level 1.`;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 2),
          sender: 'bot',
          text: botResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsChatThinking(false);
    }, 700);
  };

  // Helper formatting
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };


  const isCaseOverdue = (deadline: string, status: CaseStatus) => {
    return status !== 'RESOLVED' && new Date(deadline).getTime() < Date.now();
  };

  return (
    <div style={styles.appShell}>
      {/* ---------------------------------------------------------------- */}
      {/* SIDEBAR NAVIGATION                                               */}
      {/* ---------------------------------------------------------------- */}
      <aside style={styles.sidebar}>
        <div style={styles.brandContainer}>
          <div style={styles.brandBadge}>FE</div>
          <div>
            <div style={styles.brandTitle}>FEMA</div>
            <div style={styles.brandSubtitle}>Finance Exception Agent</div>
          </div>
        </div>

        <nav style={styles.navMenu}>
          <button
            onClick={() => setCurrentView('dashboard')}
            style={{ ...styles.navButton, ...(currentView === 'dashboard' ? styles.navButtonActive : {}) }}
          >
            <span style={styles.navIndex}>01</span>
            <Icons.Dashboard />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentView('records')}
            style={{ ...styles.navButton, ...(currentView === 'records' ? styles.navButtonActive : {}) }}
          >
            <span style={styles.navIndex}>02</span>
            <Icons.Records />
            <span>Financial Records</span>
          </button>

          <button
            onClick={() => setCurrentView('exceptions')}
            style={{ ...styles.navButton, ...(currentView === 'exceptions' ? styles.navButtonActive : {}) }}
          >
            <span style={styles.navIndex}>03</span>
            <Icons.Exceptions />
            <span>Exception Cases</span>
            {summary.open_exceptions > 0 && (
              <span style={styles.counterPill}>{summary.open_exceptions}</span>
            )}
          </button>

          <button
            onClick={() => setCurrentView('chat')}
            style={{ ...styles.navButton, ...(currentView === 'chat' ? styles.navButtonActive : {}) }}
          >
            <span style={styles.navIndex}>04</span>
            <Icons.Chat />
            <span>Finance Chat</span>
          </button>
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.statusIndicatorBox}>
            <span
              style={{
                ...styles.statusDot,
                backgroundColor: isBackendConnected ? '#10b981' : '#f59e0b',
                boxShadow: isBackendConnected ? '0 0 8px #10b981' : '0 0 8px #f59e0b',
              }}
            />
            <span style={styles.statusText}>
              {isBackendConnected === null
                ? 'Checking API...'
                : isBackendConnected
                ? 'Backend Connected (5000)'
                : 'Standalone UI (Mock Mode)'}
            </span>
          </div>
        </div>
      </aside>

      {/* ---------------------------------------------------------------- */}
      {/* MAIN VIEW AREA                                                   */}
      {/* ---------------------------------------------------------------- */}
      <main style={styles.mainContent}>
        {/* ============================================================== */}
        {/* VIEW 1: DASHBOARD                                              */}
        {/* ============================================================== */}
        {currentView === 'dashboard' && (
          <div style={styles.viewContainer}>
            <header style={styles.viewHeader}>
              <h1 style={styles.viewTitle}>Executive Dashboard</h1>
              <p style={styles.viewDescription}>
                Real-time operational ledger and risk telemetry monitored by FEMA Agent.
              </p>
            </header>

            {/* Metric Stat Cards */}
            <div style={styles.statGrid}>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>TOTAL MONITORED RECORDS</div>
                <div style={styles.statValue}>{summary.total_records}</div>
                <div style={styles.statSub}>Budget vs Actual ledger items</div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statLabel}>OPEN EXCEPTION CASES</div>
                <div style={{ ...styles.statValue, color: '#f87171' }}>{summary.open_exceptions}</div>
                <div style={styles.statSub}>Requiring finance team resolution</div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statLabel}>OVERDUE SLA BREACHES</div>
                <div style={{ ...styles.statValue, color: summary.overdue_exceptions > 0 ? '#ef4444' : '#10b981' }}>
                  {summary.overdue_exceptions}
                </div>
                <div style={styles.statSub}>Passed resolution timeline</div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statLabel}>RESOLVED CASES</div>
                <div style={{ ...styles.statValue, color: '#34d399' }}>{summary.exceptions_by_status.RESOLVED || 0}</div>
                <div style={styles.statSub}>Audit closed and verified</div>
              </div>
            </div>

            {/* Severity Distribution Bars */}
            <div style={styles.panel}>
              <div style={styles.panelHeader}>
                <h2 style={styles.panelTitle}>Exceptions by Severity Level</h2>
                <button onClick={handleRunMonitoring} disabled={isMonitoring} style={styles.primaryButton}>
                  <Icons.Refresh />
                  {isMonitoring ? 'Analyzing Ledgers...' : 'Run Variance Audit'}
                </button>
              </div>

              <div style={styles.severitySection}>
                {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Severity[]).map((sev) => {
                  const count = summary.exceptions_by_severity[sev] || 0;
                  const total = summary.total_exceptions || 1;
                  const pct = Math.round((count / total) * 100);

                  const barColor =
                    sev === 'CRITICAL'
                      ? '#ef4444'
                      : sev === 'HIGH'
                      ? '#f59e0b'
                      : sev === 'MEDIUM'
                      ? '#818cf8'
                      : '#10b981';

                  return (
                    <div key={sev} style={styles.severityBarRow}>
                      <div style={styles.severityBarMeta}>
                        <span style={{ fontWeight: 600, color: barColor }}>{sev}</span>
                        <span style={{ color: '#94a3b8' }}>
                          {count} case{count !== 1 ? 's' : ''} ({pct}%)
                        </span>
                      </div>
                      <div style={styles.barTrack}>
                        <div
                          style={{
                            ...styles.barFill,
                            width: `${pct}%`,
                            backgroundColor: barColor,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Urgent Attention Alert Box */}
            {summary.overdue_exceptions > 0 && (
              <div style={styles.urgentAlert}>
                <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icons.AlertCircle />
                  <strong>Attention Required:</strong>
                </div>
                <span style={{ color: '#cbd5e1' }}>
                  {summary.overdue_exceptions} case(s) have passed their assigned SLA deadline. Immediate escalation recommended.
                </span>
                <button
                  onClick={() => {
                    setShowOverdueOnly(true);
                    setCurrentView('exceptions');
                  }}
                  style={styles.textButton}
                >
                  View Overdue →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: FINANCIAL RECORDS                                      */}
        {/* ============================================================== */}
        {currentView === 'records' && (
          <div style={styles.viewContainer}>
            <header style={styles.viewHeader}>
              <h1 style={styles.viewTitle}>Financial Records</h1>
              <p style={styles.viewDescription}>
                Budget vs. Actual figures ingested for variance surveillance.
              </p>
            </header>

            {/* Add Record Form */}
            <div style={styles.panel}>
              <div style={styles.panelHeader}>
                <h2 style={styles.panelTitle}>Add New Ledger Entry</h2>
              </div>

              <form onSubmit={handleCreateRecord} style={styles.formGrid}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    style={styles.select}
                  >
                    <option value="Revenue">Revenue</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Period (YYYY-MM)</label>
                  <input
                    type="text"
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    placeholder="2026-09"
                    required
                    style={styles.input}
                  />
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Department / Cost Center</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Engineering, Sales, Marketing"
                    style={styles.input}
                  />
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Budget Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.budget_amount}
                    onChange={(e) => setFormData({ ...formData, budget_amount: e.target.value })}
                    placeholder="1000000"
                    required
                    style={styles.input}
                  />
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Actual Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.actual_amount}
                    onChange={(e) => setFormData({ ...formData, actual_amount: e.target.value })}
                    placeholder="850000"
                    required
                    style={styles.input}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" style={{ ...styles.primaryButton, width: '100%', height: '42px' }}>
                    Record Entry
                  </button>
                </div>
              </form>

              {formFeedback && (
                <div
                  style={{
                    ...styles.feedbackNotice,
                    backgroundColor: formFeedback.type === 'success' ? '#065f4625' : '#88133725',
                    borderColor: formFeedback.type === 'success' ? '#10b981' : '#ef4444',
                    color: formFeedback.type === 'success' ? '#34d399' : '#f87171',
                  }}
                >
                  {formFeedback.message}
                </div>
              )}
            </div>

            {/* Records Ledger Table */}
            <div style={styles.panel}>
              <div style={styles.panelHeader}>
                <div>
                  <h2 style={styles.panelTitle}>Active Ledger Records ({records.length})</h2>
                  <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                    Click &quot;Run Monitoring&quot; to inspect all records and generate exception cases.
                  </p>
                </div>
                <button onClick={handleRunMonitoring} disabled={isMonitoring} style={styles.secondaryButton}>
                  <Icons.Refresh />
                  {isMonitoring ? 'Scanning...' : 'Run Monitoring →'}
                </button>
              </div>

              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Category</th>
                      <th style={styles.th}>Period</th>
                      <th style={styles.th}>Department</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>Budget</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>Actual</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => {
                      const variance =
                        r.variance_percent ??
                        (r.budget_amount !== 0
                          ? ((r.actual_amount - r.budget_amount) / r.budget_amount) * 100
                          : 0);

                      const isNegativeRevenue = r.category === 'Revenue' && variance < -10;
                      const isOverExpense = r.category === 'Expense' && variance > 10;
                      const isAbnormal = isNegativeRevenue || isOverExpense;

                      return (
                        <tr key={r.id} style={styles.tr}>
                          <td style={styles.tdMono}>#{r.id}</td>
                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.categoryPill,
                                backgroundColor: r.category === 'Revenue' ? '#065f4625' : '#88133725',
                                color: r.category === 'Revenue' ? '#34d399' : '#f87171',
                              }}
                            >
                              {r.category}
                            </span>
                          </td>
                          <td style={styles.tdMono}>{r.period}</td>
                          <td style={styles.td}>{r.department || '—'}</td>
                          <td style={{ ...styles.tdMono, textAlign: 'right' }}>{formatCurrency(r.budget_amount)}</td>
                          <td style={{ ...styles.tdMono, textAlign: 'right' }}>{formatCurrency(r.actual_amount)}</td>
                          <td style={{ ...styles.td, textAlign: 'right' }}>
                            <span
                              style={{
                                ...styles.varianceBadge,
                                color: isAbnormal ? '#ef4444' : '#10b981',
                                backgroundColor: isAbnormal ? '#450a0a' : '#022c22',
                              }}
                            >
                              {variance > 0 ? '+' : ''}
                              {variance.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 3: EXCEPTION CASES                                        */}
        {/* ============================================================== */}
        {currentView === 'exceptions' && (
          <div style={styles.viewContainer}>
            <header style={styles.viewHeader}>
              <h1 style={styles.viewTitle}>Exception Management</h1>
              <p style={styles.viewDescription}>
                Detected variances triage, SLA countdowns, and escalation workflows.
              </p>
            </header>

            {/* Filter Bar */}
            <div style={styles.filterBar}>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Severity:</label>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  style={styles.filterSelect}
                >
                  <option value="">All Severities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Status:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={styles.filterSelect}
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="ESCALATED">Escalated</option>
                </select>
              </div>

              <button
                onClick={() => setShowOverdueOnly(!showOverdueOnly)}
                style={{
                  ...styles.filterToggle,
                  ...(showOverdueOnly ? styles.filterToggleActive : {}),
                }}
              >
                <Icons.AlertCircle />
                Overdue Only
              </button>

              <button
                onClick={() => {
                  setFilterSeverity('');
                  setFilterStatus('');
                  setShowOverdueOnly(false);
                }}
                style={styles.textButton}
              >
                Reset Filters
              </button>
            </div>

            {/* Exception Cases Ledger */}
            <div style={styles.panel}>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Case ID</th>
                      <th style={styles.th}>Record Ref</th>
                      <th style={styles.th}>Variance</th>
                      <th style={styles.th}>Severity</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Owner</th>
                      <th style={styles.th}>SLA Deadline</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExceptions.map((c) => {
                      const overdue = isCaseOverdue(c.sla_deadline, c.status);
                      return (
                        <tr
                          key={c.id}
                          onClick={() => setSelectedCase(c)}
                          style={{
                            ...styles.tr,
                            cursor: 'pointer',
                            backgroundColor: selectedCase?.id === c.id ? '#1e293b' : undefined,
                          }}
                        >
                          <td style={styles.tdMono}>
                            <strong>CASE-{c.id}</strong>
                          </td>
                          <td style={styles.tdMono}>REC-#{c.financial_record_id}</td>
                          <td style={styles.td}>
                            <span style={{ fontWeight: 600, color: c.variance_percent < 0 ? '#f87171' : '#fbbf24' }}>
                              {c.variance_percent > 0 ? '+' : ''}
                              {c.variance_percent}%
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ ...styles.badge, ...getSeverityBadgeInline(c.severity) }}>
                              {c.severity}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ ...styles.badge, ...getStatusBadgeInline(c.status) }}>
                              {c.status}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '13px', fontWeight: 500, color: '#f1f5f9' }}>
                                {c.owner?.name || 'Unassigned'}
                              </span>
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>{c.owner?.role}</span>
                            </div>
                          </td>
                          <td style={styles.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {overdue && (
                                <span title="SLA Overdue" style={{ color: '#ef4444' }}>
                                  <Icons.AlertCircle />
                                </span>
                              )}
                              <span
                                style={{
                                  fontSize: '12px',
                                  fontFamily: 'monospace',
                                  color: overdue ? '#ef4444' : '#cbd5e1',
                                }}
                              >
                                {new Date(c.sla_deadline).toLocaleDateString()}
                              </span>
                            </div>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCase(c);
                              }}
                              style={styles.miniButton}
                            >
                              Inspect →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Case Details Drawer / Panel */}
            {selectedCase && (
              <div style={styles.drawerOverlay} onClick={() => setSelectedCase(null)}>
                <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
                  <div style={styles.drawerHeader}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#818cf8', fontWeight: 600, letterSpacing: '0.05em' }}>
                        EXCEPTION DETAIL
                      </span>
                      <h2 style={{ fontSize: '20px', margin: '4px 0 0 0', color: '#f8fafc' }}>
                        Case #{selectedCase.id}
                      </h2>
                    </div>
                    <button onClick={() => setSelectedCase(null)} style={styles.closeButton}>
                      ✕
                    </button>
                  </div>

                  <div style={styles.drawerBody}>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Variance Impact:</span>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: selectedCase.variance_percent < 0 ? '#f87171' : '#fbbf24' }}>
                        {selectedCase.variance_percent > 0 ? '+' : ''}
                        {selectedCase.variance_percent}%
                      </span>
                    </div>

                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Severity:</span>
                      <span style={{ ...styles.badge, ...getSeverityBadgeInline(selectedCase.severity) }}>
                        {selectedCase.severity}
                      </span>
                    </div>

                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Escalation Level:</span>
                      <span style={{ color: '#e2e8f0', fontWeight: 600 }}>
                        Level {selectedCase.escalation_level} of 4
                      </span>
                    </div>

                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Assigned Owner:</span>
                      <div>
                        <div style={{ color: '#f1f5f9', fontWeight: 600 }}>{selectedCase.owner?.name}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{selectedCase.owner?.role}</div>
                      </div>
                    </div>

                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>SLA Deadline:</span>
                      <div style={{ color: isCaseOverdue(selectedCase.sla_deadline, selectedCase.status) ? '#ef4444' : '#f1f5f9' }}>
                        {new Date(selectedCase.sla_deadline).toLocaleString()}
                        {isCaseOverdue(selectedCase.sla_deadline, selectedCase.status) && ' (BREACHED)'}
                      </div>
                    </div>

                    <div style={{ marginTop: '16px' }}>
                      <span style={styles.detailLabel}>Root Cause / Observed Reason:</span>
                      <div style={styles.reasonBox}>{selectedCase.possible_reason || 'Under review by finance agent.'}</div>
                    </div>

                    {/* Status Update & Actions */}
                    <div style={{ marginTop: '24px', borderTop: '1px solid #334155', paddingTop: '16px' }}>
                      <label style={{ ...styles.label, marginBottom: '8px', display: 'block' }}>Update Status</label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {(['OPEN', 'IN_PROGRESS', 'RESOLVED'] as CaseStatus[]).map((st) => (
                          <button
                            key={st}
                            onClick={() => handleStatusUpdate(selectedCase.id, st)}
                            style={{
                              ...styles.statusButton,
                              ...(selectedCase.status === st ? styles.statusButtonActive : {}),
                            }}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                      <button
                        onClick={() => handleEscalateCase(selectedCase.id)}
                        disabled={selectedCase.escalation_level >= 3}
                        style={{
                          ...styles.primaryButton,
                          width: '100%',
                          backgroundColor: '#e11d48',
                          borderColor: '#f43f5e',
                          justifyContent: 'center',
                        }}
                      >
                        <Icons.Escalate />
                        Escalate Case to Higher Authority
                      </button>
                      <p style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', marginTop: '6px' }}>
                        Moves case automatically to next role (Manager → Sr. Manager → CFO)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 4: FINANCE CHAT (RAG AI)                                  */}
        {/* ============================================================== */}
        {currentView === 'chat' && (
          <div style={styles.viewContainer}>
            <header style={styles.viewHeader}>
              <h1 style={styles.viewTitle}>FEMA Intelligence Chat</h1>
              <p style={styles.viewDescription}>
                Query your company ledger and exceptions in plain English. Answers are strictly grounded in stored financial records.
              </p>
            </header>

            <div style={styles.chatShell}>
              {/* Message History */}
              <div style={styles.chatLog}>
                {chatMessages.map((msg: ChatMessage) => (
                  <div
                    key={msg.id}
                    style={{
                      ...styles.chatBubbleContainer,
                      justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        ...styles.chatBubble,
                        ...(msg.sender === 'user' ? styles.userBubble : styles.botBubble),
                      }}
                    >
                      <div style={styles.chatBubbleHeader}>
                        <span style={styles.chatSender}>
                          {msg.sender === 'user' ? 'You' : 'FEMA Assistant'}
                        </span>
                        <span style={styles.chatTimestamp}>{msg.timestamp}</span>
                      </div>
                      <div style={styles.chatText}>{msg.text}</div>

                      {msg.sources && msg.sources.length > 0 && (
                        <div style={styles.sourceCitation}>
                          <strong>Sources:</strong> {msg.sources.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isChatThinking && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#818cf8', fontSize: '13px' }}>
                    <Icons.Bot />
                    <span>Searching records and formulating answer...</span>
                  </div>
                )}
              </div>

              {/* Sample Prompts */}
              <div style={styles.promptChips}>
                <span style={{ fontSize: '12px', color: '#64748b', marginRight: '4px' }}>Try asking:</span>
                {[
                  'Why did revenue decrease?',
                  'How many critical exceptions are open?',
                  'Show me overdue SLA cases',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setChatInput(prompt)}
                    style={styles.chipButton}
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendChat} style={styles.chatInputRow}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChatInput(e.target.value)}
                  placeholder="Ask a question regarding financial records, owners, or variances..."
                  style={styles.chatInput}
                />
                <button type="submit" disabled={isChatThinking || !chatInput.trim()} style={styles.chatSendButton}>
                  <Icons.Send />
                  Send
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// ============================================================================
// STYLING HELPERS & DESIGN SYSTEM
// ============================================================================
function getSeverityBadgeInline(sev: Severity): React.CSSProperties {
  switch (sev) {
    case 'CRITICAL':
      return { backgroundColor: '#450a0a', color: '#f87171', border: '1px solid #ef444455' };
    case 'HIGH':
      return { backgroundColor: '#451a03', color: '#fbbf24', border: '1px solid #f59e0b55' };
    case 'MEDIUM':
      return { backgroundColor: '#1e1b4b', color: '#a5b4fc', border: '1px solid #6366f155' };
    case 'LOW':
      return { backgroundColor: '#022c22', color: '#34d399', border: '1px solid #10b98155' };
  }
}

function getStatusBadgeInline(status: CaseStatus): React.CSSProperties {
  switch (status) {
    case 'OPEN':
      return { backgroundColor: '#172554', color: '#60a5fa', border: '1px solid #3b82f644' };
    case 'IN_PROGRESS':
      return { backgroundColor: '#2e1065', color: '#c084fc', border: '1px solid #a855f744' };
    case 'RESOLVED':
      return { backgroundColor: '#022c22', color: '#34d399', border: '1px solid #10b98144' };
    case 'ESCALATED':
      return { backgroundColor: '#4c0519', color: '#fda4af', border: '1px solid #f43f5e55', fontWeight: 600 };
  }
}

const styles: Record<string, React.CSSProperties> = {
  appShell: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#090d16',
    color: '#f8fafc',
    fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  sidebar: {
    width: '270px',
    backgroundColor: '#0f172a',
    borderRight: '1px solid #1e293b',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    flexShrink: 0,
  },
  brandContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '32px',
    paddingLeft: '8px',
  },
  brandBadge: {
    width: '38px',
    height: '38px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: '15px',
    color: '#ffffff',
    letterSpacing: '0.05em',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
  },
  brandTitle: {
    fontSize: '18px',
    fontWeight: 700,
    letterSpacing: '0.02em',
    color: '#f8fafc',
  },
  brandSubtitle: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: 500,
  },
  navMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '11px 14px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
  },
  navButtonActive: {
    backgroundColor: '#1e293b',
    color: '#ffffff',
    fontWeight: 600,
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
  },
  navIndex: {
    fontSize: '11px',
    fontFamily: 'monospace',
    color: '#64748b',
  },
  counterPill: {
    marginLeft: 'auto',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 7px',
    borderRadius: '12px',
  },
  sidebarFooter: {
    borderTop: '1px solid #1e293b',
    paddingTop: '16px',
  },
  statusIndicatorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    backgroundColor: '#1e293b60',
    borderRadius: '6px',
    border: '1px solid #33415530',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  statusText: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  mainContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '32px 40px',
    backgroundColor: '#090d16',
  },
  viewContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  viewHeader: {
    marginBottom: '8px',
  },
  viewTitle: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#f8fafc',
    margin: 0,
  },
  viewDescription: {
    fontSize: '14px',
    color: '#94a3b8',
    marginTop: '6px',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  statCard: {
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.05em',
    color: '#64748b',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 800,
    color: '#f8fafc',
    lineHeight: 1.1,
  },
  statSub: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '8px',
  },
  panel: {
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  panelTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: 0,
    color: '#f8fafc',
  },
  severitySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  severityBarRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  severityBarMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
  },
  barTrack: {
    height: '8px',
    backgroundColor: '#1e293b',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.4s ease',
  },
  urgentAlert: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#450a0a30',
    border: '1px solid #ef444455',
    padding: '14px 20px',
    borderRadius: '8px',
    fontSize: '13px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#94a3b8',
  },
  input: {
    backgroundColor: '#090d16',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '10px 12px',
    color: '#f8fafc',
    fontSize: '14px',
    outline: 'none',
  },
  select: {
    backgroundColor: '#090d16',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '10px 12px',
    color: '#f8fafc',
    fontSize: '14px',
    outline: 'none',
  },
  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#4f46e5',
    border: '1px solid #6366f1',
    color: '#ffffff',
    padding: '9px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    color: '#f8fafc',
    padding: '8px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  textButton: {
    background: 'none',
    border: 'none',
    color: '#818cf8',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    padding: '4px 8px',
  },
  feedbackNotice: {
    marginTop: '16px',
    padding: '10px 14px',
    borderRadius: '6px',
    borderWidth: '1px',
    borderStyle: 'solid',
    fontSize: '13px',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    padding: '12px 14px',
    borderBottom: '1px solid #1e293b',
    color: '#64748b',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  tr: {
    borderBottom: '1px solid #1e293b40',
    transition: 'background-color 0.15s',
  },
  td: {
    padding: '12px 14px',
    fontSize: '13px',
    color: '#cbd5e1',
  },
  tdMono: {
    padding: '12px 14px',
    fontSize: '13px',
    fontFamily: 'monospace',
    color: '#e2e8f0',
  },
  categoryPill: {
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
  },
  varianceBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
  },
  badge: {
    display: 'inline-block',
    padding: '3px 9px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.03em',
  },
  miniButton: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    color: '#94a3b8',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  filterBar: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
    backgroundColor: '#0f172a',
    padding: '14px 20px',
    borderRadius: '10px',
    border: '1px solid #1e293b',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  filterLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#94a3b8',
  },
  filterSelect: {
    backgroundColor: '#090d16',
    border: '1px solid #334155',
    color: '#f8fafc',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '13px',
    outline: 'none',
  },
  filterToggle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    color: '#94a3b8',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  filterToggleActive: {
    backgroundColor: '#ef444420',
    color: '#ef4444',
    borderColor: '#ef4444',
  },
  drawerOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  drawer: {
    width: '460px',
    height: '100%',
    backgroundColor: '#0f172a',
    borderLeft: '1px solid #1e293b',
    boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.4)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    boxSizing: 'border-box',
    overflowY: 'auto',
  },
  drawerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid #1e293b',
    paddingBottom: '16px',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '18px',
    cursor: 'pointer',
  },
  drawerBody: {
    marginTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: '13px',
    color: '#94a3b8',
    fontWeight: 500,
  },
  reasonBox: {
    backgroundColor: '#090d16',
    border: '1px solid #1e293b',
    borderRadius: '6px',
    padding: '12px',
    fontSize: '13px',
    color: '#cbd5e1',
    lineHeight: 1.5,
    marginTop: '6px',
  },
  statusButton: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #334155',
    backgroundColor: '#1e293b',
    color: '#cbd5e1',
    fontSize: '12px',
    cursor: 'pointer',
  },
  statusButtonActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#6366f1',
    color: '#ffffff',
    fontWeight: 600,
  },
  chatShell: {
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    height: '620px',
    overflow: 'hidden',
  },
  chatLog: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  chatBubbleContainer: {
    display: 'flex',
    width: '100%',
  },
  chatBubble: {
    maxWidth: '75%',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '14px',
    lineHeight: 1.5,
  },
  userBubble: {
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    borderBottomRightRadius: '2px',
  },
  botBubble: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    borderBottomLeftRadius: '2px',
    border: '1px solid #33415560',
  },
  chatBubbleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '4px',
  },
  chatSender: {
    fontSize: '11px',
    fontWeight: 700,
    opacity: 0.8,
  },
  chatTimestamp: {
    fontSize: '10px',
    opacity: 0.6,
  },
  chatText: {
    fontSize: '14px',
  },
  sourceCitation: {
    marginTop: '8px',
    paddingTop: '6px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    fontSize: '11px',
    opacity: 0.8,
  },
  promptChips: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#090d1650',
    borderTop: '1px solid #1e293b',
    overflowX: 'auto',
  },
  chipButton: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    color: '#cbd5e1',
    borderRadius: '16px',
    padding: '4px 12px',
    fontSize: '12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  chatInputRow: {
    display: 'flex',
    gap: '10px',
    padding: '14px 16px',
    backgroundColor: '#090d16',
    borderTop: '1px solid #1e293b',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#f8fafc',
    fontSize: '14px',
    outline: 'none',
  },
  chatSendButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#4f46e5',
    border: 'none',
    color: '#ffffff',
    padding: '10px 18px',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
  },
};

export default FemaApp;
