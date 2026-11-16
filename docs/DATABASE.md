# Normalized 21-Entity Security Database Schema — TheSteps

## Entity Relationship Diagram

```text
+------------------+       +---------------+       +-------------+
|      Users       |1-----*|   UserRoles   |*-----1|    Roles    |
+------------------+       +---------------+       +-------------+
| id (PK, UUID)    |                               | id (PK)     |
| username (UQ)    |       +---------------+       | slug (UQ)   |
| email (UQ)       |       |RolePermissions|       | hierarchy   |
| password_hash    |       +---------------+       +-------------+
| status           |       | role_id (FK)  |<------------+
| failed_attempts  |       | perm_id (FK)  |-------*+-------------+
+------------------+       +---------------+        | Permissions |
  |  |  |  |  |                                     +-------------+
  |  |  |  |  +---* UserPermissionOverrides ------->| id (PK)     |
  |  |  |  |                                        | code (UQ)   |
  |  |  |  +------* UserSessions 1----* RefreshTokens| category   |
  |  |  |                               | isCritical  |
  |  |  +---------* UserMfa 1---* MfaRecoveryCodes  +-------------+
  |  |
  |  +------------* PasswordResetTokens / VerificationTokens / PasswordHistory
  +---------------* LoginHistory / LoginAttempts / AuditLogs / SecurityEvents / UserNotifications
```

## Required 21 Entities

1. `Users` — Identity, contact details, password hash (`scrypt`), status (`active`, `pending_verification`, `inactive`, `suspended`, `locked`, `deactivated`), lockout tracking, last login metadata.
2. `Roles` — Dynamic roles (`superadmin`, `administrator`, `manager`, `staff`, `customer`, plus custom roles) with hierarchy levels.
3. `Permissions` — Fine-grained capability catalog (`users.*`, `roles.*`, `permissions.*`, `auth.*`, `security.*`, `profile.*`, `products.*`, `orders.*`, `finance.*`).
4. `UserRoles` — Multi-role assignment join records with `assignedBy` metadata.
5. `RolePermissions` — Role-to-permission mappings.
6. `UserPermissionOverrides` — Per-user explicit `allow` or `deny` capability overrides with reason tracking.
7. `UserSessions` — Device, browser, OS, IP, idle timeout, absolute expiry, MFA verified flag, and revocation metadata.
8. `RefreshTokens` — Rotated SHA-256 token hashes bound to `familyId` for replay/reuse detection.
9. `LoginAttempts` — Sliding-window authentication attempt counters per identifier + IP.
10. `LoginHistory` — Risk-scored sign-in log (`success`, `isAdminPortal`, `riskScore`, `riskFlags`).
11. `PasswordResetTokens` — Single-use expiring SHA-256 reset token hashes.
12. `PasswordHistory` — Rolling hash archive enforcing configurable reuse prevention.
13. `EmailVerificationTokens` & `PhoneVerificationTokens` — Expiring SHA-256 OTP & verification token records.
14. `AdminInvitations` — Time-limited administrator/staff onboarding invitations created by authorized admins.
15. `UserMfa` — AES-256-GCM encrypted TOTP secrets and enrollment timestamps.
16. `MfaRecoveryCodes` — Single-use SHA-256 hashed backup codes (`usedAt` tracked).
17. `SecuritySettings` — Centralized runtime security policies (password length/history, lockout thresholds, token TTLs, MFA enforcement).
18. `AuditLogs` — Immutable append-only audit trail with redacted `previousValue`/`newValue` diffs.
19. `SecurityEvents` — High-risk anomaly alerts (brute-force lockouts, token reuse, privilege escalation attempts) with resolution status.
20. `UserNotifications` — Personal security notifications (password resets, MFA updates, account unlocks).
