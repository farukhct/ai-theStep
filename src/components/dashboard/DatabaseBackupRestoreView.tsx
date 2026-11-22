import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  ShieldCheck,
  HardDrive,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileJson,
  Lock,
  Copy,
  Check,
  Layers,
  Users,
  ShoppingBag,
  History
} from 'lucide-react';
import { apiRequest, ApiError } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { useNotification } from '../../context/NotificationContext';
import { auth } from '../../config/firebase';

interface BackupCounts {
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

interface BackupSummary {
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

interface DatabaseStatsResponse {
  commerce: {
    products: number;
    orders: number;
    coupons: number;
    paymentSessions: number;
  };
  security: {
    users: number;
    roles: number;
    permissions: number;
    securityEvents: number;
    auditLogs: number;
  };
  backupsCount: number;
  lastBackupAt: string | null;
}

interface RestoreResponse {
  success: boolean;
  preRestoreBackupId: string;
  restoredCounts: {
    commerce: { products: number; coupons: number; orders: number; paymentSessions: number } | null;
    security: {
      users: number;
      roles: number;
      permissions: number;
      rolePermissions: number;
      securityEvents: number;
      auditLogs: number;
    } | null;
  };
  restoredStorefront: Record<string, any> | null;
}

interface ParsedUploadPreview {
  filename: string;
  sizeBytes: number;
  format: 'v1_envelope' | 'legacy_storefront';
  createdAt: string | null;
  checksumSha256: string | null;
  hasCommerce: boolean;
  hasStorefront: boolean;
  hasSecurity: boolean;
  counts: {
    products: number;
    orders: number;
    coupons: number;
    erpRecords: number;
    users: number;
    roles: number;
    auditLogs: number;
  };
  rawObject: Record<string, any>;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function triggerJsonDownload(data: unknown, filename: string) {
  const json = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const DatabaseBackupRestoreView: React.FC = () => {
  const { hasPermission, refreshSessionUser } = useAuth();
  const {
    products,
    orders,
    transactions,
    suppliers,
    purchaseOrders,
    expenses,
    bids,
    syncStatus,
    getStorefrontSnapshotPayload,
    restoreStoreSnapshot,
    pullFirestoreBackup,
    syncFirestoreCollections
  } = useStore();
  const { addToast } = useNotification();

  const canBackup = hasPermission('database.backup');
  const canRestore = hasPermission('database.restore');

  const [stats, setStats] = useState<DatabaseStatsResponse | null>(null);
  const [backups, setBackups] = useState<BackupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Create Snapshot form state
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [snapshotScope, setSnapshotScope] = useState<'full' | 'commerce' | 'security'>('full');
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [exportingDownload, setExportingDownload] = useState(false);

  // Upload & Restore state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadPreview, setUploadPreview] = useState<ParsedUploadPreview | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [restoreSections, setRestoreSections] = useState({
    commerce: true,
    storefront: true,
    security: false
  });
  const [restoringUpload, setRestoringUpload] = useState(false);
  const [confirmUploadReady, setConfirmUploadReady] = useState(false);

  // Snapshot table state
  const [kindFilter, setKindFilter] = useState<'all' | 'manual' | 'pre_restore'>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);

  // Cloud Firestore backup state
  const [firestoreBusy, setFirestoreBusy] = useState(false);
  const fbUser = auth.currentUser;

