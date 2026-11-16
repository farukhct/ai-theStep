import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { SecurityStore, type UserEntity, type UserSessionEntity, type RoleEntity } from '../data/securityStore.ts';
import { generateOpaqueToken, getRuntimeSecret, verifyJwt, type JwtClaims } from '../security/crypto.ts';

export const ACCESS_COOKIE = 'thesteps_access';
export const REFRESH_COOKIE = 'thesteps_refresh';
export const MFA_PENDING_COOKIE = 'thesteps_mfa_pending';
export const CSRF_COOKIE = 'thesteps_csrf';

export interface AuthContextRequest extends Request {
  authUser?: UserEntity;
  authSession?: UserSessionEntity;
  authRoles?: RoleEntity[];
  authPermissions?: string[];
  authClaims?: JwtClaims;
  mfaPendingClaims?: JwtClaims;
}

export function getClientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.trim()) {
    return fwd.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || '127.0.0.1';
}

export function getUserAgent(req: Request): string {
  return String(req.headers['user-agent'] || 'Unknown Client').slice(0, 300);
}

function isHttpsRequest(req: Request): boolean {
  const fwdProto = String(req.headers['x-forwarded-proto'] || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  return Boolean(req.secure || req.protocol === 'https' || fwdProto === 'https');
}

function signCsrfValue(nonce: string): string {
  const sig = crypto
    .createHmac('sha256', `${getRuntimeSecret()}:csrf`)
    .update(nonce)
    .digest('base64url');
  return `${nonce}.${sig}`;
}

function verifySignedCsrfValue(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2 || parts[0].length < 16 || !parts[1]) return false;
  const expected = signCsrfValue(parts[0]);
  try {
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function isSameOriginBrowserRequest(req: Request): boolean {
  const expectedHost = String(req.headers['x-forwarded-host'] || req.headers.host || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  if (!expectedHost) return false;

  const origin = typeof req.headers.origin === 'string' ? req.headers.origin.trim() : '';
  if (origin) {
    try {
      return new URL(origin).host.toLowerCase() === expectedHost;
    } catch {
      return false;
    }
  }

  const referer = typeof req.headers.referer === 'string' ? req.headers.referer.trim() : '';
  if (referer) {
    try {
      return new URL(referer).host.toLowerCase() === expectedHost;
    } catch {
      return false;
    }
  }

  return false;
}

export function ensureCsrfCookie(req: Request, res: Response): string {
  const existing = req.cookies?.[CSRF_COOKIE];
  if (existing && typeof existing === 'string' && verifySignedCsrfValue(existing)) {
    return existing;
  }
  const token = signCsrfValue(generateOpaqueToken(24));
  const secure = isHttpsRequest(req);
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure,
    sameSite: secure ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 3600 * 1000,
    ...(secure ? { partitioned: true } : {})
  } as any);
  return token;
}

export function setAuthCookies(
  req: Request,
  res: Response,
  store: SecurityStore,
  accessToken: string,
  refreshToken: string,
  rememberMe = false
): void {
  const settings = store.getSettings();
  const secure = isHttpsRequest(req);
  const sameSite: 'none' | 'lax' = secure ? 'none' : 'lax';
  const accessMaxAge = settings.accessTokenLifetimeMinutes * 60 * 1000;
  const refreshMaxAge = (rememberMe ? settings.refreshTokenLifetimeDays : 1) * 24 * 3600 * 1000;
  const partitionedExtra = secure ? { partitioned: true } : {};

  res.cookie(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    maxAge: accessMaxAge,
    ...partitionedExtra
  } as any);
  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    maxAge: refreshMaxAge,
    ...partitionedExtra
  } as any);
  ensureCsrfCookie(req, res);
}

export function setMfaPendingCookie(req: Request, res: Response, pendingToken: string): void {
  const secure = isHttpsRequest(req);
  res.cookie(MFA_PENDING_COOKIE, pendingToken, {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    path: '/',
    maxAge: 10 * 60 * 1000,
    ...(secure ? { partitioned: true } : {})
  } as any);
}

