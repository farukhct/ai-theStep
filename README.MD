# TheSteps — E-Commerce Platform & Enterprise Security Architecture

> **The Ultimate Online Shopping BD Experience** · Full-featured multi-department marketplace storefront, EPS digital checkout, local-drive media optimizer, TailAdmin ERP dashboard, and an enterprise-grade **Authentication, RBAC, TOTP MFA, Session Rotation, Security Monitoring & Append-Only Audit System** built with **React 19**, **TypeScript**, **React Router**, **Tailwind CSS v4**, **Node.js / Express.js**, and **Firebase**.

---

## Live Environments & Metadata

| Item | Details |
| --- | --- |
| **Brand Name** | **TheSteps** (`thesteps.com.bd`) |
| **Development URL** | https://ais-dev-o65z4twbgppluzgf3ks6gh-135013076922.asia-southeast1.run.app |
| **Shared Preview URL** | https://ais-pre-o65z4twbgppluzgf3ks6gh-135013076922.asia-southeast1.run.app |
| **Currency & Localization** | Bangladeshi Taka (`৳` BDT) · Bilingual **English (`en`)** & **Bengali (`bn`)** |
| **Backend API & Auth** | Express.js (`server.ts` / `server/app.ts`) on Port `3000` with HttpOnly Cookies, CSRF, Helmet & Zod |
| **Cloud Sync** | Cloud Firestore (`ai-studio-1a418eef-cb15-4548-9402-e9592242d773`) + Verified Google Identity (`firebase-admin`) |
| **Platform Owner Email** | `faruk017@gmail.com` |
| **Detailed Guides** | See [`docs/`](./docs/INSTALLATION.md): `AUTHENTICATION.md`, `AUTHORIZATION.md`, `SECURITY.md`, `DATABASE.md`, `INSTALLATION.md` |

---

## 1. Security Architecture & Core Capabilities

1. **Separated Authentication Portals on Centralized API (`server/routes/`)**:
   - **Customer & Storefront Auth (`/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-account`, `/account/*`)**: Supports email/username + password, verified Google Sign-In (`POST /api/auth/firebase-google`), email OTP/link verification, password recovery, and customer role enforcement (rejects role injection `403`).
   - **Dedicated Administrator Auth (`/admin/login`, `/admin/forgot-password`, `/admin/verify-mfa`, `/invite/accept`)**: Completely separated privileged interface with zero public signup, progressive login delays, temporary brute-force lockouts (`423`), and invitation-only onboarding.
2. **HttpOnly Cookie Sessions & CSRF (`server/middleware/authMiddleware.ts`)**:
   - Zero tokens in `localStorage`. Issues `HttpOnly`, `SameSite` (`None; Secure` on HTTPS preview) cookies (`thesteps_access`, `thesteps_refresh`, `thesteps_mfa_pending`).
   - Double-submit `thesteps_csrf` cookie paired with `X-CSRF-Token` validation on mutating requests.
   - Refresh token rotation with **reuse detection**: replaying a consumed refresh token revokes the entire session token family immediately.
3. **TOTP Multi-Factor Authentication & Recovery Codes (`server/security/crypto.ts`)**:
   - Full TOTP enrollment (`otpauth://` URI + secret), 6-digit verification, single-use `XXXX-XXXX` recovery codes (stored hashed with SHA-256), and AES-256-GCM encrypted secrets at rest.
4. **Dynamic RBAC & Hierarchy Protection (`server/authorization/rbac.ts`)**:
   - 5 hierarchical default roles (`superadmin` 100, `administrator` 80, `manager` 60, `staff` 40, `customer` 10) + custom role & permission creation + per-user `allow`/`deny` overrides applied live on backend middleware without rebuilding.
   - Prevents privilege escalation across lower tiers and blocks removing/deactivating/demoting the **final active Super Administrator**.
5. **Admin Security Operations Console (`src/components/dashboard/AdminDashboard.tsx` & `security/`)**:
   - Permission-gated sidebar navigation (`User Management`, `Administrators`, `Staff Accounts`, `Customer Accounts`, `Role Management`, `Permissions Matrix`, `Active Sessions`, `Login History`, `Security Events`, `Security Settings`, `Audit Logs`, `My Profile & Personal Security`, and `Logout`).
   - User analytics KPIs, CSV reports, role/permission management UI, active device/session termination, security event resolution, and immutable redacted audit trail viewer (`405` enforced on `PUT`/`DELETE`).
