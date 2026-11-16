import { Router, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth as getFirebaseAdminAuth } from 'firebase-admin/auth';
import { z } from 'zod';
import { SecurityStore, toPublicUser } from '../data/securityStore.ts';
import {
  ACCESS_COOKIE,
  MFA_PENDING_COOKIE,
  REFRESH_COOKIE,
  clearAuthCookies,
  createAuthMiddleware,
  ensureCsrfCookie,
  extractAccessToken,
  getClientIp,
  getUserAgent,
  rateLimitAuth,
  setAuthCookies,
  setMfaPendingCookie,
  validateCsrfToken,
  type AuthContextRequest
} from '../middleware/authMiddleware.ts';
import {
  buildOtpAuthUri,
  decryptSecret,
  encryptSecret,
  generateOpaqueToken,
  generateOtpCode,
  generateRecoveryCodes,
  generateTotpSecret,
  hashPassword,
  signJwt,
  validatePasswordPolicy,
  verifyJwt,
  verifyPassword,
  verifyTotpCode
} from '../security/crypto.ts';

function getFirebaseProjectId(): string | null {
  try {
    const cfgPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(cfgPath)) return null;
    const raw = JSON.parse(fs.readFileSync(cfgPath, 'utf8')) as { projectId?: string };
    return raw.projectId || null;
  } catch {
    return null;
  }
}

function getAdminFirebaseAuth() {
  const projectId = getFirebaseProjectId();
  if (!projectId) return null;
  const app = getApps().length > 0 ? getApp() : initializeApp({ projectId });
  return getFirebaseAdminAuth(app);
}

const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters.').max(120),
  username: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : typeof val === 'string' ? val.trim() : val),
    z
      .string()
      .min(3, 'Username must be at least 3 characters.')
      .max(40, 'Username cannot exceed 40 characters.')
      .regex(/^[a-zA-Z0-9_.-]+$/, 'Username may only contain letters, numbers, dots, underscores, and hyphens.')
      .optional()
  ),
  email: z.string().trim().email('Please enter a valid email address.').max(160),
  phoneNumber: z.string().trim().min(8, 'Mobile number must be at least 8 characters.').max(24),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(128),
  confirmPassword: z.preprocess(
    (val) => (typeof val === 'string' && val === '' ? undefined : val),
    z.string().min(8, 'Confirm password must be at least 8 characters.').max(128).optional()
  ),
  acceptedTerms: z.boolean().optional(),
  botTrap: z.string().optional()
});

const loginSchema = z.object({
  identifier: z.string().trim().min(2).max(160),
  password: z.string().min(1).max(128),
  rememberMe: z.boolean().optional()
});

