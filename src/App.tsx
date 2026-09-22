import React, { useState, useEffect, useMemo } from 'react';
import LandingPage from './components/LandingPage';
import { type UserSession, AuthModal } from './components/AuthModal';
import { RoleNavbar } from './components/RoleNavbar';
import { AdminDashboard } from './components/AdminDashboard';
import { AnalystDashboard } from './components/AnalystDashboard';
import { CfoDashboard } from './components/CfoDashboard';
import { AuditorDashboard } from './components/AuditorDashboard';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';

export interface FinancialRecord {
  id: number;
  category: string;
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
// ============================================================================
// DYNAMIC DATA (Loaded directly from live backend database)
// ============================================================================
const INITIAL_RECORDS: FinancialRecord[] = [];
const INITIAL_OWNERS: Owner[] = [];
const INITIAL_EXCEPTIONS: ExceptionCase[] = [];

// ============================================================================
// ICONS (Clean, zero-dependency inline SVGs)
// ============================================================================
const Icons = {
  Dashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
  ),
  Records: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><line x1="10" x2="8" y1="9" y2="9" /></svg>
  ),
  Exceptions: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></svg>
  ),
  Chat: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
  ),
  AlertCircle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
  ),
  CheckCircle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
  ),
  TrendingUp: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
  ),
  TrendingDown: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7" /><polyline points="16 17 22 17 22 11" /></svg>
  ),
  Refresh: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21h5v-5" /></svg>
  ),
  Escalate: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 11 12 6 7 11" /><polyline points="17 18 12 13 7 18" /></svg>
  ),
  Send: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
  ),
  Bot: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="12" x="3" y="6" rx="2" /><circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" /><path d="M12 2v4" /><path d="M2 12h1" /><path d="M21 12h1" /></svg>
  ),
  User: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
  ),
  ChevronLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
  ),
  ChevronRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
  ),
  Sun: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
  ),
  Moon: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
  ),
  LogOut: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
  ),
};

// ============================================================================
// ============================================================================
// ROUTING VIEWS
// ============================================================================
export type AppView =
  | 'landing'
  | 'dashboard'
  | 'records'
  | 'exceptions'
  | 'chat'
  | 'admin-health'
  | 'admin-thresholds'
  | 'admin-users'
  | 'admin-logs'
  | 'admin-trail'
  | 'admin-sla'
  | 'admin-hitl'
  | 'admin-export'
  | 'analyst-tasks'
  | 'analyst-sla'
  | 'analyst-insights'
  | 'cfo-kpis'
  | 'cfo-warnings'
  | 'cfo-risks'
  | 'cfo-brief'
  | 'auditor-trail'
  | 'auditor-sla'
  | 'auditor-hitl'
  | 'auditor-export';

