import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import { z } from 'zod';
import { CommerceStore } from '../data/commerceStore.ts';
import { SecurityStore, type SecurityDatabaseSchema } from '../data/securityStore.ts';
import {
  createAuthMiddleware,
  getClientIp,
  getUserAgent,
  validateCsrfToken,
  type AuthContextRequest
} from '../middleware/authMiddleware.ts';

const BACKUP_ID_REGEX = /^bkp_[a-zA-Z0-9_-]{4,80}$/;

const storefrontSnapshotSchema = z
  .object({
    products: z.array(z.record(z.string(), z.any())).optional(),
    orders: z.array(z.record(z.string(), z.any())).optional(),
    coupons: z.array(z.record(z.string(), z.any())).optional(),
    transactions: z.array(z.record(z.string(), z.any())).optional(),
    suppliers: z.array(z.record(z.string(), z.any())).optional(),
    purchaseOrders: z.array(z.record(z.string(), z.any())).optional(),
    expenses: z.array(z.record(z.string(), z.any())).optional(),
    bids: z.array(z.record(z.string(), z.any())).optional(),
    auditLogs: z.array(z.record(z.string(), z.any())).optional()
  })
  .passthrough();

const createBackupSchema = z.object({
  label: z.string().trim().min(2).max(80).optional(),
  scope: z.enum(['full', 'commerce', 'security']).default('full'),
  storefront: storefrontSnapshotSchema.optional()
});

const restoreOptionsSchema = z.object({
  sections: z
    .object({
      commerce: z.boolean().optional(),
      storefront: z.boolean().optional(),
      security: z.boolean().optional()
    })
    .optional()
});

const uploadedBackupSchema = z.object({
  backup: z.record(z.string(), z.any()),
  sections: z
    .object({
      commerce: z.boolean().optional(),
      storefront: z.boolean().optional(),
      security: z.boolean().optional()
    })
    .optional()
});

const commerceSectionSchema = z.object({
  products: z.array(z.record(z.string(), z.any())).optional(),
  coupons: z.array(z.record(z.string(), z.any())).optional(),
  orders: z.array(z.record(z.string(), z.any())).optional(),
  paymentSessions: z.array(z.record(z.string(), z.any())).optional()
});

const securitySectionSchema = z
  .object({
    users: z.array(z.record(z.string(), z.any())).optional(),
    roles: z.array(z.record(z.string(), z.any())).optional(),
    permissions: z.array(z.record(z.string(), z.any())).optional(),
    userRoles: z.array(z.record(z.string(), z.any())).optional(),
    rolePermissions: z.array(z.record(z.string(), z.any())).optional(),
    userPermissionOverrides: z.array(z.record(z.string(), z.any())).optional(),
    securitySettings: z.record(z.string(), z.any()).optional(),
    auditLogs: z.array(z.record(z.string(), z.any())).optional(),
    securityEvents: z.array(z.record(z.string(), z.any())).optional(),
    loginHistory: z.array(z.record(z.string(), z.any())).optional(),
    userNotifications: z.array(z.record(z.string(), z.any())).optional()
  })
  .passthrough();

export interface BackupCounts {
  products: number;
  orders: number;
  coupons: number;
  paymentSessions: number;
  transactions: number;
  suppliers: number;
  purchaseOrders: number;
  expenses: number;
  bids: number;
  users: number;
  roles: number;
  auditLogs: number;
}

export interface BackupEnvelope {
  version: '1.0';
  id: string;
  label: string;
  scope: 'full' | 'commerce' | 'security';
  kind: 'manual' | 'pre_restore';
  createdAt: string;
  createdBy: {
    userId: string;
    username: string;
    email: string;
  };
  checksumSha256: string;
  sizeBytes: number;
  counts: BackupCounts;
  commerce?: ReturnType<CommerceStore['exportSnapshot']>;
  storefront?: Record<string, unknown[]>;
  security?: SecurityDatabaseSchema;
}

export interface BackupSummary {
  version: '1.0';
  id: string;
  label: string;
  scope: 'full' | 'commerce' | 'security';
  kind: 'manual' | 'pre_restore';
  createdAt: string;
  createdBy: {
    userId: string;
    username: string;
    email: string;
  };
  checksumSha256: string;
  sizeBytes: number;
  counts: BackupCounts;
}

export interface AdminBackupRoutesOptions {
  backupDir?: string | null;
}

