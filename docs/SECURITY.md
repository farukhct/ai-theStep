# Security Controls & OWASP ASVS Compliance — TheSteps

## Implemented Cryptographic & Protocol Controls

| Control Area | Implementation Details |
| --- | --- |
| **Password Hashing** | `crypto.scryptSync(password, randomSalt16B, 64, { N: 16384, r: 8, p: 1 })` verified via `crypto.timingSafeEqual`. Plaintext passwords are never logged or stored. |
| **Password Policy & History** | Enforce `>= 8` chars for customers (`>= 12` chars for admin/staff), compromised breach dictionary checks, personal-term checks, and configurable reuse history (`PasswordHistory`). |
| **Cookie & CSRF Security** | Access (`thesteps_access`), refresh (`thesteps_refresh`), and MFA pending (`thesteps_mfa_pending`) tokens issued as `HttpOnly; SameSite` cookies (`Secure` + `SameSite=None` on HTTPS preview). Double-submit `thesteps_csrf` cookie + `X-CSRF-Token` validation protects all mutating endpoints. |
| **Zero `localStorage` Tokens** | Frontend stores zero JWTs, refresh tokens, or password credentials in Web Storage. |
| **Refresh Token Rotation & Reuse Detection** | Every `POST /api/auth/refresh` consumes the prior token hash, issues a new rotated token in the same `familyId`, and revokes the entire token family + session if a consumed token is replayed. |
| **TOTP MFA at Rest** | 160-bit Base32 TOTP secrets are encrypted with **AES-256-GCM** using a unique 96-bit IV + AuthTag before persistence. 8 single-use recovery codes (`XXXX-XXXX`) are stored exclusively as **SHA-256** hashes. |
| **Token & OTP Storage** | Password reset tokens, email/phone OTPs, and admin invitation tokens are persisted strictly as **SHA-256** digests (`tokenHash`). |
| **Brute-Force & Anomaly Detection** | Sliding-window rate limiting + progressive delays per failed attempt + automatic `locked` status after `maxLoginAttempts` + anomaly scoring on IP/device changes logged to `SecurityEvents`. |
| **Append-Only Redacted Audit Logs** | All auth, RBAC, status, session, and policy changes append to `AuditLogs` with `sanitizeAuditPayload` recursively masking passwords, tokens, OTPs, and secrets with `[REDACTED]`. `PUT/PATCH/DELETE /api/admin/audit-logs*` return `405 Method Not Allowed`. |
| **HTTP Security Headers** | Configured via `helmet` (`X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Strict-Transport-Security`, COOP `same-origin-allow-popups` for Google OAuth, iFrame-compatible framing). |
