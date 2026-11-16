import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Monitor,
  Smartphone,
  Clock,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  AlertTriangle,
  History,
  LogOut,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { apiRequest } from '../../services/apiClient';
import { LoginHistoryRecord, UserSessionRecord } from '../../types';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

interface PersonalSecurityPanelProps {
  initialSection?: 'password' | 'mfa' | 'sessions' | 'activity';
}

export const PersonalSecurityPanel: React.FC<PersonalSecurityPanelProps> = ({
  initialSection = 'mfa'
}) => {
  const { currentUser, refreshSessionUser } = useAuth();
  const { addToast } = useNotification();

  const [section, setSection] = useState<'password' | 'mfa' | 'sessions' | 'activity'>(initialSection);
  const [sessions, setSessions] = useState<UserSessionRecord[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryRecord[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Change Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // TOTP MFA state
  const [enrollData, setEnrollData] = useState<{ secret: string; otpauthUri: string } | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [disablePassword, setDisablePassword] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [mfaBusy, setMfaBusy] = useState(false);

  const isPrivileged = Boolean(currentUser && currentUser.role !== 'customer');
  const minPwLen = isPrivileged ? 12 : 8;

  const fetchSessionsAndHistory = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const [sesRes, histRes] = await Promise.all([
        apiRequest<{ sessions: UserSessionRecord[] }>('/api/auth/sessions'),
        apiRequest<{ history: LoginHistoryRecord[] }>('/api/auth/login-history')
      ]);
      setSessions(sesRes.sessions || []);
      setLoginHistory(histRes.history || []);
    } catch {
      // ignore if session expired
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    fetchSessionsAndHistory();
  }, [fetchSessionsAndHistory]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      addToast('Mismatch', 'New passwords do not match.', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      await apiRequest('/api/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword }
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      await refreshSessionUser();
      await fetchSessionsAndHistory();
      addToast('Password Changed', 'Your password was updated and other sessions were signed out.', 'success');
    } catch (err: any) {
      addToast('Password Update Failed', err.message || 'Could not update password.', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleStartMfaEnroll = async () => {
    setMfaBusy(true);
    try {
      const res = await apiRequest<{ secret: string; otpauthUri: string }>('/api/auth/mfa/enroll', {
        method: 'POST'
      });
      setEnrollData(res);
      setRecoveryCodes(null);
      setTotpCode('');
    } catch (err: any) {
      addToast('MFA Setup Failed', err.message || 'Unable to start enrollment.', 'error');
    } finally {
      setMfaBusy(false);
    }
  };

  const handleVerifyMfaEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaBusy(true);
    try {
      const res = await apiRequest<{ enabled: boolean; recoveryCodes: string[] }>('/api/auth/mfa/verify-enroll', {
        method: 'POST',
        body: { code: totpCode }
      });
      setEnrollData(null);
      setTotpCode('');
      setRecoveryCodes(res.recoveryCodes);
      await refreshSessionUser();
      addToast('MFA Activated', 'Authenticator TOTP enabled! Save your recovery codes immediately.', 'success');
    } catch (err: any) {
      addToast('Invalid Code', err.message || 'Verification failed.', 'error');
    } finally {
      setMfaBusy(false);
    }
  };

  const handleRegenerateRecovery = async () => {
    setMfaBusy(true);
    try {
      const res = await apiRequest<{ recoveryCodes: string[] }>('/api/auth/mfa/regenerate-recovery', {
        method: 'POST',
        body: { currentPassword: disablePassword }
      });
      setRecoveryCodes(res.recoveryCodes);
      setDisablePassword('');
      addToast('Codes Regenerated', 'Previous unused recovery codes were invalidated.', 'success');
    } catch (err: any) {
      addToast('Error', err.message || 'Current password confirmation required.', 'error');
    } finally {
      setMfaBusy(false);
    }
  };

  const handleDisableMfa = async () => {
    setMfaBusy(true);
    try {
      await apiRequest('/api/auth/mfa/disable', {
        method: 'POST',
        body: { currentPassword: disablePassword }
      });
      setDisablePassword('');
      setRecoveryCodes(null);
      await refreshSessionUser();
      addToast('MFA Disabled', 'Two-factor authentication disabled.', 'info');
    } catch (err: any) {
      addToast('Cannot Disable MFA', err.message || 'Check password or security policy.', 'error');
    } finally {
      setMfaBusy(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await apiRequest(`/api/auth/sessions/${sessionId}`, { method: 'DELETE' });
      await fetchSessionsAndHistory();
      addToast('Session Revoked', 'Device session terminated immediately.', 'info');
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to revoke session.', 'error');
    }
  };

  const handleRevokeAllOthers = async () => {
    try {
      const res = await apiRequest<{ revokedCount: number }>('/api/auth/sessions/revoke-others', {
        method: 'POST'
      });
      await fetchSessionsAndHistory();
      addToast('Sessions Cleaned', `Revoked ${res.revokedCount} other active session(s).`, 'success');
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to revoke sessions.', 'error');
    }
  };

  return (
    <div className="space-y-5">
      {/* Sub-navigation pills */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
        {[
          { id: 'mfa', label: 'Authenticator MFA', icon: ShieldCheck },
          { id: 'password', label: currentUser?.hasPassword ? 'Change Password' : 'Set Password', icon: KeyRound },
          { id: 'sessions', label: `Active Sessions (${sessions.length})`, icon: Monitor },
          { id: 'activity', label: 'Login Activity', icon: History }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = section === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSection(tab.id as any)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-[#292933] text-white dark:bg-[#465FFF]'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: TOTP MFA */}
      {section === 'mfa' && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Multi-Factor Authentication (TOTP Authenticator)</span>
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Protect your account with RFC 6238 time-based 6-digit codes + single-use recovery backup codes.
              </p>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
                currentUser?.mfaEnabled
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
              }`}
            >
              {currentUser?.mfaEnabled ? 'TOTP Active' : 'MFA Not Enabled'}
            </span>
          </div>

          {!currentUser?.mfaEnabled && !enrollData && (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 space-y-3">
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Use Google Authenticator, Authy, 1Password, or Bitwarden to scan and verify your secret key.
              </p>
              <button
                type="button"
                disabled={mfaBusy}
                onClick={handleStartMfaEnroll}
                className="px-4 py-2 rounded-lg bg-[#465FFF] hover:bg-[#3641F5] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                {mfaBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Set Up Authenticator App</span>
              </button>
            </div>
          )}

          {enrollData && (
            <form
              onSubmit={handleVerifyMfaEnroll}
              className="p-4 rounded-xl border border-[#465FFF]/30 bg-blue-50/40 dark:bg-blue-500/5 space-y-4"
            >
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  Step 1: Add secret key to your Authenticator app
                </p>
                <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
                  <code className="font-mono text-xs font-bold tracking-wider text-[#465FFF] break-all flex-1">
                    {enrollData.secret}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(enrollData.secret);
                      setCopiedSecret(true);
                      setTimeout(() => setCopiedSecret(false), 1800);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-xs font-semibold cursor-pointer"
                  >
                    {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSecret ? 'Copied' : 'Copy Secret'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 break-all font-mono">
                  otpauth URI: {enrollData.otpauthUri}
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-900 dark:text-white">
                  Step 2: Enter the 6-digit verification code from your app
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-40 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-mono-num text-center text-base font-bold tracking-widest bg-white dark:bg-gray-950"
                    required
                  />
                  <button
                    type="submit"
                    disabled={mfaBusy || totpCode.length !== 6}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
                  >
                    {mfaBusy ? 'Verifying...' : 'Verify & Activate MFA'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnrollData(null)}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          {recoveryCodes && (
            <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/30 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                    Save Your Single-Use Recovery Backup Codes
                  </h5>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                    Store these somewhere safe. Only hashed digests are kept by the server—they will not be shown again.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {recoveryCodes.map((code) => (
                  <code
                    key={code}
                    className="px-2.5 py-1.5 rounded bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-700 font-mono text-xs font-bold text-center text-gray-900 dark:text-white"
                  >
                    {code}
                  </code>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(recoveryCodes.join('\n'));
                  addToast('Copied', 'Recovery codes copied to clipboard.', 'success');
                }}
                className="px-3 py-1.5 rounded bg-amber-900 text-white text-[11px] font-semibold cursor-pointer"
              >
                Copy All Recovery Codes
              </button>
            </div>
          )}

          {currentUser?.mfaEnabled && (
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 space-y-3">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                Manage Active TOTP Protection
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {currentUser.hasPassword && (
                  <input
                    type="password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="Confirm current password"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-950"
                  />
                )}
                <button
                  type="button"
                  disabled={mfaBusy}
                  onClick={handleRegenerateRecovery}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#292933] hover:bg-[#1b1b28] text-white text-xs font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate Recovery Codes</span>
                </button>
                <button
                  type="button"
                  disabled={mfaBusy}
                  onClick={handleDisableMfa}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Disable MFA</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: CHANGE PASSWORD */}
      {section === 'password' && (
        <form
          onSubmit={handlePasswordSubmit}
          className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4 max-w-xl"
        >
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              {currentUser?.hasPassword ? 'Update Account Password' : 'Establish Account Password'}
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Minimum {minPwLen} characters. Updating your password revokes other active sessions.
            </p>
          </div>

          {currentUser?.hasPassword && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Current Password *
              </label>
              <div className="relative">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-950"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                >
                  {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              New Password *
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={minPwLen}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-950"
              required
            />
            <PasswordStrengthMeter password={newPassword} minLength={minPwLen} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Confirm New Password *
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              minLength={minPwLen}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-950"
              required
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="px-4 py-2 rounded-lg bg-[#ff4300] hover:bg-[#d93800] disabled:opacity-60 text-white text-xs font-bold cursor-pointer"
          >
            {savingPassword ? 'Updating...' : 'Save New Password'}
          </button>
        </form>
      )}

      {/* SECTION 3: ACTIVE SESSIONS */}
      {section === 'sessions' && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Active Device Sessions
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Sessions backed by rotating HttpOnly refresh tokens and idle timeouts.
              </p>
            </div>
            {sessions.length > 1 && (
              <button
                type="button"
                onClick={handleRevokeAllOthers}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out All Other Devices</span>
              </button>
            )}
          </div>

          {loadingSessions ? (
            <p className="py-6 text-center text-xs text-gray-500">Loading active sessions...</p>
          ) : sessions.length === 0 ? (
            <p className="py-6 text-center text-xs text-gray-500">No active sessions recorded.</p>
          ) : (
            <div className="space-y-2.5">
              {sessions.map((ses) => (
                <div
                  key={ses.id}
                  className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-200 shrink-0">
                      {/Android|iOS|iPhone/i.test(ses.os) ? (
                        <Smartphone className="w-4 h-4" />
                      ) : (
                        <Monitor className="w-4 h-4" />
                      )}
                    </div>
                    <div className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white">{ses.deviceName}</span>
                        {ses.isCurrent && (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Current Session
                          </span>
                        )}
                        {ses.isAdminSession && (
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                            Admin Portal
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 font-mono-num">
                        IP: {ses.ipAddress} · Last Active: {new Date(ses.lastActivityAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {!ses.isCurrent && (
                    <button
                      type="button"
                      onClick={() => handleRevokeSession(ses.id)}
                      className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold cursor-pointer"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: PERSONAL LOGIN ACTIVITY */}
      {section === 'activity' && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-3">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#465FFF]" />
            <span>Recent Account Login History</span>
          </h4>
          {loginHistory.length === 0 ? (
            <p className="py-6 text-center text-xs text-gray-500">No login records yet.</p>
          ) : (
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-[10px] uppercase text-gray-500">
                  <tr>
                    <th className="py-2.5 px-3">Date &amp; Time</th>
                    <th className="py-2.5 px-3">Device</th>
                    <th className="py-2.5 px-3">IP Address</th>
                    <th className="py-2.5 px-3">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-mono-num text-[11px]">
                  {loginHistory.slice(0, 20).map((entry) => (
                    <tr key={entry.id}>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-300">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 font-sans text-gray-800 dark:text-gray-200">
                        {entry.deviceName}
                      </td>
                      <td className="py-2 px-3 text-gray-500">{entry.ipAddress}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded font-sans font-bold text-[10px] ${
                            entry.success
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {entry.success ? 'Success' : entry.failureReason || 'Failed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
