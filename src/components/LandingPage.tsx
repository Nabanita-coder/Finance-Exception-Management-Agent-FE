import React, { useState, useMemo } from 'react';

export interface UserSession {
  id: number;
  username: string;
  email: string;
  role_id: number;
  role: string;
  full_name: string;
}

export interface LandingPageProps {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  user?: UserSession | null;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  onLaunchApp: (view?: 'dashboard' | 'records' | 'exceptions' | 'chat') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  theme,
  setTheme,
  user,
  onOpenAuth,
  onLaunchApp,
}) => {
  const isDark = theme === 'dark';

  // Active Role Persona Tab
  const [activePersona, setActivePersona] = useState<'cfo' | 'analyst' | 'auditor' | 'admin'>('cfo');

  // Interactive Live Anomaly Simulator State
  const [simulatorScenario, setSimulatorScenario] = useState<'cloud' | 'sales' | 'payroll'>('cloud');
  const [simBudget, setSimBudget] = useState<number>(300000);
  const [simActual, setSimActual] = useState<number>(450000);

  // Scenario presets
  const applyScenarioPreset = (type: 'cloud' | 'sales' | 'payroll') => {
    setSimulatorScenario(type);
    if (type === 'cloud') {
      setSimBudget(300000);
      setSimActual(450000);
    } else if (type === 'sales') {
      setSimBudget(1200000);
      setSimActual(720000);
    } else if (type === 'payroll') {
      setSimBudget(250000);
      setSimActual(315000);
    }
  };

  // Compute live simulator outputs
  const simOutputs = useMemo(() => {
    const variance = simBudget > 0 ? ((simActual - simBudget) / simBudget) * 100 : 0;
    const absVar = Math.abs(variance);
    let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    let sla = '72 Hours';
    let owner = 'Operations Lead';
    let hypothesis = 'Variance is within acceptable operational tolerance.';

    if (absVar >= 30) {
      severity = 'CRITICAL';
      sla = '24 Hours';
      owner = simulatorScenario === 'cloud' ? 'DevOps VP / Head of Infra' : simulatorScenario === 'sales' ? 'CRO / Enterprise Sales Dir' : 'HR VP / Talent Lead';
      hypothesis = simulatorScenario === 'cloud'
        ? 'Unbudgeted GPU cluster auto-scaling and unreserved multi-region compute surges.'
        : simulatorScenario === 'sales'
        ? 'Major enterprise sales pipeline slippage and deferred billing cycle.'
        : 'Accelerated executive headhunting fees and retroactive compensation parity adjustments.';
    } else if (absVar >= 15) {
      severity = 'HIGH';
      sla = '48 Hours';
      owner = 'Senior Finance Manager';
      hypothesis = 'Material deviation exceeding departmental quarterly tolerance threshold.';
    } else if (absVar >= 5) {
      severity = 'MEDIUM';
      sla = '72 Hours';
      owner = 'Finance Analyst';
      hypothesis = 'Minor pacing variance identified; recommended for standard monthly review.';
    }

    return {
      variance: Math.round(variance * 10) / 10,
      absVar,
      severity,
      sla,
      owner,
      hypothesis,
    };
  }, [simBudget, simActual, simulatorScenario]);

  // Feature Preview Modal state
  const [featurePreview, setFeaturePreview] = useState<{
    title: string;
    tag: string;
    icon: string;
    description: string;
    highlights: string[];
    targetView: 'dashboard' | 'records' | 'exceptions' | 'chat';
  } | null>(null);

  const handleLaunch = (view: 'dashboard' | 'records' | 'exceptions' | 'chat' = 'dashboard') => {
    if (!user && onOpenAuth) {
      onOpenAuth('login');
    } else {
      onLaunchApp(view);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--fema-bg)',
        color: 'var(--fema-text-primary)',
        fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
      }}
    >
      {/* ==================================================================== */}
      {/* 1. TOP NAVIGATION BAR                                               */}
      {/* ==================================================================== */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          backgroundColor: isDark ? 'rgba(9, 13, 22, 0.85)' : 'rgba(237, 242, 247, 0.88)',
          borderBottom: '1px solid var(--fema-border)',
          padding: '0 32px',
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand */}
        <div
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            window.history.pushState(null, '', '/');
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '11px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '16px',
              color: '#ffffff',
              boxShadow: '0 6px 20px rgba(79, 70, 229, 0.35)',
            }}
          >
            FE
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.02em', color: 'var(--fema-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              FEMA
              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontWeight: 700, border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                ENTERPRISE
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--fema-text-secondary)', fontWeight: 500 }}>
              Finance Exception Management Agent
            </div>
          </div>
        </div>

        {/* Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <a href="#roles" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--fema-text-secondary)', textDecoration: 'none' }}>
            Roles & Personas
          </a>
          <a href="#simulator" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--fema-text-secondary)', textDecoration: 'none' }}>
            Live Simulator
          </a>
          <a href="#pipeline" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--fema-text-secondary)', textDecoration: 'none' }}>
            Agentic Pipeline
          </a>
          <a href="#governance" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--fema-text-secondary)', textDecoration: 'none' }}>
            SOX 404 & HITL
          </a>
        </nav>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              border: '1px solid var(--fema-border)',
              backgroundColor: 'var(--fema-surface-subtle)',
              color: 'var(--fema-text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '15px',
            }}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            )}
          </button>

          {user ? (
            <button
              onClick={() => onLaunchApp('dashboard')}
              style={{
                padding: '9px 20px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(79, 70, 229, 0.35)',
              }}
            >
              Open Console ({user.username}) →
            </button>
          ) : (
            <>
              <button
                onClick={() => onOpenAuth ? onOpenAuth('login') : handleLaunch('dashboard')}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  border: '1px solid var(--fema-border)',
                  backgroundColor: 'var(--fema-surface-subtle)',
                  color: 'var(--fema-text-primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth ? onOpenAuth('register') : handleLaunch('dashboard')}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(79, 70, 229, 0.35)',
                }}
              >
                Get Started →
              </button>
            </>
          )}
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. HERO SECTION                                                     */}
      {/* ==================================================================== */}
      <section
        style={{
          padding: '90px 32px 60px',
          maxWidth: '1280px',
          margin: '0 auto',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '20px',
            background: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#818cf8',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: '28px',
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          Enterprise Financial Intelligence &amp; Anomaly Governance
        </div>

        <h1
          style={{
            fontSize: 'clamp(36px, 6vw, 68px)',
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            maxWidth: '1000px',
            margin: '0 0 24px',
            color: 'var(--fema-text-primary)',
          }}
        >
          Autonomous Financial{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Exception Management
          </span>
        </h1>

        <p
          style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            lineHeight: 1.6,
            color: 'var(--fema-text-secondary)',
            maxWidth: '740px',
            margin: '0 0 40px',
          }}
        >
          Detect general ledger deviations, auto-reconcile recurring variances, generate multi-factor AI root causes, and enforce regulatory SLA compliance across all 4 financial roles.
        </p>

        {/* Hero CTAs */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginBottom: '40px',
          }}
        >
          <button
            onClick={() => onOpenAuth ? onOpenAuth('login') : handleLaunch('dashboard')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 28px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 10px 28px rgba(99, 102, 241, 0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
          >
            <span>Launch FEMA Platform</span>
            <span>→</span>
          </button>

          <a
            href="#simulator"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 26px',
              borderRadius: '12px',
              border: '1px solid var(--fema-border)',
              backgroundColor: 'var(--fema-surface)',
              color: 'var(--fema-text-primary)',
              fontSize: '15px',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: 'var(--fema-card-shadow)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <span>Interactive Simulator</span>
          </a>

          <button
            onClick={() => handleLaunch('chat')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 26px',
              borderRadius: '12px',
              border: '1px solid var(--fema-border)',
              backgroundColor: 'var(--fema-surface)',
              color: 'var(--fema-text-primary)',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'var(--fema-card-shadow)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>RAG Financial AI</span>
          </button>
        </div>

        {/* Quick Role Demos Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            padding: '10px 18px',
            borderRadius: '14px',
            background: 'var(--fema-surface-subtle)',
            border: '1px solid var(--fema-border)',
            fontSize: '12px',
            marginBottom: '50px',
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--fema-text-secondary)' }}>Instant Role Demos:</span>
          <button
            onClick={() => onOpenAuth ? onOpenAuth('login') : handleLaunch('dashboard')}
            style={{ border: 'none', background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
          >
            Admin (Role 0)
          </button>
          <button
            onClick={() => onOpenAuth ? onOpenAuth('login') : handleLaunch('dashboard')}
            style={{ border: 'none', background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
          >
            Analyst (Role 1)
          </button>
          <button
            onClick={() => onOpenAuth ? onOpenAuth('login') : handleLaunch('dashboard')}
            style={{ border: 'none', background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
          >
            CFO (Role 2)
          </button>
          <button
            onClick={() => onOpenAuth ? onOpenAuth('login') : handleLaunch('dashboard')}
            style={{ border: 'none', background: 'rgba(217, 119, 6, 0.12)', color: '#fbbf24', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
          >
            Auditor (Role 3)
          </button>
        </div>

        {/* ================================================================== */}
        {/* HERO LIVE RADAR / TELEMETRY TERMINAL MOCKUP                        */}
        {/* ================================================================== */}
        <div
          style={{
            width: '100%',
            maxWidth: '1080px',
            background: isDark ? 'rgba(15, 23, 42, 0.75)' : '#ffffff',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
            borderRadius: '20px',
            boxShadow: isDark
              ? '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(79, 70, 229, 0.15)'
              : '0 20px 40px -10px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            textAlign: 'left',
          }}
        >
          {/* Mockup Header bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 22px',
              background: isDark ? 'rgba(30, 41, 59, 0.6)' : '#f1f5f9',
              borderBottom: '1px solid var(--fema-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }} />
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ marginLeft: '12px', fontSize: '12px', fontFamily: 'monospace', color: 'var(--fema-text-muted)' }}>
                fema-core-telemetry // stream: ERP-LIVE-01
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>
                MONITORING ACTIVE
              </span>
            </div>
          </div>

          {/* Mockup Body Content */}
          <div style={{ padding: '24px 28px' }}>
            {/* Live Case Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
                padding: '16px 20px',
                borderRadius: '12px',
                background: isDark ? 'rgba(244, 63, 94, 0.1)' : 'rgba(244, 63, 94, 0.06)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', background: 'rgba(244, 63, 94, 0.15)', borderRadius: '10px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#f43f5e' }}>CASE #104: CRITICAL VARIANCE DETECTED</span>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: '#f43f5e', color: '#fff', fontWeight: 700 }}>
                      +50.0% DEVIATION
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--fema-text-secondary)', marginTop: '4px' }}>
                    Ledger: <strong>Cloud Infrastructure</strong> (DevOps Cost Center) • Period: <strong>2026-09</strong>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--fema-text-muted)' }}>SLA COUNTDOWN</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#fbbf24', fontFamily: 'monospace' }}>
                  23h 42m remaining
                </div>
              </div>
            </div>

            {/* Budget vs Actual Comparison Visual */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '22px' }}>
              <div style={{ padding: '14px 18px', background: 'var(--fema-surface-subtle)', borderRadius: '10px', border: '1px solid var(--fema-border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--fema-text-secondary)' }}>Budget Quota</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--fema-text-primary)', marginTop: '2px' }}>$300,000</div>
              </div>
              <div style={{ padding: '14px 18px', background: 'var(--fema-surface-subtle)', borderRadius: '10px', border: '1px solid var(--fema-border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--fema-text-secondary)' }}>Actual Spend (ERP Ingestion)</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#f43f5e', marginTop: '2px' }}>$450,000</div>
              </div>
              <div style={{ padding: '14px 18px', background: 'var(--fema-surface-subtle)', borderRadius: '10px', border: '1px solid var(--fema-border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--fema-text-secondary)' }}>Accountable Owner</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--fema-text-primary)', marginTop: '4px' }}>DevOps Engineering Lead</div>
              </div>
              <div style={{ padding: '14px 18px', background: 'var(--fema-surface-subtle)', borderRadius: '10px', border: '1px solid var(--fema-border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--fema-text-secondary)' }}>Assigned Tier</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#818cf8', marginTop: '4px' }}>Tier 1 / Auto-Escalate at 12h</div>
              </div>
            </div>

            {/* AI Agent Root Cause Analysis Pipeline */}
            <div
              style={{
                padding: '14px 18px',
                borderRadius: '10px',
                background: isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.05)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                fontSize: '12px',
                color: 'var(--fema-text-secondary)',
                lineHeight: 1.6,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}
            >
              <div style={{ color: '#818cf8', marginTop: '2px', flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
              </div>
              <div>
                <strong>Autonomous AI Root-Cause Hypothesis:</strong> Deviation primarily driven by unreserved compute clusters spinning up during continuous integration load testing in US-East region. Vendor contract review recommended before end-of-month reconciliation.
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Ribbon */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            width: '100%',
            maxWidth: '1080px',
            marginTop: '32px',
          }}
        >
          <div style={{ backgroundColor: 'var(--fema-surface)', border: '1px solid var(--fema-border)', borderRadius: '16px', padding: '22px', textAlign: 'left', boxShadow: 'var(--fema-card-shadow)' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#06b6d4', marginBottom: '4px' }}>100%</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--fema-text-primary)' }}>Autonomous Anomaly Audit</div>
            <div style={{ fontSize: '11px', color: 'var(--fema-text-muted)', marginTop: '4px' }}>Continuous variance verification vs spreadsheets</div>
          </div>

          <div style={{ backgroundColor: 'var(--fema-surface)', border: '1px solid var(--fema-border)', borderRadius: '16px', padding: '22px', textAlign: 'left', boxShadow: 'var(--fema-card-shadow)' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981', marginBottom: '4px' }}>&lt; 24h</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--fema-text-primary)' }}>Critical Exception SLA</div>
            <div style={{ fontSize: '11px', color: 'var(--fema-text-muted)', marginTop: '4px' }}>Tiered escalation ladder to CFO</div>
          </div>

          <div style={{ backgroundColor: 'var(--fema-surface)', border: '1px solid var(--fema-border)', borderRadius: '16px', padding: '22px', textAlign: 'left', boxShadow: 'var(--fema-card-shadow)' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#818cf8', marginBottom: '4px' }}>SOX 404</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--fema-text-primary)' }}>Human-in-the-Loop Certified</div>
            <div style={{ fontSize: '11px', color: 'var(--fema-text-muted)', marginTop: '4px' }}>Mandatory dual sign-off on material risks</div>
          </div>

          <div style={{ backgroundColor: 'var(--fema-surface)', border: '1px solid var(--fema-border)', borderRadius: '16px', padding: '22px', textAlign: 'left', boxShadow: 'var(--fema-card-shadow)' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b', marginBottom: '4px' }}>ChromaDB RAG</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--fema-text-primary)' }}>Zero-Hallucination AI</div>
            <div style={{ fontSize: '11px', color: 'var(--fema-text-muted)', marginTop: '4px' }}>Direct vector retrieval on active ledgers</div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. INTERACTIVE ANOMALY SIMULATOR                                     */}
      {/* ==================================================================== */}
      <section
        id="simulator"
        style={{
          padding: '80px 32px',
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 40px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', color: '#6366f1', textTransform: 'uppercase', marginBottom: '8px' }}>
            Interactive Demo Lab
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--fema-text-primary)', letterSpacing: '-0.01em', marginBottom: '12px' }}>
            Experience the Agentic Exception Engine
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--fema-text-secondary)', lineHeight: 1.5 }}>
            Adjust budget and actual figures below or choose a scenario to observe how FEMA autonomously classifies severity, calculates SLA countdowns, and routes to accountable owners.
          </p>
        </div>

        <div
          style={{
            backgroundColor: 'var(--fema-surface)',
            border: '1px solid var(--fema-border)',
            borderRadius: '24px',
            padding: '36px',
            boxShadow: 'var(--fema-card-shadow)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '36px',
          }}
        >
          {/* Controls Column */}
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Select Simulation Scenario</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <button
                onClick={() => applyScenarioPreset('cloud')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: simulatorScenario === 'cloud' ? '1px solid #6366f1' : '1px solid var(--fema-border)',
                  background: simulatorScenario === 'cloud' ? 'rgba(99, 102, 241, 0.15)' : 'var(--fema-surface-subtle)',
                  color: simulatorScenario === 'cloud' ? '#818cf8' : 'var(--fema-text-secondary)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                ☁️ Cloud Infra (+50%)
              </button>
              <button
                onClick={() => applyScenarioPreset('sales')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: simulatorScenario === 'sales' ? '1px solid #6366f1' : '1px solid var(--fema-border)',
                  background: simulatorScenario === 'sales' ? 'rgba(99, 102, 241, 0.15)' : 'var(--fema-surface-subtle)',
                  color: simulatorScenario === 'sales' ? '#818cf8' : 'var(--fema-text-secondary)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                📉 Enterprise Sales (-40%)
              </button>
              <button
                onClick={() => applyScenarioPreset('payroll')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: simulatorScenario === 'payroll' ? '1px solid #6366f1' : '1px solid var(--fema-border)',
                  background: simulatorScenario === 'payroll' ? 'rgba(99, 102, 241, 0.15)' : 'var(--fema-surface-subtle)',
                  color: simulatorScenario === 'payroll' ? '#818cf8' : 'var(--fema-text-secondary)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                👥 Talent Acq (+26%)
              </button>
            </div>

            {/* Sliders */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                <span>Budget Quota</span>
                <span style={{ color: '#6366f1', fontFamily: 'monospace' }}>${simBudget.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="50000"
                max="2000000"
                step="25000"
                value={simBudget}
                onChange={(e) => setSimBudget(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer', accentColor: '#6366f1' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                <span>Actual Spend / Inflow</span>
                <span style={{ color: simActual > simBudget ? '#f43f5e' : '#10b981', fontFamily: 'monospace' }}>
                  ${simActual.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="50000"
                max="2000000"
                step="25000"
                value={simActual}
                onChange={(e) => setSimActual(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer', accentColor: simActual > simBudget ? '#f43f5e' : '#10b981' }}
              />
            </div>

            <div style={{ padding: '14px', background: 'var(--fema-surface-subtle)', borderRadius: '12px', border: '1px solid var(--fema-border)', fontSize: '12px', color: 'var(--fema-text-secondary)' }}>
              💡 <em>Threshold calibration:</em> Values are checked against active thresholds in <code>ai_thresholds</code> (CRITICAL &ge; 30%, HIGH &ge; 15%, MEDIUM &ge; 5%).
            </div>
          </div>

          {/* Real-time Evaluation Card */}
          <div
            style={{
              padding: '24px',
              borderRadius: '16px',
              background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#f8fafc',
              border: '1px solid var(--fema-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--fema-text-secondary)' }}>
                FEMA REAL-TIME EVALUATION
              </span>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 800,
                  background:
                    simOutputs.severity === 'CRITICAL'
                      ? 'rgba(244, 63, 94, 0.15)'
                      : simOutputs.severity === 'HIGH'
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'rgba(16, 185, 129, 0.15)',
                  color:
                    simOutputs.severity === 'CRITICAL'
                      ? '#f43f5e'
                      : simOutputs.severity === 'HIGH'
                      ? '#f59e0b'
                      : '#10b981',
                }}
              >
                {simOutputs.severity} SEVERITY
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', background: 'var(--fema-surface)', borderRadius: '10px', border: '1px solid var(--fema-border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--fema-text-muted)' }}>Computed Variance</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: simOutputs.variance > 0 ? '#f43f5e' : '#10b981' }}>
                  {simOutputs.variance > 0 ? `+${simOutputs.variance}%` : `${simOutputs.variance}%`}
                </div>
              </div>

              <div style={{ padding: '12px', background: 'var(--fema-surface)', borderRadius: '10px', border: '1px solid var(--fema-border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--fema-text-muted)' }}>Resolution SLA</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#fbbf24' }}>
                  {simOutputs.sla}
                </div>
              </div>
            </div>

            <div style={{ padding: '12px', background: 'var(--fema-surface)', borderRadius: '10px', border: '1px solid var(--fema-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--fema-text-muted)' }}>Designated Accountable Owner</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--fema-text-primary)', marginTop: '2px' }}>
                {simOutputs.owner}
              </div>
            </div>

            <div style={{ padding: '12px', background: 'var(--fema-surface)', borderRadius: '10px', border: '1px solid var(--fema-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--fema-text-muted)' }}>Root-Cause Reasoning Diagnostic</div>
              <div style={{ fontSize: '12px', color: 'var(--fema-text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                {simOutputs.hypothesis}
              </div>
            </div>

            <button
              onClick={() => handleLaunch('dashboard')}
              style={{
                marginTop: 'auto',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Test in Production Console →
            </button>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. THE 4 ENTERPRISE PERSONAS (ROLES)                                */}
      {/* ==================================================================== */}
      <section
        id="roles"
        style={{
          padding: '80px 32px',
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 40px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', color: '#6366f1', textTransform: 'uppercase', marginBottom: '8px' }}>
            Multi-Tier Architecture
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--fema-text-primary)', letterSpacing: '-0.01em', marginBottom: '12px' }}>
            Tailored Experiences for Every Finance Persona
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--fema-text-secondary)', lineHeight: 1.5 }}>
            From operational triage analysts to boardroom executives, FEMA provides strict role-based dashboards with clear separation of duties.
          </p>
        </div>

        {/* Persona Tabs */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '32px',
          }}
        >
          <button
            onClick={() => setActivePersona('cfo')}
            style={{
              padding: '12px 22px',
              borderRadius: '12px',
              border: activePersona === 'cfo' ? '1px solid #a855f7' : '1px solid var(--fema-border)',
              background: activePersona === 'cfo' ? 'rgba(168, 85, 247, 0.15)' : 'var(--fema-surface)',
              color: activePersona === 'cfo' ? '#c084fc' : 'var(--fema-text-primary)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            💼 Role 2: CFO &amp; Executive
          </button>

          <button
            onClick={() => setActivePersona('analyst')}
            style={{
              padding: '12px 22px',
              borderRadius: '12px',
              border: activePersona === 'analyst' ? '1px solid #3b82f6' : '1px solid var(--fema-border)',
              background: activePersona === 'analyst' ? 'rgba(59, 130, 246, 0.15)' : 'var(--fema-surface)',
              color: activePersona === 'analyst' ? '#60a5fa' : 'var(--fema-text-primary)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            🔍 Role 1: Finance Analyst
          </button>

          <button
            onClick={() => setActivePersona('auditor')}
            style={{
              padding: '12px 22px',
              borderRadius: '12px',
              border: activePersona === 'auditor' ? '1px solid #f59e0b' : '1px solid var(--fema-border)',
              background: activePersona === 'auditor' ? 'rgba(245, 158, 11, 0.15)' : 'var(--fema-surface)',
              color: activePersona === 'auditor' ? '#fbbf24' : 'var(--fema-text-primary)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            ⚖️ Role 3: Auditor &amp; Compliance
          </button>

          <button
            onClick={() => setActivePersona('admin')}
            style={{
              padding: '12px 22px',
              borderRadius: '12px',
              border: activePersona === 'admin' ? '1px solid #6366f1' : '1px solid var(--fema-border)',
              background: activePersona === 'admin' ? 'rgba(99, 102, 241, 0.15)' : 'var(--fema-surface)',
              color: activePersona === 'admin' ? '#818cf8' : 'var(--fema-text-primary)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            ⚙️ Role 0: System Administrator
          </button>
        </div>

        {/* Persona Details Card */}
        <div
          style={{
            backgroundColor: 'var(--fema-surface)',
            border: '1px solid var(--fema-border)',
            borderRadius: '20px',
            padding: '36px',
            boxShadow: 'var(--fema-card-shadow)',
          }}
        >
          {activePersona === 'cfo' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#a855f7', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  ROLE 2: EXECUTIVE FINANCE LEADERSHIP
                </div>
                <h3 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '14px' }}>
                  Strategic Liquidity, Covenant Early Warnings &amp; Sign-offs
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--fema-text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                  The CFO dashboard delivers executive-tier macro financial indicators, predictive covenant alerts, escalated material risks awaiting sign-off, and automated daily AI briefings.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span style={{ color: '#10b981' }}>✓</span> <strong>Automated AI Executive Briefing:</strong> Synthesizes 7-day financial exposure into board-ready memos.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span style={{ color: '#10b981' }}>✓</span> <strong>Covenant Telemetry:</strong> High-quality liquid assets vs 30-day outflows with early triggers.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span style={{ color: '#10b981' }}>✓</span> <strong>Material Risk Override:</strong> Formal sign-off on exceptions exceeding $50,000 threshold.
                  </li>
                </ul>
                <button
                  onClick={() => onOpenAuth ? onOpenAuth('login') : handleLaunch('dashboard')}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Enter CFO Console (cfo / cfo123) →
                </button>
              </div>

              <div style={{ padding: '24px', background: 'var(--fema-surface-subtle)', borderRadius: '16px', border: '1px solid var(--fema-border)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--fema-text-muted)', marginBottom: '14px' }}>
                  LIVE CFO METRIC SNAPSHOT
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ padding: '12px', background: 'var(--fema-surface)', borderRadius: '10px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--fema-text-muted)' }}>Operating Cash Flow</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981' }}>$12.85M</div>
                    <div style={{ fontSize: '10px', color: '#10b981' }}>+8.4% YoY Safe</div>
                  </div>
                  <div style={{ padding: '12px', background: 'var(--fema-surface)', borderRadius: '10px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--fema-text-muted)' }}>Liquidity Ratio</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#6366f1' }}>2.35x</div>
                    <div style={{ fontSize: '10px', color: '#6366f1' }}>Target &ge; 1.50x</div>
                  </div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '10px', border: '1px solid rgba(168, 85, 247, 0.25)', fontSize: '11px', color: '#a855f7' }}>
                  ⚡ <strong>AI Daily Briefing:</strong> "Zero covenant violations. 1 material exception in Cloud Infra escalated for executive override authorization."
                </div>
              </div>
            </div>
          )}

          {activePersona === 'analyst' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  ROLE 1: FINANCE ANALYST &amp; OPERATIONS
                </div>
                <h3 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '14px' }}>
                  Work Queue Triage, AI RCA &amp; Single-Click Escalations
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--fema-text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                  Analysts handle the operational day-to-day exception queue, reviewing AI-generated root cause hypotheses, entering justifications, and escalating when SLA bounds are challenged.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span style={{ color: '#10b981' }}>✓</span> <strong>Root-Cause Analysis (RCA):</strong> Instant multi-dimensional hypothesis generation per ledger entry.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span style={{ color: '#10b981' }}>✓</span> <strong>SLA Countdown Engine:</strong> Real-time visual timers preventing compliance breaches.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span style={{ color: '#10b981' }}>✓</span> <strong>Resolution &amp; Escalation:</strong> Seamless transition to higher-tier managers or CFO review.
                  </li>
                </ul>
                <button
                  onClick={() => onOpenAuth ? onOpenAuth('login') : handleLaunch('dashboard')}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Enter Analyst Console (analyst / analyst123) →
                </button>
              </div>

              <div style={{ padding: '24px', background: 'var(--fema-surface-subtle)', borderRadius: '16px', border: '1px solid var(--fema-border)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--fema-text-muted)', marginBottom: '14px' }}>
                  ANALYST ACTIVE WORK QUEUE
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ padding: '12px', background: 'var(--fema-surface)', borderRadius: '10px', border: '1px solid var(--fema-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>Case #104 • Cloud Infra</div>
                      <div style={{ fontSize: '11px', color: 'var(--fema-text-muted)' }}>Variance: +50.0% ($150,000)</div>
                    </div>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', fontWeight: 700 }}>
                      CRITICAL
                    </span>
                  </div>
                  <div style={{ padding: '12px', background: 'var(--fema-surface)', borderRadius: '10px', border: '1px solid var(--fema-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>Case #102 • Enterprise Sales</div>
                      <div style={{ fontSize: '11px', color: 'var(--fema-text-muted)' }}>Variance: -40.0% ($480,000)</div>
                    </div>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', fontWeight: 700 }}>
                      CRITICAL
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePersona === 'auditor' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  ROLE 3: AUDIT &amp; COMPLIANCE GOVERNANCE
                </div>
                <h3 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '14px' }}>
                  Cryptographic Audit Trail, SOX 404 &amp; Multi-Format Export
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--fema-text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                  Provides complete transparency for internal and external auditors. Every action, transition, node IP, and explanation is immutably logged with SHA-256 hash chains.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span style={{ color: '#10b981' }}>✓</span> <strong>Cryptographic Audit Trail:</strong> Immutable SHA-256 timeline of all exception resolutions.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span style={{ color: '#10b981' }}>✓</span> <strong>Human-in-the-Loop Ratios:</strong> SOX 404 certification proving humans authorize changes.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span style={{ color: '#10b981' }}>✓</span> <strong>Multi-Format Export:</strong> Instant CSV and JSON audit package generation.
                  </li>
                </ul>
                <button
                  onClick={() => onOpenAuth ? onOpenAuth('login') : handleLaunch('dashboard')}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Enter Auditor Console (auditor / auditor123) →
                </button>
              </div>

              <div style={{ padding: '24px', background: 'var(--fema-surface-subtle)', borderRadius: '16px', border: '1px solid var(--fema-border)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--fema-text-muted)', marginBottom: '14px' }}>
                  SOX 404 GOVERNANCE CERTIFICATION
                </div>
                <div style={{ padding: '14px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.25)', marginBottom: '14px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#10b981' }}>● STATUS: CERTIFIED PASS</div>
                  <div style={{ fontSize: '11px', color: 'var(--fema-text-secondary)', marginTop: '4px' }}>
                    Human Oversight Ratio: <strong>75.0%</strong> (Mandatory threshold &ge; 60%)
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--fema-text-muted)', fontFamily: 'monospace' }}>
                  Cryptographic Proof: SHA256 e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                </div>
              </div>
            </div>
          )}

          {activePersona === 'admin' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#6366f1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  ROLE 0: SYSTEM ADMINISTRATOR
                </div>
                <h3 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '14px' }}>
                  Dynamic AI Threshold Calibration &amp; System Health
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--fema-text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                  Administrators calibrate dynamic exception sensitivity rules across categories in real time, monitor microservice API health, manage user accounts, and review node logs.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span style={{ color: '#10b981' }}>✓</span> <strong>Dynamic Thresholds:</strong> Calibrate variance limits per category with immediate live propagation.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span style={{ color: '#10b981' }}>✓</span> <strong>System Health Telemetry:</strong> Database connection, memory allocation, and API uptime.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span style={{ color: '#10b981' }}>✓</span> <strong>Access Management:</strong> Provision and revoke user privileges across the 4 security roles.
                  </li>
                </ul>
                <button
                  onClick={() => onOpenAuth ? onOpenAuth('login') : handleLaunch('dashboard')}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Enter Admin Console (admin / admin123) →
                </button>
              </div>

              <div style={{ padding: '24px', background: 'var(--fema-surface-subtle)', borderRadius: '16px', border: '1px solid var(--fema-border)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--fema-text-muted)', marginBottom: '14px' }}>
                  ACTIVE THRESHOLD MATRIX (ai_thresholds)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ padding: '10px', background: 'var(--fema-surface)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span>Cloud Infrastructure</span>
                    <strong style={{ color: '#f43f5e' }}>Critical &gt; 30%</strong>
                  </div>
                  <div style={{ padding: '10px', background: 'var(--fema-surface)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span>Revenue (Inflows)</span>
                    <strong style={{ color: '#f43f5e' }}>Critical &gt; 35%</strong>
                  </div>
                  <div style={{ padding: '10px', background: 'var(--fema-surface)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span>Operating Expense</span>
                    <strong style={{ color: '#f59e0b' }}>High &gt; 15%</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 5. AGENTIC PIPELINE WORKFLOW                                         */}
      {/* ==================================================================== */}
      <section
        id="pipeline"
        style={{
          padding: '80px 32px',
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 50px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', color: '#6366f1', textTransform: 'uppercase', marginBottom: '8px' }}>
            System Architecture
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--fema-text-primary)', letterSpacing: '-0.01em', marginBottom: '12px' }}>
            Autonomous Multi-Agent Workflow
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--fema-text-secondary)', lineHeight: 1.5 }}>
            How FEMA executes from raw ERP ledger entries to board-level risk remediation.
          </p>
        </div>

        <div
          style={{
            backgroundColor: 'var(--fema-surface-subtle)',
            border: '1px solid var(--fema-border)',
            borderRadius: '24px',
            padding: '36px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '18px',
          }}
        >
          <div style={{ backgroundColor: 'var(--fema-surface)', border: '1px solid var(--fema-border)', borderRadius: '14px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#6366f1', letterSpacing: '0.05em' }}>STEP 01</span>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>Data Ingestion</div>
            <div style={{ fontSize: '13px', color: 'var(--fema-text-secondary)', lineHeight: 1.5 }}>
              MySQL ACID Stored Procedures ingest Budget vs Actual ledger items across cost centers.
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--fema-surface)', border: '1px solid var(--fema-border)', borderRadius: '14px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#6366f1', letterSpacing: '0.05em' }}>STEP 02</span>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>Variance Audit</div>
            <div style={{ fontSize: '13px', color: 'var(--fema-text-secondary)', lineHeight: 1.5 }}>
              Mathematical verification scans non-linear deviations against dynamic <code>ai_thresholds</code>.
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--fema-surface)', border: '1px solid var(--fema-border)', borderRadius: '14px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#6366f1', letterSpacing: '0.05em' }}>STEP 03</span>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>AI Diagnostics</div>
            <div style={{ fontSize: '13px', color: 'var(--fema-text-secondary)', lineHeight: 1.5 }}>
              Universal heuristic and LLM diagnostic engine synthesizes root-cause reasoning.
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--fema-surface)', border: '1px solid var(--fema-border)', borderRadius: '14px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#6366f1', letterSpacing: '0.05em' }}>STEP 04</span>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>Owner Routing</div>
            <div style={{ fontSize: '13px', color: 'var(--fema-text-secondary)', lineHeight: 1.5 }}>
              Assigns case to designated department owner with live SLA deadline countdowns.
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--fema-surface)', border: '1px solid var(--fema-border)', borderRadius: '14px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#6366f1', letterSpacing: '0.05em' }}>STEP 05</span>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>CFO Escalation</div>
            <div style={{ fontSize: '13px', color: 'var(--fema-text-secondary)', lineHeight: 1.5 }}>
              Unresolved breaches automatically escalate directly to the CFO and immutable audit ledger.
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 6. GOVERNANCE, SOX 404 & SECURITY                                    */}
      {/* ==================================================================== */}
      <section
        id="governance"
        style={{
          padding: '80px 32px',
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 50px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', color: '#10b981', textTransform: 'uppercase', marginBottom: '8px' }}>
            Statutory Assurance
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--fema-text-primary)', letterSpacing: '-0.01em', marginBottom: '12px' }}>
            Enterprise Governance &amp; Regulatory Integrity
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--fema-text-secondary)', lineHeight: 1.5 }}>
            Engineered to exceed Sarbanes-Oxley (SOX 404) oversight and ISO 27001 cybersecurity frameworks.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          <div style={{ backgroundColor: 'var(--fema-surface)', border: '1px solid var(--fema-border)', borderRadius: '16px', padding: '26px', boxShadow: 'var(--fema-card-shadow)' }}>
            <div style={{ fontSize: '28px', marginBottom: '14px' }}>⚖️</div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>Sarbanes-Oxley (SOX 404)</h3>
            <p style={{ fontSize: '13px', color: 'var(--fema-text-secondary)', lineHeight: 1.6 }}>
              Enforces mandatory dual human reviewer sign-off on any ledger change exceeding threshold, preserving internal financial controls.
            </p>
          </div>

          <div style={{ backgroundColor: 'var(--fema-surface)', border: '1px solid var(--fema-border)', borderRadius: '16px', padding: '26px', boxShadow: 'var(--fema-card-shadow)' }}>
            <div style={{ fontSize: '28px', marginBottom: '14px' }}>📜</div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>Cryptographic Audit Trail</h3>
            <p style={{ fontSize: '13px', color: 'var(--fema-text-secondary)', lineHeight: 1.6 }}>
              Every status transition, timestamp, user action, and explanation is secured in an immutable event ledger with node IP attribution.
            </p>
          </div>

          <div style={{ backgroundColor: 'var(--fema-surface)', border: '1px solid var(--fema-border)', borderRadius: '16px', padding: '26px', boxShadow: 'var(--fema-card-shadow)' }}>
            <div style={{ fontSize: '28px', marginBottom: '14px' }}>🤖</div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>Zero-Hallucination RAG</h3>
            <p style={{ fontSize: '13px', color: 'var(--fema-text-secondary)', lineHeight: 1.6 }}>
              ChromaDB vector embeddings ensure financial queries are strictly grounded in active verified ledger data with verifiable citations.
            </p>
          </div>

          <div style={{ backgroundColor: 'var(--fema-surface)', border: '1px solid var(--fema-border)', borderRadius: '16px', padding: '26px', boxShadow: 'var(--fema-card-shadow)' }}>
            <div style={{ fontSize: '28px', marginBottom: '14px' }}>🛡️</div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>Role-Based Access (RBAC)</h3>
            <p style={{ fontSize: '13px', color: 'var(--fema-text-secondary)', lineHeight: 1.6 }}>
              Granular separation of duties across 4 distinct security tiers: System Administrator, Finance Analyst, CFO, and Auditor.
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 7. CALL TO ACTION BANNER                                             */}
      {/* ==================================================================== */}
      <section style={{ padding: '0 32px 80px', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
        <div
          style={{
            background: isDark
              ? 'linear-gradient(135deg, #312e81 0%, #1e1b4b 50%, #0f172a 100%)'
              : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: '24px',
            padding: '60px 40px',
            textAlign: 'center',
            color: '#ffffff',
            border: isDark ? '1px solid #4338ca' : '1px solid #1e293b',
            boxShadow: '0 20px 50px -15px rgba(79, 70, 229, 0.4)',
          }}
        >
          <h2 style={{ fontSize: '34px', fontWeight: 800, marginBottom: '16px' }}>
            Ready to Safeguard Your Financial Governance?
          </h2>
          <p style={{ fontSize: '16px', opacity: 0.9, maxWidth: '640px', margin: '0 auto 32px', lineHeight: 1.6 }}>
            Experience real-time anomaly detection, multi-agent exception resolution, and continuous financial compliance across all cost centers.
          </p>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '32px' }}>
            <button
              onClick={() => handleLaunch('dashboard')}
              style={{
                padding: '14px 32px',
                borderRadius: '12px',
                border: 'none',
                background: '#ffffff',
                color: '#1e1b4b',
                fontWeight: 800,
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(255, 255, 255, 0.25)',
              }}
            >
              Launch Live Console Now →
            </button>
            <button
              onClick={() => onOpenAuth ? onOpenAuth('login') : handleLaunch('dashboard')}
              style={{
                padding: '14px 28px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                background: 'transparent',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              Sign In With Role Credentials
            </button>
          </div>

          {/* Quick Demo Credentials Guide */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
              justifyContent: 'center',
              padding: '10px 20px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              fontSize: '12px',
              fontFamily: 'monospace',
            }}
          >
            <span>Admin: <code>admin / admin123</code></span>
            <span>•</span>
            <span>Analyst: <code>analyst / analyst123</code></span>
            <span>•</span>
            <span>CFO: <code>cfo / cfo123</code></span>
            <span>•</span>
            <span>Auditor: <code>auditor / auditor123</code></span>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 8. FOOTER SECTION                                                   */}
      {/* ==================================================================== */}
      <footer
        style={{
          backgroundColor: 'var(--fema-surface)',
          borderTop: '1px solid var(--fema-border)',
          padding: '60px 32px 30px',
          marginTop: 'auto',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '40px',
            marginBottom: '40px',
          }}
        >
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '14px',
                  color: '#ffffff',
                }}
              >
                FE
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--fema-text-primary)' }}>FEMA</div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--fema-text-secondary)', lineHeight: 1.6, maxWidth: '340px' }}>
              An enterprise agentic AI solution engineered by <strong>Aiinhome Technologies</strong> for automated variance auditing, SLA tracking, and CFO governance.
            </p>
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '16px' }}>
              Platform
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--fema-text-secondary)' }}>
              <span style={{ cursor: 'pointer' }} onClick={() => handleLaunch('dashboard')}>Executive Dashboard</span>
              <span style={{ cursor: 'pointer' }} onClick={() => handleLaunch('records')}>Financial Records</span>
              <span style={{ cursor: 'pointer' }} onClick={() => handleLaunch('exceptions')}>Exception Management</span>
              <span style={{ cursor: 'pointer' }} onClick={() => handleLaunch('chat')}>ChromaDB RAG Assistant</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '16px' }}>
              Personas
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--fema-text-secondary)' }}>
              <span style={{ cursor: 'pointer' }} onClick={() => setActivePersona('admin')}>System Administrator (0)</span>
              <span style={{ cursor: 'pointer' }} onClick={() => setActivePersona('analyst')}>Finance Analyst (1)</span>
              <span style={{ cursor: 'pointer' }} onClick={() => setActivePersona('cfo')}>CFO &amp; Executive (2)</span>
              <span style={{ cursor: 'pointer' }} onClick={() => setActivePersona('auditor')}>Auditor &amp; Compliance (3)</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '16px' }}>
              Compliance &amp; Legal
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--fema-text-secondary)' }}>
              <span>Sarbanes-Oxley (SOX 404)</span>
              <span>ISO 27001 AI Standards</span>
              <span>ACID Stored Procedures</span>
              <span>Privacy &amp; Security Policy</span>
            </div>
          </div>
        </div>

        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            paddingTop: '24px',
            borderTop: '1px solid var(--fema-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            fontSize: '12px',
            color: 'var(--fema-text-muted)',
          }}
        >
          <div>© {new Date().getFullYear()} Aiinhome Technologies. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>Status: <strong style={{ color: '#10b981' }}>🟢 Systems Operational</strong></span>
            <span>API Version: <strong>v1.0.0</strong></span>
          </div>
        </div>
      </footer>

      {/* Feature Preview Modal */}
      {featurePreview && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '16px',
          }}
          onClick={() => setFeaturePreview(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--fema-surface)',
              border: '1px solid var(--fema-border-highlight)',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '520px',
              padding: '32px',
              boxShadow: 'var(--fema-card-shadow-hover)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>{featurePreview.icon}</span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {featurePreview.tag}
                </span>
              </div>
              <button
                onClick={() => setFeaturePreview(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: 'var(--fema-text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px' }}>{featurePreview.title}</h3>
            <p style={{ fontSize: '14px', color: 'var(--fema-text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
              {featurePreview.description}
            </p>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--fema-text-primary)', marginBottom: '8px' }}>
                Key Technical Highlights:
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {featurePreview.highlights.map((h, i) => (
                  <li key={i} style={{ fontSize: '13px', color: 'var(--fema-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#10b981' }}>✓</span> {h}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  const target = featurePreview.targetView;
                  setFeaturePreview(null);
                  handleLaunch(target);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Launch This Module →
              </button>
              <button
                onClick={() => setFeaturePreview(null)}
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: '1px solid var(--fema-border)',
                  background: 'var(--fema-surface-subtle)',
                  color: 'var(--fema-text-primary)',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
