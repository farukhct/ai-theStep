import React, { useState, useEffect, useCallback } from 'react';
import {
  Monitor,
  ShieldAlert,
  History,
  Settings,
  Download,
  CheckCircle2,
  Trash2,
  Search,
  Lock
} from 'lucide-react';
import { apiRequest } from '../../../services/apiClient';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import {
  LoginHistoryRecord,
  SecurityAuditLogRecord,
  SecurityEventRecord,
  SecuritySettingsRecord,
  UserSessionRecord
} from '../../../types';

interface SecurityOperationsViewProps {
  section: 'sessions' | 'login-history' | 'security-events' | 'security-audit' | 'security-settings';
}

export const SecurityOperationsView: React.FC<SecurityOperationsViewProps> = ({ section }) => {
  const { hasPermission } = useAuth();
  const { addToast } = useNotification();

  const [sessions, setSessions] = useState<UserSessionRecord[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryRecord[]>([]);
  const [events, setEvents] = useState<SecurityEventRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLogRecord[]>([]);
  const [settings, setSettings] = useState<SecuritySettingsRecord | null>(null);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditModule, setAuditModule] = useState('all');
  const [auditResult, setAuditResult] = useState('all');
  const [failedOnly, setFailedOnly] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const loadSection = useCallback(async () => {
    try {
      if (section === 'sessions') {
        const res = await apiRequest<{ sessions: UserSessionRecord[] }>('/api/admin/sessions');
        setSessions(res.sessions);
      } else if (section === 'login-history') {
        const res = await apiRequest<{ history: LoginHistoryRecord[] }>(
          `/api/admin/security/login-history?failed=${failedOnly}`
        );
        setLoginHistory(res.history);
      } else if (section === 'security-events') {
        const res = await apiRequest<{ events: SecurityEventRecord[] }>('/api/admin/security/events');
        setEvents(res.events);
      } else if (section === 'security-audit') {
        const qs = new URLSearchParams({
          search: auditSearch,
          module: auditModule,
          result: auditResult,
          pageSize: '60'
        });
        const res = await apiRequest<{ auditLogs: SecurityAuditLogRecord[] }>(`/api/admin/audit-logs?${qs.toString()}`);
        setAuditLogs(res.auditLogs);
      } else if (section === 'security-settings') {
        const res = await apiRequest<{ settings: SecuritySettingsRecord }>('/api/admin/security/settings');
        setSettings(res.settings);
      }
    } catch (err: any) {
      addToast('Load Failed', err.message || 'Insufficient permission or network error.', 'error');
    }
  }, [section, failedOnly, auditSearch, auditModule, auditResult, addToast]);

  useEffect(() => {
    loadSection();
  }, [loadSection]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSavingSettings(true);
    try {
      const res = await apiRequest<{ settings: SecuritySettingsRecord }>('/api/admin/security/settings', {
        method: 'PUT',
        body: {
          minPasswordLength: Number(settings.minPasswordLength),
          adminMinPasswordLength: Number(settings.adminMinPasswordLength),
          passwordHistoryLimit: Number(settings.passwordHistoryLimit),
          maxLoginAttempts: Number(settings.maxLoginAttempts),
          lockoutDurationMinutes: Number(settings.lockoutDurationMinutes),
          accessTokenLifetimeMinutes: Number(settings.accessTokenLifetimeMinutes),
          refreshTokenLifetimeDays: Number(settings.refreshTokenLifetimeDays),
          idleSessionTimeoutMinutes: Number(settings.idleSessionTimeoutMinutes),
          maxSessionLifetimeHours: Number(settings.maxSessionLifetimeHours),
          mfaEnforcement: settings.mfaEnforcement,
          requireEmailVerification: settings.requireEmailVerification,
          requireMobileVerification: settings.requireMobileVerification,
          passwordResetExpiryMinutes: Number(settings.passwordResetExpiryMinutes),
          invitationExpiryHours: Number(settings.invitationExpiryHours)
        }
      });
      setSettings(res.settings);
      addToast('Security Policies Saved', 'Authentication & session policy updated and logged in audit trail.', 'success');
    } catch (err: any) {
      addToast('Policy Update Rejected', err.message || 'Only Super Administrators can alter security settings.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  if (section === 'sessions') {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Monitor className="w-4 h-4 text-[#465FFF]" />
              <span>Active Platform Sessions ({sessions.length})</span>
            </h3>
            <p className="text-xs text-gray-500">Live server-side sessions tracked with idle timeout &amp; token family rotation</p>
          </div>
        </div>
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
          <table className="min-w-[850px] w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900/60 text-[10px] uppercase text-gray-500 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4">Device / Client</th>
                <th className="py-3 px-4">Portal</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td className="py-3 px-4">
                    <p className="font-bold text-gray-900 dark:text-white">{s.userFullName}</p>
                    <p className="text-[11px] text-gray-500">{s.userEmail}</p>
                  </td>
                  <td className="py-3 px-4">{s.deviceName}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.isAdminSession ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-700'}`}>
                      {s.isAdminSession ? 'Admin Console' : 'Storefront'}
                    </span>
                    {s.isCurrent && <span className="ml-1 text-[10px] font-bold text-emerald-600">(Current)</span>}
                  </td>
                  <td className="py-3 px-4 font-mono-num text-[11px]">{s.ipAddress}</td>
                  <td className="py-3 px-4 font-mono-num text-[11px] text-gray-500">
                    {new Date(s.lastActivityAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {hasPermission('security.sessions.revoke') && !s.isCurrent && (
                      <button
                        type="button"
                        onClick={async () => {
                          await apiRequest(`/api/admin/sessions/${s.id}`, { method: 'DELETE' });
                          addToast('Session Revoked', 'Session terminated.', 'info');
                          loadSection();
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Revoke</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (section === 'login-history') {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-[#465FFF]" />
              <span>Authentication &amp; Login History</span>
            </h3>
            <p className="text-xs text-gray-500">Includes heuristic anomaly risk score &amp; unusual activity indicators</p>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={failedOnly}
              onChange={(e) => setFailedOnly(e.target.checked)}
              className="rounded accent-[#465FFF]"
            />
            <span>Failed Attempts Only</span>
          </label>
        </div>

        <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl max-h-[560px]">
          <table className="min-w-[850px] w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900/60 text-[10px] uppercase text-gray-500 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Account / Identifier</th>
                <th className="py-3 px-4">Portal</th>
                <th className="py-3 px-4">Device / IP</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-mono-num text-[11px]">
              {loginHistory.map((h) => (
                <tr key={h.id}>
                  <td className="py-2.5 px-4 text-gray-500">{new Date(h.createdAt).toLocaleString()}</td>
                  <td className="py-2.5 px-4 font-sans font-semibold text-gray-900 dark:text-white">{h.identifier}</td>
                  <td className="py-2.5 px-4 font-sans">{h.isAdminPortal ? 'Admin' : 'Customer'}</td>
                  <td className="py-2.5 px-4 font-sans">
                    {h.deviceName} <span className="font-mono text-gray-400">({h.ipAddress})</span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded font-bold ${h.riskScore >= 60 ? 'bg-rose-100 text-rose-700' : h.riskScore >= 25 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {h.riskScore}/100 {h.riskFlags.length > 0 ? `(${h.riskFlags.join(', ')})` : ''}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded font-sans font-bold ${h.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}`}>
                      {h.success ? 'Success' : h.failureReason || 'Failed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (section === 'security-events') {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 space-y-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Security Monitoring &amp; Anomaly Alerts ({events.length})</span>
          </h3>
          <p className="text-xs text-gray-500">Refresh-token reuse alerts, repeated brute-force failures, and unusual login warnings</p>
        </div>

        {events.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">
            No unresolved anomalies detected. System posture normal.
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ev.severity === 'critical'
                          ? 'bg-rose-600 text-white'
                          : ev.severity === 'high'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ev.severity}
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">{ev.title}</span>
                    {ev.resolved && (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">{ev.description}</p>
                  <p className="text-[11px] font-mono-num text-gray-400">
                    {new Date(ev.createdAt).toLocaleString()} · IP {ev.ipAddress}
                  </p>
                </div>

                {!ev.resolved && (
                  <button
                    type="button"
                    onClick={async () => {
                      await apiRequest(`/api/admin/security/events/${ev.id}/resolve`, { method: 'PATCH' });
                      addToast('Event Resolved', 'Security event marked resolved.', 'success');
                      loadSection();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#292933] text-white font-semibold cursor-pointer"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (section === 'security-audit') {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Append-Only Security Audit Logs</span>
            </h3>
            <p className="text-xs text-gray-500">
              Immutable cryptographic audit trail · Passwords, tokens, OTPs, and MFA secrets are redacted automatically
            </p>
          </div>
          <a
            href={`/api/admin/audit-logs?format=csv&search=${encodeURIComponent(auditSearch)}&module=${auditModule}&result=${auditResult}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit CSV</span>
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          <div className="relative sm:col-span-2">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="Search action, actor, target ID, context..."
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent"
            />
          </div>
          <select
            value={auditModule}
            onChange={(e) => setAuditModule(e.target.value)}
            className="px-2.5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
          >
            <option value="all">All Modules</option>
            <option value="Authentication">Authentication</option>
            <option value="AdminAuth">AdminAuth</option>
            <option value="UserManagement">UserManagement</option>
            <option value="RBAC">RBAC</option>
            <option value="MFA">MFA</option>
            <option value="Sessions">Sessions</option>
            <option value="SecuritySettings">SecuritySettings</option>
            <option value="Authorization">Authorization</option>
          </select>
          <select
            value={auditResult}
            onChange={(e) => setAuditResult(e.target.value)}
            className="px-2.5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
          >
            <option value="all">All Results</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="denied">Denied</option>
          </select>
        </div>

        <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl max-h-[540px]">
          <table className="min-w-[960px] w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900/60 text-[10px] uppercase text-gray-500 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor (Role)</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Module / Target</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">Diff / Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-mono-num text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="py-2.5 px-4 text-gray-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 font-sans font-semibold text-gray-900 dark:text-white">
                    {log.username} <span className="text-gray-400">({log.role})</span>
                  </td>
                  <td className="py-2.5 px-4 font-bold text-[#465FFF]">{log.action}</td>
                  <td className="py-2.5 px-4 font-sans">
                    {log.module} {log.targetRecordId ? `· ${log.targetRecordId}` : ''}
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded font-sans font-bold text-[10px] uppercase ${
                        log.result === 'success'
                          ? 'bg-emerald-100 text-emerald-700'
                          : log.result === 'denied'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {log.result}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-sans text-gray-600 dark:text-gray-400 max-w-xs truncate">
                    {log.additionalContext || (log.newValue ? JSON.stringify(log.newValue) : '—')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Security Policy Settings Panel
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6 space-y-5 max-w-3xl">
      <div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Settings className="w-4 h-4 text-[#465FFF]" />
          <span>System Security &amp; Authentication Policies</span>
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Only Super Administrators can commit policy changes. Previous and new policy values are recorded in audit logs.
        </p>
      </div>

      {!settings ? (
        <p className="text-xs text-gray-500">Loading security policy...</p>
      ) : (
        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Customer Min Password Length</label>
              <input
                type="number"
                min={8}
                max={64}
                value={settings.minPasswordLength}
                onChange={(e) => setSettings({ ...settings, minPasswordLength: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-mono-num bg-transparent"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Admin Min Password Length (12+)</label>
              <input
                type="number"
                min={12}
                max={64}
                value={settings.adminMinPasswordLength}
                onChange={(e) => setSettings({ ...settings, adminMinPasswordLength: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-mono-num bg-transparent"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Password History Reuse Limit</label>
              <input
                type="number"
                min={1}
                max={24}
                value={settings.passwordHistoryLimit}
                onChange={(e) => setSettings({ ...settings, passwordHistoryLimit: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-mono-num bg-transparent"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Max Failed Login Attempts</label>
              <input
                type="number"
                min={3}
                max={20}
                value={settings.maxLoginAttempts}
                onChange={(e) => setSettings({ ...settings, maxLoginAttempts: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-mono-num bg-transparent"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Account Lockout Duration (minutes)</label>
              <input
                type="number"
                min={1}
                max={1440}
                value={settings.lockoutDurationMinutes}
                onChange={(e) => setSettings({ ...settings, lockoutDurationMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-mono-num bg-transparent"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Access Token Lifetime (minutes)</label>
              <input
                type="number"
                min={5}
                max={120}
                value={settings.accessTokenLifetimeMinutes}
                onChange={(e) => setSettings({ ...settings, accessTokenLifetimeMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-mono-num bg-transparent"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Refresh Token Lifetime (days)</label>
              <input
                type="number"
                min={1}
                max={90}
                value={settings.refreshTokenLifetimeDays}
                onChange={(e) => setSettings({ ...settings, refreshTokenLifetimeDays: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-mono-num bg-transparent"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Idle Session Timeout (minutes)</label>
              <input
                type="number"
                min={5}
                max={1440}
                value={settings.idleSessionTimeoutMinutes}
                onChange={(e) => setSettings({ ...settings, idleSessionTimeoutMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-mono-num bg-transparent"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Max Session Lifetime (hours)</label>
              <input
                type="number"
                min={1}
                max={720}
                value={settings.maxSessionLifetimeHours}
                onChange={(e) => setSettings({ ...settings, maxSessionLifetimeHours: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-mono-num bg-transparent"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">MFA Policy Enforcement</label>
              <select
                value={settings.mfaEnforcement}
                onChange={(e) => setSettings({ ...settings, mfaEnforcement: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
              >
                <option value="superadmin_and_admin">Required for SuperAdmin &amp; Admin</option>
                <option value="all_privileged">Required for All Privileged Staff</option>
                <option value="optional">Optional (Recommended)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Password Reset Expiry (minutes)</label>
              <input
                type="number"
                min={5}
                max={120}
                value={settings.passwordResetExpiryMinutes}
                onChange={(e) => setSettings({ ...settings, passwordResetExpiryMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-mono-num bg-transparent"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Admin Invitation Expiry (hours)</label>
              <input
                type="number"
                min={1}
                max={168}
                value={settings.invitationExpiryHours}
                onChange={(e) => setSettings({ ...settings, invitationExpiryHours: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-mono-num bg-transparent"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-5 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireEmailVerification}
                onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
                className="rounded accent-[#465FFF]"
              />
              <span>Require Email OTP Verification Before Customer Sign-In</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireMobileVerification}
                onChange={(e) => setSettings({ ...settings, requireMobileVerification: e.target.checked })}
                className="rounded accent-[#465FFF]"
              />
              <span>Require Mobile Number Verification</span>
            </label>
          </div>

          {hasPermission('security.settings.manage') && (
            <button
              type="submit"
              disabled={savingSettings}
              className="px-5 py-2.5 rounded-lg bg-[#465FFF] hover:bg-[#3641F5] text-white font-semibold cursor-pointer"
            >
              {savingSettings ? 'Saving Policies...' : 'Save Security Configuration'}
            </button>
          )}
        </form>
      )}
    </div>
  );
};