// MAIN APPLICATION COMPONENT
// ============================================================================
export const FemaApp: React.FC<FemaAppProps> = ({ apiBaseUrl = 'http://localhost:5000/api' }) => {
  // Navigation & URL Routing Helper
  const getViewFromPath = (): AppView => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('admin-health')) return 'admin-health';
    if (path.includes('admin-threshold')) return 'admin-thresholds';
    if (path.includes('admin-user')) return 'admin-users';
    if (path.includes('admin-log')) return 'admin-logs';
    if (path.includes('admin-trail') || path.includes('auditor-trail')) return 'admin-trail';
    if (path.includes('admin-sla') || path.includes('auditor-sla')) return 'admin-sla';
    if (path.includes('admin-hitl') || path.includes('auditor-hitl')) return 'admin-hitl';
    if (path.includes('admin-export') || path.includes('auditor-export')) return 'admin-export';

    if (path.includes('analyst-task')) return 'analyst-tasks';
    if (path.includes('analyst-sla')) return 'analyst-sla';
    if (path.includes('analyst-insight')) return 'analyst-insights';

    if (path.includes('cfo-kpi')) return 'cfo-kpis';
    if (path.includes('cfo-warning')) return 'cfo-warnings';
    if (path.includes('cfo-risk')) return 'cfo-risks';
    if (path.includes('cfo-brief')) return 'cfo-brief';

    if (path.includes('record')) return 'records';
    if (path.includes('exception')) return 'exceptions';
    if (path.includes('chat')) return 'chat';
    if (path.includes('dashboard') || path.includes('app')) return 'dashboard';
    return 'landing';
  };

  const [currentView, setCurrentViewState] = useState<AppView>(getViewFromPath);

  // Navigate and update browser URL address bar
  const navigateTo = (view: AppView) => {
    setCurrentViewState(view);
    const targetPath = view === 'landing' ? '/' : `/${view}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ view }, '', targetPath);
    }
  };

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentViewState(getViewFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // User Session & Role Architecture
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('fema_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [_token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('fema_token');
  });

  const [activeRole, setActiveRole] = useState<number>(() => {
    const savedRole = localStorage.getItem('fema_active_role');
    if (savedRole !== null) return Number(savedRole);
    try {
      const savedUser = localStorage.getItem('fema_user');
      if (savedUser) return JSON.parse(savedUser).role_id ?? 0;
    } catch {}
    return 0; // Default to Admin
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const handleAuthSuccess = (newToken: string, newUser: UserSession) => {
    setToken(newToken);
    setUser(newUser);
    setActiveRole(newUser.role_id);
    localStorage.setItem('fema_token', newToken);
    localStorage.setItem('fema_user', JSON.stringify(newUser));
    localStorage.setItem('fema_active_role', String(newUser.role_id));
    navigateTo('dashboard');
  };

  const handleSignOut = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('fema_token');
    localStorage.removeItem('fema_user');
    localStorage.removeItem('fema_active_role');
    navigateTo('landing');
  };

  const handleRoleChange = (newRole: number) => {
    setActiveRole(newRole);
    localStorage.setItem('fema_active_role', String(newRole));
    navigateTo('dashboard');
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Synchronize data-theme on document root and body for index.css global styles
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // Dynamic Theme Styles
  const styles = useMemo(() => getStyles(theme), [theme]);

  // Backend connection state
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);

  // Core Data
  const [records, setRecords] = useState<FinancialRecord[]>(INITIAL_RECORDS);
  const [exceptions, setExceptions] = useState<ExceptionCase[]>(INITIAL_EXCEPTIONS);
  const [_owners, setOwners] = useState<Owner[]>(INITIAL_OWNERS);

  // Modals & Panels
  const [selectedCase, setSelectedCase] = useState<ExceptionCase | null>(null);

  // Filters
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showOverdueOnly, setShowOverdueOnly] = useState<boolean>(false);

  // Dynamic period default (current YYYY-MM)
  const currentPeriod = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Forms
  const [formData, setFormData] = useState({
    category: 'Revenue',
    customCategory: '',
    period: currentPeriod,
    department: '',
    budget_amount: '',
    actual_amount: '',
  });
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Dynamic unique existing departments for datalist autocompletion
  const existingDepartments = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.department && r.department.trim()) set.add(r.department.trim());
    });
    return Array.from(set);
  }, [records]);

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

  // Clear notices when changing pages
  useEffect(() => {
    setFormFeedback(null);
  }, [currentView]);

  const fetchBackendData = async () => {
    try {
      const [recordsRes, exceptionsRes, ownersRes] = await Promise.all([
        fetch(`${apiBaseUrl}/financial-records`),
        fetch(`${apiBaseUrl}/exceptions`),
        fetch(`${apiBaseUrl}/owners`),
      ]);
      if (recordsRes.ok) {
        const data = await recordsRes.json();
        setRecords(data);
      }
      if (exceptionsRes.ok) {
        const data = await exceptionsRes.json();
        setExceptions(data);
      }
      if (ownersRes.ok) {
        const data = await ownersRes.json();
        if (Array.isArray(data) && data.length > 0) {
          setOwners(data);
        }
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

    let totalBudget = 0;
    let totalActual = 0;
    records.forEach((r) => {
      totalBudget += r.budget_amount || 0;
      totalActual += r.actual_amount || 0;
    });

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
      total_budget: totalBudget,
      total_actual: totalActual,
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
    const finalCategory = formData.category === 'Custom' 
      ? (formData.customCategory.trim() || 'General Expense')
      : formData.category;

    const newRecord: FinancialRecord = {
      id: records.length ? Math.max(...records.map((r) => r.id)) + 1 : 1,
      category: finalCategory,
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
          await fetchBackendData();
          setFormFeedback({ type: 'success', message: `Record successfully recorded (${variance > 0 ? '+' : ''}${variance.toFixed(1)}% variance).` });
        } else {
          const errData = await res.json().catch(() => ({}));
          setFormFeedback({ type: 'error', message: errData.error || 'Failed to post financial record to database.' });
        }
      } catch (err: any) {
        setFormFeedback({ type: 'error', message: 'Backend connection error: ' + err.message });
      }
    } else {
      setFormFeedback({ type: 'error', message: '⚠️ Backend API is offline. Connect to backend to post financial records.' });
    }

    setFormData({
      category: 'Revenue',
      customCategory: '',
      period: currentPeriod,
      department: '',
      budget_amount: '',
      actual_amount: '',
    });
    setTimeout(() => setFormFeedback(null), 5000);
  };

  const handleRunMonitoring = async () => {
    setIsMonitoring(true);
    if (isBackendConnected) {
      try {
        const res = await fetch(`${apiBaseUrl}/monitor`, { method: 'POST' });
        const data = await res.json();
        await fetchBackendData();
        setIsMonitoring(false);
        const count = data.exceptions_created ?? (data.new_exceptions ? data.new_exceptions.length : 0);
        if (count > 0) {
          setFormFeedback({
            type: 'success',
            message: `✅ Monitoring complete: ${count} new exception case${count > 1 ? 's' : ''} detected!`,
          });
        } else {
          setFormFeedback({
            type: 'success',
            message: '✅ Monitoring complete: No new exception cases detected (all records within threshold).',
          });
        }
        setTimeout(() => setFormFeedback(null), 6000);
        return;
      } catch (err) {
        console.warn('Backend monitor failed:', err);
      }
    }

    setIsMonitoring(false);
    setFormFeedback({
      type: 'error',
      message: '⚠️ Backend API is offline. Start the FEMA backend server (python app.py) to execute AI exception monitoring.',
    });
    setTimeout(() => setFormFeedback(null), 6000);
  };

  const handleEscalateCase = async (caseId: number) => {
    if (!isBackendConnected) {
      setFormFeedback({ type: 'error', message: '⚠️ Backend is offline. Connect to backend to escalate exception cases.' });
      return;
    }
    try {
      const res = await fetch(`${apiBaseUrl}/exceptions/${caseId}/escalate`, { method: 'POST' });
      if (res.ok) {
        await fetchBackendData();
        setFormFeedback({ type: 'success', message: `Case #${caseId} escalated to higher seniority owner.` });
      }
    } catch (err) {
      console.warn('API escalation error:', err);
    }
  };

  const handleStatusUpdate = async (caseId: number, newStatus: CaseStatus) => {
    if (!isBackendConnected) {
      setFormFeedback({ type: 'error', message: '⚠️ Backend is offline. Connect to backend to update case status.' });
      return;
    }
    try {
      const res = await fetch(`${apiBaseUrl}/exceptions/${caseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchBackendData();
        setFormFeedback({ type: 'success', message: `Case #${caseId} status changed to ${newStatus}.` });
      }
    } catch (err) {
      console.warn('Status update API error:', err);
    }
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
        if (revRecords.length > 0) {
          const getVar = (r: FinancialRecord) => Math.abs(r.variance_percent ?? 0);
          const maxVar = revRecords.reduce((prev, curr) => getVar(curr) > getVar(prev) ? curr : prev, revRecords[0]);
          const vp = maxVar.variance_percent ?? 0;
          botResponse = `Revenue Analysis: You have ${revRecords.length} revenue entries. The biggest variance is in ${maxVar.department} with an actual of ₹${Number(maxVar.actual_amount).toLocaleString()} vs budget of ₹${Number(maxVar.budget_amount).toLocaleString()} (${vp > 0 ? '+' : ''}${vp.toFixed(1)}% variance).`;
        } else {
          botResponse = `Revenue Analysis: No revenue entries currently recorded in the active ledger.`;
        }
      } else if (qLower.includes('critical') || qLower.includes('severity')) {
        botResponse = `Severity Breakdown: There are currently ${summary.exceptions_by_severity.CRITICAL} CRITICAL, ${summary.exceptions_by_severity.HIGH} HIGH, and ${summary.exceptions_by_severity.MEDIUM} MEDIUM cases. Critical items require resolution within 24 hours under SLA policy.`;
      } else if (qLower.includes('overdue') || qLower.includes('sla')) {
        const overdueList = exceptions.filter((e) => isCaseOverdue(e.sla_deadline, e.status));
        if (overdueList.length > 0) {
          const first = overdueList[0];
          const linkedRecord = records.find((r) => r.id === first.financial_record_id);
          botResponse = `SLA Alert: ${overdueList.length} exception case(s) past SLA deadline (e.g. Case #${first.id} in ${linkedRecord?.department || 'Operations'}). Escalation recommended.`;
        } else {
          botResponse = `SLA Status: All exception cases are currently within compliance tolerances. Zero overdue SLA cases.`;
        }
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

  // If on Landing Page, render LandingPage component directly
  if (currentView === 'landing') {
    return (
      <>
        <LandingPage
          theme={theme}
          setTheme={setTheme}
          user={user}
          onOpenAuth={(mode = 'login') => {
            setAuthModalMode(mode);
            setAuthModalOpen(true);
          }}
          onLaunchApp={(targetView = 'dashboard') => {
            if (!user) {
              setAuthModalMode('login');
              setAuthModalOpen(true);
            } else {
              navigateTo(targetView);
            }
          }}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
          initialMode={authModalMode}
        />
      </>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', backgroundColor: 'var(--fema-bg)' }}>
      {user && (
        <RoleNavbar
          user={user}
          activeRole={activeRole}
          onSignOut={handleSignOut}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onNavigateHome={() => navigateTo('landing')}
          onRoleChange={handleRoleChange}
        />
      )}
      <div style={styles.appShell}>
      {/* ---------------------------------------------------------------- */}
      {/* SIDEBAR NAVIGATION                                               */}
      {/* ---------------------------------------------------------------- */}
      <aside
        style={{
          ...styles.sidebar,
          width: isSidebarCollapsed ? '76px' : '260px',
          height: '100vh',
          maxHeight: '100vh',
          overflow: 'hidden',
          padding: isSidebarCollapsed ? '16px 8px' : '18px 14px',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), padding 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ ...styles.brandContainer, paddingLeft: 0, marginBottom: '16px' }}>
          {isSidebarCollapsed ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%' }}>
              <div
                onClick={() => navigateTo('landing')}
                style={{
                  ...styles.brandBadge,
                  width: '42px',
                  height: '42px',
                  flexShrink: 0,
                  fontSize: '16px',
                  cursor: 'pointer',
                }}
                title="Back to Landing Page"
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
              <div
                onClick={() => navigateTo('landing')}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden', cursor: 'pointer' }}
                title="Back to Landing Page"
              >
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

        <nav style={styles.navMenu}>
          {/* Main Role Overview Button */}
          <button
            onClick={() => navigateTo('dashboard')}
            style={{
              ...styles.navButton,
              ...(currentView === 'dashboard' ? styles.navButtonActive : {}),
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
              padding: isSidebarCollapsed ? '12px' : '11px 14px',
              position: 'relative',
            }}
            title={isSidebarCollapsed ? 'Dashboard Overview' : undefined}
          >
            <Icons.Dashboard />
            {!isSidebarCollapsed && <span>Dashboard Overview</span>}
          </button>

          {/* Role 0: Admin & Compliance Officer Sub-pages */}
          {activeRole === 0 && (
            <>
              {!isSidebarCollapsed && (
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#ef4444', letterSpacing: '0.06em', padding: '8px 12px 4px', textTransform: 'uppercase' }}>
                  Infrastructure & Ops
                </div>
              )}
              <button
                onClick={() => navigateTo('admin-health')}
                style={{
                  ...styles.navButton,
                  ...(currentView === 'admin-health' ? styles.navButtonActive : {}),
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  padding: isSidebarCollapsed ? '10px' : '8px 12px',
                }}
                title={isSidebarCollapsed ? 'Financial Integrations' : undefined}
              >
                <span>🔌</span>
                {!isSidebarCollapsed && <span>Financial Integrations</span>}
              </button>
              <button
                onClick={() => navigateTo('admin-thresholds')}
                style={{
                  ...styles.navButton,
                  ...(currentView === 'admin-thresholds' ? styles.navButtonActive : {}),
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  padding: isSidebarCollapsed ? '10px' : '8px 12px',
                }}
                title={isSidebarCollapsed ? 'AI Anomaly Thresholds' : undefined}
              >
                <span>⚙️</span>
                {!isSidebarCollapsed && <span>AI Anomaly Thresholds</span>}
              </button>
              <button
                onClick={() => navigateTo('admin-users')}
                style={{
                  ...styles.navButton,
                  ...(currentView === 'admin-users' ? styles.navButtonActive : {}),
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  padding: isSidebarCollapsed ? '10px' : '8px 12px',
                }}
                title={isSidebarCollapsed ? 'User & Access Control' : undefined}
              >
                <span>👥</span>
                {!isSidebarCollapsed && <span>User Directory & Access</span>}
              </button>
              <button
                onClick={() => navigateTo('admin-logs')}
                style={{
                  ...styles.navButton,
                  ...(currentView === 'admin-logs' ? styles.navButtonActive : {}),
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  padding: isSidebarCollapsed ? '10px' : '8px 12px',
                }}
                title={isSidebarCollapsed ? 'System Logs & Sync' : undefined}
              >
                <span>💻</span>
                {!isSidebarCollapsed && <span>System Sync Logs</span>}
              </button>

              {!isSidebarCollapsed && (
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#f59e0b', letterSpacing: '0.06em', padding: '8px 12px 4px', textTransform: 'uppercase' }}>
                  Compliance & Governance
                </div>
              )}
              <button
                onClick={() => navigateTo('admin-trail')}
                style={{
                  ...styles.navButton,
                  ...(currentView === 'admin-trail' || currentView === 'auditor-trail' ? styles.navButtonActive : {}),
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  padding: isSidebarCollapsed ? '10px' : '8px 12px',
                }}
                title={isSidebarCollapsed ? 'Audit Trail Feed' : undefined}
              >
                <span>📜</span>
                {!isSidebarCollapsed && <span>Audit Trail Feed</span>}
              </button>
              <button
                onClick={() => navigateTo('admin-sla')}
                style={{
                  ...styles.navButton,
                  ...(currentView === 'admin-sla' || currentView === 'auditor-sla' ? styles.navButtonActive : {}),
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  padding: isSidebarCollapsed ? '10px' : '8px 12px',
                }}
                title={isSidebarCollapsed ? 'SLA Compliance Stats' : undefined}
              >
                <span>🎯</span>
                {!isSidebarCollapsed && <span>SLA Compliance Stats</span>}
              </button>
              <button
                onClick={() => navigateTo('admin-hitl')}
                style={{
                  ...styles.navButton,
                  ...(currentView === 'admin-hitl' || currentView === 'auditor-hitl' ? styles.navButtonActive : {}),
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  padding: isSidebarCollapsed ? '10px' : '8px 12px',
                }}
                title={isSidebarCollapsed ? 'HITL Governance Ratio' : undefined}
              >
                <span>⚖️</span>
                {!isSidebarCollapsed && <span>HITL Governance Ratio</span>}
              </button>
              <button
                onClick={() => navigateTo('admin-export')}
                style={{
                  ...styles.navButton,
                  ...(currentView === 'admin-export' || currentView === 'auditor-export' ? styles.navButtonActive : {}),
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  padding: isSidebarCollapsed ? '10px' : '8px 12px',
                }}
                title={isSidebarCollapsed ? 'Export Compliance Reports' : undefined}
              >
                <span>📥</span>
                {!isSidebarCollapsed && <span>Export Reports</span>}
              </button>
            </>
          )}

          {/* Role 1: Finance Analyst Specific Page Buttons */}
          {activeRole === 1 && (
            <>

              <button
                onClick={() => navigateTo('analyst-tasks')}
                style={{
                  ...styles.navButton,
                  ...(currentView === 'analyst-tasks' ? styles.navButtonActive : {}),
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  padding: isSidebarCollapsed ? '10px' : '8px 12px',
                }}
                title={isSidebarCollapsed ? 'My Tasks Queue' : undefined}
              >
                <span>📋</span>
                {!isSidebarCollapsed && <span>My Tasks Queue</span>}
              </button>
              <button
                onClick={() => navigateTo('analyst-sla')}
                style={{
                  ...styles.navButton,
                  ...(currentView === 'analyst-sla' ? styles.navButtonActive : {}),
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  padding: isSidebarCollapsed ? '10px' : '8px 12px',
                }}
                title={isSidebarCollapsed ? 'SLA Tracker & Alerts' : undefined}
              >
                <span>⏱️</span>
                {!isSidebarCollapsed && <span>SLA Tracker & Alerts</span>}
              </button>
              <button
                onClick={() => navigateTo('analyst-insights')}
                style={{
                  ...styles.navButton,
                  ...(currentView === 'analyst-insights' ? styles.navButtonActive : {}),
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  padding: isSidebarCollapsed ? '10px' : '8px 12px',
                }}
                title={isSidebarCollapsed ? 'AI Diagnostics & Actions' : undefined}
              >
                <span>🔍</span>
                {!isSidebarCollapsed && <span>AI Root-Cause & Action</span>}
              </button>
            </>
          )}

          {/* Role 2: Executive (CFO) Specific Page Buttons */}
          {activeRole === 2 && (
            <>

              <button
                onClick={() => navigateTo('cfo-kpis')}
                style={{
                  ...styles.navButton,
                  ...(currentView === 'cfo-kpis' ? styles.navButtonActive : {}),
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  padding: isSidebarCollapsed ? '10px' : '8px 12px',
                }}
                title={isSidebarCollapsed ? 'Strategic Financial KPIs' : undefined}
              >
                <span>🏛️</span>
                {!isSidebarCollapsed && <span>Strategic Financial KPIs</span>}
              </button>
              <button
                onClick={() => navigateTo('cfo-warnings')}
                style={{
                  ...styles.navButton,
                  ...(currentView === 'cfo-warnings' ? styles.navButtonActive : {}),
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  padding: isSidebarCollapsed ? '10px' : '8px 12px',
                }}
                title={isSidebarCollapsed ? 'Early Warnings & Covenants' : undefined}
              >
                <span>⚠️</span>
                {!isSidebarCollapsed && <span>Early Warnings & Covenants</span>}
              </button>
              <button
                onClick={() => navigateTo('cfo-risks')}
                style={{
                  ...styles.navButton,
                  ...(currentView === 'cfo-risks' ? styles.navButtonActive : {}),
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  padding: isSidebarCollapsed ? '10px' : '8px 12px',
                }}
                title={isSidebarCollapsed ? 'Escalated Material Risks' : undefined}
              >
                <span>🚨</span>
                {!isSidebarCollapsed && <span>Escalated Risks Sign-off</span>}
              </button>
              <button
                onClick={() => navigateTo('cfo-brief')}
                style={{
                  ...styles.navButton,
                  ...(currentView === 'cfo-brief' ? styles.navButtonActive : {}),
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  padding: isSidebarCollapsed ? '10px' : '8px 12px',
                }}
                title={isSidebarCollapsed ? 'AI Executive Brief' : undefined}
              >
                <span>✨</span>
                {!isSidebarCollapsed && <span>AI Executive Brief</span>}
              </button>
            </>
          )}

          {/* Role 3: Auditor Specific Page Buttons */}
          {activeRole === 3 && (
            <>

              <button
                onClick={() => navigateTo('auditor-trail')}
                style={{
                  ...styles.navButton,
                  ...(currentView === 'auditor-trail' ? styles.navButtonActive : {}),
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  padding: isSidebarCollapsed ? '10px' : '8px 12px',
                }}
                title={isSidebarCollapsed ? 'Audit Trail Feed' : undefined}
              >
                <span>📜</span>
                {!isSidebarCollapsed && <span>Audit Trail Feed</span>}
              </button>
              <button
                onClick={() => navigateTo('auditor-sla')}
                style={{
                  ...styles.navButton,
                  ...(currentView === 'auditor-sla' ? styles.navButtonActive : {}),
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  padding: isSidebarCollapsed ? '10px' : '8px 12px',
                }}
                title={isSidebarCollapsed ? 'SLA Compliance Report' : undefined}
              >
                <span>🎯</span>
                {!isSidebarCollapsed && <span>SLA Compliance Stats</span>}
              </button>
              <button
                onClick={() => navigateTo('auditor-hitl')}
                style={{
                  ...styles.navButton,
                  ...(currentView === 'auditor-hitl' ? styles.navButtonActive : {}),
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  padding: isSidebarCollapsed ? '10px' : '8px 12px',
                }}
                title={isSidebarCollapsed ? 'Human-in-the-Loop Governance' : undefined}
              >
                <span>⚖️</span>
                {!isSidebarCollapsed && <span>HITL Governance Ratio</span>}
              </button>
              <button
                onClick={() => navigateTo('auditor-export')}
                style={{
                  ...styles.navButton,
                  ...(currentView === 'auditor-export' ? styles.navButtonActive : {}),
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  padding: isSidebarCollapsed ? '10px' : '8px 12px',
                }}
                title={isSidebarCollapsed ? 'Report Generator & Export' : undefined}
              >
                <span>📥</span>
                {!isSidebarCollapsed && <span>Export Reports</span>}
              </button>
            </>
          )}

          {/* General Ledger & Exceptions */}
          {(activeRole === 1 || activeRole === 2) && (
            <>


              <button
                onClick={() => navigateTo('records')}
                style={{
                  ...styles.navButton,
                  ...(currentView === 'records' ? styles.navButtonActive : {}),
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  padding: isSidebarCollapsed ? '10px' : '9px 14px',
                  position: 'relative',
                }}
                title={isSidebarCollapsed ? 'Financial Records' : undefined}
              >
                <Icons.Records />
                {!isSidebarCollapsed && <span>Financial Records</span>}
              </button>

              <button
                onClick={() => navigateTo('exceptions')}
                style={{
                  ...styles.navButton,
                  ...(currentView === 'exceptions' ? styles.navButtonActive : {}),
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  padding: isSidebarCollapsed ? '10px' : '9px 14px',
                  position: 'relative',
                }}
                title={isSidebarCollapsed ? `Exception Cases (${summary.open_exceptions})` : undefined}
              >
                <Icons.Exceptions />
                {!isSidebarCollapsed && <span>All Exceptions</span>}
                {summary.open_exceptions > 0 && (
                  isSidebarCollapsed ? (
                    <span
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '10px',
                        width: '8px',
                        height: '8px',
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
            </>
          )}

          {/* AI Copilot */}
          {(activeRole === 1 || activeRole === 2) && (
            <button
              onClick={() => navigateTo('chat')}
              style={{
                ...styles.navButton,
                ...(currentView === 'chat' ? styles.navButtonActive : {}),
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                padding: isSidebarCollapsed ? '10px' : '9px 14px',
                position: 'relative',
              }}
              title={isSidebarCollapsed ? 'Finance AI Copilot' : undefined}
            >
              <Icons.Chat />
              {!isSidebarCollapsed && <span>Finance AI Copilot</span>}
            </button>
          )}
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Light / Dark Mode Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{
                ...styles.themeToggleBtn,
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                padding: isSidebarCollapsed ? '8px' : '6px 12px',
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

            {/* Logout Button */}
            <button
              onClick={handleSignOut}
              style={{
                ...styles.themeToggleBtn,
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                padding: isSidebarCollapsed ? '8px' : '6px 12px',
                color: 'var(--fema-accent-rose, #ef4444)',
              }}
              title="Sign Out"
            >
              <Icons.LogOut />
              {!isSidebarCollapsed && (
                <span style={{ fontSize: '12px', fontWeight: 600 }}>
                  Sign Out
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* ---------------------------------------------------------------- */}
      {/* MAIN VIEW AREA                                                   */}
      {/* ---------------------------------------------------------------- */}
      <main
        style={{
          ...styles.mainContent,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflowY: currentView === 'chat' ? 'hidden' : 'auto',
          padding: currentView === 'chat' ? '20px 32px' : '32px 40px',
        }}
      >
        {/* ============================================================== */}
        {/* ============================================================== */}
        {/* VIEW 1: DYNAMIC ROLE-SPECIFIC DASHBOARD                        */}
        {/* ============================================================== */}
        {currentView === 'dashboard' && (
          <div style={{ width: '100%' }}>
            {activeRole === 0 && (
              <AdminDashboard
                activeSection="all"
                onNavigateSection={(sec) => navigateTo(`admin-${sec}` as AppView)}
                records={records}
                exceptions={exceptions}
              />
            )}
            {activeRole === 1 && <AnalystDashboard activeSection="all" records={records} exceptions={exceptions} />}
            {activeRole === 2 && <CfoDashboard activeSection="all" records={records} exceptions={exceptions} />}
          </div>
        )}

        {/* Role 0: System Administrator Sub-pages */}
        {activeRole === 0 && currentView === 'admin-health' && (
          <AdminDashboard activeSection="health" onNavigateSection={(sec) => navigateTo(`admin-${sec}` as AppView)} records={records} exceptions={exceptions} />
        )}
        {activeRole === 0 && currentView === 'admin-thresholds' && (
          <AdminDashboard activeSection="thresholds" onNavigateSection={(sec) => navigateTo(`admin-${sec}` as AppView)} records={records} exceptions={exceptions} />
        )}
        {activeRole === 0 && currentView === 'admin-users' && (
          <AdminDashboard activeSection="users" onNavigateSection={(sec) => navigateTo(`admin-${sec}` as AppView)} records={records} exceptions={exceptions} />
        )}
        {activeRole === 0 && currentView === 'admin-logs' && (
          <AdminDashboard activeSection="logs" onNavigateSection={(sec) => navigateTo(`admin-${sec}` as AppView)} records={records} exceptions={exceptions} />
        )}

        {/* Role 0: Audit & Compliance Sub-pages (Consolidated from Role 3) */}
        {activeRole === 0 && (currentView === 'admin-trail' || (currentView as string) === 'auditor-trail') && (
          <AuditorDashboard activeSection="trail" />
        )}
        {activeRole === 0 && (currentView === 'admin-sla' || (currentView as string) === 'auditor-sla') && (
          <AuditorDashboard activeSection="compliance" />
        )}
        {activeRole === 0 && (currentView === 'admin-hitl' || (currentView as string) === 'auditor-hitl') && (
          <AuditorDashboard activeSection="hitl" />
        )}
        {activeRole === 0 && (currentView === 'admin-export' || (currentView as string) === 'auditor-export') && (
          <AuditorDashboard activeSection="export" />
        )}

        {/* Role 1: Finance Analyst Sub-pages */}
        {activeRole === 1 && currentView === 'analyst-tasks' && <AnalystDashboard activeSection="tasks" records={records} exceptions={exceptions} />}
        {activeRole === 1 && currentView === 'analyst-sla' && <AnalystDashboard activeSection="sla" records={records} exceptions={exceptions} />}
        {activeRole === 1 && currentView === 'analyst-insights' && <AnalystDashboard activeSection="insights" records={records} exceptions={exceptions} />}

        {/* Role 2: Executive (CFO) Sub-pages */}
        {activeRole === 2 && currentView === 'cfo-kpis' && <CfoDashboard activeSection="kpis" records={records} exceptions={exceptions} />}
        {activeRole === 2 && currentView === 'cfo-warnings' && <CfoDashboard activeSection="warnings" records={records} exceptions={exceptions} />}
        {activeRole === 2 && currentView === 'cfo-risks' && <CfoDashboard activeSection="risks" records={records} exceptions={exceptions} />}
        {activeRole === 2 && currentView === 'cfo-brief' && <CfoDashboard activeSection="brief" records={records} exceptions={exceptions} />}


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
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      style={styles.select}
                    >
                      <option value="Revenue">Revenue (Inflow)</option>
                      <option value="Operating Expense">Operating Expense (OpEx)</option>
                      <option value="Capital Expenditure">Capital Expenditure (CapEx)</option>
                      <option value="Cost of Goods Sold">Cost of Goods Sold (COGS)</option>
                      <option value="Payroll & Talent">Payroll & Talent</option>
                      <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                      <option value="Marketing & Growth">Marketing & Growth</option>
                      <option value="Treasury & Finance">Treasury & Finance</option>
                      <option value="Custom">Custom Category...</option>
                    </select>
                  </div>

                  {formData.category === 'Custom' && (
                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>Custom Category Name</label>
                      <input
                        type="text"
                        value={formData.customCategory}
                        onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                        placeholder="e.g. Legal & Compliance, Logistics"
                        required
                        style={styles.input}
                      />
                    </div>
                  )}

                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Period (Month / YYYY-MM)</label>
                    <input
                      type="month"
                      value={formData.period}
                      onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                      required
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Department / Cost Center</label>
                    <input
                      type="text"
                      list="departments-autocomplete"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="e.g. Marketing, DevOps, Sales"
                      required
                      style={styles.input}
                    />
                    <datalist id="departments-autocomplete">
                      {existingDepartments.map((dept) => (
                        <option key={dept} value={dept} />
                      ))}
                    </datalist>
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
                    marginTop: '18px',
                    padding: '14px 20px',
                    borderRadius: '8px',
                    border: formFeedback.type === 'success' ? '1px solid #10b981' : '1px solid #ef4444',
                    backgroundColor: formFeedback.type === 'success' ? '#064e3b' : '#7f1d1d',
                    color: formFeedback.type === 'success' ? '#6ee7b7' : '#fca5a5',
                    fontSize: '14px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: formFeedback.type === 'success' ? '0 0 15px rgba(16, 185, 129, 0.25)' : 'none',
                    animation: 'fadeIn 0.2s ease-in-out',
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
                    {records.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--fema-text-muted)', fontSize: '13px' }}>
                          No financial ledger records found in database. Use the form above to add a new record.
                        </td>
                      </tr>
                    ) : (
                      records.map((r) => {
                      const variance = r.variance_percent !== undefined
                        ? r.variance_percent
                        : r.budget_amount > 0
                        ? Number((((r.actual_amount - r.budget_amount) / r.budget_amount) * 100).toFixed(2))
                        : 0;
                      const isHighRisk = Math.abs(variance) >= 20;

                      return (
                        <tr key={r.id} style={styles.tr}>
                          <td style={styles.tdMono}>REC-#{r.id}</td>
                          <td style={styles.td}>{r.period}</td>
                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.categoryPill,
                                backgroundColor: r.category === 'Revenue'
                                  ? (theme === 'dark' ? '#1e1b4b' : '#eff6ff')
                                  : (theme === 'dark' ? '#312e81' : '#faf5ff'),
                                color: r.category === 'Revenue'
                                  ? (theme === 'dark' ? '#a5b4fc' : '#2563eb')
                                  : (theme === 'dark' ? '#c084fc' : '#7e22ce'),
                                border: r.category === 'Revenue'
                                  ? (theme === 'dark' ? '1px solid #3730a3' : '1px solid #bfdbfe')
                                  : (theme === 'dark' ? '1px solid #4c1d95' : '1px solid #e9d5ff'),
                              }}
                            >
                              {r.category}
                            </span>
                          </td>
                          <td style={{ ...styles.td, fontWeight: 500, color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }}>{r.department}</td>
                          <td style={styles.tdMono}>{formatCurrency(r.budget_amount)}</td>
                          <td style={styles.tdMono}>{formatCurrency(r.actual_amount)}</td>
                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.varianceBadge,
                                backgroundColor: isHighRisk
                                  ? variance < 0
                                    ? (theme === 'dark' ? '#450a0a' : '#fee2e2')
                                    : (theme === 'dark' ? '#451a03' : '#fef3c7')
                                  : (theme === 'dark' ? '#0f172a' : '#f1f5f9'),
                                color: variance < 0
                                  ? (theme === 'dark' ? '#f87171' : '#dc2626')
                                  : (theme === 'dark' ? '#fbbf24' : '#d97706'),
                                border: isHighRisk
                                  ? '1px solid currentColor'
                                  : (theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0'),
                              }}
                            >
                              {variance > 0 ? '+' : ''}
                              {variance}%
                            </span>
                          </td>
                        </tr>
                      );
                    }))}
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
                    {filteredExceptions.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--fema-text-muted)', fontSize: '13px' }}>
                          No exception cases found. Post financial records and run monitoring to detect anomalies.
                        </td>
                      </tr>
                    ) : (
                      filteredExceptions.map((c) => {
                      const overdue = isCaseOverdue(c.sla_deadline, c.status);
                      return (
                        <tr
                          key={c.id}
                          onClick={() => setSelectedCase(c)}
                          style={{
                            ...styles.tr,
                            cursor: 'pointer',
                            backgroundColor: selectedCase?.id === c.id ? (theme === 'dark' ? '#1e293b' : '#f1f5f9') : 'transparent',
                          }}
                        >
                          <td style={styles.tdMono}>
                            <strong>CASE-{c.id}</strong>
                          </td>
                          <td style={styles.tdMono}>REC-#{c.financial_record_id}</td>
                          <td style={styles.td}>
                            <span style={{ fontWeight: 600, color: c.variance_percent < 0 ? (theme === 'dark' ? '#f87171' : '#dc2626') : (theme === 'dark' ? '#fbbf24' : '#d97706') }}>
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
                              <span style={{ fontSize: '13px', fontWeight: 500, color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }}>
                                {c.owner?.name || 'Unassigned'}
                              </span>
                              <span style={{ fontSize: '11px', color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>{c.owner?.role}</span>
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
                    }))}
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
                      <span style={{ fontSize: '12px', color: theme === 'dark' ? '#818cf8' : '#2563eb', fontWeight: 600, letterSpacing: '0.05em' }}>
                        EXCEPTION DETAIL
                      </span>
                      <h2 style={{ fontSize: '20px', margin: '4px 0 0 0', color: theme === 'dark' ? '#f8fafc' : '#1e293b' }}>
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
                      <span style={{ fontSize: '18px', fontWeight: 700, color: selectedCase.variance_percent < 0 ? (theme === 'dark' ? '#f87171' : '#dc2626') : (theme === 'dark' ? '#fbbf24' : '#d97706') }}>
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
                      <span style={{ color: theme === 'dark' ? '#e2e8f0' : '#1e293b', fontWeight: 600 }}>
                        Level {selectedCase.escalation_level} of 4
                      </span>
                    </div>

                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Assigned Owner:</span>
                      <div>
                        <div style={{ color: theme === 'dark' ? '#f1f5f9' : '#1e293b', fontWeight: 600 }}>{selectedCase.owner?.name}</div>
                        <div style={{ fontSize: '12px', color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>{selectedCase.owner?.role}</div>
                      </div>
                    </div>

                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>SLA Deadline:</span>
                      <div style={{ color: isCaseOverdue(selectedCase.sla_deadline, selectedCase.status) ? '#ef4444' : (theme === 'dark' ? '#f1f5f9' : '#1e293b') }}>
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
          <div style={{ ...styles.viewContainer, flex: 1, height: '100%', minHeight: 0, gap: '10px' }}>
            <header style={{ ...styles.viewHeader, marginBottom: '0px', flexShrink: 0 }}>
              <h1 style={{ ...styles.viewTitle, fontSize: '24px' }}>FEMA Intelligence Chat</h1>
              <p style={{ ...styles.viewDescription, marginTop: '2px', fontSize: '13px' }}>
                Query your company ledger and exceptions in plain English. Answers are strictly grounded in stored financial records.
              </p>
            </header>

            <div style={{ ...styles.chatShell, flex: 1, height: 'auto', minHeight: 0 }}>
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
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authModalMode}
      />
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
        : { backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' };
    case 'HIGH':
      return isDark
        ? { backgroundColor: '#451a03', color: '#fbbf24', border: '1px solid #f59e0b55' }
        : { backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' };
    case 'MEDIUM':
      return isDark
        ? { backgroundColor: '#1e1b4b', color: '#a5b4fc', border: '1px solid #6366f155' }
        : { backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' };
    case 'LOW':
      return isDark
        ? { backgroundColor: '#022c22', color: '#34d399', border: '1px solid #10b98155' }
        : { backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' };
  }
}

function getStatusBadgeInline(status: CaseStatus, theme: 'dark' | 'light' = 'dark'): React.CSSProperties {
  const isDark = theme === 'dark';
  switch (status) {
    case 'OPEN':
      return isDark
        ? { backgroundColor: '#172554', color: '#60a5fa', border: '1px solid #3b82f644' }
        : { backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' };
    case 'IN_PROGRESS':
      return isDark
        ? { backgroundColor: '#2e1065', color: '#c084fc', border: '1px solid #a855f744' }
        : { backgroundColor: '#faf5ff', color: '#7e22ce', border: '1px solid #e9d5ff' };
    case 'RESOLVED':
      return isDark
        ? { backgroundColor: '#022c22', color: '#34d399', border: '1px solid #10b98144' }
        : { backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' };
    case 'ESCALATED':
      return isDark
        ? { backgroundColor: '#4c0519', color: '#fda4af', border: '1px solid #f43f5e55', fontWeight: 600 }
        : { backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', fontWeight: 600 };
  }
}

function getStyles(theme: 'dark' | 'light'): Record<string, React.CSSProperties> {
  const isDark = theme === 'dark';

  return {
    appShell: {
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: isDark ? '#090d16' : '#edf2f7',
      color: isDark ? '#f8fafc' : '#1e293b',
      fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      transition: 'background-color 0.2s ease, color 0.2s ease',
    },
    sidebar: {
      width: '270px',
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderRight: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 12px',
      flexShrink: 0,
      transition: 'background-color 0.2s ease, border-color 0.2s ease',
    },
    brandContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '20px',
      paddingLeft: '6px',
    },
    brandBadge: {
      width: '38px',
      height: '38px',
      borderRadius: '10px',
      background: isDark
        ? 'linear-gradient(135deg, #6366f1, #3b82f6)'
        : 'linear-gradient(135deg, #1e293b, #334155)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 800,
      fontSize: '15px',
      color: '#ffffff',
      letterSpacing: '0.05em',
      boxShadow: isDark
        ? '0 4px 12px rgba(99, 102, 241, 0.3)'
        : '0 4px 12px rgba(30, 41, 59, 0.2)',
    },
    brandTitle: {
      fontSize: '18px',
      fontWeight: 700,
      letterSpacing: '0.02em',
      color: isDark ? '#f8fafc' : '#1e293b',
    },
    brandSubtitle: {
      fontSize: '11px',
      color: isDark ? '#64748b' : '#64748b',
      fontWeight: 500,
    },
    navMenu: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      flex: 1,
    },
    navButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '8px 12px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: 'transparent',
      color: isDark ? '#94a3b8' : '#64748b',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 0.15s ease',
    },
    navButtonActive: {
      backgroundColor: isDark ? '#1e293b' : '#1e293b',
      color: '#ffffff',
      fontWeight: 600,
      boxShadow: isDark
        ? 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        : '0 4px 12px rgba(30, 41, 59, 0.15)',
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
      borderTop: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
      paddingTop: '12px',
    },
    themeToggleBtn: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
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
      backgroundColor: isDark ? '#1e293b60' : '#f8fafc',
      borderRadius: '8px',
      border: isDark ? '1px solid #33415530' : '1px solid #e2e8f0',
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
      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
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
      padding: '32px 40px',
      backgroundColor: isDark ? '#090d16' : '#edf2f7',
      transition: 'background-color 0.2s ease',
    },
    viewContainer: {
      maxWidth: '1360px',
      width: '100%',
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
      color: isDark ? '#f8fafc' : '#1e293b',
      margin: 0,
    },
    viewDescription: {
      fontSize: '14px',
      color: isDark ? '#94a3b8' : '#64748b',
      marginTop: '6px',
    },
    statGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '16px',
      width: '100%',
    },
    statCard: {
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '22px 24px',
      boxShadow: isDark
        ? '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
        : '0 4px 20px -2px rgba(112, 144, 176, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
    },
    statLabel: {
      fontSize: '12px',
      fontWeight: 600,
      letterSpacing: '0.04em',
      color: isDark ? '#64748b' : '#64748b',
      marginBottom: '8px',
    },
    statValue: {
      fontSize: '32px',
      fontWeight: 800,
      color: isDark ? '#f8fafc' : '#1e293b',
      lineHeight: 1.1,
    },
    statSub: {
      fontSize: '12px',
      color: isDark ? '#94a3b8' : '#64748b',
      marginTop: '8px',
    },
    panel: {
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: isDark
        ? '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
        : '0 4px 20px -2px rgba(112, 144, 176, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
    },
    panelHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
    },
    panelTitle: {
      fontSize: '18px',
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
      borderRadius: '999px',
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: '999px',
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
      backgroundColor: isDark ? '#090d16' : '#f8fafc',
      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
      borderRadius: '10px',
      padding: '10px 14px',
      color: isDark ? '#f8fafc' : '#1e293b',
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.15s ease',
    },
    select: {
      backgroundColor: isDark ? '#090d16' : '#f8fafc',
      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
      borderRadius: '10px',
      padding: '10px 14px',
      color: isDark ? '#f8fafc' : '#1e293b',
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.15s ease',
    },
    primaryButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: isDark ? '#4f46e5' : '#1e293b',
      border: isDark ? '1px solid #6366f1' : '1px solid #1e293b',
      color: '#ffffff',
      padding: '10px 18px',
      borderRadius: '10px',
      fontSize: '13px',
      fontWeight: 600,
      cursor: 'pointer',
      boxShadow: isDark ? 'none' : '0 4px 12px rgba(30, 41, 59, 0.15)',
      transition: 'all 0.15s ease',
    },
    secondaryButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
      color: isDark ? '#f8fafc' : '#1e293b',
      padding: '9px 16px',
      borderRadius: '10px',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    },
    textButton: {
      background: 'none',
      border: 'none',
      color: isDark ? '#818cf8' : '#2563eb',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: 600,
      padding: '4px 8px',
    },
    feedbackNotice: {
      marginTop: '16px',
      padding: '12px 16px',
      borderRadius: '10px',
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
      padding: '12px 16px',
      borderBottom: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
      backgroundColor: isDark ? 'transparent' : '#f8fafc',
      color: isDark ? '#64748b' : '#64748b',
      fontSize: '11px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    tr: {
      borderBottom: isDark ? '1px solid #1e293b40' : '1px solid #f1f5f9',
      transition: 'background-color 0.15s',
    },
    td: {
      padding: '14px 16px',
      fontSize: '13px',
      color: isDark ? '#cbd5e1' : '#334155',
    },
    tdMono: {
      padding: '14px 16px',
      fontSize: '13px',
      fontFamily: 'monospace',
      color: isDark ? '#e2e8f0' : '#1e293b',
      fontWeight: 600,
    },
    categoryPill: {
      padding: '3px 9px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 600,
    },
    varianceBadge: {
      display: 'inline-block',
      padding: '3px 8px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 600,
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
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
      color: isDark ? '#94a3b8' : '#334155',
      padding: '5px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    },
    filterBar: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      flexWrap: 'wrap',
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      padding: '16px 20px',
      borderRadius: '14px',
      border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
      boxShadow: isDark ? 'none' : '0 4px 20px -2px rgba(112, 144, 176, 0.06)',
    },
    filterGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    filterLabel: {
      fontSize: '12px',
      fontWeight: 600,
      color: isDark ? '#94a3b8' : '#64748b',
    },
    filterSelect: {
      backgroundColor: isDark ? '#090d16' : '#f8fafc',
      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
      color: isDark ? '#f8fafc' : '#1e293b',
      padding: '7px 12px',
      borderRadius: '8px',
      fontSize: '13px',
      outline: 'none',
    },
    filterToggle: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
      color: isDark ? '#94a3b8' : '#64748b',
      padding: '7px 14px',
      borderRadius: '8px',
      fontSize: '13px',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    },
    filterToggleActive: {
      backgroundColor: isDark ? '#ef444420' : '#fee2e2',
      color: isDark ? '#ef4444' : '#dc2626',
      borderColor: '#fca5a5',
    },
    drawerOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'flex-end',
      zIndex: 1000,
    },
    drawer: {
      width: '460px',
      height: '100%',
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderLeft: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
      boxShadow: isDark
        ? '-8px 0 24px rgba(0, 0, 0, 0.25)'
        : '-8px 0 32px rgba(15, 23, 42, 0.12)',
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
      borderBottom: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
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
      backgroundColor: isDark ? '#090d16' : '#f8fafc',
      border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
      borderRadius: '10px',
      padding: '12px 14px',
      fontSize: '13px',
      color: isDark ? '#cbd5e1' : '#334155',
      lineHeight: 1.5,
      marginTop: '6px',
    },
    statusButton: {
      padding: '7px 14px',
      borderRadius: '8px',
      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
      color: isDark ? '#cbd5e1' : '#475569',
      fontSize: '12px',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    },
    statusButtonActive: {
      backgroundColor: isDark ? '#4f46e5' : '#1e293b',
      borderColor: isDark ? '#6366f1' : '#1e293b',
      color: '#ffffff',
      fontWeight: 600,
    },
    chatShell: {
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
      borderRadius: '16px',
      display: 'flex',
      flexDirection: 'column',
      height: '620px',
      overflow: 'hidden',
      boxShadow: isDark
        ? 'none'
        : '0 4px 20px -2px rgba(112, 144, 176, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
    },
    chatLog: {
      flex: 1,
      overflowY: 'auto',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
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
      backgroundColor: isDark ? '#4f46e5' : '#1e293b',
      color: '#ffffff',
      borderBottomRightRadius: '3px',
      boxShadow: isDark ? 'none' : '0 2px 8px rgba(30, 41, 59, 0.15)',
    },
    botBubble: {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      color: isDark ? '#f8fafc' : '#1e293b',
      borderBottomLeftRadius: '3px',
      border: isDark ? '1px solid #33415560' : '1px solid #e2e8f0',
      boxShadow: isDark ? 'none' : '0 2px 10px rgba(112, 144, 176, 0.08)',
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
      borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
      fontSize: '11px',
      opacity: 0.8,
    },
    promptChips: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      padding: '10px 16px',
      backgroundColor: isDark ? '#090d1650' : '#ffffff',
      borderTop: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
      overflowX: 'auto',
    },
    chipButton: {
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
      color: isDark ? '#cbd5e1' : '#475569',
      borderRadius: '20px',
      padding: '5px 14px',
      fontSize: '12px',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      transition: 'all 0.15s ease',
    },
    chatInputRow: {
      display: 'flex',
      gap: '10px',
      padding: '14px 16px',
      backgroundColor: isDark ? '#090d16' : '#ffffff',
      borderTop: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
    },
    chatInput: {
      flex: 1,
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
      borderRadius: '10px',
      padding: '10px 14px',
      color: isDark ? '#f8fafc' : '#1e293b',
      fontSize: '14px',
      outline: 'none',
    },
    chatSendButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      backgroundColor: isDark ? '#4f46e5' : '#1e293b',
      border: 'none',
      color: '#ffffff',
      padding: '10px 18px',
      borderRadius: '10px',
      fontWeight: 600,
      fontSize: '13px',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      boxShadow: isDark ? 'none' : '0 4px 12px rgba(30, 41, 59, 0.15)',
    },
  };
}

export default FemaApp;
