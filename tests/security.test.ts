import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../server/app.ts';
import { SecurityStore } from '../server/data/securityStore.ts';
import { generateTotpCodeForTimestamp } from '../server/security/crypto.ts';

class CookieClient {
  private baseUrl: string;
  private cookies = new Map<string, string>();

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

  getCookie(name: string): string | undefined {
    return this.cookies.get(name);
  }

  setCookie(name: string, value: string) {
    this.cookies.set(name, value);
  }

  cloneWithSameBase(): CookieClient {
    const c = new CookieClient(this.baseUrl);
    for (const [k, v] of this.cookies.entries()) c.setCookie(k, v);
    return c;
  }

  async ensureCsrf() {
    await this.request('GET', '/api/auth/csrf');
  }

  async request<T = any>(
    method: string,
    path: string,
    body?: unknown,
    extraHeaders: Record<string, string> = {}
  ): Promise<{ status: number; data: T; text: string }> {
    const headers: Record<string, string> = {
      'User-Agent': 'SecurityTestSuite/1.0 (Linux)',
      ...extraHeaders
    };
    if (this.cookies.size > 0) {
      headers.Cookie = Array.from(this.cookies.entries())
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
    }
    const csrf = this.cookies.get('thesteps_csrf');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase()) && csrf && !('X-CSRF-Token' in extraHeaders)) {
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
    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, data, text };
  }
}

