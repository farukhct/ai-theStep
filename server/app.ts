import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { SecurityStore } from './data/securityStore.ts';
import { CommerceStore } from './data/commerceStore.ts';
import { createAuthRoutes } from './routes/authRoutes.ts';
import { createAdminAuthRoutes } from './routes/adminAuthRoutes.ts';
import { createAdminUsersRoutes } from './routes/adminUsersRoutes.ts';
import { createAdminRolesRoutes } from './routes/adminRolesRoutes.ts';
import { createAdminSecurityRoutes } from './routes/adminSecurityRoutes.ts';
import { createCommerceRoutes } from './routes/commerceRoutes.ts';

export interface CreateAppOptions {
  store?: SecurityStore;
  commerceStore?: CommerceStore;
  exposeDebugTokens?: boolean;
  verifyGoogleIdToken?: (token: string) => Promise<{ email?: string; email_verified?: boolean; name?: string; picture?: string }>;
}

export function createApp(options: CreateAppOptions = {}): { app: Express; store: SecurityStore; commerceStore: CommerceStore } {
  const store = options.store || new SecurityStore();
  const commerceStore = options.commerceStore || new CommerceStore();
  const app = express();

  app.set('trust proxy', 1);

  // Configure Helmet security headers while preserving iframe preview compatibility
  app.use(
    helmet({
      frameguard: false,
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'thesteps-security-api',
      timestamp: new Date().toISOString()
    });
  });

  // OpenAPI 3.0 specification endpoint
  app.get('/api/docs/openapi.json', (_req, res) => {
    res.json({
      openapi: '3.0.3',
      info: {
        title: 'TheSteps Secure Authentication & RBAC API',
        version: '2.0.0',
        description: 'Cookie-based HttpOnly JWT + Refresh Token Rotation, TOTP MFA, Dynamic RBAC, Audit Logging & User Governance API.'
      },
      paths: {
        '/api/auth/csrf': { get: { summary: 'Initialize CSRF double-submit token cookie' } },
        '/api/auth/register': { post: { summary: 'Register customer account (enforces customer role)' } },
        '/api/auth/login': { post: { summary: 'Customer sign-in with progressive lockout' } },
        '/api/auth/verify-mfa': { post: { summary: 'Verify TOTP / recovery code for customer MFA' } },
        '/api/auth/firebase-google': { post: { summary: 'Authenticate verified Firebase Google ID token' } },
        '/api/auth/refresh': { post: { summary: 'Rotate refresh token with reuse detection' } },
        '/api/auth/me': { get: { summary: 'Fetch authenticated user identity & permissions' } },
        '/api/auth/logout': { post: { summary: 'Terminate current session and clear cookies' } },
        '/api/auth/forgot-password': { post: { summary: 'Request password reset token' } },
        '/api/auth/reset-password': { post: { summary: 'Reset password using single-use token' } },
        '/api/auth/verify-email': { post: { summary: 'Verify account email via OTP or token' } },
        '/api/auth/change-password': { post: { summary: 'Change authenticated user password' } },
        '/api/auth/sessions': { get: { summary: 'List personal active sessions' } },
        '/api/auth/mfa/enroll': { post: { summary: 'Initiate TOTP MFA enrollment' } },
        '/api/auth/mfa/verify-enroll': { post: { summary: 'Verify TOTP setup and issue recovery codes' } },
        '/api/admin/auth/login': { post: { summary: 'Dedicated Administrator / Staff login' } },
        '/api/admin/auth/verify-mfa': { post: { summary: 'Verify TOTP / recovery code for admin login' } },
        '/api/admin/auth/accept-invitation': { post: { summary: 'Complete admin/staff invitation onboarding' } },
        '/api/admin/users': { get: { summary: 'List/filter/export users' }, post: { summary: 'Create or invite user' } },
        '/api/admin/users/:id/status': { patch: { summary: 'Update user status (active/suspended/deactivated/unlocked)' } },
        '/api/admin/users/:id/assign-role': { post: { summary: 'Assign dynamic RBAC roles to user' } },
        '/api/admin/roles': { get: { summary: 'List roles' }, post: { summary: 'Create custom role' } },
        '/api/admin/permissions': { get: { summary: 'List permission catalog' }, post: { summary: 'Create custom permission' } },
        '/api/admin/security/settings': { get: { summary: 'View security policies' }, put: { summary: 'Update security policies (SuperAdmin)' } },
        '/api/admin/security/events': { get: { summary: 'View security anomaly events' } },
        '/api/admin/audit-logs': { get: { summary: 'Query or export append-only audit logs' } },
        '/api/admin/sessions': { get: { summary: 'Monitor all active platform sessions' } },
        '/api/commerce/coupons/validate': { post: { summary: 'Validate voucher code against cart subtotal' } },
        '/api/commerce/payments/initiate': { post: { summary: 'Initiate EPS payment session' } },
        '/api/commerce/payments/authorize': { post: { summary: 'Authorize EPS online payment channel' } },
        '/api/commerce/payments/cancel': { post: { summary: 'Cancel active EPS payment session' } },
        '/api/commerce/orders': { post: { summary: 'Place idempotent order with verified payment or COD' } },
        '/api/commerce/orders/mine': { get: { summary: 'Fetch authenticated customer orders' } },
        '/api/commerce/orders/track/:query': { get: { summary: 'Track shipment by order ID, tracking ID, or phone' } }
      }
    });
  });

  const isDevExpose = options.exposeDebugTokens ?? process.env.NODE_ENV !== 'production';

  app.use(
    '/api/auth',
    createAuthRoutes(store, {
      exposeDebugTokens: isDevExpose,
      verifyGoogleIdToken: options.verifyGoogleIdToken
    })
  );
  app.use('/api/admin/auth', createAdminAuthRoutes(store, { exposeDebugTokens: isDevExpose }));
  app.use('/api/admin/users', createAdminUsersRoutes(store, { exposeDebugTokens: isDevExpose }));
  app.use('/api/admin', createAdminRolesRoutes(store));
  app.use('/api/admin', createAdminSecurityRoutes(store));
  app.use('/api/commerce', createCommerceRoutes(store, commerceStore, { exposeDebugTokens: isDevExpose }));

  return { app, store, commerceStore };
}
