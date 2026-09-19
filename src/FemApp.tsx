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
  total_budget: number;
  total_actual: number;
  total_revenue: number;
  total_expense: number;
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
  ),
  TrendingDown: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>
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
  ChevronLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
  ),
  ChevronRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
  ),
  Sun: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
  ),
  Moon: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
  ),
  Bell: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
  ),
  Settings: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  ),
  Search: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
  ),
  Wallet: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>
  ),
  CreditCard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
  ),
  Plus: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
  ),
  ArrowUpRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" x2="17" y1="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
  ),
  DollarSign: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  ),
  Cart: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
  ),
  PiggyBank: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z"/><path d="M16 9h.01"/></svg>
  ),
};

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================
export const FemaApp: React.FC<FemaAppProps> = ({ apiBaseUrl = 'http://localhost:5000/api' }) => {
  // Navigation
  const [currentView, setCurrentView] = useState<'dashboard' | 'records' | 'exceptions' | 'chat'>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Dynamic Theme Styles
  const styles = useMemo(() => getStyles(theme), [theme]);

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

    let totalBudget = 0;
    let totalActual = 0;
    let totalRevenue = 0;
    let totalExpense = 0;

    records.forEach((r) => {
      totalBudget += Number(r.budget_amount) || 0;
      totalActual += Number(r.actual_amount) || 0;
      if (r.category === 'Revenue') {
        totalRevenue += Number(r.actual_amount) || 0;
      } else {
        totalExpense += Number(r.actual_amount) || 0;
      }
    });

    return {
      total_records: records.length,
      total_exceptions: exceptions.length,
      open_exceptions: (by_status.OPEN || 0) + (by_status.IN_PROGRESS || 0) + (by_status.ESCALATED || 0),
      overdue_exceptions: overdue,
      total_budget: totalBudget,
      total_actual: totalActual,
      total_revenue: totalRevenue,
      total_expense: totalExpense,
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
      <aside
        style={{
          ...styles.sidebar,
          width: isSidebarCollapsed ? '80px' : '270px',
          padding: isSidebarCollapsed ? '20px 8px' : '24px 16px',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), padding 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div style={{ ...styles.brandContainer, paddingLeft: 0, marginBottom: '24px' }}>
          {isSidebarCollapsed ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%' }}>
              <div
                style={{
                  ...styles.brandBadge,
                  width: '42px',
                  height: '42px',
                  flexShrink: 0,
                  fontSize: '16px',
                }}
                title="FEMA - Finance Exception Agent"
              >
                FE
              </div>
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                style={{
                  ...styles.collapseBtn,
                  width: '32px',
                  height: '26px',
                }}
                title="Expand Sidebar"
              >
                <Icons.ChevronRight />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingLeft: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                <div style={{ ...styles.brandBadge, flexShrink: 0 }} title="FEMA - Finance Exception Agent">
                  FE
                </div>
                <div style={{ whiteSpace: 'nowrap' }}>
                  <div style={styles.brandTitle}>FEMA</div>
                  <div style={styles.brandSubtitle}>Finance Exception Agent</div>
                </div>
              </div>
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                style={{
                  ...styles.collapseBtn,
                  width: '28px',
                  height: '28px',
                  flexShrink: 0,
                }}
                title="Collapse Sidebar"
              >
                <Icons.ChevronLeft />
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Search Bar */}
        {!isSidebarCollapsed && (
          <div style={styles.sidebarSearchWrapper}>
            <Icons.Search />
            <input
              type="text"
              placeholder="Search..."
              style={styles.sidebarSearchInput}
            />
          </div>
        )}

        <nav style={styles.navMenu}>
          <button
            onClick={() => setCurrentView('dashboard')}
            style={{
              ...styles.navButton,
              ...(currentView === 'dashboard' ? styles.navButtonActive : {}),
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
              padding: isSidebarCollapsed ? '12px' : '11px 14px',
              position: 'relative',
            }}
            title={isSidebarCollapsed ? 'Dashboard' : undefined}
          >
            <Icons.Dashboard />
            {!isSidebarCollapsed && <span>Dashboard</span>}
          </button>

          <button
            onClick={() => setCurrentView('records')}
            style={{
              ...styles.navButton,
              ...(currentView === 'records' ? styles.navButtonActive : {}),
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
              padding: isSidebarCollapsed ? '12px' : '11px 14px',
              position: 'relative',
            }}
            title={isSidebarCollapsed ? 'Invoices & Records' : undefined}
          >
            <Icons.Records />
            {!isSidebarCollapsed && <span>Invoices & Ledger</span>}
          </button>

          <button
            onClick={() => setCurrentView('exceptions')}
            style={{
              ...styles.navButton,
              ...(currentView === 'exceptions' ? styles.navButtonActive : {}),
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
              padding: isSidebarCollapsed ? '12px' : '11px 14px',
              position: 'relative',
            }}
            title={isSidebarCollapsed ? `Exception Cases (${summary.open_exceptions})` : undefined}
          >
            <Icons.Exceptions />
            {!isSidebarCollapsed && <span>Exception Cases</span>}
            {summary.open_exceptions > 0 && (
              isSidebarCollapsed ? (
                <span
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '10px',
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#ef4444',
                    borderRadius: '50%',
                    border: '2px solid #0f172a',
                  }}
                />
              ) : (
                <span style={styles.counterPill}>{summary.open_exceptions}</span>
              )
            )}
          </button>

          <button
            onClick={() => setCurrentView('chat')}
            style={{
              ...styles.navButton,
              ...(currentView === 'chat' ? styles.navButtonActive : {}),
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
              padding: isSidebarCollapsed ? '12px' : '11px 14px',
              position: 'relative',
            }}
            title={isSidebarCollapsed ? 'Finance Chat' : undefined}
          >
            <Icons.Chat />
            {!isSidebarCollapsed && <span>Finance Chat</span>}
          </button>
        </nav>

        {/* User profile card widget */}
        {!isSidebarCollapsed && (
          <div style={styles.userWidget}>
            <div style={styles.userAvatar}>RN</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Raya Neal
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Admin / Lead</div>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '12px' }}>⇅</div>
          </div>
        )}

        <div style={styles.sidebarFooter}>
          {/* Light / Dark Mode Toggle */}
          <div style={{ marginBottom: '10px' }}>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{
                ...styles.themeToggleBtn,
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                padding: isSidebarCollapsed ? '8px' : '8px 12px',
              }}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Icons.Sun /> : <Icons.Moon />}
              {!isSidebarCollapsed && (
                <span style={{ fontSize: '12px', fontWeight: 600 }}>
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </span>
              )}
            </button>
          </div>

          <div
            style={{
              ...styles.statusIndicatorBox,
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
              padding: isSidebarCollapsed ? '8px' : '8px 12px',
            }}
            title={
              isBackendConnected === null
                ? 'Checking API...'
                : isBackendConnected
                ? 'Backend Connected (5000)'
                : 'Standalone UI (Mock Mode)'
            }
          >
            <span
              style={{
                ...styles.statusDot,
                backgroundColor: isBackendConnected ? '#10b981' : '#f59e0b',
                boxShadow: isBackendConnected ? '0 0 8px #10b981' : '0 0 8px #f59e0b',
              }}
            />
            {!isSidebarCollapsed && (
              <span style={styles.statusText}>
                {isBackendConnected === null
                  ? 'Checking API...'
                  : isBackendConnected
                  ? 'Backend Connected'
                  : 'Standalone Mode'}
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* ---------------------------------------------------------------- */}
      {/* MAIN VIEW AREA                                                   */}
      {/* ---------------------------------------------------------------- */}
      <main style={styles.mainContent}>
        {/* ============================================================== */}
        {/* VIEW 1: DASHBOARD (Payout Inspired Theme)                      */}
        {/* ============================================================== */}
        {currentView === 'dashboard' && (
          <div style={styles.viewContainer}>
            {/* Top Bar: Title + Notification & Settings Badges */}
            <div style={styles.topHeaderRow}>
              <div>
                <h1 style={styles.viewTitle}>Dashboard</h1>
                <p style={styles.viewDescription}>
                  Real-time operational ledger and risk telemetry monitored by FEMA Agent.
                </p>
              </div>

              <div style={styles.headerActions}>
                <button
                  style={styles.headerIconBtn}
                  onClick={() => handleRunMonitoring()}
                  title={isMonitoring ? 'Monitoring...' : 'Run Monitoring Scan'}
                >
                  <Icons.Refresh />
                </button>
                <button style={styles.headerIconBtn} title="Notifications">
                  <Icons.Bell />
                </button>
                <button
                  style={styles.headerIconBtn}
                  onClick={() => setCurrentView('chat')}
                  title="Finance Chat"
                >
                  <Icons.Chat />
                </button>
                <button style={styles.headerIconBtn} title="Settings">
                  <Icons.Settings />
                </button>
              </div>
            </div>

            {/* Top Stat Row: Earnings, Spending's, Saving */}
            <div style={styles.statGrid}>
              {/* Earnings Card */}
              <div style={styles.statCard}>
                <div style={styles.statTopRow}>
                  <div style={styles.statIconCircle}>
                    <Icons.DollarSign />
                  </div>
                  <span>Earnings (Revenue)</span>
                </div>
                <div style={styles.statMainRow}>
                  <div style={styles.statValue}>
                    ₹{((summary.total_revenue || 1540000) / 1000).toFixed(2)}k
                  </div>
                  <span
                    style={{
                      ...styles.trendBadge,
                      backgroundColor: theme === 'dark' ? '#064e3b' : '#ecfdf5',
                      color: '#10b981',
                    }}
                  >
                    <Icons.TrendingUp /> 12.8%
                  </span>
                </div>
                <div style={styles.statSub}>+₹120.8k than last month</div>
              </div>

              {/* Spending's Card */}
              <div style={styles.statCard}>
                <div style={styles.statTopRow}>
                  <div style={styles.statIconCircle}>
                    <Icons.Cart />
                  </div>
                  <span>Spending's (Actual)</span>
                </div>
                <div style={styles.statMainRow}>
                  <div style={styles.statValue}>
                    ₹{((summary.total_expense || 960000) / 1000).toFixed(2)}k
                  </div>
                  <span
                    style={{
                      ...styles.trendBadge,
                      backgroundColor: theme === 'dark' ? '#7f1d1d' : '#fef2f2',
                      color: '#ef4444',
                    }}
                  >
                    <Icons.TrendingDown /> 2.4%
                  </span>
                </div>
                <div style={styles.statSub}>-₹6.8k under budget targets</div>
              </div>

              {/* Saving / Net Reserve Card */}
              <div style={styles.statCard}>
                <div style={styles.statTopRow}>
                  <div style={styles.statIconCircle}>
                    <Icons.PiggyBank />
                  </div>
                  <span>Saving & Reserve</span>
                </div>
                <div style={styles.statMainRow}>
                  <div style={styles.statValue}>
                    ₹{(Math.max(0, (summary.total_revenue - summary.total_expense) || 580000) / 1000).toFixed(2)}k
                  </div>
                  <span
                    style={{
                      ...styles.trendBadge,
                      backgroundColor: theme === 'dark' ? '#064e3b' : '#ecfdf5',
                      color: '#10b981',
                    }}
                  >
                    <Icons.TrendingUp /> 6.7%
                  </span>
                </div>
                <div style={styles.statSub}>+₹46.1k than last month</div>
              </div>
            </div>

            {/* Middle Grid: Balance Summary (Line Area Chart) + Virtual Card Widget */}
            <div style={styles.dashboardMainGrid}>
              {/* Balance Summary Chart */}
              <div style={styles.balanceChartCard}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>Balance Summary</h3>
                  <div style={styles.periodDropdown}>
                    <span>March</span>
                    <span style={{ fontSize: '10px' }}>▼</span>
                  </div>
                </div>

                {/* SVG Line / Area Graph */}
                <div style={{ width: '100%', height: '220px', position: 'relative', marginTop: '10px' }}>
                  <svg width="100%" height="100%" viewBox="0 0 600 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="balanceAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Gridlines */}
                    <line x1="40" y1="30" x2="580" y2="30" stroke={theme === 'dark' ? '#1f293d' : '#f1f5f9'} strokeDasharray="4 4" strokeWidth="1" />
                    <line x1="40" y1="75" x2="580" y2="75" stroke={theme === 'dark' ? '#1f293d' : '#f1f5f9'} strokeDasharray="4 4" strokeWidth="1" />
                    <line x1="40" y1="120" x2="580" y2="120" stroke={theme === 'dark' ? '#1f293d' : '#f1f5f9'} strokeDasharray="4 4" strokeWidth="1" />
                    <line x1="40" y1="165" x2="580" y2="165" stroke={theme === 'dark' ? '#1f293d' : '#f1f5f9'} strokeDasharray="4 4" strokeWidth="1" />

                    {/* Y-Axis Labels */}
                    <text x="5" y="34" fill="#94a3b8" fontSize="11" fontFamily="sans-serif">₹99k</text>
                    <text x="5" y="79" fill="#94a3b8" fontSize="11" fontFamily="sans-serif">₹75k</text>
                    <text x="5" y="124" fill="#94a3b8" fontSize="11" fontFamily="sans-serif">₹50k</text>
                    <text x="5" y="169" fill="#94a3b8" fontSize="11" fontFamily="sans-serif">₹25k</text>

                    {/* Area fill */}
                    <path
                      d="M 50 140 L 95 125 L 145 125 L 190 150 L 240 150 L 285 70 L 335 75 L 380 75 L 430 45 L 475 45 L 525 110 L 570 110 L 570 170 L 50 170 Z"
                      fill="url(#balanceAreaGrad)"
                    />

                    {/* Line spline path */}
                    <path
                      d="M 50 140 L 95 125 L 145 125 L 190 150 L 240 150 L 285 70 L 335 75 L 380 75 L 430 45 L 475 45 L 525 110 L 570 110"
                      fill="none"
                      stroke="#475569"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Active Jun Tooltip Indicator Pin */}
                    <line x1="285" y1="70" x2="285" y2="170" stroke="#3b82f6" strokeDasharray="3 3" strokeWidth="1.5" />
                    <circle cx="285" cy="70" r="5" fill="#ffffff" stroke="#3b82f6" strokeWidth="3" />
                  </svg>

                  {/* Active Point Hover Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '20px',
                      left: '42%',
                      transform: 'translateX(-50%)',
                      backgroundColor: '#2b3648',
                      color: '#ffffff',
                      padding: '5px 10px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                      pointerEvents: 'none',
                    }}
                  >
                    <div style={{ fontWeight: 800 }}>₹70,685.00</div>
                    <div style={{ fontSize: '9px', opacity: 0.75 }}>Value | Jun, 20</div>
                  </div>

                  {/* X-Axis Months */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingLeft: '40px',
                      paddingRight: '10px',
                      marginTop: '8px',
                      fontSize: '11px',
                      color: '#94a3b8',
                      fontWeight: 500,
                    }}
                  >
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span style={{ color: theme === 'dark' ? '#f8fafc' : '#1e293b', fontWeight: 800 }}>Jun</span>
                    <span>Jul</span>
                    <span>Aug</span>
                    <span>Sep</span>
                    <span>Oct</span>
                    <span>Nov</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Virtual Card + Quick Transactions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Virtual Card */}
                <div style={styles.virtualCardWidget}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', opacity: 0.85, fontWeight: 600 }}>Card Balance</span>
                    <div style={{ display: 'flex', gap: '4px', opacity: 0.8 }}>
                      <span style={{ fontSize: '12px' }}>‹</span>
                      <span style={{ fontSize: '12px' }}>›</span>
                    </div>
                  </div>

                  <div style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '0.02em' }}>
                    ₹34,000.00
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: '10px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Card Holder</div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>Mical Smith</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expires</div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>03/28</div>
                    </div>
                    <div style={{ fontSize: '14px', letterSpacing: '2px', opacity: 0.85 }}>
                      •••• 7223
                    </div>
                  </div>
                </div>

                {/* Card Quick Action Buttons */}
                <div style={styles.cardQuickActions}>
                  <button
                    style={styles.quickActionBtn}
                    onClick={() => setCurrentView('records')}
                  >
                    <Icons.ArrowUpRight /> Send
                  </button>
                  <button
                    style={styles.quickActionBtn}
                    onClick={() => handleRunMonitoring()}
                  >
                    <Icons.Refresh /> Scan
                  </button>
                  <button
                    style={{ ...styles.quickActionBtn, backgroundColor: theme === 'dark' ? '#2b3648' : '#e2e8f0' }}
                    onClick={() => setCurrentView('records')}
                  >
                    <Icons.Plus /> Add
                  </button>
                </div>

                {/* Quick Transaction Team Routing Row */}
                <div style={{ ...styles.panel, padding: '16px 20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: theme === 'dark' ? '#f8fafc' : '#1e293b' }}>
                    Quick Owner Escalation
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div
                      onClick={() => setCurrentView('records')}
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        backgroundColor: theme === 'dark' ? '#1a2234' : '#f1f5f9',
                        border: '1px dashed #94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#64748b',
                      }}
                      title="Add Entry"
                    >
                      <Icons.Plus />
                    </div>
                    {owners.map((o) => (
                      <div
                        key={o.id}
                        onClick={() => {
                          setCurrentView('exceptions');
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                        }}
                        title={`${o.name} (${o.role})`}
                      >
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            backgroundColor: theme === 'dark' ? '#2b3648' : '#cbd5e1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '13px',
                            color: theme === 'dark' ? '#f8fafc' : '#1e293b',
                          }}
                        >
                          {o.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <span style={{ fontSize: '10px', color: '#94a3b8', maxWidth: '44px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {o.name.split(' ')[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Admit Snap / Growth + Donut Expense Summary + Transaction History Table */}
            <div style={styles.dashboardBottomGrid}>
              {/* Admit Snap Metric Widget */}
              <div style={styles.panel}>
                <div style={styles.panelHeader}>
                  <h3 style={styles.panelTitle}>Admit Snap</h3>
                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>•••</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 700 }}>+30.00% ▲</span>
                </div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: theme === 'dark' ? '#f8fafc' : '#1e293b' }}>
                  ₹40,585
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '16px' }}>Total Amount Recorded</div>

                {/* Mini bar chart */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '60px', marginTop: '10px' }}>
                  {[30, 50, 65, 45, 20].map((h, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div
                        style={{
                          width: '100%',
                          height: `${h}%`,
                          backgroundColor: i === 2 ? '#2b3648' : (theme === 'dark' ? '#1f293d' : '#cbd5e1'),
                          borderRadius: '4px',
                        }}
                      />
                      <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                        {['J', 'F', 'M', 'A', 'M'][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expenses Summary Donut Chart Widget */}
              <div style={styles.panel}>
                <div style={styles.panelHeader}>
                  <h3 style={styles.panelTitle}>Expenses Summary</h3>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>March ∨</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
                  {/* Circular Donut Progress Indicator */}
                  <div style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0 }}>
                    <svg width="90" height="90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={theme === 'dark' ? '#1f293d' : '#e2e8f0'}
                        strokeWidth="3.8"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#2b3648"
                        strokeDasharray="72, 100"
                        strokeWidth="3.8"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>Total</div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: theme === 'dark' ? '#f8fafc' : '#1e293b' }}>
                        ₹9,670
                      </div>
                    </div>
                  </div>

                  {/* Breakdown Legend */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 }}>
                    <div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>• Cloud & IT</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#1e293b' }}>
                        ₹2,657.89
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>• Operations & Misc</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#1e293b' }}>
                        ₹2,657.89
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>• Payroll & Staff</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#1e293b' }}>
                        ₹2,657.89
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#1e293b' }}>
                  72% <span style={{ fontSize: '11px', fontWeight: 400, color: '#94a3b8' }}>Total Expense Ratio</span>
                </div>
              </div>

              {/* Transaction & Audit History */}
              <div style={styles.panel}>
                <div style={styles.panelHeader}>
                  <h3 style={styles.panelTitle}>Transaction History</h3>
                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>•••</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {records.slice(0, 3).map((r) => (
                    <div
                      key={r.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        backgroundColor: theme === 'dark' ? '#1a2234' : '#f8fafd',
                        borderRadius: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            backgroundColor: theme === 'dark' ? '#2b3648' : '#cbd5e1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          {r.category[0]}
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#1e293b' }}>
                            {r.department}
                          </div>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                            {r.period} • {r.category}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: r.category === 'Revenue' ? '#10b981' : (theme === 'dark' ? '#f8fafc' : '#1e293b') }}>
                          {formatCurrency(r.actual_amount)}
                        </div>
                        <div style={{ fontSize: '10px', color: (r.variance_percent || 0) < 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                          {(r.variance_percent || 0) > 0 ? '+' : ''}{r.variance_percent || 0}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Urgent Alert Banner if overdue cases exist */}
            {summary.overdue_exceptions > 0 && (
              <div style={styles.urgentAlert}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icons.AlertCircle />
                  <span>
                    <strong>Urgent SLA Breach Warning:</strong> You have {summary.overdue_exceptions} case(s) requiring immediate CFO / Manager escalation.
                  </span>
                </div>
                <button
                  onClick={() => {
                    setCurrentView('exceptions');
                    setShowOverdueOnly(true);
                  }}
                  style={{ ...styles.secondaryButton, padding: '6px 12px', fontSize: '12px' }}
                >
                  View Overdue Cases →
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
              <h1 style={styles.viewTitle}>Financial Ledger & Record Entry</h1>
              <p style={styles.viewDescription}>
                Post ledger items to trigger AI-driven variance computation and automatic anomaly detection.
              </p>
            </header>

            {/* Add Record Form */}
            <div style={styles.panel}>
              <h3 style={{ ...styles.panelTitle, marginBottom: '16px' }}>Add Ledger Record</h3>

              <form onSubmit={handleCreateRecord}>
                <div style={styles.formGrid}>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as 'Revenue' | 'Expense' })}
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
                      placeholder="e.g. 2026-09"
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
                      placeholder="e.g. Marketing, DevOps"
                      required
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Budget Amount (₹)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.budget_amount}
                      onChange={(e) => setFormData({ ...formData, budget_amount: e.target.value })}
                      placeholder="0.00"
                      required
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Actual Amount (₹)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.actual_amount}
                      onChange={(e) => setFormData({ ...formData, actual_amount: e.target.value })}
                      placeholder="0.00"
                      required
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button type="submit" style={styles.primaryButton}>
                    Post Ledger Entry
                  </button>
                  <button
                    type="button"
                    onClick={handleRunMonitoring}
                    disabled={isMonitoring}
                    style={styles.secondaryButton}
                  >
                    <Icons.Refresh />
                    {isMonitoring ? 'Agent Analyzing...' : 'Run Exception Monitor'}
                  </button>
                </div>
              </form>

              {formFeedback && (
                <div
                  style={{
                    ...styles.feedbackNotice,
                    backgroundColor: formFeedback.type === 'success' ? '#022c22' : '#450a0a',
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
                <h3 style={styles.panelTitle}>Active Ledger Records ({records.length})</h3>
              </div>

              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Record ID</th>
                      <th style={styles.th}>Period</th>
                      <th style={styles.th}>Category</th>
                      <th style={styles.th}>Department</th>
                      <th style={styles.th}>Budget</th>
                      <th style={styles.th}>Actual</th>
                      <th style={styles.th}>Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => {
                      const isHighRisk = Math.abs(r.variance_percent) >= 20;

                      return (
                        <tr key={r.id} style={styles.tr}>
                          <td style={styles.tdMono}>REC-#{r.id}</td>
                          <td style={styles.td}>{r.period}</td>
                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.categoryPill,
                                backgroundColor: r.category === 'Revenue' ? '#1e1b4b' : '#312e81',
                                color: '#a5b4fc',
                              }}
                            >
                              {r.category}
                            </span>
                          </td>
                          <td style={{ ...styles.td, fontWeight: 500, color: '#f1f5f9' }}>{r.department}</td>
                          <td style={styles.tdMono}>{formatCurrency(r.budget_amount)}</td>
                          <td style={styles.tdMono}>{formatCurrency(r.actual_amount)}</td>
                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.varianceBadge,
                                backgroundColor: isHighRisk
                                  ? r.variance_percent < 0
                                    ? '#450a0a'
                                    : '#451a03'
                                  : '#0f172a',
                                color: r.variance_percent < 0 ? '#f87171' : '#fbbf24',
                                border: isHighRisk ? '1px solid currentColor' : '1px solid #334155',
                              }}
                            >
                              {r.variance_percent > 0 ? '+' : ''}
                              {r.variance_percent}%
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
              <h1 style={styles.viewTitle}>Exceptions & SLA Management</h1>
              <p style={styles.viewDescription}>
                Multi-agent triage, accountable owner assignments, SLA countdowns, and automated escalation.
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
                Overdue SLA Only
              </button>

              {(filterSeverity || filterStatus || showOverdueOnly) && (
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
              )}
            </div>

            {/* Exception Cases Ledger */}
            <div style={styles.panel}>
              <div style={styles.panelHeader}>
                <h3 style={styles.panelTitle}>Tracked Exceptions ({filteredExceptions.length})</h3>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Click row to view details & audit trail</span>
              </div>

              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Case ID</th>
                      <th style={styles.th}>Record Ref</th>
                      <th style={styles.th}>Variance</th>
                      <th style={styles.th}>Severity</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Accountable Owner</th>
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
                            backgroundColor: selectedCase?.id === c.id ? (theme === 'dark' ? '#1e293b' : '#e0e7ff') : 'transparent',
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
                            <span style={{ ...styles.badge, ...getSeverityBadgeInline(c.severity, theme) }}>
                              {c.severity}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ ...styles.badge, ...getStatusBadgeInline(c.status, theme) }}>
                              {c.status}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '13px', fontWeight: 500, color: theme === 'dark' ? '#f1f5f9' : '#0f172a' }}>
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
                                  color: overdue ? '#ef4444' : (theme === 'dark' ? '#cbd5e1' : '#334155'),
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
                      <h2 style={{ fontSize: '20px', margin: '4px 0 0 0', color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>
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
                      <span style={{ ...styles.badge, ...getSeverityBadgeInline(selectedCase.severity, theme) }}>
                        {selectedCase.severity}
                      </span>
                    </div>

                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Escalation Level:</span>
                      <span style={{ color: theme === 'dark' ? '#e2e8f0' : '#0f172a', fontWeight: 600 }}>
                        Level {selectedCase.escalation_level} of 4
                      </span>
                    </div>

                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Assigned Owner:</span>
                      <div>
                        <div style={{ color: theme === 'dark' ? '#f1f5f9' : '#0f172a', fontWeight: 600 }}>{selectedCase.owner?.name}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{selectedCase.owner?.role}</div>
                      </div>
                    </div>

                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>SLA Deadline:</span>
                      <div style={{ color: isCaseOverdue(selectedCase.sla_deadline, selectedCase.status) ? '#ef4444' : (theme === 'dark' ? '#f1f5f9' : '#0f172a') }}>
                        {new Date(selectedCase.sla_deadline).toLocaleString()}
                        {isCaseOverdue(selectedCase.sla_deadline, selectedCase.status) && ' (BREACHED)'}
                      </div>
                    </div>

                    <div style={{ marginTop: '16px' }}>
                      <span style={styles.detailLabel}>Root Cause / Observed Reason:</span>
                      <div style={styles.reasonBox}>{selectedCase.possible_reason || 'Under review by finance agent.'}</div>
                    </div>

                    {/* Status Update & Actions */}
                    <div style={{ marginTop: '24px', borderTop: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0', paddingTop: '16px' }}>
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
function getSeverityBadgeInline(sev: Severity, theme: 'dark' | 'light' = 'dark'): React.CSSProperties {
  const isDark = theme === 'dark';
  switch (sev) {
    case 'CRITICAL':
      return isDark
        ? { backgroundColor: '#450a0a', color: '#f87171', border: '1px solid #ef444455' }
        : { backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' };
    case 'HIGH':
      return isDark
        ? { backgroundColor: '#451a03', color: '#fbbf24', border: '1px solid #f59e0b55' }
        : { backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fcd34d' };
    case 'MEDIUM':
      return isDark
        ? { backgroundColor: '#1e1b4b', color: '#a5b4fc', border: '1px solid #6366f155' }
        : { backgroundColor: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe' };
    case 'LOW':
      return isDark
        ? { backgroundColor: '#022c22', color: '#34d399', border: '1px solid #10b98155' }
        : { backgroundColor: '#d1fae5', color: '#047857', border: '1px solid #6ee7b7' };
  }
}

function getStatusBadgeInline(status: CaseStatus, theme: 'dark' | 'light' = 'dark'): React.CSSProperties {
  const isDark = theme === 'dark';
  switch (status) {
    case 'OPEN':
      return isDark
        ? { backgroundColor: '#172554', color: '#60a5fa', border: '1px solid #3b82f644' }
        : { backgroundColor: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd' };
    case 'IN_PROGRESS':
      return isDark
        ? { backgroundColor: '#2e1065', color: '#c084fc', border: '1px solid #a855f744' }
        : { backgroundColor: '#f3e8ff', color: '#7e22ce', border: '1px solid #d8b4fe' };
    case 'RESOLVED':
      return isDark
        ? { backgroundColor: '#022c22', color: '#34d399', border: '1px solid #10b98144' }
        : { backgroundColor: '#d1fae5', color: '#047857', border: '1px solid #6ee7b7' };
    case 'ESCALATED':
      return isDark
        ? { backgroundColor: '#4c0519', color: '#fda4af', border: '1px solid #f43f5e55', fontWeight: 600 }
        : { backgroundColor: '#ffe4e6', color: '#be123c', border: '1px solid #fda4af', fontWeight: 600 };
  }
}

function getStyles(theme: 'dark' | 'light'): Record<string, React.CSSProperties> {
  const isDark = theme === 'dark';

  return {
    appShell: {
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: isDark ? '#0b111e' : '#eaf0f9',
      color: isDark ? '#f8fafc' : '#1e293b',
      fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      transition: 'background-color 0.2s ease, color 0.2s ease',
    },
    sidebar: {
      width: '270px',
      backgroundColor: isDark ? '#111827' : '#f8fafd',
      borderRight: isDark ? '1px solid #1f293d' : '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      flexShrink: 0,
      transition: 'background-color 0.2s ease, border-color 0.2s ease',
    },
    brandContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '20px',
      paddingLeft: '4px',
    },
    brandBadge: {
      width: '38px',
      height: '38px',
      borderRadius: '10px',
      background: 'linear-gradient(135deg, #2b3648, #182232)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 800,
      fontSize: '15px',
      color: '#ffffff',
      letterSpacing: '0.05em',
      boxShadow: '0 4px 14px rgba(24, 34, 50, 0.25)',
    },
    brandTitle: {
      fontSize: '19px',
      fontWeight: 800,
      letterSpacing: '-0.02em',
      color: isDark ? '#f8fafc' : '#1e293b',
    },
    brandSubtitle: {
      fontSize: '11px',
      color: isDark ? '#64748b' : '#64748b',
      fontWeight: 500,
    },
    sidebarSearchWrapper: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: isDark ? '#1a2234' : '#ffffff',
      border: isDark ? '1px solid #28334a' : '1px solid #e2e8f0',
      borderRadius: '10px',
      padding: '8px 12px',
      marginBottom: '20px',
      color: isDark ? '#94a3b8' : '#64748b',
    },
    sidebarSearchInput: {
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: isDark ? '#f8fafc' : '#1e293b',
      fontSize: '13px',
      width: '100%',
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
      borderRadius: '10px',
      border: 'none',
      backgroundColor: 'transparent',
      color: isDark ? '#94a3b8' : '#64748b',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 0.15s ease',
    },
    navButtonActive: {
      backgroundColor: isDark ? '#1e293b' : '#2b3648',
      color: '#ffffff',
      fontWeight: 600,
      boxShadow: '0 4px 12px rgba(43, 54, 72, 0.2)',
    },
    counterPill: {
      marginLeft: 'auto',
      backgroundColor: '#ef4444',
      color: '#ffffff',
      fontSize: '11px',
      fontWeight: 700,
      padding: '2px 8px',
      borderRadius: '12px',
    },
    userWidget: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 12px',
      backgroundColor: isDark ? '#1a2234' : '#ffffff',
      border: isDark ? '1px solid #28334a' : '1px solid #e2e8f0',
      borderRadius: '12px',
      marginBottom: '12px',
    },
    userAvatar: {
      width: '34px',
      height: '34px',
      borderRadius: '8px',
      backgroundColor: isDark ? '#334155' : '#cbd5e1',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: isDark ? '#f8fafc' : '#1e293b',
      fontWeight: 700,
      fontSize: '13px',
    },
    sidebarFooter: {
      borderTop: isDark ? '1px solid #1f293d' : '1px solid #e2e8f0',
      paddingTop: '16px',
    },
    themeToggleBtn: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      backgroundColor: isDark ? '#1a2234' : '#ffffff',
      border: isDark ? '1px solid #28334a' : '1px solid #e2e8f0',
      borderRadius: '10px',
      color: isDark ? '#f8fafc' : '#1e293b',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    },
    statusIndicatorBox: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '8px 12px',
      backgroundColor: isDark ? '#1a223460' : '#ffffff',
      borderRadius: '8px',
      border: isDark ? '1px solid #28334a40' : '1px solid #e2e8f0',
    },
    statusDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
    },
    statusText: {
      fontSize: '12px',
      color: isDark ? '#94a3b8' : '#64748b',
    },
    collapseBtn: {
      backgroundColor: isDark ? '#1a2234' : '#ffffff',
      border: isDark ? '1px solid #28334a' : '1px solid #e2e8f0',
      borderRadius: '8px',
      color: isDark ? '#94a3b8' : '#64748b',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      padding: 0,
      transition: 'all 0.15s ease',
    },
    mainContent: {
      flex: 1,
      overflowY: 'auto',
      padding: '28px 36px',
      backgroundColor: isDark ? '#0b111e' : '#eaf0f9',
      transition: 'background-color 0.2s ease',
    },
    viewContainer: {
      maxWidth: '1360px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    topHeaderRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '4px',
    },
    viewHeader: {
      marginBottom: '0px',
    },
    viewTitle: {
      fontSize: '26px',
      fontWeight: 800,
      letterSpacing: '-0.02em',
      color: isDark ? '#f8fafc' : '#1e293b',
      margin: 0,
    },
    viewDescription: {
      fontSize: '13px',
      color: isDark ? '#94a3b8' : '#64748b',
      marginTop: '4px',
    },
    headerActions: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    headerIconBtn: {
      width: '38px',
      height: '38px',
      borderRadius: '10px',
      backgroundColor: isDark ? '#111827' : '#ffffff',
      border: isDark ? '1px solid #1f293d' : '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: isDark ? '#94a3b8' : '#64748b',
      cursor: 'pointer',
      boxShadow: isDark ? 'none' : '0 2px 6px rgba(0, 0, 0, 0.03)',
      transition: 'all 0.15s ease',
    },
    statGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
    },
    statCard: {
      backgroundColor: isDark ? '#111827' : '#ffffff',
      border: isDark ? '1px solid #1f293d' : '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '20px 22px',
      boxShadow: isDark ? '0 4px 12px rgba(0, 0, 0, 0.25)' : '0 4px 20px rgba(71, 91, 137, 0.06)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    statTopRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      color: isDark ? '#94a3b8' : '#64748b',
      fontSize: '13px',
      fontWeight: 600,
    },
    statIconCircle: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: isDark ? '#94a3b8' : '#475569',
    },
    statMainRow: {
      display: 'flex',
      alignItems: 'baseline',
      gap: '12px',
    },
    statValue: {
      fontSize: '28px',
      fontWeight: 800,
      color: isDark ? '#f8fafc' : '#1e293b',
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
    },
    trendBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '3px',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 700,
    },
    statSub: {
      fontSize: '12px',
      color: isDark ? '#64748b' : '#94a3b8',
      fontWeight: 500,
    },
    dashboardMainGrid: {
      display: 'grid',
      gridTemplateColumns: '1.8fr 1fr',
      gap: '18px',
    },
    balanceChartCard: {
      backgroundColor: isDark ? '#111827' : '#ffffff',
      border: isDark ? '1px solid #1f293d' : '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '22px 24px',
      boxShadow: isDark ? '0 4px 12px rgba(0, 0, 0, 0.25)' : '0 4px 20px rgba(71, 91, 137, 0.06)',
      display: 'flex',
      flexDirection: 'column',
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
    },
    cardTitle: {
      fontSize: '16px',
      fontWeight: 700,
      color: isDark ? '#f8fafc' : '#1e293b',
      margin: 0,
    },
    periodDropdown: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '8px',
      backgroundColor: isDark ? '#1a2234' : '#f8fafd',
      border: isDark ? '1px solid #28334a' : '1px solid #e2e8f0',
      color: isDark ? '#94a3b8' : '#64748b',
      fontSize: '12px',
      fontWeight: 600,
      cursor: 'pointer',
    },
    virtualCardWidget: {
      background: 'linear-gradient(135deg, #18253a 0%, #0d1522 100%)',
      borderRadius: '16px',
      padding: '22px 24px',
      color: '#ffffff',
      boxShadow: '0 8px 24px rgba(13, 21, 34, 0.35)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '180px',
      position: 'relative',
      overflow: 'hidden',
    },
    cardQuickActions: {
      display: 'flex',
      gap: '10px',
      marginTop: '14px',
    },
    quickActionBtn: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      backgroundColor: isDark ? '#1a2234' : '#ffffff',
      border: isDark ? '1px solid #28334a' : '1px solid #e2e8f0',
      borderRadius: '10px',
      padding: '9px 12px',
      fontSize: '12px',
      fontWeight: 600,
      color: isDark ? '#f8fafc' : '#1e293b',
      cursor: 'pointer',
      boxShadow: isDark ? 'none' : '0 2px 6px rgba(0,0,0,0.03)',
      transition: 'all 0.15s ease',
    },
    dashboardBottomGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1.4fr',
      gap: '18px',
    },
    panel: {
      backgroundColor: isDark ? '#111827' : '#ffffff',
      border: isDark ? '1px solid #1f293d' : '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '22px 24px',
      boxShadow: isDark ? '0 4px 12px rgba(0, 0, 0, 0.25)' : '0 4px 20px rgba(71, 91, 137, 0.06)',
    },
    panelHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
    },
    panelTitle: {
      fontSize: '15px',
      fontWeight: 700,
      margin: 0,
      color: isDark ? '#f8fafc' : '#1e293b',
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
      color: isDark ? '#cbd5e1' : '#334155',
    },
    barTrack: {
      height: '8px',
      backgroundColor: isDark ? '#1e293b' : '#e2e8f0',
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
      backgroundColor: isDark ? '#450a0a30' : '#fef2f2',
      border: isDark ? '1px solid #ef444455' : '1px solid #fecaca',
      padding: '14px 20px',
      borderRadius: '12px',
      fontSize: '13px',
      color: isDark ? '#f8fafc' : '#991b1b',
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
      color: isDark ? '#94a3b8' : '#475569',
    },
    input: {
      backgroundColor: isDark ? '#1a2234' : '#ffffff',
      border: isDark ? '1px solid #28334a' : '1px solid #cbd5e1',
      borderRadius: '8px',
      padding: '10px 12px',
      color: isDark ? '#f8fafc' : '#0f172a',
      fontSize: '14px',
      outline: 'none',
    },
    select: {
      backgroundColor: isDark ? '#1a2234' : '#ffffff',
      border: isDark ? '1px solid #28334a' : '1px solid #cbd5e1',
      borderRadius: '8px',
      padding: '10px 12px',
      color: isDark ? '#f8fafc' : '#0f172a',
      fontSize: '14px',
      outline: 'none',
    },
    primaryButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: '#2b3648',
      border: 'none',
      color: '#ffffff',
      padding: '10px 18px',
      borderRadius: '10px',
      fontSize: '13px',
      fontWeight: 600,
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(43, 54, 72, 0.25)',
      transition: 'all 0.15s ease',
    },
    secondaryButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: isDark ? '#1a2234' : '#ffffff',
      border: isDark ? '1px solid #28334a' : '1px solid #cbd5e1',
      color: isDark ? '#f8fafc' : '#1e293b',
      padding: '8px 14px',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: 600,
      cursor: 'pointer',
    },
    textButton: {
      background: 'none',
      border: 'none',
      color: isDark ? '#818cf8' : '#4f46e5',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: 600,
      padding: '4px 8px',
    },
    feedbackNotice: {
      marginTop: '16px',
      padding: '10px 14px',
      borderRadius: '8px',
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
      borderBottom: isDark ? '1px solid #1f293d' : '1px solid #e2e8f0',
      color: isDark ? '#64748b' : '#64748b',
      fontSize: '12px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    tr: {
      borderBottom: isDark ? '1px solid #1f293d40' : '1px solid #f1f5f9',
      transition: 'background-color 0.15s',
    },
    td: {
      padding: '12px 14px',
      fontSize: '13px',
      color: isDark ? '#cbd5e1' : '#334155',
    },
    tdMono: {
      padding: '12px 14px',
      fontSize: '13px',
      fontFamily: 'monospace',
      color: isDark ? '#e2e8f0' : '#1e293b',
    },
    categoryPill: {
      padding: '3px 8px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 600,
    },
    varianceBadge: {
      display: 'inline-block',
      padding: '3px 8px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 700,
    },
    badge: {
      display: 'inline-block',
      padding: '3px 9px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 600,
      letterSpacing: '0.03em',
    },
    miniButton: {
      backgroundColor: isDark ? '#1a2234' : '#f1f5f9',
      border: isDark ? '1px solid #28334a' : '1px solid #cbd5e1',
      color: isDark ? '#94a3b8' : '#475569',
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '12px',
      cursor: 'pointer',
    },
    filterBar: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      flexWrap: 'wrap',
      backgroundColor: isDark ? '#111827' : '#ffffff',
      padding: '14px 20px',
      borderRadius: '12px',
      border: isDark ? '1px solid #1f293d' : '1px solid #e2e8f0',
      boxShadow: isDark ? 'none' : '0 2px 10px rgba(0, 0, 0, 0.03)',
    },
    filterGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    filterLabel: {
      fontSize: '12px',
      fontWeight: 600,
      color: isDark ? '#94a3b8' : '#475569',
    },
    filterSelect: {
      backgroundColor: isDark ? '#1a2234' : '#f8fafd',
      border: isDark ? '1px solid #28334a' : '1px solid #cbd5e1',
      color: isDark ? '#f8fafc' : '#0f172a',
      padding: '6px 10px',
      borderRadius: '6px',
      fontSize: '13px',
      outline: 'none',
    },
    filterToggle: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      backgroundColor: isDark ? '#1a2234' : '#f1f5f9',
      border: isDark ? '1px solid #28334a' : '1px solid #cbd5e1',
      color: isDark ? '#94a3b8' : '#64748b',
      padding: '6px 12px',
      borderRadius: '6px',
      fontSize: '13px',
      cursor: 'pointer',
    },
    filterToggleActive: {
      backgroundColor: isDark ? '#ef444420' : '#fee2e2',
      color: isDark ? '#ef4444' : '#dc2626',
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
      backgroundColor: isDark ? '#111827' : '#ffffff',
      borderLeft: isDark ? '1px solid #1f293d' : '1px solid #e2e8f0',
      boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.25)',
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
      borderBottom: isDark ? '1px solid #1f293d' : '1px solid #e2e8f0',
      paddingBottom: '16px',
    },
    closeButton: {
      background: 'none',
      border: 'none',
      color: isDark ? '#94a3b8' : '#64748b',
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
      color: isDark ? '#94a3b8' : '#64748b',
      fontWeight: 500,
    },
    reasonBox: {
      backgroundColor: isDark ? '#1a2234' : '#f8fafd',
      border: isDark ? '1px solid #28334a' : '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '13px',
      color: isDark ? '#cbd5e1' : '#334155',
      lineHeight: 1.5,
      marginTop: '6px',
    },
    statusButton: {
      padding: '6px 12px',
      borderRadius: '8px',
      border: isDark ? '1px solid #28334a' : '1px solid #cbd5e1',
      backgroundColor: isDark ? '#1a2234' : '#f1f5f9',
      color: isDark ? '#cbd5e1' : '#475569',
      fontSize: '12px',
      cursor: 'pointer',
    },
    statusButtonActive: {
      backgroundColor: '#2b3648',
      borderColor: '#2b3648',
      color: '#ffffff',
      fontWeight: 600,
    },
    chatShell: {
      backgroundColor: isDark ? '#111827' : '#ffffff',
      border: isDark ? '1px solid #1f293d' : '1px solid #e2e8f0',
      borderRadius: '16px',
      display: 'flex',
      flexDirection: 'column',
      height: '620px',
      overflow: 'hidden',
      boxShadow: isDark ? 'none' : '0 4px 20px rgba(71, 91, 137, 0.06)',
    },
    chatLog: {
      flex: 1,
      overflowY: 'auto',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      backgroundColor: isDark ? '#111827' : '#f8fafd',
    },
    chatBubbleContainer: {
      display: 'flex',
      width: '100%',
    },
    chatBubble: {
      maxWidth: '75%',
      padding: '12px 16px',
      borderRadius: '14px',
      fontSize: '14px',
      lineHeight: 1.5,
    },
    userBubble: {
      backgroundColor: '#2b3648',
      color: '#ffffff',
      borderBottomRightRadius: '2px',
    },
    botBubble: {
      backgroundColor: isDark ? '#1a2234' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
      borderBottomLeftRadius: '2px',
      border: isDark ? '1px solid #28334a60' : '1px solid #e2e8f0',
      boxShadow: isDark ? 'none' : '0 2px 6px rgba(0,0,0,0.03)',
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
      borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
      fontSize: '11px',
      opacity: 0.8,
    },
    promptChips: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      padding: '8px 16px',
      backgroundColor: isDark ? '#0b111e50' : '#ffffff',
      borderTop: isDark ? '1px solid #1f293d' : '1px solid #e2e8f0',
      overflowX: 'auto',
    },
    chipButton: {
      backgroundColor: isDark ? '#1a2234' : '#f1f5f9',
      border: isDark ? '1px solid #28334a' : '1px solid #cbd5e1',
      color: isDark ? '#cbd5e1' : '#475569',
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
      backgroundColor: isDark ? '#0b111e' : '#ffffff',
      borderTop: isDark ? '1px solid #1f293d' : '1px solid #e2e8f0',
    },
    chatInput: {
      flex: 1,
      backgroundColor: isDark ? '#1a2234' : '#f8fafd',
      border: isDark ? '1px solid #28334a' : '1px solid #cbd5e1',
      borderRadius: '10px',
      padding: '10px 14px',
      color: isDark ? '#f8fafc' : '#0f172a',
      fontSize: '14px',
      outline: 'none',
    },
    chatSendButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      backgroundColor: '#2b3648',
      border: 'none',
      color: '#ffffff',
      padding: '10px 18px',
      borderRadius: '10px',
      fontWeight: 600,
      fontSize: '13px',
      cursor: 'pointer',
    },
  };
}

export default FemaApp;
