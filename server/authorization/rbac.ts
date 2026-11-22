export interface PermissionDefinition {
  id: string;
  code: string;
  category: string;
  name: string;
  description: string;
  isCritical: boolean;
}

export interface RoleSeedDefinition {
  id: string;
  slug: string;
  name: string;
  description: string;
  hierarchyLevel: number;
  isSystem: boolean;
  permissionCodes: string[];
}

export const SYSTEM_PERMISSIONS: PermissionDefinition[] = [
  // User Management
  { id: 'perm_users_view', code: 'users.view', category: 'User Management', name: 'View Users', description: 'List and view user account details', isCritical: false },
  { id: 'perm_users_create', code: 'users.create', category: 'User Management', name: 'Create / Invite Users', description: 'Invite new administrators, staff, or create accounts', isCritical: true },
  { id: 'perm_users_update', code: 'users.update', category: 'User Management', name: 'Update Users', description: 'Update permitted user profile and account metadata', isCritical: false },
  { id: 'perm_users_deactivate', code: 'users.deactivate', category: 'User Management', name: 'Deactivate Users', description: 'Deactivate permitted user accounts', isCritical: true },
  { id: 'perm_users_activate', code: 'users.activate', category: 'User Management', name: 'Activate Users', description: 'Activate pending or inactive user accounts', isCritical: false },
  { id: 'perm_users_delete', code: 'users.delete', category: 'User Management', name: 'Delete Users', description: 'Permanently delete non-protected accounts', isCritical: true },
  { id: 'perm_users_suspend', code: 'users.suspend', category: 'User Management', name: 'Suspend Users', description: 'Suspend accounts immediately due to policy violations', isCritical: true },
  { id: 'perm_users_unlock', code: 'users.unlock', category: 'User Management', name: 'Unlock Locked Accounts', description: 'Clear temporary brute-force lockouts', isCritical: false },

  // Role Management
  { id: 'perm_roles_view', code: 'roles.view', category: 'Role Management', name: 'View Roles', description: 'Inspect system and custom RBAC roles', isCritical: false },
  { id: 'perm_roles_create', code: 'roles.create', category: 'Role Management', name: 'Create Roles', description: 'Create new custom RBAC roles', isCritical: true },
  { id: 'perm_roles_update', code: 'roles.update', category: 'Role Management', name: 'Update Roles', description: 'Edit role metadata and hierarchy', isCritical: true },
  { id: 'perm_roles_delete', code: 'roles.delete', category: 'Role Management', name: 'Delete Roles', description: 'Delete custom non-system roles', isCritical: true },
  { id: 'perm_roles_assign', code: 'roles.assign', category: 'Role Management', name: 'Assign Roles', description: 'Assign or revoke permitted roles on user accounts', isCritical: true },

  // Permission Management
  { id: 'perm_permissions_view', code: 'permissions.view', category: 'Permission Management', name: 'View Permissions', description: 'View complete permission catalog and assignments', isCritical: false },
  { id: 'perm_permissions_create', code: 'permissions.create', category: 'Permission Management', name: 'Create Permissions', description: 'Register custom dynamic permissions', isCritical: true },
  { id: 'perm_permissions_update', code: 'permissions.update', category: 'Permission Management', name: 'Update Role Permissions', description: 'Attach or detach permissions on roles', isCritical: true },
  { id: 'perm_permissions_assign', code: 'permissions.assign', category: 'Permission Management', name: 'Assign User Overrides', description: 'Grant or deny user-level permission overrides', isCritical: true },

  // Authentication Management
  { id: 'perm_auth_login', code: 'auth.login', category: 'Authentication Management', name: 'Sign In', description: 'Authenticate to allowed portal', isCritical: false },
  { id: 'perm_auth_logout', code: 'auth.logout', category: 'Authentication Management', name: 'Sign Out', description: 'Terminate active session', isCritical: false },
  { id: 'perm_auth_password_reset', code: 'auth.password_reset', category: 'Authentication Management', name: 'Reset Password', description: 'Request or initiate secure password reset workflows', isCritical: false },
  { id: 'perm_auth_sessions_manage', code: 'auth.sessions.manage', category: 'Authentication Management', name: 'Manage Personal Sessions', description: 'Inspect and revoke own active device sessions', isCritical: false },
  { id: 'perm_auth_mfa_manage', code: 'auth.mfa.manage', category: 'Authentication Management', name: 'Manage Personal MFA', description: 'Enroll, verify, regenerate codes, or disable own TOTP MFA', isCritical: false },

  // Security Management
  { id: 'perm_security_view', code: 'security.view', category: 'Security Management', name: 'View Security Overview', description: 'View security events and active sessions monitor', isCritical: false },
  { id: 'perm_security_settings_manage', code: 'security.settings.manage', category: 'Security Management', name: 'Manage Security Settings', description: 'Configure password policy, lockout, token & session lifetimes', isCritical: true },
  { id: 'perm_security_login_history_view', code: 'security.login_history.view', category: 'Security Management', name: 'View Login History', description: 'Inspect user login history and risk flags', isCritical: false },
  { id: 'perm_security_audit_logs_view', code: 'security.audit_logs.view', category: 'Security Management', name: 'View Audit Logs', description: 'Query and export append-only security audit trails', isCritical: false },
  { id: 'perm_security_sessions_revoke', code: 'security.sessions.revoke', category: 'Security Management', name: 'Revoke User Sessions', description: 'Force-terminate any permitted user session', isCritical: true },

  // Profile Management
  { id: 'perm_profile_view', code: 'profile.view', category: 'Profile Management', name: 'View Own Profile', description: 'View personal account details', isCritical: false },
  { id: 'perm_profile_update', code: 'profile.update', category: 'Profile Management', name: 'Update Own Profile', description: 'Update own name, avatar, phone, and shipping addresses', isCritical: false },
  { id: 'perm_profile_password_change', code: 'profile.password.change', category: 'Profile Management', name: 'Change Own Password', description: 'Change personal password with history enforcement', isCritical: false },

  // Commerce Operations
  { id: 'perm_products_view', code: 'products.view', category: 'Store Operations', name: 'View Store Catalog', description: 'Access internal catalog & SKU data', isCritical: false },
  { id: 'perm_products_manage', code: 'products.manage', category: 'Store Operations', name: 'Manage Products & Inventory', description: 'Create, edit, archive products and adjust warehouse stock', isCritical: false },
  { id: 'perm_orders_view', code: 'orders.view', category: 'Store Operations', name: 'View Orders', description: 'View customer orders, bids, and dispatch invoices', isCritical: false },
  { id: 'perm_orders_manage', code: 'orders.manage', category: 'Store Operations', name: 'Manage Orders & Fulfillment', description: 'Advance order statuses, handle bids and coupons', isCritical: false },
  { id: 'perm_finance_view', code: 'finance.view', category: 'Store Operations', name: 'View Finance Reports', description: 'Inspect P&L statements and EPS gateway reconciliation', isCritical: false },
  { id: 'perm_finance_manage', code: 'finance.manage', category: 'Store Operations', name: 'Manage Finance & Suppliers', description: 'Record expenses, manage suppliers and purchase orders', isCritical: true },

  // Database Backup & Recovery
  { id: 'perm_database_backup', code: 'database.backup', category: 'Database Governance', name: 'Create & Download Backups', description: 'Create server snapshots and export sanitized database backups', isCritical: true },
  { id: 'perm_database_restore', code: 'database.restore', category: 'Database Governance', name: 'Restore Database Snapshots', description: 'Restore commerce, ERP, or identity databases from snapshots or JSON files', isCritical: true }
];

