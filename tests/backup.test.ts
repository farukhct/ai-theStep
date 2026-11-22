import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../server/app.ts';
import { SecurityStore } from '../server/data/securityStore.ts';
import { CommerceStore } from '../server/data/commerceStore.ts';

class TestCookieClient {
  private baseUrl: string;
  private cookies = new Map<string, string>();
  private accessToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private captureCookies(headers: Headers) {
    const getSetCookie = (headers as unknown as { getSetCookie?: () => string[] }).getSetCookie;
    const rawList = getSetCookie ? getSetCookie.call(headers) : [];
    for (const raw of rawList) {
      const [pair] = raw.split(';');
      const eqIdx = pair.indexOf('=');
      if (eqIdx === -1) continue;
      const name = pair.slice(0, eqIdx).trim();
      const val = pair.slice(eqIdx + 1).trim();
      if (!val || raw.toLowerCase().includes('max-age=0')) {
        this.cookies.delete(name);
      } else {
        this.cookies.set(name, val);
      }
    }
  }

  async ensureCsrf() {
    await this.request('GET', '/api/auth/csrf');
  }

  async request<T = any>(
    method: string,
    path: string,
    body?: unknown,
    extraHeaders: Record<string, string> = {}
  ): Promise<{ status: number; data: T }> {
    const headers: Record<string, string> = {
      'User-Agent': 'BackupTestSuite/1.0',
      ...extraHeaders
    };
    if (this.cookies.size > 0) {
      headers.Cookie = Array.from(this.cookies.entries())
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
    }
    if (this.accessToken && !headers.Authorization) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }
    const csrf = this.cookies.get('thesteps_csrf');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase()) && csrf && !headers['X-CSRF-Token']) {
      headers['X-CSRF-Token'] = csrf;
    }
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    this.captureCookies(res.headers);
    const data = await res.json().catch(() => null);
    if (data && typeof data === 'object' && typeof (data as any).accessToken === 'string') {
      this.accessToken = (data as any).accessToken;
    }
    return { status: res.status, data };
  }
}

