import { Router } from 'express';
import { z } from 'zod';
import { SecurityStore, toPublicUser } from '../data/securityStore.ts';
import {
  ACCESS_COOKIE,
  MFA_PENDING_COOKIE,
  REFRESH_COOKIE,
  clearAuthCookies,
  createAuthMiddleware,
  getClientIp,
  getUserAgent,
  rateLimitAuth,
  setAuthCookies,
  setMfaPendingCookie,
  validateCsrfToken,
  type AuthContextRequest
} from '../middleware/authMiddleware.ts';
import {
  decryptSecret,
  generateOpaqueToken,
  hashPassword,
  signJwt,
  validatePasswordPolicy,
  verifyJwt,
  verifyPassword,
  verifyTotpCode
} from '../security/crypto.ts';

const adminLoginSchema = z.object({
  identifier: z.string().trim().min(2).max(160),
  password: z.string().min(1).max(128),
  rememberMe: z.boolean().optional()
});

export function createAdminAuthRoutes(
  store: SecurityStore,
  options: { exposeDebugTokens?: boolean } = {}
) {
  const router = Router();
  const mw = createAuthMiddleware(store);

  // Dedicated Administrator / Privileged Staff login
  router.post('/login', validateCsrfToken, rateLimitAuth(15, 60_000), async (req, res) => {
    const parsed = adminLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Email/username and password are required.' });
      return;
    }

    const { identifier, password, rememberMe } = parsed.data;
    const ip = getClientIp(req);
    const ua = getUserAgent(req);
    const settings = store.getSettings();

    const recentFails = store.getRecentFailedAttemptsCount(identifier, ip, 15);
    if (recentFails > 0) {
      await new Promise((r) => setTimeout(r, Math.min(recentFails * 140, 700)));
    }

    const user = store.findUserByIdentifier(identifier);
    if (!user || !user.passwordHash) {
      store.recordLoginAttempt({
        identifier,
        ipAddress: ip,
        success: false,
        failureReason: 'invalid_admin_credentials',
        user,
        isAdminPortal: true,
        userAgent: ua
      });
      res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid administrator credentials.'
      });
      return;
    }

    // Reject customers or non-privileged users
    if (!store.isUserPrivilegedPortalMember(user.id)) {
      store.recordAuditLog({
        userId: user.id,
        action: 'NON_ADMIN_ADMIN_LOGIN_BLOCKED',
        module: 'AdminAuth',
        targetRecordId: user.id,
        ipAddress: ip,
        userAgent: ua,
        result: 'denied',
        additionalContext: 'Customer account attempted to authenticate via /api/admin/auth/login'
      });
      res.status(403).json({
        error: 'UNAUTHORIZED_ADMIN_PORTAL',
        message: 'This account is not authorized to access the administrative console.'
      });
      return;
    }

    if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
      res.status(423).json({
        error: 'ACCOUNT_LOCKED',
        message: `Account locked until ${new Date(user.lockedUntil).toLocaleTimeString()} due to failed login attempts.`
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
        isAdminPortal: true,
        userAgent: ua
      });
      res.status(403).json({
        error: `ACCOUNT_${user.status.toUpperCase()}`,
        message: `Administrator account is ${user.status}. Access rejected.`
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
        isAdminPortal: true,
        userAgent: ua
      });
      store.recordAuditLog({
        userId: user.id,
        action: 'ADMIN_LOGIN_FAILED',
        module: 'AdminAuth',
        targetRecordId: user.id,
        ipAddress: ip,
        userAgent: ua,
        result: 'failure',
        additionalContext: shouldLock ? 'Lockout activated' : `Attempt ${fails}/${settings.maxLoginAttempts}`
      });
      res.status(shouldLock ? 423 : 401).json({
        error: shouldLock ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS',
        message: shouldLock
          ? 'Administrator account locked after repeated failed attempts.'
          : 'Invalid administrator credentials.'
      });
      return;
    }

    const mfa = store.getUserMfa(user.id);
    if (mfa?.enabled) {
      const pendingToken = signJwt(
        {
          sub: user.id,
          sid: 'admin_mfa_pending',
          type: 'mfa_pending',
          isAdminSession: true,
          mfaVerified: false
        },
        600
      );
      setMfaPendingCookie(req, res, pendingToken);
      res.json({
        authenticated: false,
        mfaRequired: true,
        mfaPendingToken: pendingToken,
        rememberMe: Boolean(rememberMe),
        message: 'MFA challenge required for administrator sign-in.'
      });
      return;
    }

    const rawRefresh = generateOpaqueToken(36);
    const session = store.createSession({
      userId: user.id,
      userAgent: ua,
      ipAddress: ip,
      isAdminSession: true,
      mfaVerified: false,
      rawRefreshToken: rawRefresh,
      rememberMe: Boolean(rememberMe)
    });

    const accessToken = signJwt(
      {
        sub: user.id,
        sid: session.id,
        type: 'access',
        isAdminSession: true,
        mfaVerified: false
      },
      settings.accessTokenLifetimeMinutes * 60
    );

    setAuthCookies(req, res, store, accessToken, rawRefresh, Boolean(rememberMe));
    store.updateUser(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date().toISOString(),
      lastLoginIp: ip,
      lastLoginDevice: session.deviceName
    });
    store.recordLoginAttempt({
      identifier,
      ipAddress: ip,
      success: true,
      user,
      isAdminPortal: true,
      userAgent: ua
    });
    store.recordAuditLog({
      userId: user.id,
      action: 'ADMIN_LOGIN_SUCCESS',
      module: 'AdminAuth',
      targetRecordId: user.id,
      ipAddress: ip,
      userAgent: ua,
      result: 'success',
      additionalContext: `Signed in via dedicated Admin Login (${session.deviceName})`
    });

    const roles = store.getUserRoles(user.id);
    const permissions = store.getEffectivePermissions(user.id);
    res.json({
      authenticated: true,
      sessionId: session.id,
      accessToken,
      refreshToken: rawRefresh,
      mfaEnrollmentRecommended: store.isUserAdminLevel(user.id) && !mfa?.enabled,
      user: toPublicUser(store.findUserById(user.id)!, roles, permissions, false)
    });
  });

  // Verify TOTP or Recovery Code for Admin MFA step
  router.post('/verify-mfa', validateCsrfToken, rateLimitAuth(15, 60_000), (req, res) => {
    const code = String(req.body?.code || '').trim();
    const rememberMe = Boolean(req.body?.rememberMe);
    const pendingToken =
      req.cookies?.[MFA_PENDING_COOKIE] ||
      (typeof req.body?.mfaPendingToken === 'string' ? req.body.mfaPendingToken : undefined);
    const claims = verifyJwt(pendingToken);

    if (!claims || claims.type !== 'mfa_pending' || !claims.isAdminSession) {
      res.status(401).json({ error: 'MFA_CHALLENGE_EXPIRED', message: 'MFA challenge session expired. Please login again.' });
      return;
    }

    const user = store.findUserById(claims.sub);
    const mfa = user ? store.getUserMfa(user.id) : undefined;
    if (!user || user.status !== 'active' || !mfa?.enabled) {
      res.status(403).json({ error: 'MFA_INVALID_ACCOUNT', message: 'Account or MFA configuration unavailable.' });
      return;
    }

    const plainSecret = decryptSecret(mfa.secretEncrypted);
    const validTotp = verifyTotpCode(plainSecret, code);
    const validRecovery = !validTotp && store.consumeMfaRecoveryCode(user.id, code);
    if (!validTotp && !validRecovery) {
      store.recordAuditLog({
        userId: user.id,
        action: 'ADMIN_MFA_FAILED',
        module: 'AdminAuth',
        targetRecordId: user.id,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        result: 'failure',
        additionalContext: 'Invalid TOTP / recovery code'
      });
      res.status(401).json({ error: 'INVALID_MFA_CODE', message: 'Invalid authenticator code or recovery code.' });
      return;
    }

    const settings = store.getSettings();
    const rawRefresh = generateOpaqueToken(36);
    const session = store.createSession({
      userId: user.id,
      userAgent: getUserAgent(req),
      ipAddress: getClientIp(req),
      isAdminSession: true,
      mfaVerified: true,
      rawRefreshToken: rawRefresh,
      rememberMe
    });
    const accessToken = signJwt(
      {
        sub: user.id,
        sid: session.id,
        type: 'access',
        isAdminSession: true,
        mfaVerified: true
      },
      settings.accessTokenLifetimeMinutes * 60
    );

    clearAuthCookies(req, res);
    setAuthCookies(req, res, store, accessToken, rawRefresh, rememberMe);
    store.updateUser(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date().toISOString(),
      lastLoginIp: getClientIp(req),
      lastLoginDevice: session.deviceName
    });
    store.recordLoginAttempt({
      identifier: user.email,
      ipAddress: getClientIp(req),
      success: true,
      user,
      isAdminPortal: true,
      userAgent: getUserAgent(req)
    });
    store.recordAuditLog({
      userId: user.id,
      action: 'ADMIN_LOGIN_MFA_VERIFIED',
      module: 'AdminAuth',
      targetRecordId: user.id,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success',
      additionalContext: validRecovery ? 'Verified with recovery code' : 'Verified with TOTP'
    });

    const roles = store.getUserRoles(user.id);
    const permissions = store.getEffectivePermissions(user.id);
    res.json({
      authenticated: true,
      sessionId: session.id,
      accessToken,
      refreshToken: rawRefresh,
      user: toPublicUser(store.findUserById(user.id)!, roles, permissions, true)
    });
  });

  // Preview invitation token before password creation
  router.get('/invitation-preview', (req, res) => {
    const token = String(req.query?.token || '').trim();
    const inv = store.findValidInvitation(token);
    if (!inv) {
      res.status(404).json({ error: 'INVITATION_INVALID', message: 'Invitation link is invalid, expired, or already used.' });
      return;
    }
    const roleNames = inv.roleIds
      .map((id) => store.findRoleById(id)?.name)
      .filter(Boolean);
    res.json({
      invitation: {
        email: inv.email,
        username: inv.username,
        fullName: inv.fullName,
        designation: inv.designation,
        roleNames,
        expiresAt: inv.expiresAt
      }
    });
  });

  // Accept admin/staff invitation and establish a strong 12+ character password
  router.post('/accept-invitation', validateCsrfToken, rateLimitAuth(10, 60_000), (req, res) => {
    const token = String(req.body?.token || '').trim();
    const password = String(req.body?.password || '');
    const inv = store.findValidInvitation(token);
    if (!inv) {
      res.status(400).json({ error: 'INVITATION_INVALID', message: 'Invitation token is invalid, expired, or already accepted.' });
      return;
    }

    const settings = store.getSettings();
    const pwCheck = validatePasswordPolicy(password, {
      minLength: settings.adminMinPasswordLength,
      isPrivileged: true,
      personalTerms: [inv.fullName, inv.username, inv.email.split('@')[0]]
    });
    if (!pwCheck.valid) {
      res.status(400).json({ error: 'WEAK_PASSWORD', message: pwCheck.errors[0], details: pwCheck });
      return;
    }

    const duplicate = store.findUserByIdentifier(inv.email) || store.findUserByIdentifier(inv.username);
    if (duplicate) {
      res.status(409).json({ error: 'USER_ALREADY_EXISTS', message: 'An account with this email or username already exists.' });
      return;
    }

    const created = store.createUser(
      {
        username: inv.username,
        email: inv.email,
        fullName: inv.fullName,
        phoneNumber: inv.phoneNumber,
        designation: inv.designation,
        photoURL: '',
        status: inv.accountStatus === 'inactive' ? 'inactive' : 'active',
        emailVerified: true,
        phoneVerified: Boolean(inv.phoneNumber),
        passwordHash: hashPassword(password),
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: null,
        lastLoginIp: null,
        lastLoginDevice: null,
        addresses: [],
        savedWishlist: [],
        collectedVouchers: [],
        createdBy: inv.invitedBy,
        deactivatedAt: null
      },
      inv.roleIds
    );
    store.markInvitationAccepted(inv.id);

    store.recordAuditLog({
      userId: created.id,
      action: 'INVITATION_ACCEPTED',
      module: 'AdminAuth',
      targetRecordId: inv.id,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success',
      additionalContext: `Invited user ${created.email} completed onboarding`
    });

    res.status(201).json({
      success: true,
      message: 'Account provisioned successfully. Please sign in through Admin Login.'
    });
  });

  router.post('/forgot-password', validateCsrfToken, rateLimitAuth(10, 60_000), (req, res) => {
    const identifier = String(req.body?.identifier || '').trim();
    if (!identifier) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Email or username is required.' });
      return;
    }
    const user = store.findUserByIdentifier(identifier);
    let previewToken: string | undefined;
    if (user && store.isUserPrivilegedPortalMember(user.id) && user.status !== 'deactivated') {
      const rawToken = generateOpaqueToken(24);
      store.createPasswordResetToken(user.id, rawToken, 'email', store.getSettings().passwordResetExpiryMinutes);
      store.recordAuditLog({
        userId: user.id,
        action: 'ADMIN_PASSWORD_RESET_REQUESTED',
        module: 'AdminAuth',
        targetRecordId: user.id,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        result: 'success'
      });
      if (options.exposeDebugTokens) previewToken = rawToken;
    }
    res.json({
      success: true,
      message: 'If an eligible administrator account matches, reset instructions have been issued.',
      ...(previewToken ? { resetTokenPreview: previewToken } : {})
    });
  });

  router.post('/refresh', validateCsrfToken, (req, res) => {
    const rawRefresh = req.cookies?.[REFRESH_COOKIE];
    if (!rawRefresh) {
      res.status(401).json({ error: 'NO_REFRESH_TOKEN', message: 'Refresh cookie missing.' });
      return;
    }
    const rotated = store.rotateRefreshToken(rawRefresh);
    if (rotated.status === 'reused') {
      clearAuthCookies(req, res);
      res.status(401).json({ error: 'REFRESH_TOKEN_REUSE_DETECTED', message: 'Token reuse detected. Sessions revoked.' });
      return;
    }
    if (rotated.status !== 'ok' || !rotated.session || !rotated.user || !rotated.newRawRefreshToken) {
      clearAuthCookies(req, res);
      res.status(401).json({ error: 'INVALID_REFRESH', message: 'Refresh token invalid or expired.' });
      return;
    }
    if (!rotated.session.isAdminSession || !store.isUserPrivilegedPortalMember(rotated.user.id)) {
      res.status(403).json({ error: 'FORBIDDEN_ADMIN_ONLY', message: 'Admin privileges required.' });
      return;
    }

    const settings = store.getSettings();
    const nextAccess = signJwt(
      {
        sub: rotated.user.id,
        sid: rotated.session.id,
        type: 'access',
        isAdminSession: true,
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
      user: toPublicUser(rotated.user, roles, permissions, Boolean(mfa?.enabled))
    });
  });

  router.post('/logout', validateCsrfToken, (req, res) => {
    const token = req.cookies?.[ACCESS_COOKIE];
    const claims = verifyJwt(token);
    if (claims?.sid) {
      store.revokeSession(claims.sid, 'Admin logout');
      store.recordAuditLog({
        userId: claims.sub,
        action: 'ADMIN_LOGOUT',
        module: 'AdminAuth',
        targetRecordId: claims.sid,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        result: 'success'
      });
    }
    clearAuthCookies(req, res);
    res.json({ success: true });
  });

  router.get('/me', mw.authenticateAdmin, (req: AuthContextRequest, res) => {
    const user = req.authUser!;
    const roles = req.authRoles!;
    const permissions = req.authPermissions!;
    const mfa = store.getUserMfa(user.id);
    res.json({
      authenticated: true,
      sessionId: req.authSession!.id,
      mfaVerified: req.authSession!.mfaVerified,
      user: toPublicUser(user, roles, permissions, Boolean(mfa?.enabled))
    });
  });

  return router;
}