export function clearAuthCookies(req: Request, res: Response, includeMfaPending = true): void {
  const secure = isHttpsRequest(req);
  const opts = {
    httpOnly: true,
    secure,
    sameSite: (secure ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
    ...(secure ? { partitioned: true } : {})
  } as any;
  res.clearCookie(ACCESS_COOKIE, opts);
  res.clearCookie(REFRESH_COOKIE, opts);
  if (includeMfaPending) {
    res.clearCookie(MFA_PENDING_COOKIE, opts);
  }
}

export function validateCsrfToken(req: Request, res: Response, next: NextFunction): void {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers['x-csrf-token'];

  if (typeof headerToken !== 'string' || !headerToken) {
    res.status(403).json({ error: 'CSRF_TOKEN_MISSING', message: 'Missing or invalid CSRF protection token.' });
    return;
  }

  if (typeof cookieToken === 'string' && cookieToken.length > 0) {
    try {
      const a = Buffer.from(cookieToken);
      const b = Buffer.from(headerToken);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        res.status(403).json({ error: 'CSRF_TOKEN_MISMATCH', message: 'CSRF token validation failed.' });
        return;
      }
      next();
      return;
    } catch {
      res.status(403).json({ error: 'CSRF_TOKEN_MISMATCH', message: 'CSRF token validation failed.' });
      return;
    }
  }

  // Fallback for cross-site iframes where third-party cookies are stripped by the browser:
  // require a same-origin browser request + valid HMAC-signed server-issued CSRF token.
  if (isSameOriginBrowserRequest(req) && verifySignedCsrfValue(headerToken)) {
    next();
    return;
  }

  res.status(403).json({ error: 'CSRF_TOKEN_MISSING', message: 'Missing or invalid CSRF protection token.' });
}

const ipBurstBuckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimitAuth(maxRequests = 25, windowMs = 60_000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = getClientIp(req);
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const bucket = ipBurstBuckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      ipBurstBuckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }
    bucket.count += 1;
    if (bucket.count > maxRequests) {
      res.status(429).json({
        error: 'RATE_LIMITED',
        message: 'Too many authentication requests from this network. Please wait before trying again.'
      });
      return;
    }
    next();
  };
}

export function extractAccessToken(req: Request): string | undefined {
  const fromCookie = req.cookies?.[ACCESS_COOKIE];
  if (typeof fromCookie === 'string' && fromCookie.length > 0) {
    return fromCookie;
  }
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (bearer.length > 0) return bearer;
  }
  return undefined;
}

