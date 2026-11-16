import { Router } from 'express';
import { z } from 'zod';
import { SecurityStore, toPublicUser, type AccountStatus } from '../data/securityStore.ts';
import {
  createAuthMiddleware,
  getClientIp,
  getUserAgent,
  validateCsrfToken,
  type AuthContextRequest
} from '../middleware/authMiddleware.ts';
import { generateOpaqueToken, hashPassword, validatePasswordPolicy } from '../security/crypto.ts';
import { isPrivilegedRoleSlug } from '../authorization/rbac.ts';

function escapeCsvCell(val: unknown): string {
  const str = String(val ?? '').replace(/"/g, '""');
  return `"${str}"`;
}

const createUserSchema = z.object({
  mode: z.enum(['invite', 'direct']).default('invite'),
  fullName: z.string().trim().min(2).max(120),
  username: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9_.-]+$/),
  email: z.string().trim().email().max(160),
  phoneNumber: z.string().trim().max(24).optional().default(''),
  designation: z.string().trim().max(80).optional().default('Staff'),
  roleIds: z.array(z.string().min(1)).min(1),
  accountStatus: z.enum(['active', 'inactive', 'pending_verification']).optional().default('active'),
  password: z.string().optional()
});

export function createAdminUsersRoutes(
  store: SecurityStore,
  options: { exposeDebugTokens?: boolean } = {}
) {
  const router = Router();
  const mw = createAuthMiddleware(store);

  router.use(mw.authenticateAdmin, mw.requireActiveAccount);

  const canModifyTargetUser = (actorId: string, targetId: string): { ok: boolean; message?: string } => {
    const actorIsSuper = store.userHasRoleSlug(actorId, 'superadmin');
    const targetIsSuper = store.userHasRoleSlug(targetId, 'superadmin');
    if (targetIsSuper && !actorIsSuper) {
      return { ok: false, message: 'Only a Super Administrator can modify a Super Administrator account.' };
    }
    if (!actorIsSuper) {
      const actorLevel = store.getUserMaxHierarchy(actorId);
      const targetLevel = store.getUserMaxHierarchy(targetId);
      if (targetId !== actorId && targetLevel >= actorLevel) {
        return { ok: false, message: 'Cannot modify an account with equal or higher role hierarchy.' };
      }
    }
    return { ok: true };
  };

  router.get('/stats', mw.requirePermission('users.view'), (_req, res) => {
    const users = store.listUsers();
    let totalAdmins = 0;
    let totalStaff = 0;
    let totalCustomers = 0;
    for (const u of users) {
      const roles = store.getUserRoles(u.id).map((r) => r.slug);
      if (roles.includes('superadmin') || roles.includes('administrator')) totalAdmins++;
      else if (roles.some((s) => s !== 'customer')) totalStaff++;
      else totalCustomers++;
    }
    const sevenDaysAgo = Date.now() - 7 * 86400 * 1000;
    const recentLogins = store.listLoginHistory().slice(0, 10);

    res.json({
      stats: {
        totalUsers: users.length,
        totalAdministrators: totalAdmins,
        totalStaff,
        totalCustomers,
        activeUsers: users.filter((u) => u.status === 'active').length,
        inactiveUsers: users.filter((u) => u.status === 'inactive' || u.status === 'deactivated' || u.status === 'pending_verification').length,
        suspendedUsers: users.filter((u) => u.status === 'suspended').length,
        lockedUsers: users.filter((u) => u.status === 'locked' || (u.lockedUntil && new Date(u.lockedUntil).getTime() > Date.now())).length,
        newlyRegisteredUsers: users.filter((u) => new Date(u.createdAt).getTime() >= sevenDaysAgo).length,
        recentLoginsCount: recentLogins.filter((l) => l.success).length
      },
      recentLoginActivities: recentLogins
    });
  });

  router.get('/invitations/list', mw.requirePermission('users.view'), (_req, res) => {
    const invitations = store.listInvitations().map((inv) => ({
      ...inv,
      tokenHash: undefined,
      roleNames: inv.roleIds.map((rid) => store.findRoleById(rid)?.name || rid)
    }));
    res.json({ invitations });
  });

  router.post('/invitations/:id/revoke', validateCsrfToken, mw.requirePermission('users.create'), (req: AuthContextRequest, res) => {
    const inv = store.listInvitations().find((i) => i.id === req.params.id);
    if (!inv || inv.acceptedAt || inv.revokedAt) {
      res.status(404).json({ error: 'INVITATION_NOT_FOUND', message: 'Pending invitation not found.' });
      return;
    }
    inv.revokedAt = new Date().toISOString();
    store.save();
    store.recordAuditLog({
      userId: req.authUser!.id,
      action: 'INVITATION_REVOKED',
      module: 'UserManagement',
      targetRecordId: inv.id,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success'
    });
    res.json({ success: true });
  });

  router.get('/', mw.requirePermission('users.view'), (req, res) => {
    const search = String(req.query.search || '').trim().toLowerCase();
    const roleFilter = String(req.query.role || 'all').toLowerCase();
    const statusFilter = String(req.query.status || 'all').toLowerCase();
    const dateFrom = req.query.dateFrom ? new Date(String(req.query.dateFrom)).getTime() : null;
    const dateTo = req.query.dateTo ? new Date(String(req.query.dateTo)).getTime() + 86400_000 : null;
    const sortBy = String(req.query.sortBy || 'createdAt');
    const sortDir = req.query.sortDir === 'asc' ? 1 : -1;
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(100, Math.max(5, Number(req.query.pageSize || 15)));

    let list = store.listUsers().map((u) => {
      const roles = store.getUserRoles(u.id);
      const perms = store.getEffectivePermissions(u.id);
      const mfa = store.getUserMfa(u.id);
      return toPublicUser(u, roles, perms, Boolean(mfa?.enabled));
    });

    if (search) {
      list = list.filter(
        (u) =>
          u.fullName.toLowerCase().includes(search) ||
          u.username.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          u.id.toLowerCase().includes(search) ||
          (u.phoneNumber || '').toLowerCase().includes(search)
      );
    }

    if (roleFilter !== 'all') {
      list = list.filter((u) => u.roles.some((r) => r.slug === roleFilter));
    }

    if (statusFilter !== 'all') {
      list = list.filter((u) => u.status === statusFilter);
    }

    if (dateFrom && !Number.isNaN(dateFrom)) {
      list = list.filter((u) => new Date(u.createdAt).getTime() >= dateFrom);
    }
    if (dateTo && !Number.isNaN(dateTo)) {
      list = list.filter((u) => new Date(u.createdAt).getTime() <= dateTo);
    }

    list.sort((a, b) => {
      if (sortBy === 'fullName') return a.fullName.localeCompare(b.fullName) * sortDir;
      if (sortBy === 'email') return a.email.localeCompare(b.email) * sortDir;
      if (sortBy === 'status') return a.status.localeCompare(b.status) * sortDir;
      if (sortBy === 'lastLoginAt') {
        return (new Date(a.lastLoginAt || 0).getTime() - new Date(b.lastLoginAt || 0).getTime()) * sortDir;
      }
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * sortDir;
    });

    if (req.query.format === 'csv') {
      const headers = ['ID', 'Full Name', 'Username', 'Email', 'Mobile', 'Roles', 'Status', 'Email Verified', 'MFA', 'Registered At', 'Last Login'];
      const rows = list.map((u) =>
        [
          u.id,
          u.fullName,
          u.username,
          u.email,
          u.phoneNumber,
          u.roles.map((r) => r.name).join('; '),
          u.status,
          u.emailVerified ? 'Yes' : 'No',
          u.mfaEnabled ? 'Enabled' : 'Disabled',
          u.createdAt,
          u.lastLoginAt || 'Never'
        ]
          .map(escapeCsvCell)
          .join(',')
      );
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="thesteps-users-report.csv"');
      res.send([headers.join(','), ...rows].join('\n'));
      return;
    }

    const total = list.length;
    const start = (page - 1) * pageSize;
    const paginated = list.slice(start, start + pageSize);

    res.json({
      users: paginated,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      }
    });
  });

  router.get('/:id', mw.requirePermission('users.view'), (req, res) => {
    const user = store.findUserById(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User account not found.' });
      return;
    }
    const roles = store.getUserRoles(user.id);
    const permissions = store.getEffectivePermissions(user.id);
    const overrides = store.getUserPermissionOverrides(user.id);
    const mfa = store.getUserMfa(user.id);
    const sessions = store.listSessions(user.id);
    const loginHistory = store.listLoginHistory(user.id).slice(0, 25);

    res.json({
      user: toPublicUser(user, roles, permissions, Boolean(mfa?.enabled)),
      overrides,
      sessions,
      loginHistory
    });
  });

  router.post('/', validateCsrfToken, mw.requirePermission('users.create'), (req: AuthContextRequest, res) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: parsed.error.issues[0]?.message || 'Invalid user payload.'
      });
      return;
    }

    const input = parsed.data;
    const actor = req.authUser!;
    const actorIsSuper = store.userHasRoleSlug(actor.id, 'superadmin');
    const actorLevel = store.getUserMaxHierarchy(actor.id);

    const requestedRoles = input.roleIds
      .map((rid) => store.findRoleById(rid) || store.findRoleBySlug(rid))
      .filter((r): r is NonNullable<typeof r> => Boolean(r));

    if (requestedRoles.length === 0) {
      res.status(400).json({ error: 'INVALID_ROLES', message: 'At least one valid role must be selected.' });
      return;
    }

    // Enforce anti-escalation rules: Administrators cannot create SuperAdmins or roles >= own hierarchy
    if (!actorIsSuper) {
      if (requestedRoles.some((r) => r.slug === 'superadmin' || r.hierarchyLevel >= actorLevel)) {
        store.recordAuditLog({
          userId: actor.id,
          action: 'ROLE_ESCALATION_BLOCKED',
          module: 'UserManagement',
          ipAddress: getClientIp(req),
          userAgent: getUserAgent(req),
          result: 'denied',
          additionalContext: `Attempted to create user with higher/superadmin roles (${requestedRoles.map((r) => r.slug).join(', ')})`
        });
        res.status(403).json({
          error: 'FORBIDDEN_PRIVILEGE_ESCALATION',
          message: 'You are not permitted to create accounts with administrator/superadmin or equal-or-higher hierarchy roles.'
        });
        return;
      }
    }

    const email = input.email.toLowerCase();
    const username = input.username.toLowerCase();
    const existing = store.findUserByIdentifier(email) || store.findUserByIdentifier(username);
    if (existing) {
      res.status(409).json({ error: 'DUPLICATE_USER', message: 'A user with that email or username already exists.' });
      return;
    }

    const roleIds = requestedRoles.map((r) => r.id);

    if (input.mode === 'invite') {
      const rawInviteToken = generateOpaqueToken(28);
      const invitation = store.createAdminInvitation({
        email,
        username,
        fullName: input.fullName,
        phoneNumber: input.phoneNumber || '',
        designation: input.designation || 'Staff',
        roleIds,
        accountStatus: input.accountStatus,
        invitedBy: actor.id,
        rawToken: rawInviteToken
      });

      store.recordAuditLog({
        userId: actor.id,
        action: 'ADMIN_INVITATION_CREATED',
        module: 'UserManagement',
        targetRecordId: invitation.id,
        newValue: { email, username, roles: requestedRoles.map((r) => r.slug) },
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        result: 'success',
        additionalContext: `Invitation issued for ${email} (${requestedRoles.map((r) => r.name).join(', ')})`
      });

      res.status(201).json({
        mode: 'invite',
        invitation: {
          id: invitation.id,
          email: invitation.email,
          username: invitation.username,
          fullName: invitation.fullName,
          expiresAt: invitation.expiresAt
        },
        inviteLink: `/invite/accept?token=${rawInviteToken}`,
        inviteToken: rawInviteToken
      });
      return;
    }

    const rawPassword = input.password || '';
    const isPrivileged = requestedRoles.some((r) => isPrivilegedRoleSlug(r.slug));
    const settings = store.getSettings();
    const pwCheck = validatePasswordPolicy(rawPassword, {
      minLength: isPrivileged ? settings.adminMinPasswordLength : settings.minPasswordLength,
      isPrivileged,
      personalTerms: [input.fullName, username, email.split('@')[0]]
    });
    if (!pwCheck.valid) {
      res.status(400).json({ error: 'WEAK_PASSWORD', message: pwCheck.errors[0], details: pwCheck });
      return;
    }

    const created = store.createUser(
      {
        username,
        email,
        fullName: input.fullName,
        phoneNumber: input.phoneNumber || '',
        designation: input.designation || 'Team Member',
        photoURL: '',
        status: input.accountStatus,
        emailVerified: true,
        phoneVerified: Boolean(input.phoneNumber),
        passwordHash: hashPassword(rawPassword),
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: null,
        lastLoginIp: null,
        lastLoginDevice: null,
        addresses: [],
        savedWishlist: [],
        collectedVouchers: ['SMART10'],
        createdBy: actor.id,
        deactivatedAt: null
      },
      roleIds
    );

    store.recordAuditLog({
      userId: actor.id,
      action: 'USER_CREATED',
      module: 'UserManagement',
      targetRecordId: created.id,
      newValue: { email: created.email, username: created.username, roles: requestedRoles.map((r) => r.slug) },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success'
    });

    res.status(201).json({
      mode: 'direct',
      user: toPublicUser(created, requestedRoles, store.getEffectivePermissions(created.id), false)
    });
  });

  router.put('/:id', validateCsrfToken, mw.requirePermission('users.update'), (req: AuthContextRequest, res) => {
    const target = store.findUserById(req.params.id);
    if (!target) {
      res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User account not found.' });
      return;
    }
    const guard = canModifyTargetUser(req.authUser!.id, target.id);
    if (!guard.ok) {
      res.status(403).json({ error: 'FORBIDDEN_HIERARCHY', message: guard.message });
      return;
    }

    const prev = { fullName: target.fullName, phoneNumber: target.phoneNumber, designation: target.designation, username: target.username };
    const updates: Partial<typeof target> = {};
    if (typeof req.body?.fullName === 'string' && req.body.fullName.trim().length >= 2) {
      updates.fullName = req.body.fullName.trim();
    }
    if (typeof req.body?.phoneNumber === 'string') {
      updates.phoneNumber = req.body.phoneNumber.trim();
    }
    if (typeof req.body?.designation === 'string') {
      updates.designation = req.body.designation.trim();
    }
    if (typeof req.body?.username === 'string' && req.body.username.trim().length >= 3) {
      const nextU = req.body.username.trim().toLowerCase();
      const collision = store.listUsers().find((u) => u.id !== target.id && u.username.toLowerCase() === nextU);
      if (collision) {
        res.status(409).json({ error: 'USERNAME_TAKEN', message: 'Username is already in use.' });
        return;
      }
      updates.username = nextU;
    }

    const updated = store.updateUser(target.id, updates)!;
    store.recordAuditLog({
      userId: req.authUser!.id,
      action: 'USER_UPDATED',
      module: 'UserManagement',
      targetRecordId: target.id,
      previousValue: prev,
      newValue: { fullName: updated.fullName, phoneNumber: updated.phoneNumber, designation: updated.designation, username: updated.username },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success'
    });

    const roles = store.getUserRoles(updated.id);
    const mfa = store.getUserMfa(updated.id);
    res.json({
      user: toPublicUser(updated, roles, store.getEffectivePermissions(updated.id), Boolean(mfa?.enabled))
    });
  });

  router.patch('/:id/status', validateCsrfToken, (req: AuthContextRequest, res) => {
    const status = String(req.body?.status || '') as AccountStatus;
    const validStatuses: AccountStatus[] = ['active', 'pending_verification', 'inactive', 'suspended', 'locked', 'deactivated'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'INVALID_STATUS', message: 'Unsupported account status.' });
      return;
    }

    const permMap: Record<AccountStatus, string> = {
      active: 'users.activate',
      inactive: 'users.deactivate',
      deactivated: 'users.deactivate',
      suspended: 'users.suspend',
      locked: 'users.suspend',
      pending_verification: 'users.update'
    };
    const requiredPerm = permMap[status];
    if (!req.authPermissions?.includes(requiredPerm)) {
      res.status(403).json({ error: 'FORBIDDEN_PERMISSION', message: `Missing permission: ${requiredPerm}` });
      return;
    }

    const target = store.findUserById(req.params.id);
    if (!target) {
      res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found.' });
      return;
    }

    const guard = canModifyTargetUser(req.authUser!.id, target.id);
    if (!guard.ok) {
      res.status(403).json({ error: 'FORBIDDEN_HIERARCHY', message: guard.message });
      return;
    }

    if (store.userHasRoleSlug(target.id, 'superadmin') && status !== 'active') {
      if (target.id === req.authUser!.id || store.countActiveSuperadmins() <= 1) {
        res.status(409).json({
          error: 'FINAL_SUPERADMIN_PROTECTED',
          message: 'Cannot suspend, lock, or deactivate the final active Super Administrator.'
        });
        return;
      }
    }

    const previousStatus = target.status;
    const isUnlockOrActivate = status === 'active';
    const updated = store.updateUser(target.id, {
      status,
      lockedUntil: isUnlockOrActivate ? null : target.lockedUntil,
      failedLoginAttempts: isUnlockOrActivate ? 0 : target.failedLoginAttempts,
      deactivatedAt: status === 'deactivated' ? new Date().toISOString() : null
    })!;

    if (status === 'suspended' || status === 'deactivated' || status === 'inactive' || status === 'locked') {
      store.revokeAllUserSessions(target.id, `Account status changed to ${status}`);
    }

    store.recordAuditLog({
      userId: req.authUser!.id,
      action: `USER_STATUS_${status.toUpperCase()}`,
      module: 'UserManagement',
      targetRecordId: target.id,
      previousValue: { status: previousStatus },
      newValue: { status },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success'
    });

    const roles = store.getUserRoles(updated.id);
    const mfa = store.getUserMfa(updated.id);
    res.json({
      user: toPublicUser(updated, roles, store.getEffectivePermissions(updated.id), Boolean(mfa?.enabled))
    });
  });

  router.post('/:id/assign-role', validateCsrfToken, mw.requirePermission('roles.assign'), (req: AuthContextRequest, res) => {
    const roleIdsInput: string[] = Array.isArray(req.body?.roleIds)
      ? req.body.roleIds.map((x: unknown) => String(x))
      : [];
    if (roleIdsInput.length === 0) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'roleIds array with at least one role is required.' });
      return;
    }

    const target = store.findUserById(req.params.id);
    if (!target) {
      res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User account not found.' });
      return;
    }

    const actor = req.authUser!;
    const actorIsSuper = store.userHasRoleSlug(actor.id, 'superadmin');
    const actorLevel = store.getUserMaxHierarchy(actor.id);

    const guard = canModifyTargetUser(actor.id, target.id);
    if (!guard.ok) {
      res.status(403).json({ error: 'FORBIDDEN_HIERARCHY', message: guard.message });
      return;
    }

    const targetRoles = roleIdsInput
      .map((id) => store.findRoleById(id) || store.findRoleBySlug(id))
      .filter((r): r is NonNullable<typeof r> => Boolean(r));
    if (targetRoles.length === 0) {
      res.status(400).json({ error: 'INVALID_ROLES', message: 'No valid roles specified.' });
      return;
    }

    if (!actorIsSuper) {
      if (targetRoles.some((r) => r.slug === 'superadmin' || r.hierarchyLevel >= actorLevel)) {
        store.recordAuditLog({
          userId: actor.id,
          action: 'ROLE_ESCALATION_BLOCKED',
          module: 'RBAC',
          targetRecordId: target.id,
          ipAddress: getClientIp(req),
          userAgent: getUserAgent(req),
          result: 'denied',
          additionalContext: `Unauthorized attempt to assign roles: ${targetRoles.map((r) => r.slug).join(', ')}`
        });
        res.status(403).json({
          error: 'FORBIDDEN_ROLE_ESCALATION',
          message: 'Administrators cannot assign Super Administrator or equal/higher roles.'
        });
        return;
      }
    }

    const hadSuper = store.userHasRoleSlug(target.id, 'superadmin');
    const willHaveSuper = targetRoles.some((r) => r.slug === 'superadmin');
    if (hadSuper && !willHaveSuper && store.countActiveSuperadmins() <= 1) {
      res.status(409).json({
        error: 'FINAL_SUPERADMIN_PROTECTED',
        message: 'Cannot remove Super Administrator role from the final active Super Administrator.'
      });
      return;
    }

    const previousRoles = store.getUserRoles(target.id).map((r) => r.slug);
    store.setUserRoles(target.id, targetRoles.map((r) => r.id), actor.id);

    store.recordAuditLog({
      userId: actor.id,
      action: 'USER_ROLES_UPDATED',
      module: 'RBAC',
      targetRecordId: target.id,
      previousValue: { roles: previousRoles },
      newValue: { roles: targetRoles.map((r) => r.slug) },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success'
    });

    const roles = store.getUserRoles(target.id);
    const mfa = store.getUserMfa(target.id);
    res.json({
      user: toPublicUser(target, roles, store.getEffectivePermissions(target.id), Boolean(mfa?.enabled))
    });
  });

  router.post('/:id/permissions', validateCsrfToken, mw.requirePermission('permissions.assign'), (req: AuthContextRequest, res) => {
    const target = store.findUserById(req.params.id);
    if (!target) {
      res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found.' });
      return;
    }
    const guard = canModifyTargetUser(req.authUser!.id, target.id);
    if (!guard.ok) {
      res.status(403).json({ error: 'FORBIDDEN_HIERARCHY', message: guard.message });
      return;
    }
    const overrides = Array.isArray(req.body?.overrides) ? req.body.overrides : [];
    const actorIsSuper = store.userHasRoleSlug(req.authUser!.id, 'superadmin');
    if (!actorIsSuper) {
      const allPerms = store.listPermissions();
      const tryingCritical = overrides.some((ov: any) => {
        const perm = allPerms.find((p) => p.id === ov.permissionId);
        return perm?.isCritical && ov.effect === 'allow';
      });
      if (tryingCritical) {
        res.status(403).json({
          error: 'CRITICAL_PERMISSION_RESTRICTED',
          message: 'Only Super Administrators can grant critical permissions.'
        });
        return;
      }
    }

    const previousOverrides = store.getUserPermissionOverrides(target.id).map((o) => ({
      permissionId: o.permissionId,
      effect: o.effect
    }));
    store.setUserPermissionOverrides(target.id, overrides, req.authUser!.id);
    store.recordAuditLog({
      userId: req.authUser!.id,
      action: 'USER_PERMISSION_OVERRIDES_UPDATED',
      module: 'RBAC',
      targetRecordId: target.id,
      previousValue: { overrides: previousOverrides },
      newValue: { overrides },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success'
    });

    res.json({
      effectivePermissions: store.getEffectivePermissions(target.id),
      overrides: store.getUserPermissionOverrides(target.id)
    });
  });

  router.post('/:id/reset-password', validateCsrfToken, mw.requirePermission('users.update'), (req: AuthContextRequest, res) => {
    const target = store.findUserById(req.params.id);
    if (!target) {
      res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found.' });
      return;
    }
    const guard = canModifyTargetUser(req.authUser!.id, target.id);
    if (!guard.ok) {
      res.status(403).json({ error: 'FORBIDDEN_HIERARCHY', message: guard.message });
      return;
    }

    const rawToken = generateOpaqueToken(24);
    const isPrivileged = store.isUserPrivilegedPortalMember(target.id);
    const exceptSessionId = target.id === req.authUser!.id ? req.authSession?.id : undefined;
    store.createPasswordResetToken(target.id, rawToken, 'admin', store.getSettings().passwordResetExpiryMinutes);
    store.revokeAllUserSessions(target.id, 'Administrative password reset initiated', exceptSessionId);
    store.createNotification(
      target.id,
      'Administrator Initiated Password Reset',
      'Your administrator initiated a password reset workflow. Active sessions were signed out.',
      'security'
    );
    store.recordAuditLog({
      userId: req.authUser!.id,
      action: 'ADMIN_INITIATED_PASSWORD_RESET',
      module: 'UserManagement',
      targetRecordId: target.id,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success'
    });

    res.json({
      success: true,
      message: `Secure reset workflow initiated for ${target.email}.`,
      resetLink: `/reset-password?token=${rawToken}&portal=${isPrivileged ? 'admin' : 'customer'}`,
      ...(options.exposeDebugTokens !== false ? { resetToken: rawToken } : {})
    });
  });

  router.post('/:id/revoke-sessions', validateCsrfToken, mw.requirePermission('security.sessions.revoke'), (req: AuthContextRequest, res) => {
    const target = store.findUserById(req.params.id);
    if (!target) {
      res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found.' });
      return;
    }
    const guard = canModifyTargetUser(req.authUser!.id, target.id);
    if (!guard.ok) {
      res.status(403).json({ error: 'FORBIDDEN_HIERARCHY', message: guard.message });
      return;
    }
    const revokedCount = store.revokeAllUserSessions(target.id, `Revoked by administrator ${req.authUser!.username}`);
    store.recordAuditLog({
      userId: req.authUser!.id,
      action: 'USER_SESSIONS_REVOKED',
      module: 'Sessions',
      targetRecordId: target.id,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success',
      additionalContext: `Revoked ${revokedCount} active sessions`
    });
    res.json({ success: true, revokedCount });
  });

  router.delete('/:id', validateCsrfToken, mw.requirePermission('users.delete'), (req: AuthContextRequest, res) => {
    const target = store.findUserById(req.params.id);
    if (!target) {
      res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found.' });
      return;
    }
    if (target.id === req.authUser!.id) {
      res.status(409).json({ error: 'SELF_DELETE_FORBIDDEN', message: 'Cannot delete your own active account.' });
      return;
    }
    if (store.userHasRoleSlug(target.id, 'superadmin')) {
      if (store.countActiveSuperadmins() <= 1) {
        res.status(409).json({ error: 'FINAL_SUPERADMIN_PROTECTED', message: 'Cannot delete the final active Super Administrator.' });
        return;
      }
      if (!store.userHasRoleSlug(req.authUser!.id, 'superadmin')) {
        res.status(403).json({ error: 'FORBIDDEN_SUPERADMIN_PROTECTED', message: 'Only a Super Administrator can remove another Super Administrator.' });
        return;
      }
    }

    const email = target.email;
    store.deleteUser(target.id);
    store.recordAuditLog({
      userId: req.authUser!.id,
      action: 'USER_DELETED',
      module: 'UserManagement',
      targetRecordId: req.params.id,
      previousValue: { email, username: target.username },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success'
    });
    res.json({ success: true });
  });

  return router;
}
