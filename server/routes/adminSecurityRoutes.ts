import { Router } from 'express';
import { z } from 'zod';
import { SecurityStore } from '../data/securityStore.ts';
import {
  createAuthMiddleware,
  getClientIp,
  getUserAgent,
  validateCsrfToken,
  type AuthContextRequest
} from '../middleware/authMiddleware.ts';

function escapeCsvCell(val: unknown): string {
  const str = String(val ?? '').replace(/"/g, '""');
  return `"${str}"`;
}

const settingsUpdateSchema = z.object({
  minPasswordLength: z.number().int().min(8).max(64).optional(),
  adminMinPasswordLength: z.number().int().min(12).max(64).optional(),
  passwordHistoryLimit: z.number().int().min(1).max(24).optional(),
  maxLoginAttempts: z.number().int().min(3).max(20).optional(),
  lockoutDurationMinutes: z.number().int().min(1).max(1440).optional(),
  accessTokenLifetimeMinutes: z.number().int().min(5).max(120).optional(),
  refreshTokenLifetimeDays: z.number().int().min(1).max(90).optional(),
  idleSessionTimeoutMinutes: z.number().int().min(5).max(1440).optional(),
  maxSessionLifetimeHours: z.number().int().min(1).max(720).optional(),
  mfaEnforcement: z.enum(['superadmin_and_admin', 'all_privileged', 'optional']).optional(),
  requireEmailVerification: z.boolean().optional(),
  requireMobileVerification: z.boolean().optional(),
  passwordResetExpiryMinutes: z.number().int().min(5).max(120).optional(),
  invitationExpiryHours: z.number().int().min(1).max(168).optional()
});

export function createAdminSecurityRoutes(store: SecurityStore) {
  const router = Router();
  const mw = createAuthMiddleware(store);

  router.use(mw.authenticateAdmin, mw.requireActiveAccount);

  // Security Policy Settings
  router.get('/security/settings', mw.requirePermission('security.view'), (_req, res) => {
    res.json({ settings: store.getSettings() });
  });

  router.put('/security/settings', validateCsrfToken, mw.requirePermission('security.settings.manage'), (req: AuthContextRequest, res) => {
    const parsed = settingsUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: parsed.error.issues[0]?.message || 'Invalid security policy values.'
      });
      return;
    }
    const { previous, current } = store.updateSettings(parsed.data, req.authUser!.id);
    store.recordAuditLog({
      userId: req.authUser!.id,
      action: 'SECURITY_SETTINGS_UPDATED',
      module: 'SecuritySettings',
      targetRecordId: current.id,
      previousValue: previous as unknown as Record<string, unknown>,
      newValue: current as unknown as Record<string, unknown>,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success',
      additionalContext: 'Updated authentication & session policies'
    });
    res.json({ settings: current });
  });

  // Security Events & Alerts
  router.get('/security/events', mw.requirePermission('security.view'), (_req, res) => {
    res.json({ events: store.listSecurityEvents() });
  });

  router.patch('/security/events/:id/resolve', validateCsrfToken, mw.requirePermission('security.view'), (req: AuthContextRequest, res) => {
    const resolved = store.resolveSecurityEvent(req.params.id, req.authUser!.id);
    if (!resolved) {
      res.status(404).json({ error: 'EVENT_NOT_FOUND', message: 'Security event not found.' });
      return;
    }
    store.recordAuditLog({
      userId: req.authUser!.id,
      action: 'SECURITY_EVENT_RESOLVED',
      module: 'SecurityMonitoring',
      targetRecordId: resolved.id,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success'
    });
    res.json({ event: resolved });
  });

  // Login History Monitor
  router.get('/security/login-history', mw.requirePermission('security.login_history.view'), (req, res) => {
    const userId = req.query.userId ? String(req.query.userId) : undefined;
    const onlyFailed = req.query.failed === 'true';
    let history = store.listLoginHistory(userId);
    if (onlyFailed) history = history.filter((h) => !h.success);
    res.json({ history: history.slice(0, 200) });
  });

  // Active Sessions across platform
  router.get('/sessions', mw.requirePermission('security.view'), (req: AuthContextRequest, res) => {
    const currentId = req.authSession!.id;
    const sessions = store.listSessions().map((s) => ({
      ...s,
      isCurrent: s.id === currentId
    }));
    res.json({ sessions });
  });

  router.delete('/sessions/:id', validateCsrfToken, mw.requirePermission('security.sessions.revoke'), (req: AuthContextRequest, res) => {
    const session = store.findSessionById(req.params.id);
    if (!session) {
      res.status(404).json({ error: 'SESSION_NOT_FOUND', message: 'Session not found.' });
      return;
    }
    if (store.userHasRoleSlug(session.userId, 'superadmin') && !store.userHasRoleSlug(req.authUser!.id, 'superadmin')) {
      res.status(403).json({
        error: 'FORBIDDEN_SUPERADMIN_SESSION',
        message: 'Only Super Administrators can terminate a Super Administrator session.'
      });
      return;
    }
    store.revokeSession(session.id, `Terminated by admin ${req.authUser!.username}`);
    store.recordAuditLog({
      userId: req.authUser!.id,
      action: 'SESSION_REVOKED_BY_ADMIN',
      module: 'Sessions',
      targetRecordId: session.id,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success',
      additionalContext: `Terminated session ${session.id} for user ${session.userId}`
    });
    res.json({ success: true });
  });

  // Append-Only Audit Logs Viewer & Export
  router.get('/audit-logs', mw.requirePermission('security.audit_logs.view'), (req, res) => {
    const search = String(req.query.search || '').trim().toLowerCase();
    const moduleFilter = String(req.query.module || 'all');
    const resultFilter = String(req.query.result || 'all');
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(100, Math.max(10, Number(req.query.pageSize || 25)));

    let logs = store.listAuditLogs();
    if (moduleFilter !== 'all') {
      logs = logs.filter((l) => l.module === moduleFilter);
    }
    if (resultFilter !== 'all') {
      logs = logs.filter((l) => l.result === resultFilter);
    }
    if (search) {
      logs = logs.filter(
        (l) =>
          l.action.toLowerCase().includes(search) ||
          l.username.toLowerCase().includes(search) ||
          l.additionalContext.toLowerCase().includes(search) ||
          (l.targetRecordId || '').toLowerCase().includes(search)
      );
    }

    if (req.query.format === 'csv') {
      const headers = ['Audit ID', 'Timestamp', 'Username', 'Role', 'Action', 'Module', 'Target ID', 'Result', 'IP', 'Context'];
      const rows = logs.map((l) =>
        [l.id, l.timestamp, l.username, l.role, l.action, l.module, l.targetRecordId || '', l.result, l.ipAddress, l.additionalContext]
          .map(escapeCsvCell)
          .join(',')
      );
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="thesteps-audit-logs.csv"');
      res.send([headers.join(','), ...rows].join('\n'));
      return;
    }

    const total = logs.length;
    const start = (page - 1) * pageSize;
    res.json({
      auditLogs: logs.slice(start, start + pageSize),
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      }
    });
  });

  // Explicitly forbid tampering/deletion of audit logs
  router.all('/audit-logs*', (_req, res) => {
    res.status(405).json({
      error: 'AUDIT_LOGS_IMMUTABLE',
      message: 'Audit logs are strictly append-only and cannot be modified or deleted.'
    });
  });

  return router;
}