export function createAuthRoutes(
  store: SecurityStore,
  options: { exposeDebugTokens?: boolean; verifyGoogleIdToken?: (token: string) => Promise<{ email?: string; email_verified?: boolean; name?: string; picture?: string }> } = {}
) {
  const router = Router();
  const mw = createAuthMiddleware(store);

  const issueSessionAndRespond = (
    req: AuthContextRequest,
    res: Response,
    userId: string,
    opts: { isAdminSession: boolean; mfaVerified: boolean; rememberMe?: boolean; extra?: Record<string, unknown> }
  ) => {
    const user = store.findUserById(userId)!;
    const settings = store.getSettings();
    const rawRefresh = generateOpaqueToken(36);
    const session = store.createSession({
      userId: user.id,
      userAgent: getUserAgent(req),
      ipAddress: getClientIp(req),
      isAdminSession: opts.isAdminSession,
      mfaVerified: opts.mfaVerified,
      rawRefreshToken: rawRefresh,
      rememberMe: opts.rememberMe
    });

    const accessToken = signJwt(
      {
        sub: user.id,
        sid: session.id,
        type: 'access',
        isAdminSession: opts.isAdminSession,
        mfaVerified: opts.mfaVerified
      },
      settings.accessTokenLifetimeMinutes * 60
    );

    setAuthCookies(req, res, store, accessToken, rawRefresh, opts.rememberMe);
    store.updateUser(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date().toISOString(),
      lastLoginIp: getClientIp(req),
      lastLoginDevice: session.deviceName
    });

    const roles = store.getUserRoles(user.id);
    const permissions = store.getEffectivePermissions(user.id);
    const mfa = store.getUserMfa(user.id);

    res.json({
      authenticated: true,
      sessionId: session.id,
      accessToken,
      refreshToken: rawRefresh,
      user: toPublicUser(store.findUserById(user.id)!, roles, permissions, Boolean(mfa?.enabled)),
      ...(opts.extra || {})
    });
  };

  // Initialize / fetch CSRF double-submit cookie
  router.get('/csrf', (req, res) => {
    const token = ensureCsrfCookie(req, res);
    res.json({ csrfToken: token });
  });

  // Public customer registration - strictly forces customer role and rejects elevated roles
  router.post('/register', validateCsrfToken, rateLimitAuth(15, 60_000), (req, res) => {
    // Prevent automated bot submissions via honeypot or explicit role injection
    if (req.body?.role || req.body?.roles || req.body?.permissions || req.body?.isAdmin) {
      store.recordAuditLog({
        userId: null,
        action: 'PRIVILEGE_ESCALATION_BLOCKED',
        module: 'Registration',
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        result: 'denied',
        additionalContext: 'Attempted to supply role or permission claims on public registration endpoint.'
      });
      res.status(403).json({
        error: 'ROLE_INJECTION_REJECTED',
        message: 'Public registration cannot specify account roles or permissions.'
      });
      return;
    }

    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: parsed.error.issues[0]?.message || 'Invalid registration data.'
      });
      return;
    }

    const input = parsed.data;
    if (input.botTrap) {
      res.status(400).json({ error: 'BOT_DETECTED', message: 'Registration request rejected.' });
      return;
    }
    if (input.confirmPassword !== undefined && input.confirmPassword !== input.password) {
      res.status(400).json({ error: 'PASSWORD_MISMATCH', message: 'Passwords do not match.' });
      return;
    }
    if (input.acceptedTerms === false) {
      res.status(400).json({ error: 'TERMS_REQUIRED', message: 'You must accept the Terms & Conditions.' });
      return;
    }

    const email = input.email.toLowerCase();
    const cleanPhone = input.phoneNumber.replace(/[\s()-]/g, '');
    const users = store.listUsers();

    if (users.some((u) => u.email.toLowerCase() === email)) {
      res.status(409).json({
        error: 'ACCOUNT_EXISTS',
        message: 'An account with this email address already exists.'
      });
      return;
    }

    if (cleanPhone && users.some((u) => (u.phoneNumber || '').replace(/[\s()-]/g, '') === cleanPhone)) {
      res.status(409).json({
        error: 'ACCOUNT_EXISTS',
        message: 'An account with this mobile number already exists.'
      });
      return;
    }

    let baseUsername = (
      input.username ||
      email.split('@')[0].replace(/[^a-zA-Z0-9_.-]/g, '') ||
      'shopper'
    ).toLowerCase();
    if (baseUsername.length < 3) {
      baseUsername = `${baseUsername}_user`.slice(0, 20);
    }

    if (input.username) {
      if (users.some((u) => u.username.toLowerCase() === baseUsername)) {
        res.status(409).json({
          error: 'ACCOUNT_EXISTS',
          message: 'This username is already taken. Please choose another or leave it blank.'
        });
        return;
      }
    } else {
      // Auto-generated username: disambiguate cleanly if another user already uses the email prefix
      let candidate = baseUsername;
      while (users.some((u) => u.username.toLowerCase() === candidate)) {
        candidate = `${baseUsername.slice(0, 28)}_${generateOtpCode(4)}`;
      }
      baseUsername = candidate;
    }

    const settings = store.getSettings();
    const pwCheck = validatePasswordPolicy(input.password, {
      minLength: settings.minPasswordLength,
      isPrivileged: false,
      personalTerms: [input.fullName, baseUsername, email.split('@')[0]]
    });
    if (!pwCheck.valid) {
      res.status(400).json({ error: 'WEAK_PASSWORD', message: pwCheck.errors[0], details: pwCheck });
      return;
    }

    const customerRole = store.findRoleBySlug('customer');
    if (!customerRole) {
      res.status(500).json({ error: 'SERVER_CONFIG_ERROR', message: 'Customer role unavailable.' });
      return;
    }

    const requireVerify = settings.requireEmailVerification;
    const created = store.createUser(
      {
        username: baseUsername,
        email,
        fullName: input.fullName,
        phoneNumber: input.phoneNumber,
        designation: 'Customer',
        photoURL: '',
        status: requireVerify ? 'pending_verification' : 'active',
        emailVerified: !requireVerify,
        phoneVerified: false,
        passwordHash: hashPassword(input.password),
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: null,
        lastLoginIp: null,
        lastLoginDevice: null,
        addresses: [],
        savedWishlist: [],
        collectedVouchers: ['SMART10'],
        createdBy: 'self_registration',
        deactivatedAt: null
      },
      [customerRole.id]
    );

    const rawOtp = generateOtpCode(6);
    const rawVerifyToken = generateOpaqueToken(24);
    store.createVerificationToken(created.id, 'email', created.email, rawOtp, rawVerifyToken);

    store.recordAuditLog({
      userId: created.id,
      action: 'CUSTOMER_REGISTERED',
      module: 'Authentication',
      targetRecordId: created.id,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success',
      additionalContext: `Registered customer ${created.email} (verifyRequired=${requireVerify})`
    });

    if (requireVerify) {
      res.status(201).json({
        authenticated: false,
        requiresVerification: true,
        message: 'Account created. Please verify your email using the verification code sent to your inbox.',
        ...(options.exposeDebugTokens ? { verificationOtpPreview: rawOtp, verificationTokenPreview: rawVerifyToken } : {})
      });
      return;
    }

    issueSessionAndRespond(req, res, created.id, {
      isAdminSession: false,
      mfaVerified: false,
      rememberMe: true,
      extra: options.exposeDebugTokens ? { verificationOtpPreview: rawOtp } : undefined
    });
  });

  // Customer standard login (rejects privileged admin portal users cleanly or directs them to dedicated portal)
  router.post('/login', validateCsrfToken, rateLimitAuth(20, 60_000), async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Valid email/username and password are required.' });
      return;
    }

    const { identifier, password, rememberMe } = parsed.data;
    const ip = getClientIp(req);
    const ua = getUserAgent(req);
    const settings = store.getSettings();
    const recentFails = store.getRecentFailedAttemptsCount(identifier, ip, 15);
    if (recentFails > 0) {
      const delayMs = Math.min(recentFails * 120, 600);
      await new Promise((r) => setTimeout(r, delayMs));
    }

    const user = store.findUserByIdentifier(identifier);
    if (!user || !user.passwordHash) {
      store.recordLoginAttempt({
        identifier,
        ipAddress: ip,
        success: false,
        failureReason: 'invalid_credentials',
        user,
        isAdminPortal: false,
        userAgent: ua
      });
      res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email/username or password.' });
      return;
    }

    if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
      store.recordLoginAttempt({
        identifier,
        ipAddress: ip,
        success: false,
        failureReason: 'account_locked',
        user,
        isAdminPortal: false,
        userAgent: ua
      });
      res.status(423).json({
        error: 'ACCOUNT_LOCKED',
        message: `Account is temporarily locked until ${new Date(user.lockedUntil).toLocaleTimeString()}.`
      });
      return;
    }

    if (user.status !== 'active') {
      store.recordLoginAttempt({
        identifier,
        ipAddress: ip,
        success: false,
        failureReason: `status_${user.status}`,
        user,
        isAdminPortal: false,
        userAgent: ua
      });
      const msg =
        user.status === 'pending_verification'
          ? 'Please verify your email address before signing in.'
          : `Your account is ${user.status}. Please contact support.`;
      res.status(403).json({ error: `ACCOUNT_${user.status.toUpperCase()}`, message: msg });
      return;
    }

    // Administrators must use dedicated /admin/login flow
    if (store.isUserAdminLevel(user.id)) {
      store.recordAuditLog({
        userId: user.id,
        action: 'ADMIN_PORTAL_SEPARATION_ENFORCED',
        module: 'Authentication',
        ipAddress: ip,
        userAgent: ua,
        result: 'denied',
        additionalContext: 'Admin account attempted customer /api/auth/login.'
      });
      res.status(403).json({
        error: 'USE_ADMIN_LOGIN_PORTAL',
        message: 'Administrative accounts must sign in through the dedicated Admin Login interface.'
      });
      return;
    }

    if (!verifyPassword(password, user.passwordHash)) {
      const fails = user.failedLoginAttempts + 1;
      const shouldLock = fails >= settings.maxLoginAttempts;
      store.updateUser(user.id, {
        failedLoginAttempts: fails,
        lockedUntil: shouldLock ? new Date(Date.now() + settings.lockoutDurationMinutes * 60 * 1000).toISOString() : null,
        status: shouldLock ? 'locked' : user.status
      });
      store.recordLoginAttempt({
        identifier,
        ipAddress: ip,
        success: false,
        failureReason: shouldLock ? 'lockout_triggered' : 'bad_password',
        user,
        isAdminPortal: false,
        userAgent: ua
      });
      store.recordAuditLog({
        userId: user.id,
        action: 'LOGIN_FAILED',
        module: 'Authentication',
        targetRecordId: user.id,
        ipAddress: ip,
        userAgent: ua,
        result: 'failure',
        additionalContext: shouldLock ? 'Brute force lockout triggered' : `Failed attempt ${fails}`
      });
      res.status(shouldLock ? 423 : 401).json({
        error: shouldLock ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS',
        message: shouldLock
          ? 'Too many failed attempts. Account temporarily locked.'
          : 'Invalid email/username or password.'
      });
      return;
    }

    const mfa = store.getUserMfa(user.id);
    if (mfa?.enabled) {
      const mfaPending = signJwt(
        {
          sub: user.id,
          sid: 'mfa_pending',
          type: 'mfa_pending',
          isAdminSession: false,
          mfaVerified: false
        },
        600
      );
      setMfaPendingCookie(req, res, mfaPending);
      res.json({
        authenticated: false,
        mfaRequired: true,
        mfaPendingToken: mfaPending,
        rememberMe: Boolean(rememberMe),
        message: 'Enter the 6-digit code from your Authenticator app or a recovery code.'
      });
      return;
    }

    store.recordLoginAttempt({
      identifier,
      ipAddress: ip,
      success: true,
      user,
      isAdminPortal: false,
      userAgent: ua
    });
    store.recordAuditLog({
      userId: user.id,
      action: 'USER_LOGIN',
      module: 'Authentication',
      targetRecordId: user.id,
      ipAddress: ip,
      userAgent: ua,
      result: 'success',
      additionalContext: 'Customer authenticated successfully'
    });

    issueSessionAndRespond(req, res, user.id, {
      isAdminSession: false,
      mfaVerified: false,
      rememberMe: Boolean(rememberMe)
    });
  });

  // Verify MFA challenge for customer login with MFA enabled
  router.post('/verify-mfa', validateCsrfToken, rateLimitAuth(15, 60_000), (req, res) => {
    const code = String(req.body?.code || '').trim();
    const rememberMe = Boolean(req.body?.rememberMe);
    const pendingToken =
      req.cookies?.[MFA_PENDING_COOKIE] ||
      (typeof req.body?.mfaPendingToken === 'string' ? req.body.mfaPendingToken : undefined);
    const claims = verifyJwt(pendingToken);
    if (!claims || claims.type !== 'mfa_pending') {
      res.status(401).json({ error: 'MFA_CHALLENGE_EXPIRED', message: 'MFA challenge expired. Please sign in again.' });
      return;
    }

    const user = store.findUserById(claims.sub);
    const mfa = user ? store.getUserMfa(user.id) : undefined;
    if (!user || user.status !== 'active' || !mfa?.enabled) {
      res.status(403).json({ error: 'MFA_INVALID_STATE', message: 'Account or MFA configuration is invalid.' });
      return;
    }

    const plainSecret = decryptSecret(mfa.secretEncrypted);
    const validTotp = verifyTotpCode(plainSecret, code);
    const validRecovery = !validTotp && store.consumeMfaRecoveryCode(user.id, code);
    if (!validTotp && !validRecovery) {
      res.status(401).json({ error: 'INVALID_MFA_CODE', message: 'Invalid authenticator or recovery code.' });
      return;
    }

    clearAuthCookies(req, res);
    store.recordAuditLog({
      userId: user.id,
      action: 'MFA_CHALLENGE_PASSED',
      module: 'Authentication',
      targetRecordId: user.id,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success',
      additionalContext: validRecovery ? 'Authenticated via single-use recovery code' : 'Authenticated via TOTP'
    });

    issueSessionAndRespond(req, res, user.id, {
      isAdminSession: claims.isAdminSession,
      mfaVerified: true,
      rememberMe
    });
  });

  // Verified Google Sign-In bridge via Firebase Admin ID Token verification
  router.post('/firebase-google', validateCsrfToken, rateLimitAuth(20, 60_000), async (req, res) => {
    const idToken = String(req.body?.idToken || '');
    const portal = req.body?.portal === 'admin' ? 'admin' : 'storefront';
    if (!idToken) {
      res.status(400).json({ error: 'MISSING_ID_TOKEN', message: 'Google ID token is required.' });
      return;
    }

    try {
      let decoded: { email?: string; email_verified?: boolean; name?: string; picture?: string };
      if (options.verifyGoogleIdToken) {
        decoded = await options.verifyGoogleIdToken(idToken);
      } else {
        const fbAuth = getAdminFirebaseAuth();
        if (!fbAuth) {
          res.status(503).json({ error: 'FIREBASE_NOT_CONFIGURED', message: 'Firebase Admin verification unavailable.' });
          return;
        }
        decoded = await fbAuth.verifyIdToken(idToken);
      }

      if (!decoded.email || !decoded.email_verified) {
        res.status(401).json({ error: 'EMAIL_NOT_VERIFIED', message: 'Verified Google email address is required.' });
        return;
      }

      const email = decoded.email.trim().toLowerCase();
      let user = store.findUserByIdentifier(email);
      if (!user) {
        const customerRole = store.findRoleBySlug('customer');
        if (!customerRole) {
          res.status(500).json({ error: 'ROLE_ERROR', message: 'Default role unavailable.' });
          return;
        }
        const username = email.split('@')[0].replace(/[^a-z0-9_]/g, '') || `user_${Date.now()}`;
        user = store.createUser(
          {
            username,
            email,
            fullName: decoded.name || username,
            phoneNumber: '',
            designation: 'Customer',
            photoURL: decoded.picture || '',
            status: 'active',
            emailVerified: true,
            phoneVerified: false,
            passwordHash: null,
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: null,
            lastLoginIp: null,
            lastLoginDevice: null,
            addresses: [],
            savedWishlist: [],
            collectedVouchers: ['SMART10'],
            createdBy: 'google_oauth',
            deactivatedAt: null
          },
          [customerRole.id]
        );
      }

      if (user.status !== 'active') {
        res.status(403).json({
          error: `ACCOUNT_${user.status.toUpperCase()}`,
          message: `Account is currently ${user.status}. Access denied.`
        });
        return;
      }

      const isPrivileged = store.isUserPrivilegedPortalMember(user.id);
      if (portal === 'admin' && !isPrivileged) {
        res.status(403).json({
          error: 'FORBIDDEN_NOT_ADMIN',
          message: 'This Google account does not have administrative privileges.'
        });
        return;
      }

      const mfa = store.getUserMfa(user.id);
      if (portal === 'admin' && mfa?.enabled) {
        const mfaPending = signJwt(
          {
            sub: user.id,
            sid: 'mfa_pending',
            type: 'mfa_pending',
            isAdminSession: true,
            mfaVerified: false
          },
          600
        );
        setMfaPendingCookie(req, res, mfaPending);
        res.json({
          authenticated: false,
          mfaRequired: true,
          message: 'Verified Google Owner sign-in. Enter your TOTP MFA code to finish signing in.'
        });
        return;
      }

      store.recordLoginAttempt({
        identifier: email,
        ipAddress: getClientIp(req),
        success: true,
        user,
        isAdminPortal: isPrivileged,
        userAgent: getUserAgent(req)
      });
      store.recordAuditLog({
        userId: user.id,
        action: 'GOOGLE_OAUTH_LOGIN',
        module: 'Authentication',
        targetRecordId: user.id,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        result: 'success',
        additionalContext: `Authenticated verified Google account (${email})`
      });

      issueSessionAndRespond(req, res, user.id, {
        isAdminSession: isPrivileged,
        mfaVerified: !mfa?.enabled,
        rememberMe: true
      });
    } catch (err: any) {
      res.status(401).json({
        error: 'GOOGLE_TOKEN_INVALID',
        message: err?.message || 'Could not verify Google authentication token.'
      });
    }
  });

  // Rotate refresh token + reissue access token (with reuse detection!)
  router.post('/refresh', validateCsrfToken, (req, res) => {
    const rawRefresh =
      req.cookies?.[REFRESH_COOKIE] ||
      (typeof req.body?.refreshToken === 'string' ? req.body.refreshToken.trim() : '');
    if (!rawRefresh) {
      res.status(401).json({ error: 'NO_REFRESH_TOKEN', message: 'No refresh token cookie present.' });
      return;
    }

    const rotated = store.rotateRefreshToken(rawRefresh);
    if (rotated.status === 'reused') {
      clearAuthCookies(req, res);
      res.status(401).json({
        error: 'REFRESH_TOKEN_REUSE_DETECTED',
        message: 'Security alert: refresh token reuse detected. All sessions in this token family have been revoked.'
      });
      return;
    }
    if (rotated.status !== 'ok' || !rotated.session || !rotated.user || !rotated.newRawRefreshToken) {
      clearAuthCookies(req, res);
      res.status(401).json({ error: 'INVALID_REFRESH_TOKEN', message: 'Refresh token invalid or expired.' });
      return;
    }

    if (rotated.user.status !== 'active') {
      store.revokeSession(rotated.session.id, `Account status changed to ${rotated.user.status}`);
      clearAuthCookies(req, res);
      res.status(403).json({
        error: `ACCOUNT_${rotated.user.status.toUpperCase()}`,
        message: 'Account is no longer active.'
      });
      return;
    }

    const settings = store.getSettings();
    const nextAccess = signJwt(
      {
        sub: rotated.user.id,
        sid: rotated.session.id,
        type: 'access',
        isAdminSession: rotated.session.isAdminSession,
        mfaVerified: rotated.session.mfaVerified
      },
      settings.accessTokenLifetimeMinutes * 60
    );

    setAuthCookies(req, res, store, nextAccess, rotated.newRawRefreshToken, true);
    const roles = store.getUserRoles(rotated.user.id);
    const permissions = store.getEffectivePermissions(rotated.user.id);
    const mfa = store.getUserMfa(rotated.user.id);

    res.json({
      authenticated: true,
      sessionId: rotated.session.id,
      accessToken: nextAccess,
      refreshToken: rotated.newRawRefreshToken,
      user: toPublicUser(rotated.user, roles, permissions, Boolean(mfa?.enabled))
    });
  });

  // Get current authenticated session identity (always returns CSRF cookie too)
  router.get('/me', (req: AuthContextRequest, res) => {
    ensureCsrfCookie(req, res);
    const token = extractAccessToken(req);
    const claims = verifyJwt(token);
    if (!claims || claims.type !== 'access') {
      res.status(401).json({ authenticated: false, user: null });
      return;
    }

    const session = store.findSessionById(claims.sid);
    const user = store.findUserById(claims.sub);
    if (!session || session.revokedAt || !user || user.status !== 'active') {
      clearAuthCookies(req, res);
      res.status(401).json({ authenticated: false, user: null });
      return;
    }
    if (new Date(session.expiresAt).getTime() < Date.now() || new Date(session.idleExpiresAt).getTime() < Date.now()) {
      store.revokeSession(session.id, 'Expired session');
      clearAuthCookies(req, res);
      res.status(401).json({ authenticated: false, user: null });
      return;
    }

    store.touchSession(session.id);
    const roles = store.getUserRoles(user.id);
    const permissions = store.getEffectivePermissions(user.id);
    const mfa = store.getUserMfa(user.id);

    res.json({
      authenticated: true,
      sessionId: session.id,
      isAdminSession: session.isAdminSession,
      mfaVerified: session.mfaVerified,
      user: toPublicUser(user, roles, permissions, Boolean(mfa?.enabled))
    });
  });

  router.post('/logout', validateCsrfToken, (req: AuthContextRequest, res) => {
    const token = extractAccessToken(req);
    const claims = verifyJwt(token);
    if (claims?.sid) {
      store.revokeSession(claims.sid, 'User signed out');
      store.recordAuditLog({
        userId: claims.sub,
        action: 'USER_LOGOUT',
        module: 'Authentication',
        targetRecordId: claims.sid,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        result: 'success',
        additionalContext: 'Session terminated by user'
      });
    }
    clearAuthCookies(req, res);
    res.json({ success: true });
  });

  // Forgot password (generic response prevents user enumeration!)
  router.post('/forgot-password', validateCsrfToken, rateLimitAuth(10, 60_000), (req, res) => {
    const identifier = String(req.body?.identifier || req.body?.email || '').trim();
    if (!identifier) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Please provide your email or mobile number.' });
      return;
    }

    const user = store.findUserByIdentifier(identifier);
    let previewToken: string | undefined;
    if (user && (user.status === 'active' || user.status === 'locked' || user.status === 'pending_verification')) {
      const rawToken = generateOpaqueToken(24);
      const settings = store.getSettings();
      store.createPasswordResetToken(user.id, rawToken, 'email', settings.passwordResetExpiryMinutes);
      store.createNotification(
        user.id,
        'Password Reset Requested',
        'A password reset request was initiated for your account.',
        'security'
      );
      store.recordAuditLog({
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        module: 'Authentication',
        targetRecordId: user.id,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        result: 'success',
        additionalContext: 'Reset token issued (stored as SHA-256 hash)'
      });
      if (options.exposeDebugTokens) previewToken = rawToken;
    }

    res.json({
      success: true,
      message:
        'If an eligible account matches that email or mobile number, password reset instructions have been issued.',
      ...(previewToken ? { resetTokenPreview: previewToken } : {})
    });
  });

  const extractRawResetToken = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return '';
    if (trimmed.includes('token=')) {
      try {
        const parsedUrl = trimmed.startsWith('http') ? new URL(trimmed) : new URL(trimmed, 'http://localhost');
        const fromParam = parsedUrl.searchParams.get('token');
        if (fromParam) return fromParam.trim();
      } catch {
        const match = trimmed.match(/[?&]token=([^&]+)/);
        if (match?.[1]) return decodeURIComponent(match[1]).trim();
      }
    }
    return trimmed;
  };

  router.get('/reset-password/validate', (req, res) => {
    const rawToken = extractRawResetToken(String(req.query?.token || ''));
    if (!rawToken) {
      res.status(400).json({ valid: false, error: 'MISSING_TOKEN', message: 'Reset token is required.' });
      return;
    }
    const tokenEntity = store.findValidResetToken(rawToken);
    if (!tokenEntity) {
      res.status(400).json({
        valid: false,
        error: 'INVALID_OR_EXPIRED_TOKEN',
        message: 'Reset token is invalid, expired, or already used.'
      });
      return;
    }
    const user = store.findUserById(tokenEntity.userId);
    if (!user || user.status === 'deactivated' || user.status === 'suspended') {
      res.status(403).json({
        valid: false,
        error: 'ACCOUNT_UNAVAILABLE',
        message: 'Password reset is not available for this account status.'
      });
      return;
    }
    const settings = store.getSettings();
    const isPrivileged = store.isUserPrivilegedPortalMember(user.id);
    res.json({
      valid: true,
      isPrivileged,
      minLength: isPrivileged ? settings.adminMinPasswordLength : settings.minPasswordLength
    });
  });

  router.post('/reset-password', validateCsrfToken, rateLimitAuth(12, 60_000), (req, res) => {
    const rawToken = extractRawResetToken(String(req.body?.token || ''));
    const newPassword = String(req.body?.newPassword || '');
    if (!rawToken || !newPassword) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Reset token and new password are required.' });
      return;
    }

    const tokenEntity = store.findValidResetToken(rawToken);
    if (!tokenEntity) {
      res.status(400).json({ error: 'INVALID_OR_EXPIRED_TOKEN', message: 'Reset token is invalid, expired, or already used.' });
      return;
    }

    const user = store.findUserById(tokenEntity.userId);
    if (!user || user.status === 'deactivated' || user.status === 'suspended') {
      res.status(403).json({ error: 'ACCOUNT_UNAVAILABLE', message: 'Password reset not permitted for this account status.' });
      return;
    }

    const settings = store.getSettings();
    const isPrivileged = store.isUserPrivilegedPortalMember(user.id);
    const pwCheck = validatePasswordPolicy(newPassword, {
      minLength: isPrivileged ? settings.adminMinPasswordLength : settings.minPasswordLength,
      isPrivileged,
      personalTerms: [user.fullName, user.username, user.email.split('@')[0]]
    });
    if (!pwCheck.valid) {
      res.status(400).json({ error: 'WEAK_PASSWORD', message: pwCheck.errors[0], details: pwCheck });
      return;
    }

    const history = store.getPasswordHistory(user.id).slice(0, settings.passwordHistoryLimit);
    if (history.some((h) => verifyPassword(newPassword, h.passwordHash))) {
      res.status(400).json({
        error: 'PASSWORD_REUSE_FORBIDDEN',
        message: `You cannot reuse any of your last ${settings.passwordHistoryLimit} passwords.`
      });
      return;
    }

    store.markResetTokenUsed(tokenEntity.id);
    store.recordPasswordChange(user.id, hashPassword(newPassword));
    store.updateUser(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      status: user.status === 'locked' ? 'active' : user.status
    });
    // Revoke all active sessions after password reset
    const revokedCount = store.revokeAllUserSessions(user.id, 'Password reset completed');
    store.createNotification(
      user.id,
      'Password Changed Successfully',
      `Your password was reset and ${revokedCount} active session(s) were signed out for protection.`,
      'security'
    );
    store.recordAuditLog({
      userId: user.id,
      action: 'PASSWORD_RESET_COMPLETED',
      module: 'Authentication',
      targetRecordId: user.id,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success',
      additionalContext: `Password updated via reset token; revoked ${revokedCount} sessions`
    });

    res.json({
      success: true,
      isPrivileged,
      message: 'Password reset successful. Please sign in with your new password.'
    });
  });

  router.post('/verify-email', validateCsrfToken, (req, res) => {
    const codeOrToken = String(req.body?.code || req.body?.token || '').trim();
    const email = req.body?.email ? String(req.body.email).trim() : undefined;
    if (!codeOrToken) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Verification code or token is required.' });
      return;
    }

    const verifiedUser = store.verifyAccountByOtpOrToken(codeOrToken, email);
    if (!verifiedUser) {
      res.status(400).json({ error: 'INVALID_VERIFICATION_CODE', message: 'Invalid or expired verification code.' });
      return;
    }

    store.recordAuditLog({
      userId: verifiedUser.id,
      action: 'ACCOUNT_VERIFIED',
      module: 'Authentication',
      targetRecordId: verifiedUser.id,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success',
      additionalContext: 'Account email verified cleanly'
    });

    res.json({ success: true, message: 'Account verified successfully. You may now sign in.' });
  });

  // Change own password (authenticated)
  router.post('/change-password', validateCsrfToken, mw.authenticateUser, mw.requireActiveAccount, (req: AuthContextRequest, res) => {
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');
    const user = req.authUser!;

    if (user.passwordHash && !verifyPassword(currentPassword, user.passwordHash)) {
      res.status(401).json({ error: 'INVALID_CURRENT_PASSWORD', message: 'Current password is incorrect.' });
      return;
    }

    const settings = store.getSettings();
    const isPrivileged = store.isUserPrivilegedPortalMember(user.id);
    const pwCheck = validatePasswordPolicy(newPassword, {
      minLength: isPrivileged ? settings.adminMinPasswordLength : settings.minPasswordLength,
      isPrivileged,
      personalTerms: [user.fullName, user.username, user.email.split('@')[0]]
    });
    if (!pwCheck.valid) {
      res.status(400).json({ error: 'WEAK_PASSWORD', message: pwCheck.errors[0], details: pwCheck });
      return;
    }

    const history = store.getPasswordHistory(user.id).slice(0, settings.passwordHistoryLimit);
    if (history.some((h) => verifyPassword(newPassword, h.passwordHash))) {
      res.status(400).json({
        error: 'PASSWORD_REUSE_FORBIDDEN',
        message: `Cannot reuse your previous ${settings.passwordHistoryLimit} passwords.`
      });
      return;
    }

    store.recordPasswordChange(user.id, hashPassword(newPassword));
    const revokedOthers = store.revokeAllUserSessions(user.id, 'Password changed by account owner', req.authSession!.id);
    store.recordAuditLog({
      userId: user.id,
      action: 'PASSWORD_CHANGED',
      module: 'Profile',
      targetRecordId: user.id,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success',
      additionalContext: `Password updated; terminated ${revokedOthers} other sessions`
    });

    res.json({ success: true, message: 'Password updated successfully.' });
  });

  // Update personal profile (strictly forbids modifying roles/status/permissions)
  router.put('/profile', validateCsrfToken, mw.authenticateUser, mw.requireActiveAccount, (req: AuthContextRequest, res) => {
    const user = req.authUser!;
    const allowed: Record<string, unknown> = {};
    if (typeof req.body?.fullName === 'string' && req.body.fullName.trim().length >= 2) {
      allowed.fullName = req.body.fullName.trim().slice(0, 120);
    }
    if (typeof req.body?.phoneNumber === 'string') {
      allowed.phoneNumber = req.body.phoneNumber.trim().slice(0, 24);
    }
    if (typeof req.body?.photoURL === 'string') {
      allowed.photoURL = req.body.photoURL;
    }
    if (Array.isArray(req.body?.addresses)) allowed.addresses = req.body.addresses.slice(0, 10);
    if (Array.isArray(req.body?.savedWishlist)) allowed.savedWishlist = req.body.savedWishlist;
    if (Array.isArray(req.body?.collectedVouchers)) allowed.collectedVouchers = req.body.collectedVouchers;

    const updated = store.updateUser(user.id, allowed)!;
    const roles = store.getUserRoles(user.id);
    const permissions = store.getEffectivePermissions(user.id);
    const mfa = store.getUserMfa(user.id);

    store.recordAuditLog({
      userId: user.id,
      action: 'PROFILE_UPDATED',
      module: 'Profile',
      targetRecordId: user.id,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success',
      additionalContext: 'Updated personal profile fields'
    });

    res.json({ user: toPublicUser(updated, roles, permissions, Boolean(mfa?.enabled)) });
  });

  // Personal sessions management
  router.get('/sessions', mw.authenticateUser, (req: AuthContextRequest, res) => {
    const currentId = req.authSession!.id;
    const sessions = store.listSessions(req.authUser!.id).map((s) => ({
      ...s,
      isCurrent: s.id === currentId
    }));
    res.json({ sessions });
  });

  router.delete('/sessions/:id', validateCsrfToken, mw.authenticateUser, (req: AuthContextRequest, res) => {
    const target = store.findSessionById(req.params.id);
    if (!target || target.userId !== req.authUser!.id) {
      res.status(404).json({ error: 'SESSION_NOT_FOUND', message: 'Session not found on your account.' });
      return;
    }
    store.revokeSession(target.id, 'Revoked by account owner');
    if (target.id === req.authSession!.id) clearAuthCookies(req, res);
    store.recordAuditLog({
      userId: req.authUser!.id,
      action: 'PERSONAL_SESSION_REVOKED',
      module: 'Sessions',
      targetRecordId: target.id,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success'
    });
    res.json({ success: true });
  });

  router.post('/sessions/revoke-others', validateCsrfToken, mw.authenticateUser, (req: AuthContextRequest, res) => {
    const count = store.revokeAllUserSessions(req.authUser!.id, 'Revoked all other sessions', req.authSession!.id);
    store.recordAuditLog({
      userId: req.authUser!.id,
      action: 'OTHER_SESSIONS_REVOKED',
      module: 'Sessions',
      targetRecordId: req.authUser!.id,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success',
      additionalContext: `Revoked ${count} other active sessions`
    });
    res.json({ success: true, revokedCount: count });
  });

  // Personal TOTP MFA Enrollment & Management
  router.post('/mfa/enroll', validateCsrfToken, mw.authenticateUser, (req: AuthContextRequest, res) => {
    const user = req.authUser!;
    const secret = generateTotpSecret();
    const otpauthUri = buildOtpAuthUri(user.email, 'TheSteps Security', secret);
    store.upsertUserMfa(user.id, encryptSecret(secret), false, null);
    res.json({
      secret,
      otpauthUri,
      message: 'Scan the QR/URI with Google Authenticator or Authy, then verify with a 6-digit code.'
    });
  });

  router.post('/mfa/verify-enroll', validateCsrfToken, mw.authenticateUser, (req: AuthContextRequest, res) => {
    const user = req.authUser!;
    const code = String(req.body?.code || '').trim();
    const mfa = store.getUserMfa(user.id);
    if (!mfa) {
      res.status(400).json({ error: 'MFA_NOT_INITIATED', message: 'Start MFA enrollment first.' });
      return;
    }
    const secret = decryptSecret(mfa.secretEncrypted);
    if (!verifyTotpCode(secret, code)) {
      res.status(400).json({ error: 'INVALID_TOTP_CODE', message: 'The 6-digit authenticator code is invalid or expired.' });
      return;
    }

    const recoveryCodes = generateRecoveryCodes(8);
    store.upsertUserMfa(user.id, mfa.secretEncrypted, true, new Date().toISOString());
    store.replaceMfaRecoveryCodes(user.id, recoveryCodes);
    store.markSessionMfaVerified(req.authSession!.id);

    store.recordAuditLog({
      userId: user.id,
      action: 'MFA_ENABLED',
      module: 'MFA',
      targetRecordId: user.id,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success',
      additionalContext: 'TOTP MFA activated and recovery codes issued'
    });

    res.json({
      enabled: true,
      recoveryCodes,
      message: 'TOTP MFA enabled! Save these single-use recovery codes safely—they will not be shown again.'
    });
  });

  router.post('/mfa/regenerate-recovery', validateCsrfToken, mw.authenticateUser, (req: AuthContextRequest, res) => {
    const user = req.authUser!;
    const mfa = store.getUserMfa(user.id);
    if (!mfa?.enabled) {
      res.status(400).json({ error: 'MFA_NOT_ENABLED', message: 'MFA is not active on this account.' });
      return;
    }
    const currentPassword = String(req.body?.currentPassword || '');
    if (user.passwordHash && !verifyPassword(currentPassword, user.passwordHash)) {
      res.status(401).json({ error: 'REAUTH_FAILED', message: 'Current password confirmation required.' });
      return;
    }

    const recoveryCodes = generateRecoveryCodes(8);
    store.replaceMfaRecoveryCodes(user.id, recoveryCodes);
    store.recordAuditLog({
      userId: user.id,
      action: 'MFA_RECOVERY_REGENERATED',
      module: 'MFA',
      targetRecordId: user.id,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success'
    });
    res.json({ recoveryCodes });
  });

  router.post('/mfa/disable', validateCsrfToken, mw.authenticateUser, (req: AuthContextRequest, res) => {
    const user = req.authUser!;
    const settings = store.getSettings();
    const isAdmin = store.isUserAdminLevel(user.id);
    if (isAdmin && settings.mfaEnforcement !== 'optional') {
      res.status(403).json({
        error: 'MFA_POLICY_ENFORCED',
        message: 'Security policy requires active MFA for administrator accounts.'
      });
      return;
    }

    const currentPassword = String(req.body?.currentPassword || '');
    if (user.passwordHash && !verifyPassword(currentPassword, user.passwordHash)) {
      res.status(401).json({ error: 'REAUTH_FAILED', message: 'Reauthentication with current password failed.' });
      return;
    }

    const mfa = store.getUserMfa(user.id);
    if (mfa) {
      store.upsertUserMfa(user.id, mfa.secretEncrypted, false, null);
    }
    store.replaceMfaRecoveryCodes(user.id, []);
    store.recordAuditLog({
      userId: user.id,
      action: 'MFA_DISABLED',
      module: 'MFA',
      targetRecordId: user.id,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success'
    });
    res.json({ enabled: false, message: 'MFA disabled cleanly.' });
  });

  router.get('/login-history', mw.authenticateUser, (req: AuthContextRequest, res) => {
    const history = store.listLoginHistory(req.authUser!.id).slice(0, 50);
    res.json({ history });
  });

  return router;
}