function sanitizeSecuritySnapshot(security: SecurityDatabaseSchema): SecurityDatabaseSchema {
  const clone = structuredClone(security);
  clone.users = (clone.users || []).map((u) => ({
    ...u,
    passwordHash: null
  }));
  clone.userSessions = [];
  clone.refreshTokens = [];
  clone.loginAttempts = [];
  clone.passwordResetTokens = [];
  clone.passwordHistory = [];
  clone.verificationTokens = [];
  clone.mfaRecoveryCodes = [];
  clone.adminInvitations = (clone.adminInvitations || []).map((inv) => ({
    ...inv,
    tokenHash: '[REDACTED]'
  }));
  clone.userMfa = (clone.userMfa || []).map((mfa) => ({
    ...mfa,
    secretEncrypted: '[REDACTED]'
  }));
  return clone;
}

function computeChecksum(payload: {
  scope: string;
  commerce?: unknown;
  storefront?: unknown;
  security?: unknown;
}): string {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export function createAdminBackupRoutes(
  securityStore: SecurityStore,
  commerceStore: CommerceStore,
  options: AdminBackupRoutesOptions = {}
) {
  const router = Router();
  const mw = createAuthMiddleware(securityStore);
  const backupDir =
    options.backupDir === undefined
      ? path.resolve(process.cwd(), '.data', 'backups')
      : options.backupDir;

  const memoryStore = new Map<string, BackupEnvelope>();

  const ensureBackupDir = () => {
    if (!backupDir) return;
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
  };

  const resolveSafeBackupPath = (id: string): string => {
    if (!BACKUP_ID_REGEX.test(id)) {
      throw Object.assign(new Error('Invalid backup identifier format.'), {
        status: 400,
        code: 'INVALID_BACKUP_ID'
      });
    }
    if (!backupDir) return id;
    const base = path.resolve(backupDir);
    const resolved = path.resolve(base, `${id}.json`);
    if (!resolved.startsWith(base + path.sep)) {
      throw Object.assign(new Error('Unsafe backup path rejected.'), {
        status: 400,
        code: 'INVALID_BACKUP_PATH'
      });
    }
    return resolved;
  };

  const saveEnvelope = (envelope: BackupEnvelope) => {
    const serialized = JSON.stringify(envelope, null, 2);
    envelope.sizeBytes = Buffer.byteLength(serialized, 'utf8');
    if (!backupDir) {
      memoryStore.set(envelope.id, structuredClone(envelope));
      return;
    }
    ensureBackupDir();
    const targetPath = resolveSafeBackupPath(envelope.id);
    const tempPath = `${targetPath}.tmp-${process.pid}-${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(envelope, null, 2), 'utf8');
    fs.renameSync(tempPath, targetPath);
  };

  const loadEnvelope = (id: string): BackupEnvelope | null => {
    if (!BACKUP_ID_REGEX.test(id)) return null;
    if (!backupDir) {
      const found = memoryStore.get(id);
      return found ? structuredClone(found) : null;
    }
    const targetPath = resolveSafeBackupPath(id);
    if (!fs.existsSync(targetPath)) return null;
    const raw = fs.readFileSync(targetPath, 'utf8');
    return JSON.parse(raw) as BackupEnvelope;
  };

  const listSummaries = (): BackupSummary[] => {
    const envelopes: BackupEnvelope[] = [];
    if (!backupDir) {
      for (const item of memoryStore.values()) {
        envelopes.push(item);
      }
    } else {
      ensureBackupDir();
      const files = fs.readdirSync(backupDir).filter((f) => f.endsWith('.json'));
      for (const file of files) {
        const id = file.replace(/\.json$/, '');
        if (!BACKUP_ID_REGEX.test(id)) continue;
        try {
          const raw = fs.readFileSync(path.resolve(backupDir, file), 'utf8');
          const parsed = JSON.parse(raw) as BackupEnvelope;
          envelopes.push(parsed);
        } catch {
          // Skip malformed backup file without crashing listing
        }
      }
    }

    return envelopes
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((env) => ({
        version: env.version,
        id: env.id,
        label: env.label,
        scope: env.scope,
        kind: env.kind,
        createdAt: env.createdAt,
        createdBy: env.createdBy,
        checksumSha256: env.checksumSha256,
        sizeBytes: env.sizeBytes,
        counts: env.counts
      }));
  };

  const buildSnapshotEnvelope = (params: {
    idPrefix: 'bkp_manual' | 'bkp_prerestore';
    kind: 'manual' | 'pre_restore';
    label: string;
    scope: 'full' | 'commerce' | 'security';
    actor: { id: string; username: string; email: string };
    storefront?: Record<string, unknown[]>;
  }): BackupEnvelope => {
    const includeCommerce = params.scope === 'full' || params.scope === 'commerce';
    const includeSecurity = params.scope === 'full' || params.scope === 'security';

    const commerce = includeCommerce ? commerceStore.exportSnapshot() : undefined;
    const security = includeSecurity ? securityStore.exportSnapshot({ sanitizeSensitive: false }) : undefined;
    const storefront = includeCommerce ? params.storefront : undefined;

    const checksumSha256 = computeChecksum({
      scope: params.scope,
      commerce,
      storefront,
      security
    });

    const id = `${params.idPrefix}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const counts: BackupCounts = {
      products: commerce?.products.length ?? 0,
      orders: commerce?.orders.length ?? 0,
      coupons: commerce?.coupons.length ?? 0,
      paymentSessions: commerce?.paymentSessions.length ?? 0,
      transactions: Array.isArray(storefront?.transactions) ? storefront.transactions.length : 0,
      suppliers: Array.isArray(storefront?.suppliers) ? storefront.suppliers.length : 0,
      purchaseOrders: Array.isArray(storefront?.purchaseOrders) ? storefront.purchaseOrders.length : 0,
      expenses: Array.isArray(storefront?.expenses) ? storefront.expenses.length : 0,
      bids: Array.isArray(storefront?.bids) ? storefront.bids.length : 0,
      users: security?.users.length ?? 0,
      roles: security?.roles.length ?? 0,
      auditLogs: security?.auditLogs.length ?? 0
    };

    const envelope: BackupEnvelope = {
      version: '1.0',
      id,
      label: params.label,
      scope: params.scope,
      kind: params.kind,
      createdAt: new Date().toISOString(),
      createdBy: {
        userId: params.actor.id,
        username: params.actor.username,
        email: params.actor.email
      },
      checksumSha256,
      sizeBytes: 0,
      counts,
      ...(commerce ? { commerce } : {}),
      ...(storefront ? { storefront } : {}),
      ...(security ? { security } : {})
    };

    saveEnvelope(envelope);
    return envelope;
  };

  router.use(mw.authenticateAdmin, mw.requireActiveAccount);

  // Live database statistics for dashboard header
  router.get('/stats', mw.requirePermission('database.backup'), (_req, res) => {
    const commerce = commerceStore.exportSnapshot();
    const security = securityStore.exportSnapshot({ sanitizeSensitive: true });
    const summaries = listSummaries();
    res.json({
      commerce: {
        products: commerce.products.length,
        orders: commerce.orders.length,
        coupons: commerce.coupons.length,
        paymentSessions: commerce.paymentSessions.length
      },
      security: {
        users: security.users.length,
        roles: security.roles.length,
        permissions: security.permissions.length,
        securityEvents: security.securityEvents.length,
        auditLogs: security.auditLogs.length
      },
      backupsCount: summaries.length,
      lastBackupAt: summaries[0]?.createdAt || null
    });
  });

  // List stored server snapshots
  router.get('/backups', mw.requirePermission('database.backup'), (_req, res) => {
    res.json({ backups: listSummaries() });
  });

  // Create new server snapshot
  router.post('/backups', validateCsrfToken, mw.requirePermission('database.backup'), (req: AuthContextRequest, res) => {
    const parsed = createBackupSchema.safeParse(req.body || {});
    if (!parsed.success) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: parsed.error.issues[0]?.message || 'Invalid backup creation parameters.'
      });
      return;
    }

    const actor = req.authUser!;
    const label =
      parsed.data.label ||
      `${parsed.data.scope.toUpperCase()} Snapshot · ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`;

    const storefrontData = parsed.data.storefront
      ? {
          transactions: parsed.data.storefront.transactions || [],
          suppliers: parsed.data.storefront.suppliers || [],
          purchaseOrders: parsed.data.storefront.purchaseOrders || [],
          expenses: parsed.data.storefront.expenses || [],
          bids: parsed.data.storefront.bids || [],
          auditLogs: parsed.data.storefront.auditLogs || []
        }
      : undefined;

    const envelope = buildSnapshotEnvelope({
      idPrefix: 'bkp_manual',
      kind: 'manual',
      label,
      scope: parsed.data.scope,
      actor: {
        id: actor.id,
        username: actor.username,
        email: actor.email
      },
      storefront: storefrontData
    });

    securityStore.recordAuditLog({
      userId: actor.id,
      action: 'DATABASE_BACKUP_CREATED',
      module: 'DatabaseBackup',
      targetRecordId: envelope.id,
      newValue: {
        scope: envelope.scope,
        label: envelope.label,
        checksumSha256: envelope.checksumSha256,
        counts: envelope.counts
      },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success',
      additionalContext: `Created ${envelope.scope} server database snapshot`
    });

    const summary: BackupSummary = {
      version: envelope.version,
      id: envelope.id,
      label: envelope.label,
      scope: envelope.scope,
      kind: envelope.kind,
      createdAt: envelope.createdAt,
      createdBy: envelope.createdBy,
      checksumSha256: envelope.checksumSha256,
      sizeBytes: envelope.sizeBytes,
      counts: envelope.counts
    };

    res.status(201).json({ backup: summary });
  });

  // Download sanitized JSON snapshot (never exposes credential hashes, TOTP secrets, or active tokens)
  router.get('/backups/:id/download', mw.requirePermission('database.backup'), (req: AuthContextRequest, res) => {
    const { id } = req.params;
    if (!BACKUP_ID_REGEX.test(id)) {
      res.status(400).json({ error: 'INVALID_BACKUP_ID', message: 'Invalid backup identifier.' });
      return;
    }

    const envelope = loadEnvelope(id);
    if (!envelope) {
      res.status(404).json({ error: 'BACKUP_NOT_FOUND', message: 'Backup snapshot not found.' });
      return;
    }

    const sanitizedEnvelope: BackupEnvelope = {
      ...envelope,
      ...(envelope.security ? { security: sanitizeSecuritySnapshot(envelope.security) } : {})
    };

    securityStore.recordAuditLog({
      userId: req.authUser!.id,
      action: 'DATABASE_BACKUP_DOWNLOADED',
      module: 'DatabaseBackup',
      targetRecordId: envelope.id,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success',
      additionalContext: 'Downloaded sanitized JSON backup archive'
    });

    res.json({
      filename: `TheSteps_${envelope.scope}_backup_${envelope.id}.json`,
      backup: sanitizedEnvelope
    });
  });

  // Restore from an existing server snapshot (always creates a safety pre-restore snapshot first)
  router.post('/backups/:id/restore', validateCsrfToken, mw.requirePermission('database.restore'), (req: AuthContextRequest, res) => {
    const { id } = req.params;
    if (!BACKUP_ID_REGEX.test(id)) {
      res.status(400).json({ error: 'INVALID_BACKUP_ID', message: 'Invalid backup identifier.' });
      return;
    }

    const parsedBody = restoreOptionsSchema.safeParse(req.body || {});
    if (!parsedBody.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid restore options.' });
      return;
    }

    const envelope = loadEnvelope(id);
    if (!envelope) {
      res.status(404).json({ error: 'BACKUP_NOT_FOUND', message: 'Backup snapshot not found.' });
      return;
    }

    const actor = req.authUser!;
    const preRestore = buildSnapshotEnvelope({
      idPrefix: 'bkp_prerestore',
      kind: 'pre_restore',
      label: `Auto Pre-Restore Safety Snapshot (before ${envelope.id})`,
      scope: 'full',
      actor: {
        id: actor.id,
        username: actor.username,
        email: actor.email
      }
    });

    const secOpts = parsedBody.data.sections || {};
    const shouldRestoreCommerce = secOpts.commerce ?? Boolean(envelope.commerce);
    const shouldRestoreStorefront = secOpts.storefront ?? Boolean(envelope.storefront || envelope.commerce);
    const shouldRestoreSecurity = secOpts.security ?? Boolean(envelope.security);

    let restoredCommerceStats: ReturnType<CommerceStore['restoreSnapshot']> | null = null;
    if (shouldRestoreCommerce && envelope.commerce) {
      restoredCommerceStats = commerceStore.restoreSnapshot(envelope.commerce);
    }

    let restoredSecurityStats: ReturnType<SecurityStore['restoreSnapshot']> | null = null;
    if (shouldRestoreSecurity && envelope.security) {
      restoredSecurityStats = securityStore.restoreSnapshot(envelope.security, {
        actorUserId: actor.id,
        activeSessionId: req.authSession?.id
      });
    }

    securityStore.recordAuditLog({
      userId: actor.id,
      action: 'DATABASE_RESTORED',
      module: 'DatabaseBackup',
      targetRecordId: envelope.id,
      newValue: {
        preRestoreBackupId: preRestore.id,
        restoredCommerceStats,
        restoredSecurityStats,
        restoredStorefront: shouldRestoreStorefront
      },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success',
      additionalContext: `Restored database from server snapshot ${envelope.id}`
    });

    res.json({
      success: true,
      restoredFromId: envelope.id,
      preRestoreBackupId: preRestore.id,
      restoredCounts: {
        commerce: restoredCommerceStats,
        security: restoredSecurityStats
      },
      restoredCommerce: shouldRestoreCommerce && envelope.commerce ? envelope.commerce : null,
      restoredStorefront: shouldRestoreStorefront
        ? {
            ...(envelope.storefront || {}),
            ...(envelope.commerce
              ? {
                  products: envelope.commerce.products,
                  orders: envelope.commerce.orders,
                  coupons: envelope.commerce.coupons
                }
              : {})
          }
        : null
    });
  });

  // Restore from an uploaded JSON backup file (supports v1 envelope & legacy StoreContext exportDataJson format)
  router.post('/restore-upload', validateCsrfToken, mw.requirePermission('database.restore'), (req: AuthContextRequest, res) => {
    const parsedOuter = uploadedBackupSchema.safeParse(req.body);
    if (!parsedOuter.success) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Uploaded payload must contain a valid JSON backup object.'
      });
      return;
    }

    const rawBackup = parsedOuter.data.backup;
    const isEnvelopeFormat =
      rawBackup.version === '1.0' ||
      Boolean(rawBackup.commerce) ||
      Boolean(rawBackup.security) ||
      Boolean(rawBackup.storefront);

    const sections = parsedOuter.data.sections || {};

    let commerceInput: ReturnType<CommerceStore['exportSnapshot']> | null = null;
    let securityInput: Partial<SecurityDatabaseSchema> | null = null;
    let storefrontInput: Record<string, unknown[]> | null = null;

    if (isEnvelopeFormat) {
      if (rawBackup.commerce) {
        const commCheck = commerceSectionSchema.safeParse(rawBackup.commerce);
        if (!commCheck.success) {
          res.status(400).json({
            error: 'INVALID_COMMERCE_SECTION',
            message: 'Uploaded backup contains invalid commerce collection data.'
          });
          return;
        }
        commerceInput = commCheck.data as ReturnType<CommerceStore['exportSnapshot']>;
      }
      if (rawBackup.security) {
        const secCheck = securitySectionSchema.safeParse(rawBackup.security);
        if (!secCheck.success) {
          res.status(400).json({
            error: 'INVALID_SECURITY_SECTION',
            message: 'Uploaded backup contains invalid security/RBAC collection data.'
          });
          return;
        }
        securityInput = secCheck.data as Partial<SecurityDatabaseSchema>;
      }
      if (rawBackup.storefront) {
        const sfCheck = storefrontSnapshotSchema.safeParse(rawBackup.storefront);
        if (!sfCheck.success) {
          res.status(400).json({
            error: 'INVALID_STOREFRONT_SECTION',
            message: 'Uploaded backup contains invalid storefront/ERP ledger data.'
          });
          return;
        }
        storefrontInput = sfCheck.data as Record<string, unknown[]>;
      }
    } else {
      // Legacy StoreContext.exportDataJson() format
      const legacyCheck = storefrontSnapshotSchema.safeParse(rawBackup);
      if (
        !legacyCheck.success ||
        (!legacyCheck.data.products &&
          !legacyCheck.data.orders &&
          !legacyCheck.data.coupons &&
          !legacyCheck.data.transactions &&
          !legacyCheck.data.suppliers &&
          !legacyCheck.data.expenses)
      ) {
        res.status(400).json({
          error: 'UNRECOGNIZED_BACKUP_FORMAT',
          message: 'JSON file does not match a recognized TheSteps backup schema.'
        });
        return;
      }

      commerceInput = {
        products: (legacyCheck.data.products || []) as ReturnType<CommerceStore['exportSnapshot']>['products'],
        orders: (legacyCheck.data.orders || []) as ReturnType<CommerceStore['exportSnapshot']>['orders'],
        coupons: (legacyCheck.data.coupons || []) as ReturnType<CommerceStore['exportSnapshot']>['coupons'],
        paymentSessions: []
      };

      storefrontInput = {
        ...(legacyCheck.data.products ? { products: legacyCheck.data.products } : {}),
        ...(legacyCheck.data.orders ? { orders: legacyCheck.data.orders } : {}),
        ...(legacyCheck.data.coupons ? { coupons: legacyCheck.data.coupons } : {}),
        ...(legacyCheck.data.transactions ? { transactions: legacyCheck.data.transactions } : {}),
        ...(legacyCheck.data.suppliers ? { suppliers: legacyCheck.data.suppliers } : {}),
        ...(legacyCheck.data.purchaseOrders ? { purchaseOrders: legacyCheck.data.purchaseOrders } : {}),
        ...(legacyCheck.data.expenses ? { expenses: legacyCheck.data.expenses } : {}),
        ...(legacyCheck.data.bids ? { bids: legacyCheck.data.bids } : {}),
        ...(legacyCheck.data.auditLogs ? { auditLogs: legacyCheck.data.auditLogs } : {})
      };
    }

    if (!commerceInput && !securityInput && !storefrontInput) {
      res.status(400).json({
        error: 'EMPTY_BACKUP',
        message: 'No restorable database collections found inside the uploaded JSON file.'
      });
      return;
    }

    const actor = req.authUser!;
    const preRestore = buildSnapshotEnvelope({
      idPrefix: 'bkp_prerestore',
      kind: 'pre_restore',
      label: 'Auto Pre-Restore Safety Snapshot (before JSON upload restore)',
      scope: 'full',
      actor: {
        id: actor.id,
        username: actor.username,
        email: actor.email
      }
    });

    const restoreComm = sections.commerce ?? Boolean(commerceInput);
    const restoreSf = sections.storefront ?? Boolean(storefrontInput || commerceInput);
    const restoreSec = sections.security ?? Boolean(securityInput);

    let restoredCommerceStats: ReturnType<CommerceStore['restoreSnapshot']> | null = null;
    if (restoreComm && commerceInput) {
      restoredCommerceStats = commerceStore.restoreSnapshot(commerceInput);
    }

    let restoredSecurityStats: ReturnType<SecurityStore['restoreSnapshot']> | null = null;
    if (restoreSec && securityInput) {
      restoredSecurityStats = securityStore.restoreSnapshot(securityInput, {
        actorUserId: actor.id,
        activeSessionId: req.authSession?.id
      });
    }

    securityStore.recordAuditLog({
      userId: actor.id,
      action: 'DATABASE_RESTORE_UPLOADED',
      module: 'DatabaseBackup',
      targetRecordId: preRestore.id,
      newValue: {
        preRestoreBackupId: preRestore.id,
        restoredCommerceStats,
        restoredSecurityStats,
        restoredStorefront: restoreSf
      },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success',
      additionalContext: 'Restored database collections from uploaded JSON backup file'
    });

    res.json({
      success: true,
      preRestoreBackupId: preRestore.id,
      restoredCounts: {
        commerce: restoredCommerceStats,
        security: restoredSecurityStats
      },
      restoredCommerce: restoreComm && commerceInput ? commerceInput : null,
      restoredStorefront: restoreSf
        ? {
            ...(storefrontInput || {}),
            ...(commerceInput
              ? {
                  products: commerceInput.products,
                  orders: commerceInput.orders,
                  coupons: commerceInput.coupons
                }
              : {})
          }
        : null
    });
  });

  // Delete server snapshot
  router.delete('/backups/:id', validateCsrfToken, mw.requirePermission('database.restore'), (req: AuthContextRequest, res) => {
    const { id } = req.params;
    if (!BACKUP_ID_REGEX.test(id)) {
      res.status(400).json({ error: 'INVALID_BACKUP_ID', message: 'Invalid backup identifier.' });
      return;
    }

    if (!backupDir) {
      if (!memoryStore.has(id)) {
        res.status(404).json({ error: 'BACKUP_NOT_FOUND', message: 'Backup snapshot not found.' });
        return;
      }
      memoryStore.delete(id);
    } else {
      const targetPath = resolveSafeBackupPath(id);
      if (!fs.existsSync(targetPath)) {
        res.status(404).json({ error: 'BACKUP_NOT_FOUND', message: 'Backup snapshot not found.' });
        return;
      }
      fs.unlinkSync(targetPath);
    }

    securityStore.recordAuditLog({
      userId: req.authUser!.id,
      action: 'DATABASE_BACKUP_DELETED',
      module: 'DatabaseBackup',
      targetRecordId: id,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success',
      additionalContext: `Deleted snapshot ${id}`
    });

    res.json({ success: true, deletedId: id });
  });

  return router;
}