  const loadDatabaseState = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [statsRes, backupsRes] = await Promise.all([
        apiRequest<DatabaseStatsResponse>('/api/admin/database/stats'),
        apiRequest<{ backups: BackupSummary[] }>('/api/admin/database/backups')
      ]);
      setStats(statsRes);
      setBackups(backupsRes.backups || []);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load database backup registry.';
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDatabaseState();
  }, [loadDatabaseState]);

  const handleCreateSnapshot = async (downloadAfter = false) => {
    if (!canBackup) {
      addToast('Permission Required', 'Your role does not have database.backup permission.', 'error');
      return;
    }
    if (downloadAfter) setExportingDownload(true);
    else setCreatingBackup(true);

    try {
      const payload: Record<string, unknown> = {
        scope: snapshotScope
      };
      if (snapshotLabel.trim()) {
        payload.label = snapshotLabel.trim();
      }
      if (snapshotScope === 'full' || snapshotScope === 'commerce') {
        payload.storefront = getStorefrontSnapshotPayload();
      }

      const res = await apiRequest<{ backup: BackupSummary }>('/api/admin/database/backups', {
        method: 'POST',
        body: payload
      });

      if (downloadAfter) {
        const dl = await apiRequest<{ filename: string; backup: unknown }>(
          `/api/admin/database/backups/${encodeURIComponent(res.backup.id)}/download`
        );
        triggerJsonDownload(dl.backup, dl.filename);
        addToast('Backup Exported', `Created snapshot & downloaded ${dl.filename}.`, 'success');
      } else {
        addToast('Snapshot Created', `Server snapshot "${res.backup.label}" saved securely.`, 'success');
      }

      setSnapshotLabel('');
      await loadDatabaseState();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Could not create database backup.';
      addToast('Backup Failed', msg, 'error');
    } finally {
      setCreatingBackup(false);
      setExportingDownload(false);
    }
  };

  const handleDownloadSnapshot = async (id: string) => {
    setDownloadingId(id);
    try {
      const dl = await apiRequest<{ filename: string; backup: unknown }>(
        `/api/admin/database/backups/${encodeURIComponent(id)}/download`
      );
      triggerJsonDownload(dl.backup, dl.filename);
      addToast('Download Started', `Sanitized archive ${dl.filename} downloaded.`, 'success');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to download backup snapshot.';
      addToast('Download Failed', msg, 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRestoreServerSnapshot = async (id: string) => {
    if (!canRestore) {
      addToast('SuperAdmin Required', 'Only operators with database.restore permission can restore snapshots.', 'error');
      return;
    }
    setRestoringId(id);
    try {
      const res = await apiRequest<RestoreResponse>(
        `/api/admin/database/backups/${encodeURIComponent(id)}/restore`,
        {
          method: 'POST',
          body: {}
        }
      );

      if (res.restoredStorefront) {
        await restoreStoreSnapshot(res.restoredStorefront);
      }
      if (res.restoredCounts.security) {
        await refreshSessionUser();
      }

      setConfirmRestoreId(null);
      addToast(
        'Database Restored',
        `Restored from ${id}. Automatic safety snapshot saved as ${res.preRestoreBackupId}.`,
        'success'
      );
      await loadDatabaseState();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Database restoration failed.';
      addToast('Restore Failed', msg, 'error');
    } finally {
      setRestoringId(null);
    }
  };

  const handleDeleteSnapshot = async (id: string) => {
    if (!canRestore) return;
    setDeletingId(id);
    try {
      await apiRequest(`/api/admin/database/backups/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      setConfirmDeleteId(null);
      addToast('Snapshot Deleted', `Snapshot ${id} removed from server archive.`, 'info');
      await loadDatabaseState();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to delete snapshot.';
      addToast('Delete Failed', msg, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleFileSelected = async (file: File | null) => {
    setUploadError(null);
    setUploadPreview(null);
    setConfirmUploadReady(false);
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json')) {
      setUploadError('Only .json database backup files are supported.');
      return;
    }
    if (file.size > 7.5 * 1024 * 1024) {
      setUploadError('Backup file exceeds maximum 7.5 MB upload size limit.');
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Record<string, any>;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setUploadError('Invalid backup structure: root must be a JSON object.');
        return;
      }

      const isEnvelope =
        parsed.version === '1.0' ||
        Boolean(parsed.commerce) ||
        Boolean(parsed.security) ||
        Boolean(parsed.storefront);

      if (isEnvelope) {
        const comm = parsed.commerce || {};
        const sf = parsed.storefront || {};
        const sec = parsed.security || {};
        const hasCommerce = Boolean(parsed.commerce);
        const hasStorefront = Boolean(parsed.storefront || parsed.commerce);
        const hasSecurity = Boolean(parsed.security);

        if (!hasCommerce && !hasStorefront && !hasSecurity) {
          setUploadError('Envelope contains no recognizable database sections.');
          return;
        }

        const erpRecords =
          (Array.isArray(sf.transactions) ? sf.transactions.length : 0) +
          (Array.isArray(sf.suppliers) ? sf.suppliers.length : 0) +
          (Array.isArray(sf.purchaseOrders) ? sf.purchaseOrders.length : 0) +
          (Array.isArray(sf.expenses) ? sf.expenses.length : 0) +
          (Array.isArray(sf.bids) ? sf.bids.length : 0);

        setUploadPreview({
          filename: file.name,
          sizeBytes: file.size,
          format: 'v1_envelope',
          createdAt: parsed.createdAt || null,
          checksumSha256: parsed.checksumSha256 || null,
          hasCommerce,
          hasStorefront,
          hasSecurity,
          counts: {
            products: Array.isArray(comm.products) ? comm.products.length : 0,
            orders: Array.isArray(comm.orders) ? comm.orders.length : 0,
            coupons: Array.isArray(comm.coupons) ? comm.coupons.length : 0,
            erpRecords,
            users: Array.isArray(sec.users) ? sec.users.length : 0,
            roles: Array.isArray(sec.roles) ? sec.roles.length : 0,
            auditLogs: Array.isArray(sec.auditLogs) ? sec.auditLogs.length : 0
          },
          rawObject: parsed
        });
        setRestoreSections({
          commerce: hasCommerce,
          storefront: hasStorefront,
          security: hasSecurity
        });
      } else {
        const hasLegacyKeys =
          Array.isArray(parsed.products) ||
          Array.isArray(parsed.orders) ||
          Array.isArray(parsed.coupons) ||
          Array.isArray(parsed.transactions) ||
          Array.isArray(parsed.suppliers) ||
          Array.isArray(parsed.expenses);

        if (!hasLegacyKeys) {
          setUploadError('Unrecognized JSON schema. Expected a TheSteps backup JSON archive.');
          return;
        }

        const erpRecords =
          (Array.isArray(parsed.transactions) ? parsed.transactions.length : 0) +
          (Array.isArray(parsed.suppliers) ? parsed.suppliers.length : 0) +
          (Array.isArray(parsed.purchaseOrders) ? parsed.purchaseOrders.length : 0) +
          (Array.isArray(parsed.expenses) ? parsed.expenses.length : 0) +
          (Array.isArray(parsed.bids) ? parsed.bids.length : 0);

        setUploadPreview({
          filename: file.name,
          sizeBytes: file.size,
          format: 'legacy_storefront',
          createdAt: parsed.timestamp || null,
          checksumSha256: null,
          hasCommerce: true,
          hasStorefront: true,
          hasSecurity: false,
          counts: {
            products: Array.isArray(parsed.products) ? parsed.products.length : 0,
            orders: Array.isArray(parsed.orders) ? parsed.orders.length : 0,
            coupons: Array.isArray(parsed.coupons) ? parsed.coupons.length : 0,
            erpRecords,
            users: 0,
            roles: 0,
            auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs.length : 0
          },
          rawObject: parsed
        });
        setRestoreSections({
          commerce: true,
          storefront: true,
          security: false
        });
      }
    } catch {
      setUploadError('Could not parse JSON file. Ensure the file is valid UTF-8 JSON.');
    }
  };

  const handleConfirmUploadRestore = async () => {
    if (!uploadPreview || !canRestore) return;
    setRestoringUpload(true);
    try {
      const res = await apiRequest<RestoreResponse>('/api/admin/database/restore-upload', {
        method: 'POST',
        body: {
          backup: uploadPreview.rawObject,
          sections: restoreSections
        }
      });

      if (res.restoredStorefront && restoreSections.storefront) {
        await restoreStoreSnapshot(res.restoredStorefront);
      }
      if (res.restoredCounts.security && restoreSections.security) {
        await refreshSessionUser();
      }

      addToast(
        'Upload Restored',
        `Database restored cleanly. Pre-restore safety snapshot: ${res.preRestoreBackupId}`,
        'success'
      );
      setUploadPreview(null);
      setConfirmUploadReady(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadDatabaseState();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to restore from uploaded JSON file.';
      addToast('Upload Restore Failed', msg, 'error');
    } finally {
      setRestoringUpload(false);
    }
  };

  const handleFirestoreExport = async () => {
    setFirestoreBusy(true);
    try {
      const data = await pullFirestoreBackup();
      const filename = `TheSteps_Firestore_Cloud_Backup_${new Date().toISOString().split('T')[0]}.json`;
      triggerJsonDownload(
        {
          version: '1.0',
          source: 'cloud-firestore',
          createdAt: new Date().toISOString(),
          commerce: {
            products: data.products,
            orders: data.orders,
            coupons: data.coupons
          },
          storefront: {
            transactions: data.transactions,
            suppliers: data.suppliers,
            expenses: data.expenses,
            bids: data.bids
          }
        },
        filename
      );
      addToast('Firestore Exported', `Downloaded Cloud Firestore snapshot (${filename}).`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Cloud Firestore export failed.';
      addToast('Firestore Notice', msg, 'error');
    } finally {
      setFirestoreBusy(false);
    }
  };

  const handleFirestoreSync = async () => {
    setFirestoreBusy(true);
    try {
      const result = await syncFirestoreCollections();
      addToast('Cloud Synced', `Synchronized ${result.docCount} documents to Cloud Firestore.`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Cloud Firestore sync failed.';
      addToast('Firestore Notice', msg, 'error');
    } finally {
      setFirestoreBusy(false);
    }
  };

  const handleCopyHash = async (id: string, hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHashId(id);
      setTimeout(() => setCopiedHashId(null), 1500);
    } catch {
      // Ignore clipboard failures in restricted frames
    }
  };

  const erpTotalCount =
    transactions.length + suppliers.length + purchaseOrders.length + expenses.length + bids.length;

  const filteredBackups = backups.filter((b) => kindFilter === 'all' || b.kind === kindFilter);

  return (
    <div className="space-y-6">
      {/* Header & Live Cluster Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-[#465FFF]" />
            <span>Database Backup &amp; Disaster Recovery</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Create atomic server snapshots, export sanitized JSON archives, sync Cloud Firestore, and restore with automatic pre-restore safeguards.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              syncStatus === 'online'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Firestore: {syncStatus === 'online' ? 'Connected' : 'Local Fallback'}</span>
          </span>

          <button
            type="button"
            onClick={loadDatabaseState}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loadError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10 px-4 py-3 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={loadDatabaseState}
            className="px-2.5 py-1 rounded-md bg-rose-600 text-white font-semibold hover:bg-rose-700 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Database Health KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Commerce Store</span>
            <span className="w-8 h-8 rounded-lg bg-[#ECF3FF] dark:bg-[#465FFF]/15 text-[#465FFF] dark:text-[#7592FF] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold font-mono-num text-gray-900 dark:text-white">
            {stats?.commerce.products ?? products.length}{' '}
            <span className="text-xs font-sans font-normal text-gray-500">SKUs</span>
          </p>
          <p className="mt-1 text-[11px] font-mono-num text-gray-500 dark:text-gray-400">
            {stats?.commerce.orders ?? orders.length} orders · {stats?.commerce.coupons ?? 0} coupons
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">ERP &amp; Ledgers</span>
            <span className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold font-mono-num text-gray-900 dark:text-white">
            {erpTotalCount}{' '}
            <span className="text-xs font-sans font-normal text-gray-500">records</span>
          </p>
          <p className="mt-1 text-[11px] font-mono-num text-gray-500 dark:text-gray-400">
            {suppliers.length} suppliers · {expenses.length} expenses · {transactions.length} txns
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Identity &amp; RBAC</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold font-mono-num text-gray-900 dark:text-white">
            {stats?.security.users ?? '—'}{' '}
            <span className="text-xs font-sans font-normal text-gray-500">users</span>
          </p>
          <p className="mt-1 text-[11px] font-mono-num text-gray-500 dark:text-gray-400">
            {stats?.security.roles ?? '—'} roles · {stats?.security.auditLogs ?? '—'} audit entries
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Server Snapshots</span>
            <span className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold font-mono-num text-gray-900 dark:text-white">
            {stats?.backupsCount ?? backups.length}{' '}
            <span className="text-xs font-sans font-normal text-gray-500">archives</span>
          </p>
          <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 truncate">
            Last:{' '}
            {stats?.lastBackupAt
              ? new Date(stats.lastBackupAt).toLocaleString()
              : 'No snapshots yet'}
          </p>
        </div>
      </div>

      {/* Primary Action Grid: Create Snapshot + Upload & Restore */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card A: Create Server Backup & Export */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-[#465FFF]" />
                <span>Create Backup Snapshot</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Writes an integrity-hashed snapshot to server storage. Downloaded JSON files automatically redact password hashes, TOTP secrets, and active session tokens.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              <ShieldCheck className="w-3 h-3" />
              SHA-256
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Snapshot Label (Optional)
              </label>
              <input
                type="text"
                value={snapshotLabel}
                onChange={(e) => setSnapshotLabel(e.target.value)}
                placeholder="e.g. Pre-Eid Campaign Full Snapshot"
                maxLength={80}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-[#465FFF] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Backup Scope
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'full', title: 'Full Cluster', sub: 'Commerce + ERP + RBAC' },
                    { id: 'commerce', title: 'Commerce & ERP', sub: 'Products, Orders, Ledger' },
                    { id: 'security', title: 'Security & RBAC', sub: 'Users, Roles, Audit' }
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSnapshotScope(item.id)}
                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      snapshotScope === item.id
                        ? 'border-[#465FFF] bg-[#ECF3FF]/70 dark:bg-[#465FFF]/15'
                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                    }`}
                  >
                    <p
                      className={`text-xs font-semibold ${
                        snapshotScope === item.id
                          ? 'text-[#465FFF] dark:text-[#7592FF]'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {item.title}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {item.sub}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                disabled={!canBackup || creatingBackup || exportingDownload}
                onClick={() => handleCreateSnapshot(false)}
                className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#465FFF] hover:bg-[#3641F5] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                <Database className="w-4 h-4" />
                <span>{creatingBackup ? 'Creating Snapshot...' : 'Create Server Snapshot'}</span>
              </button>

              <button
                type="button"
                disabled={!canBackup || creatingBackup || exportingDownload}
                onClick={() => handleCreateSnapshot(true)}
                className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{exportingDownload ? 'Exporting JSON...' : 'Create & Download JSON'}</span>
              </button>
            </div>
          </div>

          {/* Cloud Firestore Controls */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-[#465FFF]" />
                <span>Cloud Firestore Mirror</span>
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {fbUser
                  ? `Signed in via Google (${fbUser.email})`
                  : 'Sign in with verified admin Google account for direct Firestore push/pull.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={firestoreBusy || !fbUser}
                onClick={handleFirestoreSync}
                className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer disabled:opacity-40"
              >
                Push Sync
              </button>
              <button
                type="button"
                disabled={firestoreBusy || !fbUser}
                onClick={handleFirestoreExport}
                className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer disabled:opacity-40"
              >
                Pull JSON
              </button>
            </div>
          </div>
        </div>

        {/* Card B: Restore from JSON File Upload */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#465FFF]" />
                <span>Restore from JSON Archive</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Upload a downloaded TheSteps backup JSON file to inspect its contents and restore selected database layers.
              </p>
            </div>
            {!canRestore && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                <Lock className="w-3 h-3" />
                SuperAdmin Only
              </span>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={(e) => handleFileSelected(e.target.files?.[0] || null)}
            className="hidden"
          />

          {!uploadPreview ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-[#465FFF] dark:hover:border-[#7592FF] bg-gray-50/70 dark:bg-gray-900/40 p-8 text-center transition-colors cursor-pointer"
            >
              <FileJson className="w-8 h-8 mx-auto text-[#465FFF] mb-2" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Click to select a .json backup file
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Supports v1.0 Cluster Backups &amp; Storefront ERP Exports (up to 7.5 MB)
              </p>
            </button>
          ) : (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 p-4 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                    {uploadPreview.filename}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {formatBytes(uploadPreview.sizeBytes)} ·{' '}
                    {uploadPreview.format === 'v1_envelope' ? 'Full Cluster v1.0' : 'Legacy Storefront JSON'}
                    {uploadPreview.createdAt
                      ? ` · ${new Date(uploadPreview.createdAt).toLocaleString()}`
                      : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUploadPreview(null);
                    setConfirmUploadReady(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                >
                  Clear
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono-num">
                <div className="rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-2">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {uploadPreview.counts.products}
                  </p>
                  <p className="text-[10px] font-sans text-gray-500">Products</p>
                </div>
                <div className="rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-2">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {uploadPreview.counts.orders}
                  </p>
                  <p className="text-[10px] font-sans text-gray-500">Orders</p>
                </div>
                <div className="rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-2">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {uploadPreview.counts.users} / {uploadPreview.counts.roles}
                  </p>
                  <p className="text-[10px] font-sans text-gray-500">Users / Roles</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <p className="font-semibold text-gray-700 dark:text-gray-300">
                  Select layers to restore:
                </p>
                <div className="flex flex-wrap gap-3">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={restoreSections.commerce}
                      disabled={!uploadPreview.hasCommerce}
                      onChange={(e) =>
                        setRestoreSections((prev) => ({ ...prev, commerce: e.target.checked }))
                      }
                      className="rounded border-gray-300 text-[#465FFF]"
                    />
                    <span className="text-gray-700 dark:text-gray-200">
                      Server Commerce ({uploadPreview.counts.products} SKUs, {uploadPreview.counts.orders} orders)
                    </span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={restoreSections.storefront}
                      disabled={!uploadPreview.hasStorefront}
                      onChange={(e) =>
                        setRestoreSections((prev) => ({ ...prev, storefront: e.target.checked }))
                      }
                      className="rounded border-gray-300 text-[#465FFF]"
                    />
                    <span className="text-gray-700 dark:text-gray-200">
                      ERP Ledgers ({uploadPreview.counts.erpRecords} entries)
                    </span>
                  </label>
                  {uploadPreview.hasSecurity && (
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={restoreSections.security}
                        onChange={(e) =>
                          setRestoreSections((prev) => ({ ...prev, security: e.target.checked }))
                        }
                        className="rounded border-gray-300 text-[#465FFF]"
                      />
                      <span className="text-gray-700 dark:text-gray-200">
                        Identity &amp; RBAC ({uploadPreview.counts.users} users)
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {!confirmUploadReady ? (
                <button
                  type="button"
                  disabled={
                    !canRestore ||
                    (!restoreSections.commerce && !restoreSections.storefront && !restoreSections.security)
                  }
                  onClick={() => setConfirmUploadReady(true)}
                  className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40"
                >
                  Review &amp; Restore Uploaded Archive
                </button>
              ) : (
                <div className="rounded-lg border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 p-3 space-y-2.5">
                  <p className="text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      An automatic pre-restore safety snapshot will be created before overwriting selected collections. Your current admin session remains active.
                    </span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmUploadReady(false)}
                      disabled={restoringUpload}
                      className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-semibold text-gray-700 dark:text-gray-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={restoringUpload}
                      onClick={handleConfirmUploadRestore}
                      className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                    >
                      {restoringUpload ? 'Restoring...' : 'Confirm & Restore Now'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {uploadError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Snapshot Archive Table */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-[#465FFF]" />
              <span>Server Backup Snapshot Registry</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Persistent point-in-time recovery archives stored in server storage (.data/backups)
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg text-xs">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'manual', label: 'Manual' },
                { id: 'pre_restore', label: 'Pre-Restore Safety' }
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setKindFilter(tab.id)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  kindFilter === tab.id
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
          <table className="min-w-[920px] w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800 text-gray-500 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Snapshot &amp; Label</th>
                <th className="py-3 px-4">Scope / Type</th>
                <th className="py-3 px-4">Records Summary</th>
                <th className="py-3 px-4">SHA-256 &amp; Size</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading && backups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500 dark:text-gray-400">
                    Loading server backup snapshots...
                  </td>
                </tr>
              ) : filteredBackups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500 dark:text-gray-400">
                    No backup snapshots found. Create a full snapshot above to enable point-in-time recovery.
                  </td>
                </tr>
              ) : (
                filteredBackups.map((bkp) => (
                  <React.Fragment key={bkp.id}>
                    <tr className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02]">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-900 dark:text-white">{bkp.label}</p>
                        <p className="font-mono-num text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                          {bkp.id}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-[#ECF3FF] dark:bg-[#465FFF]/15 text-[#465FFF] dark:text-[#7592FF] font-semibold uppercase text-[10px]">
                            {bkp.scope}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-semibold uppercase text-[10px] ${
                              bkp.kind === 'pre_restore'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                            }`}
                          >
                            {bkp.kind === 'pre_restore' ? 'Safety Auto' : 'Manual'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono-num text-[11px] text-gray-600 dark:text-gray-300">
                        <div>
                          {bkp.counts.products} SKUs · {bkp.counts.orders} orders · {bkp.counts.coupons} coupons
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {bkp.counts.users} users · {bkp.counts.roles} roles · {bkp.counts.auditLogs} logs
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono-num text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleCopyHash(bkp.id, bkp.checksumSha256)}
                          className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-[#465FFF] cursor-pointer"
                          title="Copy SHA-256 integrity checksum"
                        >
                          <span>{bkp.checksumSha256.slice(0, 10)}…</span>
                          {copiedHashId === bkp.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                          {formatBytes(bkp.sizeBytes)}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        <p>{new Date(bkp.createdAt).toLocaleString()}</p>
                        <p className="text-gray-400">by {bkp.createdBy.username}</p>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={!canBackup || downloadingId === bkp.id}
                            onClick={() => handleDownloadSnapshot(bkp.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 text-[11px] font-semibold cursor-pointer disabled:opacity-40"
                            title="Download sanitized JSON backup"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{downloadingId === bkp.id ? '...' : 'JSON'}</span>
                          </button>

                          {canRestore && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmDeleteId(null);
                                  setConfirmRestoreId(confirmRestoreId === bkp.id ? null : bkp.id);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#ECF3FF] hover:bg-[#DDE9FF] dark:bg-[#465FFF]/15 dark:hover:bg-[#465FFF]/25 text-[#465FFF] dark:text-[#7592FF] text-[11px] font-semibold cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Restore</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmRestoreId(null);
                                  setConfirmDeleteId(confirmDeleteId === bkp.id ? null : bkp.id);
                                }}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                                title="Delete snapshot"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {confirmRestoreId === bkp.id && (
                      <tr className="bg-amber-50/80 dark:bg-amber-500/10">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 shrink-0" />
                              <span>
                                Restore <strong>{bkp.label}</strong>? An automatic pre-restore safety snapshot will be created before rolling back data.
                              </span>
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setConfirmRestoreId(null)}
                                disabled={restoringId === bkp.id}
                                className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-semibold text-gray-700 dark:text-gray-200 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={restoringId === bkp.id}
                                onClick={() => handleRestoreServerSnapshot(bkp.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{restoringId === bkp.id ? 'Restoring...' : 'Confirm Restore'}</span>
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}

                    {confirmDeleteId === bkp.id && (
                      <tr className="bg-rose-50/80 dark:bg-rose-500/10">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-xs text-rose-900 dark:text-rose-200">
                              Permanently delete snapshot <strong>{bkp.id}</strong> from server storage?
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-semibold text-gray-700 dark:text-gray-200 cursor-pointer"
                              >
                                Keep
                              </button>
                              <button
                                type="button"
                                disabled={deletingId === bkp.id}
                                onClick={() => handleDeleteSnapshot(bkp.id)}
                                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                              >
                                {deletingId === bkp.id ? 'Deleting...' : 'Delete Permanently'}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