const ALL_PERMISSION_CODES = SYSTEM_PERMISSIONS.map((p) => p.code);

export const DEFAULT_ROLES: RoleSeedDefinition[] = [
  {
    id: 'role_superadmin',
    slug: 'superadmin',
    name: 'Super Administrator',
    description: 'Highest system authority with full access to security settings, RBAC architecture, and administrator management.',
    hierarchyLevel: 100,
    isSystem: true,
    permissionCodes: ALL_PERMISSION_CODES
  },
  {
    id: 'role_administrator',
    slug: 'administrator',
    name: 'Administrator',
    description: 'Enterprise operator able to manage staff/customer accounts, commerce operations, sessions, and audit logs. Cannot alter SuperAdmin or critical security policy.',
    hierarchyLevel: 80,
    isSystem: true,
    permissionCodes: [
      'users.view',
      'users.create',
      'users.update',
      'users.deactivate',
      'users.activate',
      'users.suspend',
      'users.unlock',
      'roles.view',
      'roles.assign',
      'permissions.view',
      'auth.login',
      'auth.logout',
      'auth.password_reset',
      'auth.sessions.manage',
      'auth.mfa.manage',
      'security.view',
      'security.login_history.view',
      'security.audit_logs.view',
      'security.sessions.revoke',
      'profile.view',
      'profile.update',
      'profile.password.change',
      'products.view',
      'products.manage',
      'orders.view',
      'orders.manage',
      'finance.view',
      'finance.manage',
      'database.backup'
    ]
  },
  {
    id: 'role_manager',
    slug: 'manager',
    name: 'Manager',
    description: 'Store operations and customer/staff supervisor with limited user management and commerce control.',
    hierarchyLevel: 60,
    isSystem: true,
    permissionCodes: [
      'users.view',
      'users.update',
      'users.activate',
      'users.deactivate',
      'auth.login',
      'auth.logout',
      'auth.password_reset',
      'auth.sessions.manage',
      'auth.mfa.manage',
      'security.login_history.view',
      'profile.view',
      'profile.update',
      'profile.password.change',
      'products.view',
      'products.manage',
      'orders.view',
      'orders.manage',
      'finance.view'
    ]
  },
  {
    id: 'role_staff',
    slug: 'staff',
    name: 'Staff',
    description: 'Fulfillment and store support staff with catalog and order processing access only.',
    hierarchyLevel: 40,
    isSystem: true,
    permissionCodes: [
      'auth.login',
      'auth.logout',
      'auth.password_reset',
      'auth.sessions.manage',
      'auth.mfa.manage',
      'profile.view',
      'profile.update',
      'profile.password.change',
      'products.view',
      'orders.view',
      'orders.manage'
    ]
  },
  {
    id: 'role_customer',
    slug: 'customer',
    name: 'Customer',
    description: 'Standard shopper role. Strictly isolated from administrative functions and other customers.',
    hierarchyLevel: 10,
    isSystem: true,
    permissionCodes: [
      'auth.login',
      'auth.logout',
      'auth.password_reset',
      'auth.sessions.manage',
      'auth.mfa.manage',
      'profile.view',
      'profile.update',
      'profile.password.change'
    ]
  }
];

export const PRIVILEGED_PORTAL_ROLES = new Set([
  'superadmin',
  'administrator',
  'manager',
  'staff'
]);

export function isPrivilegedRoleSlug(slug: string): boolean {
  return PRIVILEGED_PORTAL_ROLES.has(slug) || slug !== 'customer';
}

export function isAdminOrSuperAdminSlug(slug: string): boolean {
  return slug === 'superadmin' || slug === 'administrator';
}
