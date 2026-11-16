# Installation, Provisioning & Deployment Guide — TheSteps

## 1. Prerequisites

- **Node.js `v22+`** and **`npm`**
- Copy `.env.example` to `.env` if configuring environment variables locally (never commit `.env` or secrets).

---

## 2. Environment Variables

| Variable | Description |
| --- | --- |
| `AUTH_TOKEN_SECRET` | High-entropy secret (>= 32 chars) used to sign HS256 JWTs. Auto-generated to `.data/.runtime-secret` (`0600`) in development if unset. |
| `MFA_ENCRYPTION_KEY` | Dedicated key for AES-256-GCM TOTP secret encryption at rest. |
| `SUPERADMIN_EMAIL` | Optional startup SuperAdmin provisioning email (for `npm run seed:superadmin`). |
| `SUPERADMIN_PASSWORD` | Strong 12+ character passphrase for initial CLI provisioning (never committed in source). |
| `NODE_ENV` | Set to `production` in production deployments to disable dev debug token previews and enforce HTTPS secure cookie flags. |

---

## 3. Initial Setup & Super Administrator Provisioning

```bash
# 1. Install all frontend and backend dependencies
npm install

# 2. Provision your first Super Administrator interactively or via env
npm run seed:superadmin
```

Owner Google authentication (`faruk017@gmail.com`) is also pre-authorized via verified `firebase-admin` Google ID token sign-in.

---

## 4. Verification, Security Tests & Running

```bash
# Typecheck entire React + Node.js codebase
npm run lint

# Run automated end-to-end security, RBAC, MFA, rotation & audit test suite
npm run test:security

# Start development full-stack server on port 3000
npm run dev

# Build frontend & run production server
npm run build
npm run start
```

---

## 5. Interactive API Specification

Once the server is running on port `3000`, the live OpenAPI 3.0.3 schema is served at:

- `GET http://localhost:3000/api/docs/openapi.json`
- `GET http://localhost:3000/api/health`