export function createAuthMiddleware(store: SecurityStore) {
  const resolveSessionAndUser = (req: AuthContextRequest): { errorStatus?: number; errorCode?: string; message?: string } => {
    const token = extractAccessToken(req);
    const claims = verifyJwt(token);
    if (!claims || claims.type !== 'access') {
      return { errorStatus: 401, errorCode: 'UNAUTHENTICATED', message: 'Valid session authentication is required.' };
    }

    const session = store.findSessionById(claims.sid);
    if (!session || session.revokedAt) {
      return { errorStatus: 401, errorCode: 'SESSION_REVOKED', message: 'Session has been terminated. Please sign in again.' };
    }

    const now = Date.now();
    if (new Date(session.expiresAt).getTime() < now || new Date(session.idleExpiresAt).getTime() < now) {
      store.revokeSession(session.id, 'Session expired due to idle or absolute timeout');
      return { errorStatus: 401, errorCode: 'SESSION_EXPIRED', message: 'Session expired. Please sign in again.' };
    }

    const user = store.findUserById(claims.sub);
    if (!user) {
      return { errorStatus: 401, errorCode: 'USER_NOT_FOUND', message: 'Account no longer exists.' };
    }

    if (user.status !== 'active') {
      return {
        errorStatus: 403,
        errorCode: `ACCOUNT_${user.status.toUpperCase()}`,
        message: `Account access blocked because account status is "${user.status}".`
      };
    }

    if (user.lockedUntil && new Date(user.lockedUntil).getTime() > now) {
      return {
        errorStatus: 423,
        errorCode: 'ACCOUNT_LOCKED',
        message: 'Account is temporarily locked due to repeated failed attempts.'
      };
    }

    const roles = store.getUserRoles(user.id);
    const effectivePermissions = store.getEffectivePermissions(user.id);
    store.touchSession(session.id);

    req.authUser = user;
    req.authSession = session;
    req.authRoles = roles;
    req.authPermissions = effectivePermissions;
    req.authClaims = claims;
    return {};
  };

  const authenticateUser = (req: AuthContextRequest, res: Response, next: NextFunction): void => {
    const result = resolveSessionAndUser(req);
    if (result.errorStatus) {
      if (result.errorStatus === 401) clearAuthCookies(req, res, false);
      res.status(result.errorStatus).json({ error: result.errorCode, message: result.message });
      return;
    }
    next();
  };

  const requireActiveAccount = (req: AuthContextRequest, res: Response, next: NextFunction): void => {
    if (!req.authUser || req.authUser.status !== 'active') {
      res.status(403).json({
        error: 'ACCOUNT_INACTIVE',
        message: 'Active account required for this operation.'
      });
      return;
    }
    next();
  };

  const authenticateAdmin = (req: AuthContextRequest, res: Response, next: NextFunction): void => {
    const result = resolveSessionAndUser(req);
    if (result.errorStatus) {
      if (result.errorStatus === 401) clearAuthCookies(req, res, false);
      res.status(result.errorStatus).json({ error: result.errorCode, message: result.message });
      return;
    }

    const isPrivileged = store.isUserPrivilegedPortalMember(req.authUser!.id);
    if (!isPrivileged) {
      store.recordAuditLog({
        userId: req.authUser!.id,
        action: 'ADMIN_API_ACCESS_DENIED',
        module: 'Authorization',
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        result: 'denied',
        additionalContext: `Non-privileged user attempted to access ${req.originalUrl}`
      });
      res.status(403).json({
        error: 'FORBIDDEN_ADMIN_ONLY',
        message: 'Administrative privileges required to access this resource.'
      });
      return;
    }

    if (!req.authSession?.isAdminSession) {
      res.status(403).json({
        error: 'ADMIN_SESSION_REQUIRED',
        message: 'Please sign in through the dedicated Administrator Login portal.'
      });
      return;
    }

    // Require verified MFA when account has MFA enrolled
    const mfa = store.getUserMfa(req.authUser!.id);
    if (mfa?.enabled && !req.authSession.mfaVerified) {
      res.status(403).json({
        error: 'MFA_VERIFICATION_REQUIRED',
        message: 'Multi-Factor Authentication verification required before accessing admin APIs.'
      });
      return;
    }

    next();
  };

  const requireMfa = (req: AuthContextRequest, res: Response, next: NextFunction): void => {
    if (!req.authUser || !req.authSession) {
      res.status(401).json({ error: 'UNAUTHENTICATED', message: 'Authentication required.' });
      return;
    }
    const mfa = store.getUserMfa(req.authUser.id);
    if (mfa?.enabled && !req.authSession.mfaVerified) {
      res.status(403).json({ error: 'MFA_REQUIRED', message: 'MFA verification required.' });
      return;
    }
    next();
  };

  const requireRole = (allowedSlugs: string[]) => {
    return (req: AuthContextRequest, res: Response, next: NextFunction): void => {
      if (!req.authUser || !req.authRoles) {
        res.status(401).json({ error: 'UNAUTHENTICATED', message: 'Authentication required.' });
        return;
      }
      const userSlugs = req.authRoles.map((r) => r.slug);
      if (userSlugs.includes('superadmin') || userSlugs.some((s) => allowedSlugs.includes(s))) {
        next();
        return;
      }
      store.recordAuditLog({
        userId: req.authUser.id,
        action: 'ROLE_ACCESS_DENIED',
        module: 'Authorization',
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        result: 'denied',
        additionalContext: `Missing required role (${allowedSlugs.join(', ')}) on ${req.originalUrl}`
      });
      res.status(403).json({
        error: 'FORBIDDEN_ROLE',
        message: `Requires role: ${allowedSlugs.join(' or ')}.`
      });
    };
  };

  const requirePermission = (permissionCode: string) => {
    return (req: AuthContextRequest, res: Response, next: NextFunction): void => {
      if (!req.authUser || !req.authPermissions) {
        res.status(401).json({ error: 'UNAUTHENTICATED', message: 'Authentication required.' });
        return;
      }
      if (req.authPermissions.includes(permissionCode)) {
        next();
        return;
      }
      store.recordAuditLog({
        userId: req.authUser.id,
        action: 'PERMISSION_DENIED',
        module: 'Authorization',
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        result: 'denied',
        additionalContext: `Missing permission "${permissionCode}" on ${req.method} ${req.originalUrl}`
      });
      res.status(403).json({
        error: 'FORBIDDEN_PERMISSION',
        message: `Missing required permission: ${permissionCode}`
      });
    };
  };

  return {
    authenticateUser,
    requireActiveAccount,
    authenticateAdmin,
    requireMfa,
    requireRole,
    requirePermission
  };
}
