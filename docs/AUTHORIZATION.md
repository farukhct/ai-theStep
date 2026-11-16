# Role-Based Access Control (RBAC) & Authorization — TheSteps

## Authorization Architecture

Every privileged route under `/api/admin/*` and `/api/auth/sessions|mfa|profile|change-password` executes multi-layer server-side middleware (`server/middleware/authMiddleware.ts`):

1. `validateCsrfToken` — Double-submit token validation matching `thesteps_csrf` cookie with `X-CSRF-Token` request header on all mutating routes.
2. `authenticateUser` / `authenticateAdmin` — Validates HS256 JWT access token, verifies active `UserSession` (`revokedAt === null`, within `idleExpiresAt` and `expiresAt`), verifies MFA verification state when enrolled, and loads fresh effective permissions directly from `SecurityStore`.
3. `requireActiveAccount` — Denies `inactive`, `suspended`, `locked`, `deactivated`, and `pending_verification` accounts immediately (`403`/`401`), neutralizing stale cookies.
4. `requirePermission(code)` / `requireRole(slug)` — Checks live computed permissions (`rolePermissions` unioned with `userPermissionOverrides`). Changes made by a SuperAdmin apply **immediately without rebuilding or restarting**.

---

## Role Hierarchy

| Role Slug | Name | Hierarchy Level | Scope Summary |
| --- | --- | --- | --- |
| `superadmin` | Super Administrator | `100` | Full unrestricted platform authority, security settings, role/permission management, SuperAdmin management. Final active SuperAdmin is protected from removal/demotion/deactivation. |
| `administrator` | Administrator | `80` | Full user directory management for lower hierarchy tiers, staff/customer lifecycle, session revocation, audit & login history viewing. Cannot modify SuperAdmins or critical `security.settings.manage`. |
| `manager` | Manager | `60` | Operations, products, orders, finance, customer views, and staff-level account visibility. Cannot assign critical permissions or alter security settings. |
| `staff` | Staff | `40` | Store fulfillment, own profile, password change, personal MFA & session control. |
| `customer` | Customer | `10` | Storefront shopping, own profile, own orders, personal MFA & active sessions. Zero administrative access. |

---

## Permission Catalog & Matrix

| Permission Code | SuperAdmin | Administrator | Manager | Staff | Customer |
| --- | :---: | :---: | :---: | :---: | :---: |
| `users.view` | ✅ | ✅ | ✅ | — | — |
| `users.create` | ✅ | ✅ | — | — | — |
| `users.update` | ✅ | ✅ | — | — | — |
| `users.activate` / `users.deactivate` | ✅ | ✅ | ✅ | — | — |
| `users.suspend` / `users.unlock` | ✅ | ✅ | — | — | — |
| `users.delete` | ✅ | — | — | — | — |
| `roles.view` / `roles.assign` | ✅ | ✅ (lower hierarchy) | — | — | — |
| `roles.create` / `roles.update` / `roles.delete` | ✅ | — | — | — | — |
| `permissions.view` | ✅ | ✅ | — | — | — |
| `permissions.create` / `permissions.update` / `permissions.assign` | ✅ | — | — | — | — |
| `security.view` | ✅ | ✅ | — | — | — |
| `security.login_history.view` | ✅ | ✅ | — | — | — |
| `security.audit_logs.view` | ✅ | ✅ | — | — | — |
| `security.sessions.revoke` | ✅ | ✅ (lower hierarchy) | — | — | — |
| `security.settings.manage` | ✅ | — | — | — | — |
| `products.*` / `orders.*` / `finance.view` | ✅ | ✅ | ✅ | Scoped | — |
| `profile.view` / `profile.update` / `profile.password.change` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `auth.sessions.manage` / `auth.mfa.manage` | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Privilege Escalation Protections

- No user can assign a role whose `hierarchyLevel` exceeds or equals their own unless they are `superadmin`.
- Only `superadmin` can assign `isCritical: true` permissions (`security.settings.manage`, `roles.*`, `permissions.create`, `users.delete`).
- Deactivating, suspending, deleting, or demoting the **final active `superadmin`** is blocked server-side (`409 FINAL_SUPERADMIN_PROTECTED`).
