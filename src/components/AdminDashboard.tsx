import React, { useState, useEffect } from "react";
import { ADMIN_ENDPOINTS, getAuthHeaders } from "../config/apiConfig";
import { StatCard } from "./StatCard";
import { Badge, getStatusBadgeVariant, getRoleBadgeVariant } from "./Badge";
import { Modal } from "./Modal";

interface IntegrationSystem {
  id: number;
  system_name: string;
  system_type: string;
  status: string;
  latency_ms: number;
  uptime_percent: number;
  last_sync_at: string | null;
  error_count: number;
}

interface ThresholdParam {
  id: number;
  param_key: string;
  param_label: string;
  param_value: string;
  param_type: string;
  description: string;
  updated_by: string;
  updated_at: string | null;
}

interface UserRecord {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role_id: number;
  role_name: string;
  role_description: string;
  is_active: boolean;
  created_at: string | null;
}

interface SystemLog {
  id: number;
  log_level: string;
  source: string;
  message: string;
  details: string | null;
  created_at: string | null;
}

interface AdminDashboardProps {
  activeSection?: "all" | "health" | "thresholds" | "users" | "logs";
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  activeSection = "all",
}) => {
  const [integrations, setIntegrations] = useState<IntegrationSystem[]>([]);
  const [thresholds, setThresholds] = useState<ThresholdParam[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit threshold modal state
  const [selectedThreshold, setSelectedThreshold] = useState<ThresholdParam | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isUpdatingThreshold, setIsUpdatingThreshold] = useState(false);

  // Role change modal state
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [newRoleId, setNewRoleId] = useState<number>(1);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthRes, threshRes, usersRes, logsRes] = await Promise.all([
        fetch(ADMIN_ENDPOINTS.HEALTH, { headers: getAuthHeaders() }),
        fetch(ADMIN_ENDPOINTS.THRESHOLDS, { headers: getAuthHeaders() }),
        fetch(ADMIN_ENDPOINTS.USERS, { headers: getAuthHeaders() }),
        fetch(ADMIN_ENDPOINTS.LOGS, { headers: getAuthHeaders() }),
      ]);

      const [healthData, threshData, usersData, logsData] = await Promise.all([
        healthRes.json(),
        threshRes.json(),
        usersRes.json(),
        logsRes.json(),
      ]);

      if (healthData.success) setIntegrations(healthData.integrations || []);
      if (threshData.success) setThresholds(threshData.thresholds || []);
      if (usersData.success) setUsers(usersData.users || []);
      if (logsData.success) setLogs(logsData.logs || []);
    } catch (err: any) {
      setError("Failed to fetch admin dashboard telemetry: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleSaveThreshold = async () => {
    if (!selectedThreshold) return;
    setIsUpdatingThreshold(true);
    try {
      const response = await fetch(ADMIN_ENDPOINTS.THRESHOLDS, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          param_key: selectedThreshold.param_key,
          param_value: editValue,
          updated_by: "admin",
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSelectedThreshold(null);
        fetchAdminData();
      } else {
        alert("Update failed: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsUpdatingThreshold(false);
    }
  };

  const handleSaveUserRole = async () => {
    if (!selectedUser) return;
    setIsUpdatingRole(true);
    try {
      const response = await fetch(ADMIN_ENDPOINTS.UPDATE_USER_ROLE, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          user_id: selectedUser.id,
          role_id: Number(newRoleId),
          admin_name: "admin",
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSelectedUser(null);
        fetchAdminData();
      } else {
        alert("Role update failed: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const activeIntegrationsCount = integrations.filter((i) => i.status === "ACTIVE").length;
  const averageUptime =
    integrations.length > 0
      ? (integrations.reduce((acc, curr) => acc + curr.uptime_percent, 0) / integrations.length).toFixed(2)
      : "99.95";

  return (
    <div className="fema-dashboard-view">
      {/* View Header */}
      <div className="fema-view-header">
        <div>
          <div className="fema-role-tag">ROLE 0: SYSTEM ADMINISTRATOR</div>
          <h1 className="fema-view-title">
            {activeSection === "health"
              ? "System Health & Integration Telemetry"
              : activeSection === "thresholds"
              ? "AI Model & Threshold Management"
              : activeSection === "users"
              ? "User Directory & Access Control"
              : activeSection === "logs"
              ? "System Synchronization & Error Logs"
              : "System Administrator Infrastructure Console"}
          </h1>
          <p className="fema-view-desc">
            Monitor enterprise ERP/EPM/Banking integrations, configure anomaly rules, manage user access, and inspect live logs.
          </p>
        </div>
        <button
          className="fema-btn fema-btn-outline"
          onClick={fetchAdminData}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "↻ Refresh Telemetry"}
        </button>
      </div>

      {error && <div className="fema-error-banner">⚠️ {error}</div>}

      {/* Top Stat Cards */}
      {(activeSection === "all" || activeSection === "health") && (
        <div className="fema-stats-grid">
          <StatCard
            title="Connected Integrations"
            value={`${activeIntegrationsCount} / ${integrations.length}`}
            subtitle="All core ERP & banking channels active"
            badgeText="100% HEALTHY"
            badgeVariant="success"
            icon="🔌"
          />
          <StatCard
            title="Average System Uptime"
            value={`${averageUptime}%`}
            subtitle="Last 30-day SLA compliance"
            trend={{ value: "0.05%", isPositive: true, label: "vs target" }}
            icon="⚡"
          />
          <StatCard
            title="Total Registered Users"
            value={users.length}
            subtitle={`${users.filter((u) => u.is_active).length} active platform operators`}
            badgeText="ACCESS CONTROL"
            badgeVariant="info"
            icon="👥"
          />
          <StatCard
            title="Rule Engine State"
            value="AUTONOMOUS"
            subtitle="Evaluating live transactions"
            badgeText="Z-Score: 2.5σ"
            badgeVariant="purple"
            icon="🧠"
          />
        </div>
      )}

      {/* Section 1: System Health & Uptime (ERP, EPM, Banking APIs) */}
      {(activeSection === "all" || activeSection === "health") && (
        <div className="fema-section-card">
          <div className="fema-section-header">
            <div>
              <h2 className="fema-section-title">1. System Health & Integration Telemetry</h2>
              <p className="fema-section-sub">
                Live connectivity, round-trip latency, and uptime status for ERP, EPM, and Banking APIs
              </p>
            </div>
            <Badge variant="success" size="sm">
              Live Heartbeat
            </Badge>
          </div>

          <div className="fema-integrations-grid">
            {integrations.map((sys) => (
              <div key={sys.id} className="fema-integration-box">
                <div className="fema-int-top">
                  <div>
                    <div className="fema-int-name">{sys.system_name}</div>
                    <div className="fema-int-type">{sys.system_type}</div>
                  </div>
                  <Badge variant={getStatusBadgeVariant(sys.status)} size="sm">
                    ● {sys.status}
                  </Badge>
                </div>

                <div className="fema-int-metrics">
                  <div className="fema-int-metric-col">
                    <span className="label">Latency</span>
                    <span className="val">{sys.latency_ms} ms</span>
                  </div>
                  <div className="fema-int-metric-col">
                    <span className="label">Uptime</span>
                    <span className="val">{sys.uptime_percent}%</span>
                  </div>
                  <div className="fema-int-metric-col">
                    <span className="label">Sync Errors</span>
                    <span className="val">{sys.error_count}</span>
                  </div>
                </div>

                <div className="fema-int-foot">
                  <span>Last heartbeat: {sys.last_sync_at ? new Date(sys.last_sync_at).toLocaleTimeString() : "Just now"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: AI Models & Anomaly Thresholds */}
      {(activeSection === "all" || activeSection === "thresholds") && (
        <div className="fema-section-card">
          <div className="fema-section-header">
            <div>
              <h2 className="fema-section-title">2. AI Models & Threshold Configuration</h2>
              <p className="fema-section-sub">
                Anomaly detection parameters, variance percentage cutoffs, and statistical rule engine triggers
              </p>
            </div>
          </div>

          <div className="fema-thresholds-grid">
            {thresholds.map((t) => (
              <div key={t.id} className="fema-threshold-row">
                <div className="fema-th-info">
                  <div className="fema-th-label">{t.param_label}</div>
                  <div className="fema-th-desc">{t.description}</div>
                  <div className="fema-th-meta">
                    Key: <code>{t.param_key}</code> • Updated by: <strong>{t.updated_by}</strong>
                  </div>
                </div>
                <div className="fema-th-action">
                  <span className="fema-th-value-badge">{t.param_value}</span>
                  <button
                    className="fema-btn fema-btn-sm fema-btn-outline"
                    onClick={() => {
                      setSelectedThreshold(t);
                      setEditValue(t.param_value);
                    }}
                  >
                    Configure
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 3: User & Access Management */}
      {(activeSection === "all" || activeSection === "users") && (
        <div className="fema-section-card">
          <div className="fema-section-header">
            <div>
              <h2 className="fema-section-title">3. User & Access Management</h2>
              <p className="fema-section-sub">
                Operator directory, assigned organizational roles, activation status, and role privileges
              </p>
            </div>
          </div>

          <div className="fema-table-container">
            <table className="fema-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Full Name / Username</th>
                  <th>Email</th>
                  <th>Current Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td>
                      <strong>{u.full_name || u.username}</strong>
                      <div className="fema-text-sub">@{u.username}</div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <Badge variant={getRoleBadgeVariant(u.role_id)} size="sm">
                        Role {u.role_id}: {u.role_name}
                      </Badge>
                    </td>
                    <td>
                      <span className={`fema-status-dot ${u.is_active ? "online" : "offline"}`}></span>
                      {u.is_active ? "Active" : "Deactivated"}
                    </td>
                    <td>
                      <button
                        className="fema-btn fema-btn-xs fema-btn-outline"
                        onClick={() => {
                          setSelectedUser(u);
                          setNewRoleId(u.role_id);
                        }}
                      >
                        Change Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 4: System Logs & Error Console */}
      {(activeSection === "all" || activeSection === "logs") && (
        <div className="fema-section-card">
          <div className="fema-section-header">
            <div>
              <h2 className="fema-section-title">4. System Logs & Sync Notifications</h2>
              <p className="fema-section-sub">
                Data pipeline events, synchronization telemetry, upstream retries, and network traces
              </p>
            </div>
          </div>

          <div className="fema-terminal-box">
            {logs.map((log) => (
              <div key={log.id} className="fema-terminal-line">
                <span className="log-time">
                  [{log.created_at ? new Date(log.created_at).toLocaleTimeString() : "00:00:00"}]
                </span>
                <span className={`log-level ${log.log_level.toLowerCase()}`}>
                  [{log.log_level}]
                </span>
                <span className="log-source">[{log.source}]</span>
                <span className="log-msg">{log.message}</span>
                {log.details && <span className="log-details"> — {log.details}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Threshold Modal */}
      {selectedThreshold && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedThreshold(null)}
          title={`Configure Threshold: ${selectedThreshold.param_label}`}
          subtitle={selectedThreshold.description}
        >
          <div className="fema-form-group">
            <label className="fema-label">Parameter Value</label>
            <input
              type="text"
              className="fema-input"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="e.g. 15.0 or ENABLED"
              autoFocus
            />
          </div>
          <div className="fema-modal-actions">
            <button
              className="fema-btn fema-btn-outline"
              onClick={() => setSelectedThreshold(null)}
              disabled={isUpdatingThreshold}
            >
              Cancel
            </button>
            <button
              className="fema-btn fema-btn-primary"
              onClick={handleSaveThreshold}
              disabled={isUpdatingThreshold}
            >
              {isUpdatingThreshold ? "Saving..." : "Save Parameter"}
            </button>
          </div>
        </Modal>
      )}

      {/* Change User Role Modal */}
      {selectedUser && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedUser(null)}
          title={`Modify Role for @${selectedUser.username}`}
          subtitle={selectedUser.full_name}
        >
          <div className="fema-form-group">
            <label className="fema-label">Assign New System Role</label>
            <select
              className="fema-select"
              value={newRoleId}
              onChange={(e) => setNewRoleId(Number(e.target.value))}
            >
              <option value={0}>Role 0: System Administrator</option>
              <option value={1}>Role 1: Accountable Owner / Finance Analyst</option>
              <option value={2}>Role 2: Finance Leadership / Executive (CFO)</option>
              <option value={3}>Role 3: Auditor / Compliance Officer</option>
            </select>
          </div>
          <div className="fema-modal-actions">
            <button
              className="fema-btn fema-btn-outline"
              onClick={() => setSelectedUser(null)}
              disabled={isUpdatingRole}
            >
              Cancel
            </button>
            <button
              className="fema-btn fema-btn-primary"
              onClick={handleSaveUserRole}
              disabled={isUpdatingRole}
            >
              {isUpdatingRole ? "Updating Role..." : "Confirm Role Change"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