describe('TheSteps Database Backup & Restore Architecture', () => {
  let server: http.Server;
  let baseUrl = '';
  let securityStore: SecurityStore;
  let commerceStore: CommerceStore;

  const SUPERADMIN_EMAIL = 'backup-super@thesteps.test';
  const SUPERADMIN_PASS = 'Backup!SuperSecurePass#2026';

  before(async () => {
    securityStore = new SecurityStore({
      persistPath: null,
      bootstrapSuperadminEmail: SUPERADMIN_EMAIL,
      bootstrapSuperadminPassword: SUPERADMIN_PASS
    });
    commerceStore = new CommerceStore({ persistPath: null });

    const { app } = createApp({
      store: securityStore,
      commerceStore,
      backupDir: null,
      exposeDebugTokens: true
    });

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as { port: number };
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('enforces auth, CSRF, and RBAC separation between backup and restore permissions', async () => {
    const anon = new TestCookieClient(baseUrl);
    const unauthRes = await anon.request('GET', '/api/admin/database/backups');
    assert.equal(unauthRes.status, 401);

    // Login as SuperAdmin
    const superClient = new TestCookieClient(baseUrl);
    await superClient.ensureCsrf();
    const loginRes = await superClient.request('POST', '/api/admin/auth/login', {
      identifier: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASS
    });
    assert.equal(loginRes.status, 200);

    // Create an operator with administrator role (has database.backup, NOT database.restore)
    const adminRole = securityStore.findRoleBySlug('administrator')!;
    const opPass = 'Valkyrie!FalconRiver#2026';
    const opRes = await superClient.request('POST', '/api/admin/users', {
      mode: 'direct',
      fullName: 'Backup Operator',
      username: 'backupoperator',
      email: 'backup-op@thesteps.test',
      phoneNumber: '01712340099',
      designation: 'Operations Lead',
      roleIds: [adminRole.id],
      accountStatus: 'active',
      password: opPass
    });
    assert.equal(opRes.status, 201);

    const opClient = new TestCookieClient(baseUrl);
    await opClient.ensureCsrf();
    const opLogin = await opClient.request('POST', '/api/admin/auth/login', {
      identifier: 'backup-op@thesteps.test',
      password: opPass
    });
    assert.equal(opLogin.status, 200);

    // Operator CAN create a backup
    const createRes = await opClient.request('POST', '/api/admin/database/backups', {
      label: 'Operator Daily Snapshot',
      scope: 'commerce'
    });
    assert.equal(createRes.status, 201);
    const createdId = createRes.data.backup.id;

    // Operator CANNOT restore or delete backups
    const denyRestore = await opClient.request('POST', `/api/admin/database/backups/${createdId}/restore`, {});
    assert.equal(denyRestore.status, 403);

    const denyDelete = await opClient.request('DELETE', `/api/admin/database/backups/${createdId}`);
    assert.equal(denyDelete.status, 403);

    // SuperAdmin without CSRF header is blocked
    const noCsrf = await fetch(`${baseUrl}/api/admin/database/backups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${loginRes.data.accessToken}`
      },
      body: JSON.stringify({ scope: 'full' })
    });
    assert.equal(noCsrf.status, 403);
  });

  it('creates SHA-256 hashed snapshots, redacts credentials on download, and rejects unsafe IDs', async () => {
    const superClient = new TestCookieClient(baseUrl);
    await superClient.ensureCsrf();
    const loginRes = await superClient.request('POST', '/api/admin/auth/login', {
      identifier: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASS
    });
    assert.equal(loginRes.status, 200);

    const createRes = await superClient.request('POST', '/api/admin/database/backups', {
      label: 'Full Baseline Snapshot',
      scope: 'full',
      storefront: {
        transactions: [{ id: 'tx-1', productName: 'Test Watch', quantityIn: 5 }],
        suppliers: [{ id: 'sup-1', name: 'Dhaka Supplier' }],
        expenses: [{ id: 'exp-1', amount: 1200 }]
      }
    });
    assert.equal(createRes.status, 201);
    assert.match(createRes.data.backup.checksumSha256, /^[a-f0-9]{64}$/);
    assert.equal(createRes.data.backup.counts.transactions, 1);

    const backupId = createRes.data.backup.id;
    const downloadRes = await superClient.request('GET', `/api/admin/database/backups/${backupId}/download`);
    assert.equal(downloadRes.status, 200);
    const downloaded = downloadRes.data.backup;

    assert.ok(Array.isArray(downloaded.security.users));
    assert.ok(downloaded.security.users.length >= 1);
    for (const user of downloaded.security.users) {
      assert.equal(user.passwordHash, null);
    }
    assert.deepEqual(downloaded.security.userSessions, []);
    assert.deepEqual(downloaded.security.refreshTokens, []);
    assert.deepEqual(downloaded.security.passwordResetTokens, []);

    // Unsafe path traversal / invalid ID check
    const badIdRes = await superClient.request('GET', '/api/admin/database/backups/bad..id/download');
    assert.equal(badIdRes.status, 400);
  });

  it('restores snapshots with automatic pre-restore safety backup, preserves session & password hashes, and validates uploads', async () => {
    const superClient = new TestCookieClient(baseUrl);
    await superClient.ensureCsrf();
    await superClient.request('POST', '/api/admin/auth/login', {
      identifier: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASS
    });

    const initialOrderCount = commerceStore.exportSnapshot().orders.length;

    // 1. Capture baseline full snapshot
    const baselineRes = await superClient.request('POST', '/api/admin/database/backups', {
      label: 'Before Test Mutation',
      scope: 'full'
    });
    assert.equal(baselineRes.status, 201);
    const baselineId = baselineRes.data.backup.id;

    // 2. Mutate commerce orders in-memory (simulate new order after snapshot)
    const snapBefore = commerceStore.exportSnapshot();
    commerceStore.restoreSnapshot({
      orders: [
        ...snapBefore.orders,
        {
          ...snapBefore.orders[0],
          id: 'ord-test-mutated-999',
          orderNumber: 'SD-26-MUT999'
        }
      ]
    });
    assert.equal(commerceStore.exportSnapshot().orders.length, initialOrderCount + 1);

    // 3. Restore from baseline server snapshot
    const restoreRes = await superClient.request('POST', `/api/admin/database/backups/${baselineId}/restore`, {});
    assert.equal(restoreRes.status, 200);
    assert.equal(restoreRes.data.success, true);
    assert.ok(restoreRes.data.preRestoreBackupId.startsWith('bkp_prerestore_'));
    assert.equal(commerceStore.exportSnapshot().orders.length, initialOrderCount);

    // Verify acting admin session survived restore
    const meRes = await superClient.request('GET', '/api/auth/me');
    assert.equal(meRes.status, 200);
    assert.equal(meRes.data.user.email, SUPERADMIN_EMAIL);

    // 4. Reject invalid JSON schema upload
    const invalidUpload = await superClient.request('POST', '/api/admin/database/restore-upload', {
      backup: { hello: 'world' }
    });
    assert.equal(invalidUpload.status, 400);

    // 5. Download sanitized backup & restore via upload -> existing SuperAdmin passwordHash must be preserved!
    const dlRes = await superClient.request('GET', `/api/admin/database/backups/${baselineId}/download`);
    const uploadRes = await superClient.request('POST', '/api/admin/database/restore-upload', {
      backup: dlRes.data.backup,
      sections: { commerce: true, storefront: true, security: true }
    });
    assert.equal(uploadRes.status, 200);
    assert.equal(uploadRes.data.success, true);

    // Verify SuperAdmin can still log in with original password after restoring sanitized download
    const freshLogin = new TestCookieClient(baseUrl);
    await freshLogin.ensureCsrf();
    const reAuth = await freshLogin.request('POST', '/api/admin/auth/login', {
      identifier: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASS
    });
    assert.equal(reAuth.status, 200);

    // 6. Delete the pre-restore safety snapshot
    const delRes = await superClient.request(
      'DELETE',
      `/api/admin/database/backups/${restoreRes.data.preRestoreBackupId}`
    );
    assert.equal(delRes.status, 200);
    assert.equal(delRes.data.success, true);
  });
});