6. **Frontend Protected Routes (`src/routes/ProtectedRoute.tsx` & `src/App.tsx`)**:
   - React Router guards (`RequireAuth`, `RequireAdmin`) protecting `/admin/*` and `/account/*` with dedicated `401 Unauthorized` and `403 Forbidden` views.

---

## 2. E-Commerce Platform Capabilities

- **12+ Product Departments** (`mobile-gadgets`, `audio-headphones`, `computer-office`, `home-appliances`, `health-beauty`, `fashion`, `furniture-decor`, `household-kitchenware`, `electronics-accessories`, `baby-kids`, `daily-needs`, `sports-fitness`), Flash Sale countdowns, Product Detail variants, Customer Price Bidding, and Voucher Center.
- **Easy Payment System (EPS) Checkout (21 Channels)**: Cards (VISA, MasterCard, Amex, DBBL), Internet Banking (Southeast Bank, Meghna Bank, Islami Bank, Al-Arafah), Mobile Banking (bKash, Nagad, Rocket, Ok Wallet, Meghna Pay, Sheba Pay, Islamic Wallet, Upay, Tap, MCash), and COD across all 8 Bangladesh Divisions.
- **Non-Popup Inline Product Studio (`ProductEditorPage.tsx`) & Local Drive Image Optimizer (`LocalImageUploader.tsx`)**: Drag-and-drop resizing & WebP/JPEG compression directly in browser.
- **TailAdmin Commerce ERP**: Analytics charts (`TailAdminCharts.tsx`), Inventory Ledger, Suppliers & Purchase Orders, P&L Statement with EPS 1.5% fee accounting, and CSV/JSON exports.

---

## 3. Project Structure

```text
/
├── server.ts                         # Node.js HTTP entry point (Express + Vite SSR/SPA middleware)
├── server/
│   ├── app.ts                        # Express app factory, Helmet headers, OpenAPI spec (/api/docs/openapi.json)
│   ├── authorization/rbac.ts         # System permissions catalog & default hierarchical roles
│   ├── data/securityStore.ts         # 21-entity persisted security database, rotation, risk & redacted audit logs
│   ├── middleware/authMiddleware.ts  # authenticateUser, authenticateAdmin, requirePermission, CSRF, rateLimit
│   ├── routes/                       # authRoutes, adminAuthRoutes, adminUsersRoutes, adminRolesRoutes, adminSecurityRoutes
│   ├── security/crypto.ts            # scryptSync, timingSafeEqual, AES-256-GCM, HS256 JWT, RFC 6238 TOTP
│   └── scripts/provisionSuperadmin.ts # CLI tool (npm run seed:superadmin)
├── tests/
│   └── security.test.ts              # Automated Node test suite (CSRF, RBAC, MFA, lockout, token reuse, audit logs)
├── docs/                             # AUTHENTICATION.md, AUTHORIZATION.md, SECURITY.md, DATABASE.md, INSTALLATION.md
└── src/
    ├── App.tsx                       # Storefront + React Router protected admin/customer routes
    ├── routes/ProtectedRoute.tsx     # RequireAuth, RequireAdmin, 401/403 pages
    ├── pages/auth/AuthPages.tsx      # Dedicated Login, Register, Forgot/Reset, Verify, Invite, Admin Login/MFA pages
    ├── services/apiClient.ts         # Credentialed fetch wrapper with CSRF header & single-flight refresh
    ├── context/AuthContext.tsx       # Backend session state, Google ID token bridge, live permission checks
    └── components/
        ├── auth/                     # AuthModal, CustomerPortalModal, PersonalSecurityPanel, PasswordStrengthMeter
        ├── checkout/                 # CheckoutModal, EpsPaymentBadge, EpsPaymentOptionsModal, PaymentGatewayModal
        ├── common/                   # Header, Footer, LocalImageUploader, InvoiceModal, NotificationDrawer, DevDocsModal
        └── dashboard/
            ├── AdminDashboard.tsx    # Permission-gated TailAdmin shell + commerce & security tabs
            ├── ProductEditorPage.tsx # Full-page product creator/editor
            └── security/             # UserManagementView, RolePermissionView, SecurityOperationsView
```

---

## 4. Verification, Testing & Running

```bash
# Install dependencies
npm install

# Provision initial Super Administrator (optional interactive setup)
npm run seed:superadmin

# Typecheck TypeScript across client and server
npm run lint

# Run automated security & authorization test suite
npm run test:security

# Start development server on port 3000
npm run dev

# Build and start production server
npm run build
npm run start
```
