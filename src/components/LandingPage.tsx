import React, { useState } from 'react';

interface LandingPageProps {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  onLaunchApp: (view?: 'dashboard' | 'records' | 'exceptions' | 'chat') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ theme, setTheme, onLaunchApp }) => {
  const isDark = theme === 'dark';
  const [authModal, setAuthModal] = useState<'login' | 'signup' | null>(null);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', role: 'Finance Executive' });
  const [authError, setAuthError] = useState<string | null>(null);
  const [pendingTargetView, setPendingTargetView] = useState<'dashboard' | 'records' | 'exceptions' | 'chat'>('dashboard');

  const [featurePreview, setFeaturePreview] = useState<{
    title: string;
    tag: string;
    icon: string;
    description: string;
    highlights: string[];
    targetView: 'dashboard' | 'records' | 'exceptions' | 'chat';
  } | null>(null);

  const handleOpenFeaturePreview = (feature: {
    title: string;
    tag: string;
    icon: string;
    description: string;
    highlights: string[];
    targetView: 'dashboard' | 'records' | 'exceptions' | 'chat';
  }) => {
    setFeaturePreview(feature);
  };

  const handleProceedToLoginFromFeature = () => {
    if (featurePreview) {
      setPendingTargetView(featurePreview.targetView);
    }
    setFeaturePreview(null);
    setAuthModal('login');
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authForm.email || !authForm.password) {
      setAuthError('Please fill in all required fields.');
      return;
    }
    setAuthError(null);
    setAuthModal(null);
    onLaunchApp(pendingTargetView || 'dashboard');
  };

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const colors = {
    bg: 'var(--fema-bg)',
    surface: 'var(--fema-surface)',
    surfaceSubtle: 'var(--fema-surface-subtle)',
    border: 'var(--fema-border)',
    borderHighlight: 'var(--fema-border-highlight)',
    textPrimary: 'var(--fema-text-primary)',
    textSecondary: 'var(--fema-text-secondary)',
    textMuted: 'var(--fema-text-muted)',
    primary: 'var(--fema-primary)',
    primaryHover: 'var(--fema-primary-hover)',
    primaryGlow: 'var(--fema-primary-glow)',
    accentCyan: 'var(--fema-accent-cyan)',
    accentRose: 'var(--fema-accent-rose)',
    accentEmerald: 'var(--fema-accent-emerald)',
    accentAmber: 'var(--fema-accent-amber)',
  };

  const styles: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100vh',
      backgroundColor: 'var(--fema-bg)',
      color: 'var(--fema-text-primary)',
      fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden',
    },
    // Top Nav
    navbar: {
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      backgroundColor: 'var(--fema-navbar-bg)',
      borderBottom: '1px solid var(--fema-border)',
      padding: '0 32px',
      height: '70px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    navBrand: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      cursor: 'pointer',
    },
    brandBadge: {
      width: '38px',
      height: '38px',
      borderRadius: '10px',
      background: 'var(--fema-btn-gradient)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 800,
      fontSize: '15px',
      color: '#ffffff',
      boxShadow: 'var(--fema-btn-gradient-shadow)',
    },
    brandTitle: {
      fontSize: '18px',
      fontWeight: 800,
      letterSpacing: '0.02em',
      color: 'var(--fema-text-primary)',
    },
    brandSubtitle: {
      fontSize: '11px',
      color: 'var(--fema-text-secondary)',
      fontWeight: 500,
    },
    navLinks: {
      display: 'flex',
      alignItems: 'center',
      gap: '28px',
    },
    navLink: {
      fontSize: '14px',
      fontWeight: 500,
      color: 'var(--fema-text-secondary)',
      textDecoration: 'none',
      cursor: 'pointer',
      transition: 'color 0.15s ease',
    },
    navActions: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    themeToggle: {
      width: '36px',
      height: '36px',
      borderRadius: '10px',
      border: '1px solid var(--fema-border)',
      backgroundColor: 'var(--fema-surface-subtle)',
      color: 'var(--fema-text-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      padding: 0,
      transition: 'all 0.15s ease',
    },
    loginBtn: {
      padding: '8px 18px',
      borderRadius: '10px',
      border: '1px solid var(--fema-border-highlight)',
      backgroundColor: 'transparent',
      color: 'var(--fema-text-primary)',
      fontSize: '13px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    },
    signupBtn: {
      padding: '8px 20px',
      borderRadius: '10px',
      border: 'none',
      background: 'var(--fema-btn-gradient)',
      color: '#ffffff',
      fontSize: '13px',
      fontWeight: 600,
      cursor: 'pointer',
      boxShadow: 'var(--fema-btn-gradient-shadow)',
      transition: 'all 0.15s ease',
    },
    // Hero
    heroSection: {
      position: 'relative',
      padding: '70px 32px 60px',
      maxWidth: '1280px',
      margin: '0 auto',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
    },
    heroBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 16px',
      borderRadius: '20px',
      border: '1px solid var(--fema-hero-badge-border)',
      backgroundColor: 'var(--fema-hero-badge-bg)',
      color: 'var(--fema-hero-badge-color)',
      fontSize: '12px',
      fontWeight: 600,
      marginBottom: '20px',
    },
    heroHeading: {
      fontSize: 'clamp(32px, 5vw, 54px)',
      fontWeight: 800,
      lineHeight: 1.15,
      maxWidth: '900px',
      color: colors.textPrimary,
      letterSpacing: '-0.02em',
      marginBottom: '20px',
    },
    heroGradientText: {
      background: isDark
        ? 'linear-gradient(135deg, #6366f1 0%, #38bdf8 50%, #818cf8 100%)'
        : 'linear-gradient(135deg, #1e293b 0%, #3b82f6 50%, #1e293b 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    heroParagraph: {
      fontSize: '18px',
      lineHeight: 1.6,
      color: colors.textSecondary,
      maxWidth: '740px',
      marginBottom: '36px',
    },
    heroCtaGroup: {
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginBottom: '50px',
    },
    primaryCta: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '14px 28px',
      borderRadius: '12px',
      border: 'none',
      background: 'var(--fema-btn-gradient)',
      color: '#ffffff',
      fontSize: '15px',
      fontWeight: 700,
      cursor: 'pointer',
      boxShadow: 'var(--fema-btn-gradient-shadow)',
      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    },
    secondaryCta: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '14px 28px',
      borderRadius: '12px',
      border: `1px solid ${colors.borderHighlight}`,
      backgroundColor: colors.surface,
      color: colors.textPrimary,
      fontSize: '15px',
      fontWeight: 600,
      cursor: 'pointer',
      boxShadow: 'var(--fema-card-shadow)',
      transition: 'all 0.15s ease',
    },
    // Metrics Grid Preview
    metricsRibbon: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '20px',
      width: '100%',
      maxWidth: '1100px',
      marginTop: '10px',
    },
    metricCard: {
      backgroundColor: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: '16px',
      padding: '24px',
      textAlign: 'left',
      boxShadow: 'var(--fema-card-shadow)',
      position: 'relative',
      overflow: 'hidden',
    },
    metricValue: {
      fontSize: '30px',
      fontWeight: 800,
      color: colors.textPrimary,
      marginBottom: '4px',
    },
    metricLabel: {
      fontSize: '13px',
      fontWeight: 600,
      color: colors.textSecondary,
    },
    metricSubtext: {
      fontSize: '11px',
      color: colors.textMuted,
      marginTop: '4px',
    },
    // Capabilities Section
    sectionWrapper: {
      padding: '80px 32px',
      maxWidth: '1280px',
      margin: '0 auto',
      width: '100%',
    },
    sectionHeader: {
      textAlign: 'center',
      maxWidth: '700px',
      margin: '0 auto 50px',
    },
    sectionBadge: {
      fontSize: '12px',
      fontWeight: 700,
      letterSpacing: '0.08em',
      color: isDark ? '#818cf8' : '#2563eb',
      textTransform: 'uppercase',
      marginBottom: '8px',
    },
    sectionTitle: {
      fontSize: '32px',
      fontWeight: 800,
      color: colors.textPrimary,
      letterSpacing: '-0.01em',
      marginBottom: '12px',
    },
    sectionDesc: {
      fontSize: '16px',
      color: colors.textSecondary,
      lineHeight: 1.5,
    },
    capabilitiesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '24px',
    },
    capCard: {
      backgroundColor: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: '16px',
      padding: '28px',
      boxShadow: 'var(--fema-card-shadow)',
      transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
      display: 'flex',
      flexDirection: 'column',
    },
    capIconWrapper: {
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '20px',
      fontSize: '20px',
      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(30, 41, 59, 0.06)',
      color: isDark ? '#818cf8' : '#1e293b',
    },
    capTitle: {
      fontSize: '18px',
      fontWeight: 700,
      color: colors.textPrimary,
      marginBottom: '10px',
    },
    capDesc: {
      fontSize: '14px',
      color: colors.textSecondary,
      lineHeight: 1.6,
      flex: 1,
    },
    capLink: {
      marginTop: '16px',
      fontSize: '13px',
      fontWeight: 600,
      color: isDark ? '#818cf8' : '#2563eb',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      cursor: 'pointer',
    },
    // Multi-Agent Architecture
    archContainer: {
      backgroundColor: 'var(--fema-surface-muted)',
      border: `1px solid ${colors.border}`,
      borderRadius: '24px',
      padding: '40px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      position: 'relative',
    },
    archStep: {
      backgroundColor: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: '14px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      boxShadow: 'var(--fema-card-shadow)',
    },
    archStepNum: {
      fontSize: '11px',
      fontWeight: 800,
      color: isDark ? '#818cf8' : '#2563eb',
      letterSpacing: '0.05em',
    },
    archStepTitle: {
      fontSize: '15px',
      fontWeight: 700,
      color: colors.textPrimary,
    },
    archStepDesc: {
      fontSize: '12px',
      color: colors.textSecondary,
      lineHeight: 1.5,
    },
    // Banner CTA
    ctaBanner: {
      background: isDark
        ? 'linear-gradient(135deg, #312e81 0%, #1e1b4b 50%, #0f172a 100%)'
        : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      borderRadius: '24px',
      padding: '60px 40px',
      textAlign: 'center',
      color: '#ffffff',
      border: isDark ? '1px solid #4338ca' : '1px solid #1e293b',
      boxShadow: isDark
        ? '0 20px 40px -15px rgba(79, 70, 229, 0.4)'
        : '0 20px 40px -15px rgba(30, 41, 59, 0.25)',
      margin: '40px 32px 80px',
      maxWidth: '1216px',
      marginLeft: 'auto',
      marginRight: 'auto',
      width: 'calc(100% - 64px)',
    },
    // Footer
    footer: {
      backgroundColor: colors.surface,
      borderTop: `1px solid ${colors.border}`,
      padding: '60px 32px 30px',
      marginTop: 'auto',
    },
    footerGrid: {
      maxWidth: '1280px',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '40px',
      marginBottom: '50px',
    },
    footerBrandCol: {
      gridColumn: 'span 2',
    },
    footerColTitle: {
      fontSize: '13px',
      fontWeight: 700,
      color: colors.textPrimary,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      marginBottom: '16px',
    },
    footerLinkList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    },
    footerLink: {
      fontSize: '13px',
      color: colors.textSecondary,
      textDecoration: 'none',
      cursor: 'pointer',
      transition: 'color 0.15s ease',
    },
    footerBottom: {
      maxWidth: '1280px',
      margin: '0 auto',
      paddingTop: '24px',
      borderTop: `1px solid ${colors.border}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '16px',
      fontSize: '12px',
      color: colors.textMuted,
    },
    // Auth Modal Overlay
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '16px',
    },
    modalCard: {
      backgroundColor: colors.surface,
      border: `1px solid ${colors.borderHighlight}`,
      borderRadius: '20px',
      width: '100%',
      maxWidth: '420px',
      padding: '32px',
      boxShadow: 'var(--fema-card-shadow-hover)',
      position: 'relative',
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: 700,
      color: colors.textPrimary,
      margin: 0,
    },
    modalClose: {
      background: 'none',
      border: 'none',
      color: colors.textSecondary,
      fontSize: '20px',
      cursor: 'pointer',
      padding: '4px',
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      marginBottom: '16px',
    },
    inputLabel: {
      fontSize: '12px',
      fontWeight: 600,
      color: colors.textSecondary,
    },
    inputField: {
      padding: '10px 14px',
      borderRadius: '10px',
      border: `1px solid ${colors.border}`,
      backgroundColor: colors.surfaceSubtle,
      color: colors.textPrimary,
      fontSize: '14px',
      outline: 'none',
    },
    submitAuthBtn: {
      width: '100%',
      padding: '12px',
      borderRadius: '10px',
      border: 'none',
      background: 'var(--fema-btn-gradient)',
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      marginTop: '8px',
      boxShadow: 'var(--fema-btn-gradient-shadow)',
    },
  };

  return (
    <div style={styles.page}>
      {/* ---------------------------------------------------------------- */}
      {/* TOP NAVIGATION BAR                                               */}
      {/* ---------------------------------------------------------------- */}
      <header style={styles.navbar}>
        <div style={styles.navBrand} onClick={() => onLaunchApp('dashboard')}>
          <div style={styles.brandBadge}>FE</div>
          <div>
            <div style={styles.brandTitle}>FEMA</div>
            <div style={styles.brandSubtitle}>by Aiinhome Technologies</div>
          </div>
        </div>

        <nav style={styles.navLinks}>
          <a href="#capabilities" style={styles.navLink}>Capabilities</a>
          <a href="#architecture" style={styles.navLink}>Architecture</a>
          <a href="#security" style={styles.navLink}>Security & SLA</a>
          <a
            onClick={() => onLaunchApp('chat')}
            style={{ ...styles.navLink, color: '#6366f1', fontWeight: 600 }}
          >
            AI Assistant ↗
          </a>
        </nav>

        <div style={styles.navActions}>
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            style={styles.themeToggle}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => setAuthModal('login')}
            style={styles.loginBtn}
          >
            Log In
          </button>
          <button
            onClick={() => setAuthModal('signup')}
            style={styles.signupBtn}
          >
            Get Started
          </button>
        </div>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* HERO SECTION                                                     */}
      {/* ---------------------------------------------------------------- */}
      <section style={styles.heroSection}>
        <div style={styles.heroBadge}>
          <span>⚡ Agentic AI for Enterprise Finance</span>
        </div>

        <h1 style={styles.heroHeading}>
          Autonomous Financial Exception Monitoring & <span className="landing-hero-gradient">Multi-Agent Resolution</span>
        </h1>

        <p style={styles.heroParagraph}>
          FEMA continuously ingests ledger telemetry from ERP, EPM, and banking systems. It flags variance anomalies, identifies probable root causes, assigns accountable owners, and tracks strict SLA resolution ladders.
        </p>

        <div style={styles.heroCtaGroup}>
          <button
            onClick={() => {
              setPendingTargetView('dashboard');
              setAuthModal('login');
            }}
            style={styles.primaryCta}
          >
            Launch Live Dashboard →
          </button>
          <button
            onClick={() =>
              handleOpenFeaturePreview({
                title: 'Post Financial Ledger Record',
                tag: 'Data Ingestion & ACID Integrity',
                icon: '📑',
                description:
                  'Directly inject structured Budget vs. Actual line items, departments, accounts, and monetary entries through MySQL ACID stored procedures. FEMA evaluates mathematical deviations in real time upon record creation.',
                highlights: [
                  'Stored Procedure transactional execution (sp_InsertLedgerRecord)',
                  'Continuous variance calculation against budget quotas',
                  'Instant anomaly trigger with root-cause candidate generation',
                  'Secure role-based audit trail tracking user attribution',
                ],
                targetView: 'records',
              })
            }
            style={styles.secondaryCta}
          >
            + Post Ledger Record
          </button>
          <button
            onClick={() =>
              handleOpenFeaturePreview({
                title: 'Grounded RAG Financial Chatbot',
                tag: 'AI Intelligence & Vector Retrieval',
                icon: '💬',
                description:
                  'Interact with a zero-hallucination conversational AI that references active ledger records, root-cause diagnostic findings, and SLA escalation policies via ChromaDB embeddings.',
                highlights: [
                  'Ask natural language queries regarding variance spikes & expenses',
                  'Grounded strictly on actual MySQL records with verifiable citations',
                  'Instant insight generation for quarterly financial audits and CFO reviews',
                  'Multi-turn context retention for drill-down investigation',
                ],
                targetView: 'chat',
              })
            }
            style={styles.secondaryCta}
          >
            💬 Query RAG Chatbot
          </button>
        </div>

        {/* Live Metrics Ribbon */}
        <div style={styles.metricsRibbon}>
          <div style={styles.metricCard}>
            <div style={{ ...styles.metricValue, color: colors.accentCyan }}>100%</div>
            <div style={styles.metricLabel}>Automated Anomaly Audit</div>
            <div style={styles.metricSubtext}>Zero manual spreadsheet reconciliations</div>
          </div>

          <div style={styles.metricCard}>
            <div style={{ ...styles.metricValue, color: colors.accentEmerald }}>&lt; 24h</div>
            <div style={styles.metricLabel}>Critical Exception SLA</div>
            <div style={styles.metricSubtext}>Tiered escalation to Manager & CFO</div>
          </div>

          <div style={styles.metricCard}>
            <div style={{ ...styles.metricValue, color: '#818cf8' }}>RAG Grounded</div>
            <div style={styles.metricLabel}>Zero-Hallucination AI</div>
            <div style={styles.metricSubtext}>Direct ChromaDB vector retrieval</div>
          </div>

          <div style={styles.metricCard}>
            <div style={{ ...styles.metricValue, color: colors.accentAmber }}>Stored Procs</div>
            <div style={styles.metricLabel}>ACID Enterprise Storage</div>
            <div style={styles.metricSubtext}>MySQL Stored Procedure pipeline</div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* CAPABILITIES SECTION                                             */}
      {/* ---------------------------------------------------------------- */}
      <section id="capabilities" style={styles.sectionWrapper}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionBadge}>Core Capabilities</div>
          <h2 style={styles.sectionTitle}>Built for High-Stakes Finance Operations</h2>
          <p style={styles.sectionDesc}>
            Eliminate revenue leakage, undetected cost overruns, and delayed quarterly audit disclosures.
          </p>
        </div>

        <div style={styles.capabilitiesGrid}>
          <div style={styles.capCard}>
            <div style={{ ...styles.capIconWrapper, backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              📊
            </div>
            <h3 style={styles.capTitle}>Continuous Variance Monitoring</h3>
            <p style={styles.capDesc}>
              Monitors budget vs actual line items across P&L, departments, cloud compute, and enterprise sales contracts in real time.
            </p>
            <div
              style={styles.capLink}
              onClick={() =>
                handleOpenFeaturePreview({
                  title: 'Continuous Variance Monitoring',
                  tag: 'Audit & Telemetry Engine',
                  icon: '📊',
                  description:
                    'Audit all company ledger entries against target allocations. Automatically identifies budget deviations exceeding standard thresholds and generates audit trails.',
                  highlights: [
                    'Real-time P&L and department budget reconciliation',
                    'Variance percentage tracking and alerting',
                    'Direct database synchronization via MySQL stored procedures',
                  ],
                  targetView: 'records',
                })
              }
            >
              Learn More & Inspect →
            </div>
          </div>

          <div style={styles.capCard}>
            <div style={{ ...styles.capIconWrapper, backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
              🚨
            </div>
            <h3 style={styles.capTitle}>Severity & Root Cause Engine</h3>
            <p style={styles.capDesc}>
              Auto-classifies variances into LOW, MEDIUM, HIGH, and CRITICAL thresholds with natural language root-cause reasoning.
            </p>
            <div
              style={styles.capLink}
              onClick={() =>
                handleOpenFeaturePreview({
                  title: 'Severity & Root Cause Diagnostics',
                  tag: 'Multi-Agent Root Cause Reasoner',
                  icon: '🚨',
                  description:
                    'When an anomaly is flagged, AI agents parse ledger meta-tags to discover underlying business factors: vendor contract surge, currency rate fluctuations, or infrastructure autoscaling.',
                  highlights: [
                    'Severity grading (LOW, MEDIUM, HIGH, CRITICAL)',
                    'Root cause synthesis for audit defensibility',
                    'Automated anomaly ticket creation with assigned stakeholders',
                  ],
                  targetView: 'exceptions',
                })
              }
            >
              Learn More & Inspect →
            </div>
          </div>

          <div style={styles.capCard}>
            <div style={{ ...styles.capIconWrapper, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              ⏱️
            </div>
            <h3 style={styles.capTitle}>Automated SLA & Escalation Ladder</h3>
            <p style={styles.capDesc}>
              Automatically assigns cases to designated finance personnel (Executive → Manager → Sr. Manager → CFO) with countdown tracking.
            </p>
            <div
              style={styles.capLink}
              onClick={() =>
                handleOpenFeaturePreview({
                  title: 'SLA Escalation Hierarchy & Governance',
                  tag: 'Accountability & SLA Engine',
                  icon: '⏱️',
                  description:
                    'Strict countdowns per exception severity. If unresolved within SLA limits (e.g. 24h for Critical), cases automatically escalate up the management hierarchy to the CFO.',
                  highlights: [
                    'Role-based ownership assignment (Level 1 to Level 4)',
                    'Automated breach escalation & executive notifications',
                    'Live SLA countdown timers on active exception tickets',
                  ],
                  targetView: 'dashboard',
                })
              }
            >
              Learn More & Inspect →
            </div>
          </div>

          <div style={styles.capCard}>
            <div style={{ ...styles.capIconWrapper, backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>
              🤖
            </div>
            <h3 style={styles.capTitle}>Grounded RAG Financial Chatbot</h3>
            <p style={styles.capDesc}>
              Ask plain-English questions about department expenses or revenue dips. Strictly citations-grounded against stored data.
            </p>
            <div
              style={styles.capLink}
              onClick={() =>
                handleOpenFeaturePreview({
                  title: 'Grounded RAG Financial Chatbot',
                  tag: 'Vector Embeddings & Retrieval AI',
                  icon: '🤖',
                  description:
                    'Ask plain-English questions regarding ledger figures, expense overruns, or active breaches. The assistant answers with direct citations to database records.',
                  highlights: [
                    'Semantic queries on financial variance trends',
                    'Strictly grounded with zero hallucination guarantee',
                    'Integrated ChromaDB vector search',
                  ],
                  targetView: 'chat',
                })
              }
            >
              Learn More & Inspect →
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* ARCHITECTURE PIPELINE                                            */}
      {/* ---------------------------------------------------------------- */}
      <section id="architecture" style={styles.sectionWrapper}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionBadge}>System Pipeline</div>
          <h2 style={styles.sectionTitle}>Autonomous Multi-Agent Workflow</h2>
          <p style={styles.sectionDesc}>
            How FEMA executes from raw ERP ledger entries to board-level risk remediation.
          </p>
        </div>

        <div style={styles.archContainer}>
          <div style={styles.archStep}>
            <span style={styles.archStepNum}>STEP 01</span>
            <div style={styles.archStepTitle}>Data Ingestion</div>
            <div style={styles.archStepDesc}>MySQL Stored Procedures ingest Budget vs Actual ledger items across cost centers.</div>
          </div>

          <div style={styles.archStep}>
            <span style={styles.archStepNum}>STEP 02</span>
            <div style={styles.archStepTitle}>Variance Audit</div>
            <div style={styles.archStepDesc}>Mathematical verification flags non-linear variances exceeding standard ±10% threshold.</div>
          </div>

          <div style={styles.archStep}>
            <span style={styles.archStepNum}>STEP 03</span>
            <div style={styles.archStepTitle}>AI Diagnostics</div>
            <div style={styles.archStepDesc}>LLM and rule engine formulate concise root-cause diagnostics and severity ratings.</div>
          </div>

          <div style={styles.archStep}>
            <span style={styles.archStepNum}>STEP 04</span>
            <div style={styles.archStepTitle}>Owner Routing</div>
            <div style={styles.archStepDesc}>Assigns case to responsible finance officer with strict SLA deadline countdown.</div>
          </div>

          <div style={styles.archStep}>
            <span style={styles.archStepNum}>STEP 05</span>
            <div style={styles.archStepTitle}>CFO Escalation</div>
            <div style={styles.archStepDesc}>Breached deadlines automatically escalate up the ladder directly to the Executive office.</div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* SECURITY & TRUST                                                 */}
      {/* ---------------------------------------------------------------- */}
      <section id="security" style={{ ...styles.sectionWrapper, paddingTop: '20px' }}>
        <div style={styles.ctaBanner}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '16px' }}>
            Ready to Safeguard Your Financial Governance?
          </h2>
          <p style={{ fontSize: '16px', opacity: 0.9, maxWidth: '640px', margin: '0 auto 30px', lineHeight: 1.6 }}>
            Experience real-time anomaly detection, multi-agent exception resolution, and continuous financial compliance.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => onLaunchApp('dashboard')}
              style={{
                ...styles.primaryCta,
                backgroundColor: '#ffffff',
                color: '#1e1b4b',
                boxShadow: '0 8px 24px rgba(255, 255, 255, 0.2)',
              }}
            >
              Enter Dashboard
            </button>
            <button
              onClick={() => setAuthModal('signup')}
              style={{
                ...styles.secondaryCta,
                backgroundColor: 'transparent',
                color: '#ffffff',
                borderColor: 'rgba(255, 255, 255, 0.3)',
              }}
            >
              Create Account
            </button>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* FOOTER SECTION                                                   */}
      {/* ---------------------------------------------------------------- */}
      <footer style={styles.footer}>
        <div style={styles.footerGrid}>
          <div style={styles.footerBrandCol}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={styles.brandBadge}>FE</div>
              <div>
                <div style={styles.brandTitle}>FEMA</div>
                <div style={styles.brandSubtitle}>Finance Exception Management Agent</div>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: colors.textSecondary, lineHeight: 1.6, maxWidth: '320px' }}>
              An enterprise agentic AI solution engineered by <strong>Aiinhome Technologies</strong> for automated variance auditing, SLA tracking, and CFO governance.
            </p>
          </div>

          <div>
            <div style={styles.footerColTitle}>Platform</div>
            <ul style={styles.footerLinkList}>
              <li><a style={styles.footerLink} onClick={() => onLaunchApp('dashboard')}>Executive Dashboard</a></li>
              <li><a style={styles.footerLink} onClick={() => onLaunchApp('records')}>Financial Records</a></li>
              <li><a style={styles.footerLink} onClick={() => onLaunchApp('exceptions')}>Exception Management</a></li>
              <li><a style={styles.footerLink} onClick={() => onLaunchApp('chat')}>RAG Assistant</a></li>
            </ul>
          </div>

          <div>
            <div style={styles.footerColTitle}>Architecture</div>
            <ul style={styles.footerLinkList}>
              <li><a style={styles.footerLink} href="#architecture">Multi-Agent Workflow</a></li>
              <li><a style={styles.footerLink} href="#capabilities">Variance Detection</a></li>
              <li><a style={styles.footerLink} href="#security">SLA Policy Ladder</a></li>
              <li><a style={styles.footerLink} onClick={() => onLaunchApp('records')}>MySQL Stored Procs</a></li>
            </ul>
          </div>

          <div>
            <div style={styles.footerColTitle}>Security & Legal</div>
            <ul style={styles.footerLinkList}>
              <li><a style={styles.footerLink}>Enterprise Compliance</a></li>
              <li><a style={styles.footerLink}>SOC2 / GDPR Assurance</a></li>
              <li><a style={styles.footerLink}>Privacy Policy</a></li>
              <li><a style={styles.footerLink}>Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div style={styles.footerBottom}>
          <div>
            © {new Date().getFullYear()} Aiinhome Technologies. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>Status: 🟢 Systems Operational</span>
            <span>API Version: v1.0.0</span>
          </div>
        </div>
      </footer>

      {/* ---------------------------------------------------------------- */}
      {/* FEATURE PREVIEW & DESCRIPTION MODAL                              */}
      {/* ---------------------------------------------------------------- */}
      {featurePreview && (
        <div style={styles.modalOverlay} onClick={() => setFeaturePreview(null)}>
          <div
            style={{ ...styles.modalCard, maxWidth: '540px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '28px' }}>{featurePreview.icon}</span>
                <div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#6366f1',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {featurePreview.tag}
                  </div>
                  <h3 style={{ ...styles.modalTitle, margin: 0, fontSize: '18px' }}>
                    {featurePreview.title}
                  </h3>
                </div>
              </div>
              <button style={styles.modalClose} onClick={() => setFeaturePreview(null)}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: '14px', color: colors.textSecondary, lineHeight: 1.6, margin: '14px 0 18px' }}>
              {featurePreview.description}
            </p>

            <div
              style={{
                backgroundColor: isDark ? '#080d1a' : '#f8fafc',
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: colors.textPrimary,
                  marginBottom: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Key Architecture & Capabilities
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {featurePreview.highlights.map((item, idx) => (
                  <li key={idx} style={{ fontSize: '13px', color: colors.textSecondary, lineHeight: 1.5 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div
              style={{
                padding: '12px 14px',
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)',
                border: `1px solid ${isDark ? '#3730a3' : '#c7d2fe'}`,
                borderRadius: '10px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: '18px' }}>🔒</span>
              <div style={{ fontSize: '12px', color: isDark ? '#c7d2fe' : '#3730a3', lineHeight: 1.4 }}>
                <strong>Enterprise Authentication Required:</strong> Please log in or register your account to access live data, post entries, and manage cases.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setFeaturePreview(null)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                  backgroundColor: 'transparent',
                  color: colors.textSecondary,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
              <button
                onClick={handleProceedToLoginFromFeature}
                style={{
                  padding: '10px 22px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                }}
              >
                Log In to Access Feature →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* LOGIN / SIGNUP MODAL                                             */}
      {/* ---------------------------------------------------------------- */}
      {authModal && (
        <div style={styles.modalOverlay} onClick={() => setAuthModal(null)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {authModal === 'login' ? 'Log in to FEMA' : 'Create FEMA Account'}
              </h3>
              <button style={styles.modalClose} onClick={() => setAuthModal(null)}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '-10px', marginBottom: '20px' }}>
              {authModal === 'login'
                ? 'Access your enterprise finance ledger and open exception cases.'
                : 'Sign up to configure automated anomaly tracking and team escalation.'}
            </p>

            {authError && (
              <div style={{ padding: '8px 12px', backgroundColor: '#ef444422', border: '1px solid #ef4444', borderRadius: '8px', color: '#f87171', fontSize: '12px', marginBottom: '14px' }}>
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit}>
              {authModal === 'signup' && (
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Asha Verma"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    style={styles.inputField}
                    required
                  />
                </div>
              )}

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Work Email</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  style={styles.inputField}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  style={styles.inputField}
                  required
                />
              </div>

              {authModal === 'signup' && (
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Finance Role</label>
                  <select
                    value={authForm.role}
                    onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}
                    style={styles.inputField}
                  >
                    <option value="Finance Executive">Finance Executive (Level 1)</option>
                    <option value="Finance Manager">Finance Manager (Level 2)</option>
                    <option value="Senior Finance Manager">Senior Finance Manager (Level 3)</option>
                    <option value="CFO">CFO Office (Level 4)</option>
                  </select>
                </div>
              )}

              <button type="submit" style={styles.submitAuthBtn}>
                {authModal === 'login' ? 'Sign In →' : 'Create Account →'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: colors.textSecondary }}>
              {authModal === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <span
                    onClick={() => setAuthModal('signup')}
                    style={{ color: '#6366f1', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Sign Up
                  </span>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <span
                    onClick={() => setAuthModal('login')}
                    style={{ color: '#6366f1', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Log In
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
