/**
 * config/apiConfig.ts
 * --------------------
 * Centralized API configuration file for FEMA.
 * Stores all endpoint routes as exported variables and helper methods,
 * consumed across all components and dashboard views.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// 1. Authentication & Role Endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  ME: `${API_BASE_URL}/api/auth/me`,
  ROLES: `${API_BASE_URL}/api/auth/roles`,
};

// 2. Role 0: System Administrator Endpoints
export const ADMIN_ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/api/admin/health`,
  THRESHOLDS: `${API_BASE_URL}/api/admin/thresholds`,
  USERS: `${API_BASE_URL}/api/admin/users`,
  UPDATE_USER_ROLE: `${API_BASE_URL}/api/admin/users/role`,
  LOGS: `${API_BASE_URL}/api/admin/logs`,
};

// 3. Role 1: Finance Analyst / Owner Endpoints
export const ANALYST_ENDPOINTS = {
  TASKS: `${API_BASE_URL}/api/analyst/tasks`,
  SLA_ALERTS: `${API_BASE_URL}/api/analyst/sla-alerts`,
  INSIGHT: (id: number | string) => `${API_BASE_URL}/api/analyst/insight/${id}`,
  ACTION: `${API_BASE_URL}/api/analyst/action`,
  CHAT: `${API_BASE_URL}/api/chat`,
};

// 4. Role 2: Finance Leadership / Executive (CFO) Endpoints
export const CFO_ENDPOINTS = {
  KPIS: `${API_BASE_URL}/api/cfo/kpis`,
  EARLY_WARNINGS: `${API_BASE_URL}/api/cfo/early-warnings`,
  ESCALATED_RISKS: `${API_BASE_URL}/api/cfo/escalated-risks`,
  EXECUTIVE_BRIEF: `${API_BASE_URL}/api/cfo/executive-brief`,
  CHAT: `${API_BASE_URL}/api/chat`,
};

// 5. Role 3: Auditor / Compliance Officer Endpoints
export const AUDITOR_ENDPOINTS = {
  TRAIL: `${API_BASE_URL}/api/auditor/trail`,
  SLA_COMPLIANCE: `${API_BASE_URL}/api/auditor/sla-compliance`,
  HITL_METRICS: `${API_BASE_URL}/api/auditor/hitl-metrics`,
  EXPORT: `${API_BASE_URL}/api/auditor/export`,
};

// 6. Common Financial Records & Exceptions Endpoints
export const COMMON_ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/api/health`,
  RECORDS: `${API_BASE_URL}/api/financial-records`,
  EXCEPTIONS: `${API_BASE_URL}/api/exceptions`,
  OVERDUE_EXCEPTIONS: `${API_BASE_URL}/api/exceptions/overdue`,
  EXCEPTION_DETAIL: (id: number | string) => `${API_BASE_URL}/api/exceptions/${id}`,
  EXCEPTION_ESCALATE: (id: number | string) => `${API_BASE_URL}/api/exceptions/${id}/escalate`,
  MONITOR: `${API_BASE_URL}/api/monitor`,
  OWNERS: `${API_BASE_URL}/api/owners`,
  STORED_PROCEDURE: `${API_BASE_URL}/api/sp`,
};

/**
 * Standard HTTP header builder with Bearer token support
 */
export const getAuthHeaders = (token?: string | null): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const activeToken = token || localStorage.getItem("fema_token");
  if (activeToken) {
    headers["Authorization"] = `Bearer ${activeToken}`;
  }
  return headers;
};
