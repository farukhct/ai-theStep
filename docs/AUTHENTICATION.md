# Authentication Architecture — TheSteps

## Overview

TheSteps enforces a **centralized backend authentication system** hosted by Express.js (`server.ts` + `server/routes/*`) while separating user-facing login interfaces:

- **Customer & Storefront Portal (`/login`, `/register`, Header Modal):** Supports email/username + password, verified Google Sign-In (`firebase-admin` token validation), email OTP/link verification, MFA challenge, and password recovery.
- **Dedicated Administrator Console Portal (`/admin/login`, `/admin/forgot-password`, `/admin/verify-mfa`):** Separated UI portal with zero public registration, mandatory password length >= 12 chars, optional/recommended TOTP MFA, progressive login backoff, and brute-force account lockout.

All credentials, JWT access tokens (`thesteps_access`), opaque refresh tokens (`thesteps_refresh`), and MFA challenge tokens (`thesteps_mfa_pending`) are stored strictly in **HttpOnly SameSite cookies** (never `localStorage`).

---

## Customer & Storefront Authentication Workflow

```text
Browser (/login)                    Express API (/api/auth/*)                SecurityStore
      |                                        |                                  |
      |--- GET /api/auth/csrf ---------------->|                                  |
      |<-- Set-Cookie: thesteps_csrf ----------|                                  |
      |                                        |                                  |
      |--- POST /api/auth/login -------------->|                                  |
      |    (X-CSRF-Token + credentials)        |--- verify scrypt + lockout ----->|
      |                                        |--- verify active status -------->|
      |                                        |--- block admin-level portals --->|
      |                                        |                                  |
      |    [If MFA Enabled]                    |                                  |
      |<-- 200 { mfaRequired: true } ----------| (Sets HttpOnly mfa_pending)      |
      |--- POST /api/auth/verify-mfa --------->|--- verify TOTP / recovery code ->|
      |                                        |                                  |
      |<-- Set-Cookie: access + refresh -------|--- create UserSession + family ->|
```

---

## Administrator Authentication & TOTP MFA Workflow

```text
Admin UI (/admin/login)             Express API (/api/admin/auth/*)          SecurityStore
      |                                        |                                  |
      |--- POST /api/admin/auth/login -------->|--- progressive failed delay ---->|
      |    (identifier, password, rememberMe)  |--- check active status --------->|
      |                                        |--- verify privileged role ------>|
      |                                        |--- verify scrypt hash ---------->|
      |    [If UserMfa.enabled === true]       |                                  |
      |<-- { mfaRequired: true } --------------| (Issues mfa_pending cookie)      |
      |--- Redirect -> /admin/verify-mfa       |                                  |
      |--- POST /api/admin/auth/verify-mfa --->|--- decrypt AES-256-GCM secret -->|
      |                                        |--- validate TOTP or recovery --->|
      |<-- Set-Cookie: access + refresh -------|--- create admin UserSession ---->|
      |--- Redirect -> /admin/dashboard        |                                  |
```

---

## Admin Provisioning & Invitation Flow

1. **Zero Public Admin Signup:** Public `POST /api/auth/register` strictly rejects any `role`, `roles`, `permissions`, or `isAdmin` payload (`403 ROLE_INJECTION_REJECTED`) and automatically assigns the `customer` role.
2. **Initial Super Administrator Provisioning:**
   - Executed via `npm run seed:superadmin` (`server/scripts/provisionSuperadmin.ts`) or environment bootstrapping (`SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD`).
   - Enforces strong 12+ character non-breached passphrase validation.
   - Owner Google identity (`faruk017@gmail.com`) is mapped cleanly via verified `firebase-admin` ID token verification (`POST /api/auth/firebase-google`).
3. **Staff / Administrator Invitation (`/invite/accept`):**
   - Authorized admins create a time-limited, single-use invitation (`POST /api/admin/users` with `mode: 'invite'`).
   - Only SHA-256 hashes of invitation tokens are persisted.
   - Invited users establish their own 12+ char passphrase via `/invite/accept` before activation.
