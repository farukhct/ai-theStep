import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_ROLES, SYSTEM_PERMISSIONS, isAdminOrSuperAdminSlug } from '../authorization/rbac.ts';
import { hashPassword, sha256 } from '../security/crypto.ts';

export type AccountStatus =
  | 'active'
  | 'pending_verification'
  | 'inactive'
  | 'suspended'
  | 'locked'
  | 'deactivated';

export interface UserEntity {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  designation: string;
  photoURL: string;
  status: AccountStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  passwordHash: string | null;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  lastLoginDevice: string | null;
  addresses: Array<Record<string, unknown>>;
  savedWishlist: string[];
  collectedVouchers: string[];
  createdBy: string | null;
  deactivatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoleEntity {
  id: string;
  slug: string;
  name: string;
  description: string;
  hierarchyLevel: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionEntity {
  id: string;
  code: string;
  category: string;
  name: string;
  description: string;
  isCritical: boolean;
  createdAt: string;
}

export interface UserRoleEntity {
  id: string;
  userId: string;
  roleId: string;
  assignedBy: string | null;
  createdAt: string;
}

export interface RolePermissionEntity {
  id: string;
  roleId: string;
  permissionId: string;
  assignedBy: string | null;
  createdAt: string;
}

export interface UserPermissionOverrideEntity {
  id: string;
  userId: string;
  permissionId: string;
  effect: 'allow' | 'deny';
  reason: string;
  grantedBy: string | null;
  createdAt: string;
}

export interface UserSessionEntity {
  id: string;
  userId: string;
  familyId: string;
  userAgent: string;
  deviceName: string;
  browser: string;
  os: string;
  ipAddress: string;
  locationHint: string;
  isAdminSession: boolean;
  mfaVerified: boolean;
  lastActivityAt: string;
  idleExpiresAt: string;
  expiresAt: string;
  revokedAt: string | null;
  revokeReason: string | null;
  createdAt: string;
}

export interface RefreshTokenEntity {
  id: string;
  sessionId: string;
  userId: string;
  familyId: string;
  tokenHash: string;
  expiresAt: string;
  usedAt: string | null;
  revokedAt: string | null;
  replacedByTokenId: string | null;
  createdAt: string;
}

export interface LoginAttemptEntity {
  id: string;
  identifier: string;
  ipAddress: string;
  success: boolean;
  failureReason: string | null;
  createdAt: string;
}

export interface LoginHistoryEntity {
  id: string;
  userId: string | null;
  identifier: string;
  username: string;
  email: string;
  success: boolean;
  isAdminPortal: boolean;
  ipAddress: string;
  userAgent: string;
  deviceName: string;
  riskScore: number;
  riskFlags: string[];
  failureReason: string | null;
  createdAt: string;
}

export interface PasswordResetTokenEntity {
  id: string;
  userId: string;
  tokenHash: string;
  channel: 'email' | 'sms' | 'admin';
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

export interface PasswordHistoryEntity {
  id: string;
  userId: string;
  passwordHash: string;
  createdAt: string;
}

export interface VerificationTokenEntity {
  id: string;
  userId: string;
  channel: 'email' | 'phone';
  target: string;
  codeHash: string;
  tokenHash: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

export interface AdminInvitationEntity {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phoneNumber: string;
  designation: string;
  roleIds: string[];
  accountStatus: AccountStatus;
  tokenHash: string;
  invitedBy: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface UserMfaEntity {
  id: string;
  userId: string;
  method: 'totp';
  secretEncrypted: string;
  enabled: boolean;
  verifiedAt: string | null;
  updatedAt: string;
}

export interface MfaRecoveryCodeEntity {
  id: string;
  userId: string;
  codeHash: string;
  usedAt: string | null;
  createdAt: string;
}

export interface SecuritySettingsEntity {
  id: string;
  minPasswordLength: number;
  adminMinPasswordLength: number;
  passwordHistoryLimit: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  accessTokenLifetimeMinutes: number;
  refreshTokenLifetimeDays: number;
  idleSessionTimeoutMinutes: number;
  maxSessionLifetimeHours: number;
  mfaEnforcement: 'superadmin_and_admin' | 'all_privileged' | 'optional';
  requireEmailVerification: boolean;
  requireMobileVerification: boolean;
  passwordResetExpiryMinutes: number;
  invitationExpiryHours: number;
  updatedBy: string | null;
  updatedAt: string;
}

export interface AuditLogEntity {
  id: string;
  userId: string | null;
  username: string;
  role: string;
  action: string;
  module: string;
  targetRecordId: string | null;
  previousValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  result: 'success' | 'failure' | 'denied';
  additionalContext: string;
}

export interface SecurityEventEntity {
  id: string;
  userId: string | null;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  resolved: boolean;
  resolvedBy: string | null;
  createdAt: string;
}

export interface UserNotificationEntity {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'security' | 'account' | 'system';
  isRead: boolean;
  createdAt: string;
}

export interface SecurityDatabaseSchema {
  users: UserEntity[];
  roles: RoleEntity[];
  permissions: PermissionEntity[];
  userRoles: UserRoleEntity[];
  rolePermissions: RolePermissionEntity[];
  userPermissionOverrides: UserPermissionOverrideEntity[];
  userSessions: UserSessionEntity[];
  refreshTokens: RefreshTokenEntity[];
  loginAttempts: LoginAttemptEntity[];
  loginHistory: LoginHistoryEntity[];
  passwordResetTokens: PasswordResetTokenEntity[];
  passwordHistory: PasswordHistoryEntity[];
  verificationTokens: VerificationTokenEntity[];
  adminInvitations: AdminInvitationEntity[];
  userMfa: UserMfaEntity[];
  mfaRecoveryCodes: MfaRecoveryCodeEntity[];
  securitySettings: SecuritySettingsEntity;
  auditLogs: AuditLogEntity[];
  securityEvents: SecurityEventEntity[];
  userNotifications: UserNotificationEntity[];
}

const SENSITIVE_KEYS = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'passwordHash',
  'secret',
  'secretEncrypted',
  'totpSecret',
  'otp',
  'code',
  'token',
  'rawToken',
  'refreshToken',
  'accessToken',
  'tokenHash',
  'codeHash',
  'recoveryCodes'
]);

export function sanitizeAuditPayload(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(k) || k.toLowerCase().includes('password') || k.toLowerCase().includes('secret')) {
      clean[k] = '[REDACTED]';
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      clean[k] = sanitizeAuditPayload(v);
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

export function parseUserAgent(uaRaw: string): { deviceName: string; browser: string; os: string } {
  const ua = uaRaw || 'Unknown Client';
  let browser = 'Browser';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua)) browser = 'Google Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';
  else if (/Safari\//i.test(ua)) browser = 'Safari';
  else if (/node|undici|curl/i.test(ua)) browser = 'API Client';

  let os = 'Desktop';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iOS/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return {
    deviceName: `${browser} on ${os}`,
    browser,
    os
  };
}

export function toPublicUser(
  user: UserEntity,
  roles: RoleEntity[],
  effectivePermissions: string[],
  mfaEnabled: boolean
) {
  const sortedRoles = [...roles].sort((a, b) => b.hierarchyLevel - a.hierarchyLevel);
  const primaryRole = sortedRoles[0]?.slug || 'customer';
  return {
    uid: user.id,
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.fullName,
    fullName: user.fullName,
    phoneNumber: user.phoneNumber,
    designation: user.designation,
    photoURL: user.photoURL,
    status: user.status,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    role: primaryRole,
    roles: sortedRoles.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      hierarchyLevel: r.hierarchyLevel
    })),
    permissions: effectivePermissions,
    hasPassword: Boolean(user.passwordHash),
    mfaEnabled,
    mfaMethod: mfaEnabled ? 'totp' : 'none',
    failedLoginAttempts: user.failedLoginAttempts,
    lockedUntil: user.lockedUntil,
    lastLoginAt: user.lastLoginAt,
    lastLoginIp: user.lastLoginIp,
    lastLoginDevice: user.lastLoginDevice,
    addresses: user.addresses,
    savedWishlist: user.savedWishlist,
    collectedVouchers: user.collectedVouchers,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

export class SecurityStore {
  private data: SecurityDatabaseSchema;
  private persistPath: string | null;

  constructor(options: { persistPath?: string | null; bootstrapSuperadminEmail?: string; bootstrapSuperadminPassword?: string } = {}) {
    this.persistPath =
      options.persistPath === undefined
        ? path.resolve(process.cwd(), '.data', 'security-db.json')
        : options.persistPath;

    if (this.persistPath && fs.existsSync(this.persistPath)) {
      try {
        const raw = fs.readFileSync(this.persistPath, 'utf8');
        this.data = JSON.parse(raw) as SecurityDatabaseSchema;
      } catch {
        this.data = this.createInitialState();
      }
    } else {
      this.data = this.createInitialState();
    }

    this.ensureSeedIntegrity(options.bootstrapSuperadminEmail, options.bootstrapSuperadminPassword);
    this.save();
  }

  private createInitialState(): SecurityDatabaseSchema {
    const now = new Date().toISOString();
    return {
      users: [],
      roles: [],
      permissions: [],
      userRoles: [],
      rolePermissions: [],
      userPermissionOverrides: [],
      userSessions: [],
      refreshTokens: [],
      loginAttempts: [],
      loginHistory: [],
      passwordResetTokens: [],
      passwordHistory: [],
      verificationTokens: [],
      adminInvitations: [],
      userMfa: [],
      mfaRecoveryCodes: [],
      securitySettings: {
        id: 'sec_settings_default',
        minPasswordLength: 8,
        adminMinPasswordLength: 12,
        passwordHistoryLimit: 5,
        maxLoginAttempts: 5,
        lockoutDurationMinutes: 15,
        accessTokenLifetimeMinutes: 15,
        refreshTokenLifetimeDays: 7,
        idleSessionTimeoutMinutes: 30,
        maxSessionLifetimeHours: 168,
        mfaEnforcement: 'superadmin_and_admin',
        requireEmailVerification: false,
        requireMobileVerification: false,
        passwordResetExpiryMinutes: 30,
        invitationExpiryHours: 48,
        updatedBy: 'system',
        updatedAt: now
      },
      auditLogs: [],
      securityEvents: [],
      userNotifications: []
    };
  }

  private ensureSeedIntegrity(bootstrapEmail?: string, bootstrapPassword?: string): void {
    const now = new Date().toISOString();

    for (const perm of SYSTEM_PERMISSIONS) {
      if (!this.data.permissions.some((p) => p.code === perm.code)) {
        this.data.permissions.push({
          ...perm,
          createdAt: now
        });
      }
    }

    for (const roleSeed of DEFAULT_ROLES) {
      let existingRole = this.data.roles.find((r) => r.slug === roleSeed.slug);
      if (!existingRole) {
        existingRole = {
          id: roleSeed.id,
          slug: roleSeed.slug,
          name: roleSeed.name,
          description: roleSeed.description,
          hierarchyLevel: roleSeed.hierarchyLevel,
          isSystem: roleSeed.isSystem,
          createdAt: now,
          updatedAt: now
        };
        this.data.roles.push(existingRole);
      }

      if (roleSeed.isSystem) {
        for (const permCode of roleSeed.permissionCodes) {
          const permEntity = this.data.permissions.find((p) => p.code === permCode);
          if (!permEntity) continue;
          const exists = this.data.rolePermissions.some(
            (rp) => rp.roleId === existingRole!.id && rp.permissionId === permEntity.id
          );
          if (!exists && roleSeed.slug === 'superadmin') {
            this.data.rolePermissions.push({
              id: `rp_${crypto.randomUUID().slice(0, 8)}`,
              roleId: existingRole.id,
              permissionId: permEntity.id,
              assignedBy: 'system',
              createdAt: now
            });
          } else if (!exists && this.data.rolePermissions.filter((rp) => rp.roleId === existingRole!.id).length < roleSeed.permissionCodes.length) {
            this.data.rolePermissions.push({
              id: `rp_${crypto.randomUUID().slice(0, 8)}`,
              roleId: existingRole.id,
              permissionId: permEntity.id,
              assignedBy: 'system',
              createdAt: now
            });
          }
        }
      }
    }

    const superadminRole = this.data.roles.find((r) => r.slug === 'superadmin');
    const platformOwnerEmail = 'faruk017@gmail.com';
    const configuredEmail = (bootstrapEmail || process.env.SUPERADMIN_BOOTSTRAP_EMAIL || '')
      .trim()
      .toLowerCase();
    const envPass = bootstrapPassword || process.env.SUPERADMIN_BOOTSTRAP_PASSWORD || '';

    const seedSuperAccount = (emailAddr: string, idPrefix: string, withPassword: string) => {
      if (!emailAddr) return;
      let acct = this.data.users.find((u) => u.email === emailAddr);
      if (!acct) {
        acct = {
          id: idPrefix,
          username: emailAddr.split('@')[0].replace(/[^a-z0-9_]/g, '') || 'owner',
          email: emailAddr,
          fullName: emailAddr === platformOwnerEmail ? 'Store Owner (Super Admin)' : 'Provisioned Super Admin',
          phoneNumber: '+8801700000000',
          designation: 'Chief Platform Owner',
          photoURL: '',
          status: 'active',
          emailVerified: true,
          phoneVerified: true,
          passwordHash: withPassword ? hashPassword(withPassword) : null,
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: null,
          lastLoginIp: null,
          lastLoginDevice: null,
          addresses: [],
          savedWishlist: [],
          collectedVouchers: ['SMART10'],
          createdBy: 'system_provision',
          deactivatedAt: null,
          createdAt: now,
          updatedAt: now
        };
        this.data.users.push(acct);
        if (acct.passwordHash) {
          this.data.passwordHistory.push({
            id: `ph_${crypto.randomUUID().slice(0, 8)}`,
            userId: acct.id,
            passwordHash: acct.passwordHash,
            createdAt: now
          });
        }
      } else if (withPassword && !acct.passwordHash) {
        acct.passwordHash = hashPassword(withPassword);
        acct.updatedAt = now;
      }

      if (superadminRole) {
        const hasRole = this.data.userRoles.some(
          (ur) => ur.userId === acct!.id && ur.roleId === superadminRole.id
        );
        if (!hasRole) {
          this.data.userRoles.push({
            id: `ur_${crypto.randomUUID().slice(0, 8)}`,
            userId: acct.id,
            roleId: superadminRole.id,
            assignedBy: 'system_provision',
            createdAt: now
          });
        }
      }
    };

    seedSuperAccount(platformOwnerEmail, 'usr_superadmin_owner', configuredEmail === platformOwnerEmail || !configuredEmail ? envPass : '');
    if (configuredEmail && configuredEmail !== platformOwnerEmail) {
      seedSuperAccount(configuredEmail, 'usr_superadmin_bootstrap', envPass);
    }
  }

  public save(): void {
    if (!this.persistPath) return;
    const dir = path.dirname(this.persistPath);
    fs.mkdirSync(dir, { recursive: true });
    const tmpPath = `${this.persistPath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), 'utf8');
    fs.renameSync(tmpPath, this.persistPath);
  }

  public getSettings(): SecuritySettingsEntity {
    return this.data.securitySettings;
  }

  public updateSettings(
    updates: Partial<SecuritySettingsEntity>,
    actorId: string
  ): { previous: SecuritySettingsEntity; current: SecuritySettingsEntity } {
    const previous = { ...this.data.securitySettings };
    this.data.securitySettings = {
      ...this.data.securitySettings,
      ...updates,
      id: previous.id,
      updatedBy: actorId,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return { previous, current: this.data.securitySettings };
  }

  public listUsers(): UserEntity[] {
    return this.data.users;
  }

  public findUserById(id: string): UserEntity | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public findUserByIdentifier(identifier: string): UserEntity | undefined {
    const clean = identifier.trim().toLowerCase();
    const compactPhone = identifier.replace(/\s+/g, '');
    return this.data.users.find(
      (u) =>
        u.email.toLowerCase() === clean ||
        u.username.toLowerCase() === clean ||
        (u.phoneNumber && u.phoneNumber.replace(/\s+/g, '') === compactPhone)
    );
  }

  public createUser(user: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>, roleIds: string[]): UserEntity {
    const now = new Date().toISOString();
    const created: UserEntity = {
      ...user,
      id: `usr_${crypto.randomUUID().slice(0, 12)}`,
      createdAt: now,
      updatedAt: now
    };
    this.data.users.push(created);
    if (created.passwordHash) {
      this.data.passwordHistory.push({
        id: `ph_${crypto.randomUUID().slice(0, 8)}`,
        userId: created.id,
        passwordHash: created.passwordHash,
        createdAt: now
      });
    }
    this.setUserRoles(created.id, roleIds, created.createdBy || 'system');
    this.save();
    return created;
  }

  public updateUser(id: string, updates: Partial<UserEntity>): UserEntity | null {
    const user = this.findUserById(id);
    if (!user) return null;
    Object.assign(user, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return user;
  }

  public deleteUser(id: string): boolean {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    this.data.users.splice(idx, 1);
    this.data.userRoles = this.data.userRoles.filter((ur) => ur.userId !== id);
    this.data.userPermissionOverrides = this.data.userPermissionOverrides.filter((o) => o.userId !== id);
    this.revokeAllUserSessions(id, 'Account deleted');
    this.save();
    return true;
  }

  public getUserRoles(userId: string): RoleEntity[] {
    const roleIds = new Set(this.data.userRoles.filter((ur) => ur.userId === userId).map((ur) => ur.roleId));
    return this.data.roles.filter((r) => roleIds.has(r.id)).sort((a, b) => b.hierarchyLevel - a.hierarchyLevel);
  }

  public setUserRoles(userId: string, roleIds: string[], assignedBy: string): void {
    const now = new Date().toISOString();
    const validIds = new Set(this.data.roles.map((r) => r.id));
    const filtered = Array.from(new Set(roleIds)).filter((id) => validIds.has(id));
    this.data.userRoles = this.data.userRoles.filter((ur) => ur.userId !== userId);
    for (const rId of filtered) {
      this.data.userRoles.push({
        id: `ur_${crypto.randomUUID().slice(0, 8)}`,
        userId,
        roleId: rId,
        assignedBy,
        createdAt: now
      });
    }
    this.save();
  }

  public countActiveSuperadmins(): number {
    const superRole = this.data.roles.find((r) => r.slug === 'superadmin');
    if (!superRole) return 0;
    const superUserIds = new Set(
      this.data.userRoles.filter((ur) => ur.roleId === superRole.id).map((ur) => ur.userId)
    );
    return this.data.users.filter((u) => superUserIds.has(u.id) && u.status === 'active').length;
  }

  public userHasRoleSlug(userId: string, slug: string): boolean {
    return this.getUserRoles(userId).some((r) => r.slug === slug);
  }

  public getUserMaxHierarchy(userId: string): number {
    const roles = this.getUserRoles(userId);
    return roles.reduce((max, r) => Math.max(max, r.hierarchyLevel), 0);
  }

  public isUserPrivilegedPortalMember(userId: string): boolean {
    const roles = this.getUserRoles(userId);
    return roles.some((r) => r.slug !== 'customer' && r.hierarchyLevel > 10);
  }

  public isUserAdminLevel(userId: string): boolean {
    return this.getUserRoles(userId).some((r) => isAdminOrSuperAdminSlug(r.slug));
  }

  public getEffectivePermissions(userId: string): string[] {
    const roles = this.getUserRoles(userId);
    if (roles.some((r) => r.slug === 'superadmin')) {
      return this.data.permissions.map((p) => p.code);
    }

    const roleIds = new Set(roles.map((r) => r.id));
    const permIdToCode = new Map(this.data.permissions.map((p) => [p.id, p.code]));
    const allowed = new Set<string>();

    for (const rp of this.data.rolePermissions) {
      if (roleIds.has(rp.roleId)) {
        const code = permIdToCode.get(rp.permissionId);
        if (code) allowed.add(code);
      }
    }

    for (const ov of this.data.userPermissionOverrides) {
      if (ov.userId !== userId) continue;
      const code = permIdToCode.get(ov.permissionId);
      if (!code) continue;
      if (ov.effect === 'allow') allowed.add(code);
      if (ov.effect === 'deny') allowed.delete(code);
    }

    return Array.from(allowed);
  }

  public getUserPermissionOverrides(userId: string) {
    return this.data.userPermissionOverrides
      .filter((o) => o.userId === userId)
      .map((o) => {
        const p = this.data.permissions.find((perm) => perm.id === o.permissionId);
        return { ...o, permissionCode: p?.code || o.permissionId, permissionName: p?.name || o.permissionId };
      });
  }

  public setUserPermissionOverrides(
    userId: string,
    overrides: Array<{ permissionId: string; effect: 'allow' | 'deny'; reason?: string }>,
    grantedBy: string
  ): void {
    const now = new Date().toISOString();
    const validPerms = new Set(this.data.permissions.map((p) => p.id));
    this.data.userPermissionOverrides = this.data.userPermissionOverrides.filter((o) => o.userId !== userId);
    for (const ov of overrides) {
      if (!validPerms.has(ov.permissionId)) continue;
      this.data.userPermissionOverrides.push({
        id: `upo_${crypto.randomUUID().slice(0, 8)}`,
        userId,
        permissionId: ov.permissionId,
        effect: ov.effect,
        reason: ov.reason || 'Administrative override',
        grantedBy,
        createdAt: now
      });
    }
    this.save();
  }

  // Roles & Permissions CRUD
  public listRoles() {
    return this.data.roles
      .map((r) => {
        const permIds = this.data.rolePermissions
          .filter((rp) => rp.roleId === r.id)
          .map((rp) => rp.permissionId);
        const permissionCodes = this.data.permissions
          .filter((p) => permIds.includes(p.id))
          .map((p) => p.code);
        const userCount = this.data.userRoles.filter((ur) => ur.roleId === r.id).length;
        return { ...r, permissionIds: permIds, permissionCodes, userCount };
      })
      .sort((a, b) => b.hierarchyLevel - a.hierarchyLevel);
  }

  public findRoleById(id: string): RoleEntity | undefined {
    return this.data.roles.find((r) => r.id === id);
  }

  public findRoleBySlug(slug: string): RoleEntity | undefined {
    return this.data.roles.find((r) => r.slug === slug);
  }

  public createRole(input: {
    name: string;
    slug: string;
    description: string;
    hierarchyLevel: number;
    permissionCodes: string[];
    actorId: string;
  }): RoleEntity {
    const now = new Date().toISOString();
    const role: RoleEntity = {
      id: `role_${crypto.randomUUID().slice(0, 8)}`,
      slug: input.slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_'),
      name: input.name.trim(),
      description: input.description.trim(),
      hierarchyLevel: input.hierarchyLevel,
      isSystem: false,
      createdAt: now,
      updatedAt: now
    };
    this.data.roles.push(role);
    this.setRolePermissions(role.id, input.permissionCodes, input.actorId);
    this.save();
    return role;
  }

  public updateRole(roleId: string, updates: { name?: string; description?: string; hierarchyLevel?: number }): RoleEntity | null {
    const role = this.findRoleById(roleId);
    if (!role) return null;
    if (updates.name) role.name = updates.name.trim();
    if (updates.description !== undefined) role.description = updates.description.trim();
    if (!role.isSystem && typeof updates.hierarchyLevel === 'number') {
      role.hierarchyLevel = updates.hierarchyLevel;
    }
    role.updatedAt = new Date().toISOString();
    this.save();
    return role;
  }

  public deleteRole(roleId: string): boolean {
    const role = this.findRoleById(roleId);
    if (!role || role.isSystem) return false;
    this.data.roles = this.data.roles.filter((r) => r.id !== roleId);
    this.data.rolePermissions = this.data.rolePermissions.filter((rp) => rp.roleId !== roleId);
    this.data.userRoles = this.data.userRoles.filter((ur) => ur.roleId !== roleId);
    this.save();
    return true;
  }

  public setRolePermissions(roleId: string, permissionCodes: string[], actorId: string): string[] {
    const now = new Date().toISOString();
    const wanted = new Set(permissionCodes);
    const matchingPerms = this.data.permissions.filter((p) => wanted.has(p.code) || wanted.has(p.id));
    this.data.rolePermissions = this.data.rolePermissions.filter((rp) => rp.roleId !== roleId);
    for (const perm of matchingPerms) {
      this.data.rolePermissions.push({
        id: `rp_${crypto.randomUUID().slice(0, 8)}`,
        roleId,
        permissionId: perm.id,
        assignedBy: actorId,
        createdAt: now
      });
    }
    this.save();
    return matchingPerms.map((p) => p.code);
  }

  public listPermissions(): PermissionEntity[] {
    return this.data.permissions;
  }

  public createPermission(input: { code: string; category: string; name: string; description: string; isCritical?: boolean }): PermissionEntity {
    const created: PermissionEntity = {
      id: `perm_${crypto.randomUUID().slice(0, 8)}`,
      code: input.code.trim().toLowerCase(),
      category: input.category.trim(),
      name: input.name.trim(),
      description: input.description.trim(),
      isCritical: Boolean(input.isCritical),
      createdAt: new Date().toISOString()
    };
    this.data.permissions.push(created);
    this.save();
    return created;
  }

  // Sessions & Refresh Tokens
  public createSession(input: {
    userId: string;
    userAgent: string;
    ipAddress: string;
    isAdminSession: boolean;
    mfaVerified: boolean;
    rawRefreshToken: string;
    rememberMe?: boolean;
  }): UserSessionEntity {
    const now = Date.now();
    const settings = this.data.securitySettings;
    const uaInfo = parseUserAgent(input.userAgent);
    const familyId = `fam_${crypto.randomUUID().slice(0, 12)}`;
    const maxLifeMs = (input.rememberMe ? settings.refreshTokenLifetimeDays * 24 : settings.maxSessionLifetimeHours) * 3600 * 1000;
    const idleMs = settings.idleSessionTimeoutMinutes * 60 * 1000;

    const session: UserSessionEntity = {
      id: `ses_${crypto.randomUUID().slice(0, 12)}`,
      userId: input.userId,
      familyId,
      userAgent: input.userAgent,
      deviceName: uaInfo.deviceName,
      browser: uaInfo.browser,
      os: uaInfo.os,
      ipAddress: input.ipAddress,
      locationHint: 'Bangladesh / Verified IP',
      isAdminSession: input.isAdminSession,
      mfaVerified: input.mfaVerified,
      lastActivityAt: new Date(now).toISOString(),
      idleExpiresAt: new Date(now + idleMs).toISOString(),
      expiresAt: new Date(now + maxLifeMs).toISOString(),
      revokedAt: null,
      revokeReason: null,
      createdAt: new Date(now).toISOString()
    };
    this.data.userSessions.push(session);

    const refreshToken: RefreshTokenEntity = {
      id: `rt_${crypto.randomUUID().slice(0, 12)}`,
      sessionId: session.id,
      userId: input.userId,
      familyId,
      tokenHash: sha256(input.rawRefreshToken),
      expiresAt: new Date(now + settings.refreshTokenLifetimeDays * 86400 * 1000).toISOString(),
      usedAt: null,
      revokedAt: null,
      replacedByTokenId: null,
      createdAt: new Date(now).toISOString()
    };
    this.data.refreshTokens.push(refreshToken);
    this.save();
    return session;
  }

  public findSessionById(sessionId: string): UserSessionEntity | undefined {
    return this.data.userSessions.find((s) => s.id === sessionId);
  }

  public touchSession(sessionId: string): void {
    const session = this.findSessionById(sessionId);
    if (!session || session.revokedAt) return;
    const now = Date.now();
    session.lastActivityAt = new Date(now).toISOString();
    session.idleExpiresAt = new Date(now + this.data.securitySettings.idleSessionTimeoutMinutes * 60 * 1000).toISOString();
    this.save();
  }

  public markSessionMfaVerified(sessionId: string): void {
    const session = this.findSessionById(sessionId);
    if (!session) return;
    session.mfaVerified = true;
    session.lastActivityAt = new Date().toISOString();
    this.save();
  }

  public rotateRefreshToken(rawToken: string): {
    status: 'ok' | 'reused' | 'invalid' | 'expired';
    session?: UserSessionEntity;
    user?: UserEntity;
    newRawRefreshToken?: string;
  } {
    const tokenHash = sha256(rawToken);
    const tokenRecord = this.data.refreshTokens.find((rt) => rt.tokenHash === tokenHash);
    if (!tokenRecord) return { status: 'invalid' };

    const session = this.findSessionById(tokenRecord.sessionId);
    const user = this.findUserById(tokenRecord.userId);
    if (!session || !user) return { status: 'invalid' };

    // Reuse detection: previously rotated/used OR explicitly revoked token presented again -> revoke entire family!
    if (tokenRecord.usedAt || tokenRecord.revokedAt) {
      this.revokeTokenFamily(tokenRecord.familyId, 'Refresh token reuse detected');
      this.recordSecurityEvent({
        userId: user.id,
        eventType: 'REFRESH_TOKEN_REUSE',
        severity: 'critical',
        title: 'Refresh Token Reuse Detected',
        description: `A previously rotated refresh token was replayed for ${user.email}. All sessions in family ${tokenRecord.familyId} were terminated.`,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent
      });
      return { status: 'reused', user };
    }

    const now = Date.now();
    if (
      session.revokedAt ||
      new Date(tokenRecord.expiresAt).getTime() < now ||
      new Date(session.expiresAt).getTime() < now ||
      new Date(session.idleExpiresAt).getTime() < now
    ) {
      return { status: 'expired' };
    }

    const nextRaw = crypto.randomBytes(36).toString('base64url');
    const nextRecord: RefreshTokenEntity = {
      id: `rt_${crypto.randomUUID().slice(0, 12)}`,
      sessionId: session.id,
      userId: user.id,
      familyId: tokenRecord.familyId,
      tokenHash: sha256(nextRaw),
      expiresAt: new Date(now + this.data.securitySettings.refreshTokenLifetimeDays * 86400 * 1000).toISOString(),
      usedAt: null,
      revokedAt: null,
      replacedByTokenId: null,
      createdAt: new Date(now).toISOString()
    };

    tokenRecord.usedAt = new Date(now).toISOString();
    tokenRecord.replacedByTokenId = nextRecord.id;
    session.lastActivityAt = new Date(now).toISOString();
    session.idleExpiresAt = new Date(now + this.data.securitySettings.idleSessionTimeoutMinutes * 60 * 1000).toISOString();

    this.data.refreshTokens.push(nextRecord);
    this.save();
    return { status: 'ok', session, user, newRawRefreshToken: nextRaw };
  }

  public revokeTokenFamily(familyId: string, reason: string): void {
    const now = new Date().toISOString();
    for (const ses of this.data.userSessions) {
      if (ses.familyId === familyId && !ses.revokedAt) {
        ses.revokedAt = now;
        ses.revokeReason = reason;
      }
    }
    for (const rt of this.data.refreshTokens) {
      if (rt.familyId === familyId && !rt.revokedAt) {
        rt.revokedAt = now;
      }
    }
    this.save();
  }

  public revokeSession(sessionId: string, reason: string): boolean {
    const ses = this.findSessionById(sessionId);
    if (!ses || ses.revokedAt) return false;
    const now = new Date().toISOString();
    ses.revokedAt = now;
    ses.revokeReason = reason;
    for (const rt of this.data.refreshTokens) {
      if (rt.sessionId === sessionId && !rt.revokedAt) {
        rt.revokedAt = now;
      }
    }
    this.save();
    return true;
  }

  public revokeAllUserSessions(userId: string, reason: string, exceptSessionId?: string): number {
    const now = new Date().toISOString();
    let count = 0;
    for (const ses of this.data.userSessions) {
      if (ses.userId === userId && !ses.revokedAt && ses.id !== exceptSessionId) {
        ses.revokedAt = now;
        ses.revokeReason = reason;
        count++;
      }
    }
    for (const rt of this.data.refreshTokens) {
      if (rt.userId === userId && !rt.revokedAt && rt.sessionId !== exceptSessionId) {
        rt.revokedAt = now;
      }
    }
    this.save();
    return count;
  }

  public listSessions(userId?: string) {
    const now = Date.now();
    return this.data.userSessions
      .filter((s) => (!userId || s.userId === userId) && !s.revokedAt && new Date(s.expiresAt).getTime() > now)
      .map((s) => {
        const u = this.findUserById(s.userId);
        return {
          ...s,
          userEmail: u?.email || 'unknown',
          userFullName: u?.fullName || 'Unknown User',
          username: u?.username || 'unknown'
        };
      })
      .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime());
  }

  // Password history
  public getPasswordHistory(userId: string): PasswordHistoryEntity[] {
    return this.data.passwordHistory
      .filter((p) => p.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public recordPasswordChange(userId: string, newHash: string): void {
    const user = this.findUserById(userId);
    if (!user) return;
    const now = new Date().toISOString();
    user.passwordHash = newHash;
    user.updatedAt = now;
    this.data.passwordHistory.push({
      id: `ph_${crypto.randomUUID().slice(0, 8)}`,
      userId,
      passwordHash: newHash,
      createdAt: now
    });
    this.save();
  }

  // MFA
  public getUserMfa(userId: string): UserMfaEntity | undefined {
    return this.data.userMfa.find((m) => m.userId === userId);
  }

  public upsertUserMfa(userId: string, secretEncrypted: string, enabled: boolean, verifiedAt: string | null): UserMfaEntity {
    const now = new Date().toISOString();
    let rec = this.getUserMfa(userId);
    if (!rec) {
      rec = {
        id: `mfa_${crypto.randomUUID().slice(0, 8)}`,
        userId,
        method: 'totp',
        secretEncrypted,
        enabled,
        verifiedAt,
        updatedAt: now
      };
      this.data.userMfa.push(rec);
    } else {
      rec.secretEncrypted = secretEncrypted;
      rec.enabled = enabled;
      rec.verifiedAt = verifiedAt;
      rec.updatedAt = now;
    }
    this.save();
    return rec;
  }

  public replaceMfaRecoveryCodes(userId: string, plainCodes: string[]): void {
    const now = new Date().toISOString();
    this.data.mfaRecoveryCodes = this.data.mfaRecoveryCodes.filter((c) => c.userId !== userId);
    for (const code of plainCodes) {
      this.data.mfaRecoveryCodes.push({
        id: `rc_${crypto.randomUUID().slice(0, 8)}`,
        userId,
        codeHash: sha256(code.trim().toUpperCase()),
        usedAt: null,
        createdAt: now
      });
    }
    this.save();
  }

  public consumeMfaRecoveryCode(userId: string, submittedCode: string): boolean {
    const hash = sha256(submittedCode.trim().toUpperCase());
    const found = this.data.mfaRecoveryCodes.find(
      (c) => c.userId === userId && c.codeHash === hash && !c.usedAt
    );
    if (!found) return false;
    found.usedAt = new Date().toISOString();
    this.save();
    return true;
  }

  // Tokens (Reset, Email Verify, Invitations)
  public createPasswordResetToken(userId: string, rawToken: string, channel: 'email' | 'sms' | 'admin', expiryMinutes: number): PasswordResetTokenEntity {
    const now = Date.now();
    // Invalidate prior unused reset tokens for this user
    for (const t of this.data.passwordResetTokens) {
      if (t.userId === userId && !t.usedAt) t.usedAt = new Date(now).toISOString();
    }
    const entity: PasswordResetTokenEntity = {
      id: `prt_${crypto.randomUUID().slice(0, 8)}`,
      userId,
      tokenHash: sha256(rawToken),
      channel,
      expiresAt: new Date(now + expiryMinutes * 60 * 1000).toISOString(),
      usedAt: null,
      createdAt: new Date(now).toISOString()
    };
    this.data.passwordResetTokens.push(entity);
    this.save();
    return entity;
  }

  public findValidResetToken(rawToken: string): PasswordResetTokenEntity | null {
    const hash = sha256(rawToken.trim());
    const token = this.data.passwordResetTokens.find((t) => t.tokenHash === hash);
    if (!token || token.usedAt || new Date(token.expiresAt).getTime() < Date.now()) return null;
    return token;
  }

  public markResetTokenUsed(tokenId: string): void {
    const token = this.data.passwordResetTokens.find((t) => t.id === tokenId);
    if (token) {
      token.usedAt = new Date().toISOString();
      this.save();
    }
  }

  public createVerificationToken(userId: string, channel: 'email' | 'phone', target: string, rawOtp: string, rawToken: string): VerificationTokenEntity {
    const now = Date.now();
    const entity: VerificationTokenEntity = {
      id: `vt_${crypto.randomUUID().slice(0, 8)}`,
      userId,
      channel,
      target,
      codeHash: sha256(rawOtp),
      tokenHash: sha256(rawToken),
      expiresAt: new Date(now + 24 * 3600 * 1000).toISOString(),
      usedAt: null,
      createdAt: new Date(now).toISOString()
    };
    this.data.verificationTokens.push(entity);
    this.save();
    return entity;
  }

  public verifyAccountByOtpOrToken(codeOrToken: string, emailOrUserId?: string): UserEntity | null {
    const hash = sha256(codeOrToken.trim());
    const now = Date.now();
    const match = this.data.verificationTokens.find(
      (vt) =>
        !vt.usedAt &&
        new Date(vt.expiresAt).getTime() > now &&
        (vt.codeHash === hash || vt.tokenHash === hash) &&
        (!emailOrUserId || vt.userId === emailOrUserId || vt.target.toLowerCase() === emailOrUserId.toLowerCase())
    );
    if (!match) return null;
    const user = this.findUserById(match.userId);
    if (!user) return null;
    match.usedAt = new Date(now).toISOString();
    if (match.channel === 'email') user.emailVerified = true;
    else user.phoneVerified = true;
    if (user.status === 'pending_verification') user.status = 'active';
    user.updatedAt = new Date(now).toISOString();
    this.save();
    return user;
  }

  public createAdminInvitation(input: {
    email: string;
    username: string;
    fullName: string;
    phoneNumber: string;
    designation: string;
    roleIds: string[];
    accountStatus: AccountStatus;
    invitedBy: string;
    rawToken: string;
  }): AdminInvitationEntity {
    const now = Date.now();
    const entity: AdminInvitationEntity = {
      id: `inv_${crypto.randomUUID().slice(0, 10)}`,
      email: input.email.trim().toLowerCase(),
      username: input.username.trim().toLowerCase(),
      fullName: input.fullName.trim(),
      phoneNumber: input.phoneNumber.trim(),
      designation: input.designation.trim(),
      roleIds: input.roleIds,
      accountStatus: input.accountStatus,
      tokenHash: sha256(input.rawToken),
      invitedBy: input.invitedBy,
      expiresAt: new Date(now + this.data.securitySettings.invitationExpiryHours * 3600 * 1000).toISOString(),
      acceptedAt: null,
      revokedAt: null,
      createdAt: new Date(now).toISOString()
    };
    this.data.adminInvitations.push(entity);
    this.save();
    return entity;
  }

  public findValidInvitation(rawToken: string): AdminInvitationEntity | null {
    const hash = sha256(rawToken.trim());
    const inv = this.data.adminInvitations.find((i) => i.tokenHash === hash);
    if (!inv || inv.acceptedAt || inv.revokedAt || new Date(inv.expiresAt).getTime() < Date.now()) return null;
    return inv;
  }

  public markInvitationAccepted(invId: string): void {
    const inv = this.data.adminInvitations.find((i) => i.id === invId);
    if (inv) {
      inv.acceptedAt = new Date().toISOString();
      this.save();
    }
  }

  public listInvitations(): AdminInvitationEntity[] {
    return [...this.data.adminInvitations].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Attempts, Login History, Audit Logs & Security Events
  public recordLoginAttempt(input: {
    identifier: string;
    ipAddress: string;
    success: boolean;
    failureReason?: string;
    user?: UserEntity;
    isAdminPortal: boolean;
    userAgent: string;
  }): { riskFlags: string[]; riskScore: number } {
    const now = new Date().toISOString();
    this.data.loginAttempts.push({
      id: `att_${crypto.randomUUID().slice(0, 8)}`,
      identifier: input.identifier,
      ipAddress: input.ipAddress,
      success: input.success,
      failureReason: input.failureReason || null,
      createdAt: now
    });

    const ua = parseUserAgent(input.userAgent);
    const riskFlags: string[] = [];
    let riskScore = 0;

    if (!input.success) {
      riskScore += 25;
      riskFlags.push('failed_attempt');
      const recentFails = this.data.loginAttempts.filter(
        (a) =>
          !a.success &&
          (a.identifier === input.identifier || a.ipAddress === input.ipAddress) &&
          Date.now() - new Date(a.createdAt).getTime() < 15 * 60 * 1000
      ).length;
      if (recentFails >= 3) {
        riskScore += 40;
        riskFlags.push('repeated_failures');
      }
    } else if (input.user) {
      if (input.user.lastLoginIp && input.user.lastLoginIp !== input.ipAddress) {
        riskScore += 30;
        riskFlags.push('new_ip_address');
      }
      if (input.user.lastLoginDevice && input.user.lastLoginDevice !== ua.deviceName) {
        riskScore += 20;
        riskFlags.push('new_device');
      }
      const activeSessions = this.listSessions(input.user.id);
      if (activeSessions.length >= 4) {
        riskScore += 20;
        riskFlags.push('high_concurrent_sessions');
      }
    }

    this.data.loginHistory.unshift({
      id: `lh_${crypto.randomUUID().slice(0, 10)}`,
      userId: input.user?.id || null,
      identifier: input.identifier,
      username: input.user?.username || input.identifier,
      email: input.user?.email || input.identifier,
      success: input.success,
      isAdminPortal: input.isAdminPortal,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      deviceName: ua.deviceName,
      riskScore: Math.min(100, riskScore),
      riskFlags,
      failureReason: input.failureReason || null,
      createdAt: now
    });
    if (this.data.loginHistory.length > 2000) this.data.loginHistory.length = 2000;

    if (riskScore >= 60) {
      this.recordSecurityEvent({
        userId: input.user?.id || null,
        eventType: 'SUSPICIOUS_LOGIN_ACTIVITY',
        severity: riskScore >= 80 ? 'high' : 'medium',
        title: input.success ? 'Unusual Device / Location Login' : 'Repeated Failed Login Attempts',
        description: `Login activity (${riskFlags.join(', ')}) detected for ${input.identifier} from ${input.ipAddress}`,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent
      });
    }

    this.save();
    return { riskFlags, riskScore };
  }

  public getRecentFailedAttemptsCount(identifier: string, ipAddress: string, windowMinutes = 15): number {
    const cutoff = Date.now() - windowMinutes * 60 * 1000;
    return this.data.loginAttempts.filter(
      (a) =>
        !a.success &&
        new Date(a.createdAt).getTime() >= cutoff &&
        (a.identifier.toLowerCase() === identifier.toLowerCase() || a.ipAddress === ipAddress)
    ).length;
  }

  public listLoginHistory(userId?: string): LoginHistoryEntity[] {
    return userId
      ? this.data.loginHistory.filter((l) => l.userId === userId)
      : this.data.loginHistory;
  }

  public recordAuditLog(input: {
    userId: string | null;
    username?: string;
    role?: string;
    action: string;
    module: string;
    targetRecordId?: string | null;
    previousValue?: Record<string, unknown> | null;
    newValue?: Record<string, unknown> | null;
    ipAddress?: string;
    userAgent?: string;
    result: 'success' | 'failure' | 'denied';
    additionalContext?: string;
  }): AuditLogEntity {
    const actor = input.userId ? this.findUserById(input.userId) : undefined;
    const actorRoles = actor ? this.getUserRoles(actor.id) : [];
    const entry: AuditLogEntity = {
      id: `aud_${crypto.randomUUID().slice(0, 12)}`,
      userId: input.userId,
      username: input.username || actor?.username || actor?.email || 'anonymous',
      role: input.role || actorRoles[0]?.slug || 'guest',
      action: input.action,
      module: input.module,
      targetRecordId: input.targetRecordId || null,
      previousValue: sanitizeAuditPayload(input.previousValue),
      newValue: sanitizeAuditPayload(input.newValue),
      ipAddress: input.ipAddress || 'unknown',
      userAgent: input.userAgent || 'unknown',
      timestamp: new Date().toISOString(),
      result: input.result,
      additionalContext: input.additionalContext || ''
    };
    // Append-only operational model: prepend for quick query while never permitting mutation/deletion
    this.data.auditLogs.unshift(entry);
    if (this.data.auditLogs.length > 5000) this.data.auditLogs.length = 5000;
    this.save();
    return entry;
  }

  public listAuditLogs(): AuditLogEntity[] {
    return this.data.auditLogs;
  }

  public recordSecurityEvent(input: {
    userId: string | null;
    eventType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    ipAddress: string;
    userAgent: string;
  }): SecurityEventEntity {
    const ev: SecurityEventEntity = {
      id: `sev_${crypto.randomUUID().slice(0, 10)}`,
      userId: input.userId,
      eventType: input.eventType,
      severity: input.severity,
      title: input.title,
      description: input.description,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      resolved: false,
      resolvedBy: null,
      createdAt: new Date().toISOString()
    };
    this.data.securityEvents.unshift(ev);
    if (this.data.securityEvents.length > 1000) this.data.securityEvents.length = 1000;
    if (input.userId) {
      this.createNotification(input.userId, input.title, input.description, 'security');
    }
    this.save();
    return ev;
  }

  public listSecurityEvents(): SecurityEventEntity[] {
    return this.data.securityEvents;
  }

  public resolveSecurityEvent(id: string, actorId: string): SecurityEventEntity | null {
    const ev = this.data.securityEvents.find((e) => e.id === id);
    if (!ev) return null;
    ev.resolved = true;
    ev.resolvedBy = actorId;
    this.save();
    return ev;
  }

  public createNotification(userId: string, title: string, message: string, type: 'security' | 'account' | 'system'): void {
    this.data.userNotifications.unshift({
      id: `un_${crypto.randomUUID().slice(0, 8)}`,
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString()
    });
    if (this.data.userNotifications.length > 2000) this.data.userNotifications.length = 2000;
    this.save();
  }

  public listUserNotifications(userId: string): UserNotificationEntity[] {
    return this.data.userNotifications.filter((n) => n.userId === userId);
  }
}