describe('TheSteps Security, Authentication, RBAC & Audit Architecture', () => {
  let server: http.Server;
  let baseUrl = '';
  let store: SecurityStore;

  const SUPERADMIN_EMAIL = 'superadmin@thesteps.test';
  const SUPERADMIN_PASS = 'TheSteps!UltraSecurePassphrase#2026';

  before(async () => {
    store = new SecurityStore({
      persistPath: null,
      bootstrapSuperadminEmail: SUPERADMIN_EMAIL,
      bootstrapSuperadminPassword: SUPERADMIN_PASS
    });

    const { app } = createApp({
      store,
      exposeDebugTokens: true,
      verifyGoogleIdToken: async (token: string) => {
        if (token === 'VALID_OWNER_GOOGLE_TOKEN') {
          return {
            email: 'faruk017@gmail.com',
            email_verified: true,
            name: 'Faruk Owner'
          };
        }
        throw new Error('Invalid mock Google ID token');
      }
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

  it('blocks mutating endpoints without valid double-submit CSRF token', async () => {
    const client = new CookieClient(baseUrl);
    const res = await client.request('POST', '/api/auth/login', {
      identifier: 'nobody@thesteps.test',
      password: 'Password!123456'
    });
    assert.equal(res.status, 403);
    assert.equal(res.data.error, 'CSRF_TOKEN_MISSING');

    await client.ensureCsrf();
    assert.ok(client.getCookie('thesteps_csrf'));

    const mismatch = await client.request(
      'POST',
      '/api/auth/login',
      { identifier: 'nobody@thesteps.test', password: 'Password!123456' },
      { 'X-CSRF-Token': 'tampered_csrf_token_value_1234' }
    );
    assert.equal(mismatch.status, 403);
    assert.equal(mismatch.data.error, 'CSRF_TOKEN_MISMATCH');
  });

  it('rejects role injection and breached/personal passwords during public registration, enforces customer role, and verifies OTP', async () => {
    // Enable email verification policy as SuperAdmin to verify strict OTP activation workflow
    const superAdmin = new CookieClient(baseUrl);
    await superAdmin.ensureCsrf();
    await superAdmin.request('POST', '/api/admin/auth/login', {
      identifier: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASS
    });
    const policyRes = await superAdmin.request('PUT', '/api/admin/security/settings', {
      requireEmailVerification: true
    });
    assert.equal(policyRes.status, 200);

    const client = new CookieClient(baseUrl);
    await client.ensureCsrf();

    const injectionAttempt = await client.request('POST', '/api/auth/register', {
      fullName: 'Malicious User',
      username: 'malicious1',
      email: 'malicious@thesteps.test',
      phoneNumber: '01711000099',
      password: 'SafeUniquePassphrase#2026',
      role: 'superadmin'
    });
    assert.equal(injectionAttempt.status, 403);
    assert.equal(injectionAttempt.data.error, 'ROLE_INJECTION_REJECTED');

    const weakPw = await client.request('POST', '/api/auth/register', {
      fullName: 'Weak Pass User',
      username: 'weakuser',
      email: 'weak@thesteps.test',
      phoneNumber: '01711000088',
      password: 'password123'
    });
    assert.equal(weakPw.status, 400);
    assert.equal(weakPw.data.error, 'WEAK_PASSWORD');

    const personalTermPw = await client.request('POST', '/api/auth/register', {
      fullName: 'Amina Rahman',
      username: 'amina_rahman',
      email: 'amina@thesteps.test',
      phoneNumber: '01711223344',
      password: 'AminaSecurePassphrase#2026'
    });
    assert.equal(personalTermPw.status, 400);
    assert.equal(personalTermPw.data.error, 'WEAK_PASSWORD');

    const strongCustomerPass = 'CobaltTimber!SilverPeak#2026';
    const reg = await client.request('POST', '/api/auth/register', {
      fullName: 'Amina Rahman',
      username: 'amina_rahman',
      email: 'amina@thesteps.test',
      phoneNumber: '01711223344',
      password: strongCustomerPass,
      confirmPassword: strongCustomerPass,
      acceptedTerms: true
    });
    assert.equal(reg.status, 201);
    assert.equal(reg.data.requiresVerification, true);
    assert.ok(reg.data.verificationOtpPreview);

    // Login before verification must be rejected
    const preVerifyLogin = await client.request('POST', '/api/auth/login', {
      identifier: 'amina@thesteps.test',
      password: strongCustomerPass
    });
    assert.equal(preVerifyLogin.status, 403);

    // Verify account with OTP
    const verify = await client.request('POST', '/api/auth/verify-email', {
      email: 'amina@thesteps.test',
      code: reg.data.verificationOtpPreview
    });
    assert.equal(verify.status, 200);

    // Customer login succeeds and strictly carries customer role
    const login = await client.request('POST', '/api/auth/login', {
      identifier: 'amina@thesteps.test',
      password: strongCustomerPass
    });
    assert.equal(login.status, 200);
    assert.equal(login.data.authenticated, true);
    assert.equal(login.data.user.role, 'customer');

    // Customer cannot access admin APIs
    const adminAttempt = await client.request('GET', '/api/admin/users');
    assert.equal(adminAttempt.status, 403);
    const settingsAttempt = await client.request('GET', '/api/admin/security/settings');
    assert.equal(settingsAttempt.status, 403);
  });

  it('prevents SQL/XSS payloads from bypassing validation and verifies owner Google ID token auth', async () => {
    const client = new CookieClient(baseUrl);
    await client.ensureCsrf();

    const sqliLogin = await client.request('POST', '/api/auth/login', {
      identifier: "' OR 1=1 --",
      password: "' OR '1'='1"
    });
    assert.equal(sqliLogin.status, 401);

    const badGoogle = await client.request('POST', '/api/auth/firebase-google', {
      idToken: 'FORGED_GOOGLE_TOKEN'
    });
    assert.equal(badGoogle.status, 401);

    const validOwnerGoogle = await client.request('POST', '/api/auth/firebase-google', {
      idToken: 'VALID_OWNER_GOOGLE_TOKEN'
    });
    assert.equal(validOwnerGoogle.status, 200);
    assert.equal(validOwnerGoogle.data.user.email, 'faruk017@gmail.com');
    assert.equal(validOwnerGoogle.data.user.role, 'superadmin');
  });

  it('authenticates SuperAdmin, enforces customer/admin portal separation, TOTP MFA & recovery codes', async () => {
    const customerPortalAttempt = new CookieClient(baseUrl);
    await customerPortalAttempt.ensureCsrf();
    const blockedOnStorefront = await customerPortalAttempt.request('POST', '/api/auth/login', {
      identifier: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASS
    });
    assert.equal(blockedOnStorefront.status, 403);
    assert.equal(blockedOnStorefront.data.error, 'USE_ADMIN_LOGIN_PORTAL');

    const superClient = new CookieClient(baseUrl);
    await superClient.ensureCsrf();

    const loginRes = await superClient.request('POST', '/api/admin/auth/login', {
      identifier: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASS
    });
    assert.equal(loginRes.status, 200);
    assert.equal(loginRes.data.authenticated, true);
    assert.equal(loginRes.data.user.role, 'superadmin');

    // Enroll TOTP MFA
    const enroll = await superClient.request('POST', '/api/auth/mfa/enroll', {});
    assert.equal(enroll.status, 200);
    const secret = enroll.data.secret as string;
    assert.ok(secret);

    const validTotp = generateTotpCodeForTimestamp(secret);
    const verifyEnroll = await superClient.request('POST', '/api/auth/mfa/verify-enroll', {
      code: validTotp
    });
    assert.equal(verifyEnroll.status, 200);
    assert.equal(verifyEnroll.data.enabled, true);
    assert.equal(verifyEnroll.data.recoveryCodes.length, 8);
    const recoveryCode = verifyEnroll.data.recoveryCodes[0] as string;

    // Logout & re-login -> MFA must now be required before admin endpoints work
    await superClient.request('POST', '/api/admin/auth/logout', {});
    const step1 = await superClient.request('POST', '/api/admin/auth/login', {
      identifier: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASS
    });
    assert.equal(step1.status, 200);
    assert.equal(step1.data.mfaRequired, true);
    assert.equal(step1.data.authenticated, false);

    // Admin API blocked while in MFA pending state
    const blockedBeforeMfa = await superClient.request('GET', '/api/admin/users');
    assert.equal(blockedBeforeMfa.status, 401);

    // Invalid TOTP rejected
    const badMfa = await superClient.request('POST', '/api/admin/auth/verify-mfa', { code: '000000' });
    assert.equal(badMfa.status, 401);

    // Valid TOTP succeeds
    const step2 = await superClient.request('POST', '/api/admin/auth/verify-mfa', {
      code: generateTotpCodeForTimestamp(secret)
    });
    assert.equal(step2.status, 200);
    assert.equal(step2.data.authenticated, true);

    // Test single-use recovery code login + replay rejection
    const recoveryClient = new CookieClient(baseUrl);
    await recoveryClient.ensureCsrf();
    await recoveryClient.request('POST', '/api/admin/auth/login', {
      identifier: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASS
    });
    const recSuccess = await recoveryClient.request('POST', '/api/admin/auth/verify-mfa', {
      code: recoveryCode
    });
    assert.equal(recSuccess.status, 200);

    // Reusing same recovery code must fail
    const recReplay = new CookieClient(baseUrl);
    await recReplay.ensureCsrf();
    await recReplay.request('POST', '/api/admin/auth/login', {
      identifier: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASS
    });
    const recFail = await recReplay.request('POST', '/api/admin/auth/verify-mfa', {
      code: recoveryCode
    });
    assert.equal(recFail.status, 401);
  });

  it('enforces admin hierarchy, dynamic RBAC permission updates, and final SuperAdmin protection', async () => {
    // Log in via verified owner Google session (which creates active SuperAdmin session on faruk017@gmail.com)
    const superClient = new CookieClient(baseUrl);
    await superClient.ensureCsrf();
    await superClient.request('POST', '/api/auth/firebase-google', {
      idToken: 'VALID_OWNER_GOOGLE_TOKEN'
    });

    const rolesRes = await superClient.request('GET', '/api/admin/roles');
    assert.equal(rolesRes.status, 200);
    const adminRole = rolesRes.data.roles.find((r: any) => r.slug === 'administrator');
    const staffRole = rolesRes.data.roles.find((r: any) => r.slug === 'staff');
    const superRole = rolesRes.data.roles.find((r: any) => r.slug === 'superadmin');
    assert.ok(adminRole && staffRole && superRole);

    // Invite an Administrator
    const inviteAdmin = await superClient.request('POST', '/api/admin/users', {
      mode: 'invite',
      fullName: 'Tariq Admin',
      username: 'tariq_admin',
      email: 'tariq.admin@thesteps.test',
      phoneNumber: '01811223344',
      designation: 'Security Admin',
      roleIds: [adminRole.id],
      accountStatus: 'active'
    });
    assert.equal(inviteAdmin.status, 201);
    assert.ok(inviteAdmin.data.inviteToken);

    // Accept Admin invitation
    const adminClient = new CookieClient(baseUrl);
    await adminClient.ensureCsrf();
    const adminPass = 'DeltaFalcon!BlueRiver#2026';
    const accept = await adminClient.request('POST', '/api/admin/auth/accept-invitation', {
      token: inviteAdmin.data.inviteToken,
      password: adminPass
    });
    assert.equal(accept.status, 201);

    // Admin signs in via dedicated admin login
    const adminLogin = await adminClient.request('POST', '/api/admin/auth/login', {
      identifier: 'tariq_admin',
      password: adminPass
    });
    assert.equal(adminLogin.status, 200);
    assert.equal(adminLogin.data.user.role, 'administrator');

    // Administrator CANNOT create a SuperAdmin or assign superadmin role
    const escalateCreate = await adminClient.request('POST', '/api/admin/users', {
      mode: 'direct',
      fullName: 'Rogue Super',
      username: 'rogue_super',
      email: 'rogue@thesteps.test',
      roleIds: [superRole.id],
      password: 'RogueEscalationPass#2026'
    });
    assert.equal(escalateCreate.status, 403);

    // Administrator CANNOT alter security settings (SuperAdmin permission only)
    const alterSettings = await adminClient.request('PUT', '/api/admin/security/settings', {
      maxLoginAttempts: 99
    });
    assert.equal(alterSettings.status, 403);

    // Create a Staff account directly
    const staffPass = 'SummitCanyon!CedarPine#2026';
    const createStaff = await superClient.request('POST', '/api/admin/users', {
      mode: 'direct',
      fullName: 'Nadia Staff',
      username: 'nadia_staff',
      email: 'nadia.staff@thesteps.test',
      roleIds: [staffRole.id],
      password: staffPass
    });
    assert.equal(createStaff.status, 201);
    const staffUserId = createStaff.data.user.id;

    // Staff logs in; without users.view, /api/admin/users returns 403
    const staffClient = new CookieClient(baseUrl);
    await staffClient.ensureCsrf();
    const staffLogin = await staffClient.request('POST', '/api/admin/auth/login', {
      identifier: 'nadia_staff',
      password: staffPass
    });
    assert.equal(staffLogin.status, 200);

    const staffDenied = await staffClient.request('GET', '/api/admin/users');
    assert.equal(staffDenied.status, 403);

    // Dynamic RBAC: SuperAdmin grants 'users.view' permission to Staff role
    const permsRes = await superClient.request('GET', '/api/admin/permissions');
    const usersViewPerm = permsRes.data.permissions.find((p: any) => p.code === 'users.view');
    assert.ok(usersViewPerm);
    const currentStaffPermIds = staffRole.permissionIds as string[];
    const grantRes = await superClient.request('POST', `/api/admin/roles/${staffRole.id}/permissions`, {
      permissionIds: [...currentStaffPermIds, usersViewPerm.id]
    });
    assert.equal(grantRes.status, 200);

    // Immediately takes effect without rebuild or re-login!
    const staffAllowed = await staffClient.request('GET', '/api/admin/users');
    assert.equal(staffAllowed.status, 200);

    // Revoke permission back and verify denied immediately
    await superClient.request('POST', `/api/admin/roles/${staffRole.id}/permissions`, {
      permissionIds: currentStaffPermIds
    });
    const staffRevoked = await staffClient.request('GET', '/api/admin/users');
    assert.equal(staffRevoked.status, 403);

    // Final Active SuperAdmin protection: even SuperAdmin cannot deactivate the last active SuperAdmin (let's first suspend owner so only bootstrapped remains active)
    const usersListRes = await superClient.request('GET', '/api/admin/users');
    const superUsers = usersListRes.data.users.filter((u: any) => u.role === 'superadmin' && u.status === 'active');
    if (superUsers.length > 1) {
      // Deactivate one non-self superadmin so only 1 remains
      const other = superUsers.find((u: any) => u.email === SUPERADMIN_EMAIL);
      if (other) {
        const deactOne = await superClient.request('PATCH', `/api/admin/users/${other.id}/status`, {
          status: 'inactive'
        });
        assert.equal(deactOne.status, 200);
      }
    }
    const remainingSupers = (await superClient.request('GET', '/api/admin/users')).data.users.filter(
      (u: any) => u.role === 'superadmin' && u.status === 'active'
    );
    assert.equal(remainingSupers.length, 1);
    const lastSuperId = remainingSupers[0].id;
    const lockLastSuper = await superClient.request('PATCH', `/api/admin/users/${lastSuperId}/status`, {
      status: 'deactivated'
    });
    assert.ok([403, 409].includes(lockLastSuper.status));

    // Deactivating staff immediately invalidates their active session
    const deactStaff = await superClient.request('PATCH', `/api/admin/users/${staffUserId}/status`, {
      status: 'deactivated'
    });
    assert.equal(deactStaff.status, 200);

    const staffMeAfterDeact = await staffClient.request('GET', '/api/admin/auth/me');
    assert.ok([401, 403].includes(staffMeAfterDeact.status));
  });

  it('triggers account lockout on brute force, executes password reset revocation, and detects refresh token reuse', async () => {
    const victimClient = new CookieClient(baseUrl);
    await victimClient.ensureCsrf();

    // Register & verify a fresh customer
    const oldPass = 'HarborBreeze!VioletSky#2026';
    const newPass = 'AmberMeadow!ForestPine#2026';
    const thirdPass = 'CrimsonHorizon!OceanWave#2026';

    const reg = await victimClient.request('POST', '/api/auth/register', {
      fullName: 'Karim Shopper',
      username: 'karim_shop',
      email: 'karim@thesteps.test',
      phoneNumber: '01911223344',
      password: oldPass
    });
    assert.equal(reg.status, 201);
    await victimClient.request('POST', '/api/auth/verify-email', {
      email: 'karim@thesteps.test',
      code: reg.data.verificationOtpPreview
    });

    // Trigger brute force lockout (default maxLoginAttempts = 5)
    let lockoutStatus = 0;
    for (let i = 0; i < 6; i++) {
      const bad = await victimClient.request('POST', '/api/auth/login', {
        identifier: 'karim@thesteps.test',
        password: 'WrongPasswordAttempt999'
      });
      lockoutStatus = bad.status;
      if (bad.status === 423) break;
    }
    assert.equal(lockoutStatus, 423);

    // Forgot password -> Reset password (works once, rejects reuse & old password, unlocks account)
    const forgot = await victimClient.request('POST', '/api/auth/forgot-password', {
      identifier: 'karim@thesteps.test'
    });
    assert.equal(forgot.status, 200);
    assert.ok(forgot.data.resetTokenPreview);

    // Reusing old password blocked by history policy
    const reuseOldPw = await victimClient.request('POST', '/api/auth/reset-password', {
      token: forgot.data.resetTokenPreview,
      newPassword: oldPass
    });
    assert.equal(reuseOldPw.status, 400);
    assert.equal(reuseOldPw.data.error, 'PASSWORD_REUSE_FORBIDDEN');

    const resetOk = await victimClient.request('POST', '/api/auth/reset-password', {
      token: forgot.data.resetTokenPreview,
      newPassword: newPass
    });
    assert.equal(resetOk.status, 200);

    // Reusing single-use reset token fails
    const resetReplay = await victimClient.request('POST', '/api/auth/reset-password', {
      token: forgot.data.resetTokenPreview,
      newPassword: thirdPass
    });
    assert.equal(resetReplay.status, 400);

    // Sign in & test refresh token rotation + reuse detection
    const loginOk = await victimClient.request('POST', '/api/auth/login', {
      identifier: 'karim@thesteps.test',
      password: newPass
    });
    assert.equal(loginOk.status, 200);

    // Clone client carrying R1 before rotation
    const staleClientWithR1 = victimClient.cloneWithSameBase();
    const refreshR1 = await victimClient.request('POST', '/api/auth/refresh', {});
    assert.equal(refreshR1.status, 200);

    // Attacker replays stolen R1 -> triggers family-wide revocation (401 REFRESH_TOKEN_REUSE_DETECTED)
    const replayR1 = await staleClientWithR1.request('POST', '/api/auth/refresh', {});
    assert.equal(replayR1.status, 401);
    assert.equal(replayR1.data.error, 'REFRESH_TOKEN_REUSE_DETECTED');

    // Legitimate client holding R2 is now also revoked for protection!
    const refreshR2AfterCompromise = await victimClient.request('POST', '/api/auth/refresh', {});
    assert.equal(refreshR2AfterCompromise.status, 401);
  });

  it('enforces append-only audit logs with sensitive credential redaction', async () => {
    const owner = new CookieClient(baseUrl);
    await owner.ensureCsrf();
    await owner.request('POST', '/api/auth/firebase-google', {
      idToken: 'VALID_OWNER_GOOGLE_TOKEN'
    });

    const delAttempt = await owner.request('DELETE', '/api/admin/audit-logs/some-id');
    assert.equal(delAttempt.status, 405);
    const putAttempt = await owner.request('PUT', '/api/admin/audit-logs/some-id', {});
    assert.equal(putAttempt.status, 405);

    const logsRes = await owner.request('GET', '/api/admin/audit-logs');
    assert.equal(logsRes.status, 200);
    assert.ok(logsRes.data.auditLogs.length > 0);
    const serialized = JSON.stringify(logsRes.data.auditLogs);
    assert.equal(serialized.includes(SUPERADMIN_PASS), false);
    assert.equal(serialized.includes('AmberMeadow!ForestPine#2026'), false);
    assert.equal(serialized.includes('SummitCanyon!CedarPine#2026'), false);
  });
});
