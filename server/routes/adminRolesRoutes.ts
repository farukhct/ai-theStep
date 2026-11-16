import { Router } from 'express';
import { z } from 'zod';
import { SecurityStore } from '../data/securityStore.ts';
import {
  createAuthMiddleware,
  getClientIp,
  getUserAgent,
  validateCsrfToken,
  type AuthContextRequest
} from '../middleware/authMiddleware.ts';

const createRoleSchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug: z.string().trim().min(2).max(40).regex(/^[a-zA-Z0-9_-]+$/),
  description: z.string().trim().max(240).optional().default(''),
  hierarchyLevel: z.number().int().min(11).max(95).optional().default(30),
  permissionCodes: z.array(z.string()).optional().default([])
});

export function createAdminRolesRoutes(store: SecurityStore) {
  const router = Router();
  const mw = createAuthMiddleware(store);

  router.use(mw.authenticateAdmin, mw.requireActiveAccount);

  router.get('/roles', mw.requirePermission('roles.view'), (_req, res) => {
    res.json({ roles: store.listRoles() });
  });

  router.post('/roles', validateCsrfToken, mw.requirePermission('roles.create'), (req: AuthContextRequest, res) => {
    const parsed = createRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message || 'Invalid role data.' });
      return;
    }
    const { name, slug, description, hierarchyLevel, permissionCodes } = parsed.data;
    if (store.findRoleBySlug(slug.toLowerCase())) {
      res.status(409).json({ error: 'DUPLICATE_ROLE', message: 'A role with this slug already exists.' });
      return;
    }

    const role = store.createRole({
      name,
      slug,
      description,
      hierarchyLevel,
      permissionCodes,
      actorId: req.authUser!.id
    });

    store.recordAuditLog({
      userId: req.authUser!.id,
      action: 'ROLE_CREATED',
      module: 'RBAC',
      targetRecordId: role.id,
      newValue: { slug: role.slug, name: role.name, hierarchyLevel: role.hierarchyLevel, permissionCodes },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success'
    });

    res.status(201).json({ role: store.listRoles().find((r) => r.id === role.id) });
  });

  router.put('/roles/:id', validateCsrfToken, mw.requirePermission('roles.update'), (req: AuthContextRequest, res) => {
    const role = store.findRoleById(req.params.id);
    if (!role) {
      res.status(404).json({ error: 'ROLE_NOT_FOUND', message: 'Role not found.' });
      return;
    }
    if (role.slug === 'superadmin') {
      res.status(403).json({ error: 'PROTECTED_ROLE', message: 'The Super Administrator system role cannot be downgraded or altered.' });
      return;
    }
    const prev = { name: role.name, description: role.description, hierarchyLevel: role.hierarchyLevel };
    const updated = store.updateRole(role.id, {
      name: typeof req.body?.name === 'string' ? req.body.name : undefined,
      description: typeof req.body?.description === 'string' ? req.body.description : undefined,
      hierarchyLevel: typeof req.body?.hierarchyLevel === 'number' ? req.body.hierarchyLevel : undefined
    })!;
    store.recordAuditLog({
      userId: req.authUser!.id,
      action: 'ROLE_UPDATED',
      module: 'RBAC',
      targetRecordId: role.id,
      previousValue: prev,
      newValue: { name: updated.name, description: updated.description, hierarchyLevel: updated.hierarchyLevel },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success'
    });
    res.json({ role: store.listRoles().find((r) => r.id === updated.id) });
  });

  router.delete('/roles/:id', validateCsrfToken, mw.requirePermission('roles.delete'), (req: AuthContextRequest, res) => {
    const role = store.findRoleById(req.params.id);
    if (!role) {
      res.status(404).json({ error: 'ROLE_NOT_FOUND', message: 'Role not found.' });
      return;
    }
    if (role.isSystem) {
      res.status(403).json({ error: 'SYSTEM_ROLE_LOCKED', message: 'Built-in system roles cannot be deleted.' });
      return;
    }
    store.deleteRole(role.id);
    store.recordAuditLog({
      userId: req.authUser!.id,
      action: 'ROLE_DELETED',
      module: 'RBAC',
      targetRecordId: role.id,
      previousValue: { slug: role.slug, name: role.name },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success'
    });
    res.json({ success: true });
  });

  router.post('/roles/:id/permissions', validateCsrfToken, mw.requirePermission('permissions.update'), (req: AuthContextRequest, res) => {
    const role = store.findRoleById(req.params.id);
    if (!role) {
      res.status(404).json({ error: 'ROLE_NOT_FOUND', message: 'Role not found.' });
      return;
    }
    if (role.slug === 'superadmin') {
      res.status(403).json({
        error: 'SUPERADMIN_PERMISSIONS_LOCKED',
        message: 'Super Administrator inherently holds full system permissions and cannot be restricted.'
      });
      return;
    }

    const rawPermissions = Array.isArray(req.body?.permissionCodes)
      ? req.body.permissionCodes
      : Array.isArray(req.body?.permissionIds)
        ? req.body.permissionIds
        : [];
    const permissionCodes = rawPermissions.map(String);
    const prevCodes = store.listRoles().find((r) => r.id === role.id)?.permissionCodes || [];
    const assigned = store.setRolePermissions(role.id, permissionCodes, req.authUser!.id);

    store.recordAuditLog({
      userId: req.authUser!.id,
      action: 'ROLE_PERMISSIONS_UPDATED',
      module: 'RBAC',
      targetRecordId: role.id,
      previousValue: { permissionCodes: prevCodes },
      newValue: { permissionCodes: assigned },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success',
      additionalContext: `Updated ${role.name} (${assigned.length} permissions)`
    });

    res.json({ role: store.listRoles().find((r) => r.id === role.id) });
  });

  router.get('/permissions', mw.requirePermission('permissions.view'), (_req, res) => {
    res.json({ permissions: store.listPermissions() });
  });

  router.post('/permissions', validateCsrfToken, mw.requirePermission('permissions.create'), (req: AuthContextRequest, res) => {
    const code = String(req.body?.code || '').trim().toLowerCase();
    const category = String(req.body?.category || 'Custom').trim();
    const name = String(req.body?.name || '').trim();
    const description = String(req.body?.description || '').trim();
    if (!code || !/^[a-z0-9_.]+$/.test(code) || !name) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Valid permission code (e.g. reports.export) and name required.' });
      return;
    }
    if (store.listPermissions().some((p) => p.code === code)) {
      res.status(409).json({ error: 'DUPLICATE_PERMISSION', message: 'Permission code already exists.' });
      return;
    }
    const created = store.createPermission({ code, category, name, description, isCritical: Boolean(req.body?.isCritical) });
    store.recordAuditLog({
      userId: req.authUser!.id,
      action: 'PERMISSION_CREATED',
      module: 'RBAC',
      targetRecordId: created.id,
      newValue: { code: created.code, category: created.category, name: created.name },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      result: 'success'
    });
    res.status(201).json({ permission: created });
  });

  return router;
}
