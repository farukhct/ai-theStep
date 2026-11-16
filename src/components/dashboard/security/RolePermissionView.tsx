import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Plus, Trash2, Check, Lock } from 'lucide-react';
import { apiRequest } from '../../../services/apiClient';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { PermissionRecord, RoleRecord } from '../../../types';

interface RolePermissionViewProps {
  mode: 'roles' | 'permissions';
}

export const RolePermissionView: React.FC<RolePermissionViewProps> = ({ mode }) => {
  const { hasPermission } = useAuth();
  const { addToast } = useNotification();

  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Create Role modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [rName, setRName] = useState('');
  const [rSlug, setRSlug] = useState('');
  const [rDesc, setRDesc] = useState('');
  const [rHierarchy, setRHierarchy] = useState(50);

  // Create Custom Permission modal
  const [showPermModal, setShowPermModal] = useState(false);
  const [pCode, setPCode] = useState('');
  const [pName, setPName] = useState('');
  const [pCategory, setPCategory] = useState('Custom Operations');
  const [pDesc, setPDesc] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        apiRequest<{ roles: RoleRecord[] }>('/api/admin/roles'),
        apiRequest<{ permissions: PermissionRecord[] }>('/api/admin/permissions')
      ]);
      setRoles(rolesRes.roles);
      setPermissions(permsRes.permissions);
      if (!selectedRoleId && rolesRes.roles.length > 0) {
        const editable = rolesRes.roles.find((r) => r.slug !== 'superadmin') || rolesRes.roles[0];
        setSelectedRoleId(editable.id);
      }
    } catch (err: any) {
      addToast('Load Failed', err.message || 'Unable to load roles & permissions.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedRoleId, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeRole = roles.find((r) => r.id === selectedRoleId);

  const groupedPermissions = permissions.reduce<Record<string, PermissionRecord[]>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  const handleToggleRolePermission = async (role: RoleRecord, permCode: string) => {
    if (!hasPermission('permissions.update')) return;
    if (role.slug === 'superadmin') {
      addToast('Protected Role', 'Super Administrator holds immutable full permissions.', 'info');
      return;
    }
    const exists = role.permissionCodes.includes(permCode);
    const nextCodes = exists
      ? role.permissionCodes.filter((c) => c !== permCode)
      : [...role.permissionCodes, permCode];
    try {
      await apiRequest(`/api/admin/roles/${role.id}/permissions`, {
        method: 'POST',
        body: { permissionCodes: nextCodes }
      });
      await loadData();
      addToast('Permission Matrix Updated', `${role.name} updated cleanly.`, 'success');
    } catch (err: any) {
      addToast('Update Denied', err.message || 'Permission modification failed.', 'error');
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest<{ role: RoleRecord }>('/api/admin/roles', {
        method: 'POST',
        body: {
          name: rName,
          slug: rSlug,
          description: rDesc,
          hierarchyLevel: rHierarchy,
          permissionCodes: ['auth.login', 'auth.logout', 'profile.view', 'profile.update']
        }
      });
      setShowRoleModal(false);
      setRName('');
      setRSlug('');
      setRDesc('');
      setSelectedRoleId(res.role.id);
      addToast('Role Created', `Created dynamic role "${res.role.name}".`, 'success');
      loadData();
    } catch (err: any) {
      addToast('Error', err.message || 'Could not create role.', 'error');
    }
  };

  const handleDeleteRole = async (role: RoleRecord) => {
    try {
      await apiRequest(`/api/admin/roles/${role.id}`, { method: 'DELETE' });
      addToast('Role Deleted', `Deleted role "${role.name}".`, 'info');
      setSelectedRoleId('');
      loadData();
    } catch (err: any) {
      addToast('Cannot Delete', err.message || 'Protected role.', 'error');
    }
  };

  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/admin/permissions', {
        method: 'POST',
        body: { code: pCode, name: pName, category: pCategory, description: pDesc }
      });
      setShowPermModal(false);
      setPCode('');
      setPName('');
      setPDesc('');
      addToast('Permission Created', `Registered dynamic permission "${pCode}".`, 'success');
      loadData();
    } catch (err: any) {
      addToast('Failed', err.message || 'Could not create permission.', 'error');
    }
  };

  if (loading) {
    return <p className="py-12 text-center text-xs text-gray-500">Loading RBAC architecture...</p>;
  }

  return (
    <div className="space-y-6">
      {mode === 'roles' && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Dynamic RBAC Roles Hierarchy
              </h3>
              <p className="text-xs text-gray-500">
                Create custom roles, manage permissions without rebuilding the app, and safeguard system roles
              </p>
            </div>
            {hasPermission('roles.create') && (
              <button
                type="button"
                onClick={() => setShowRoleModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#465FFF] hover:bg-[#3641F5] text-white text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Custom Role</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {roles.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedRoleId(r.id)}
                className={`rounded-2xl border p-5 space-y-3 cursor-pointer transition-all ${
                  selectedRoleId === r.id
                    ? 'border-[#465FFF] bg-blue-50/30 dark:bg-[#465FFF]/10'
                    : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#465FFF]" />
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">{r.name}</h4>
                    </div>
                    <p className="text-[11px] font-mono text-gray-400 mt-0.5">
                      slug: {r.slug} · Hierarchy Lvl {r.hierarchyLevel}
                    </p>
                  </div>
                  {r.isSystem ? (
                    <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-600 dark:text-gray-300">
                      SYSTEM
                    </span>
                  ) : (
                    hasPermission('roles.delete') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRole(r);
                        }}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                        title="Delete Custom Role"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{r.description}</p>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px]">
                  <span className="font-mono-num text-gray-500">{r.permissionCodes.length} Permissions</span>
                  <span className="font-mono-num font-bold text-[#465FFF]">{r.userCount} User(s)</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Interactive Permission Matrix for Active Selected Role */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              Role-Permission Matrix {activeRole ? `· ${activeRole.name}` : ''}
            </h4>
            <p className="text-xs text-gray-500">
              Changes take effect immediately on backend API middleware checks
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-semibold"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.permissionCodes.length} perms)
                </option>
              ))}
            </select>
            {hasPermission('permissions.create') && (
              <button
                type="button"
                onClick={() => setShowPermModal(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#292933] text-white text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Permission</span>
              </button>
            )}
          </div>
        </div>

        {activeRole && activeRole.slug === 'superadmin' && (
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 text-xs text-purple-900 dark:text-purple-200 flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Super Administrator always retains all permissions by system design.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(groupedPermissions).map(([category, perms]) => (
            <div
              key={category}
              className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-2.5"
            >
              <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500">{category}</h5>
              <div className="space-y-2">
                {perms.map((p) => {
                  const checked = activeRole?.permissionCodes.includes(p.code) || false;
                  const disabled = !hasPermission('permissions.update') || activeRole?.slug === 'superadmin';
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={disabled || !activeRole}
                      onClick={() => activeRole && handleToggleRolePermission(activeRole, p.code)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg border text-left text-xs transition-colors ${
                        disabled ? 'opacity-80 cursor-default' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                      } ${
                        checked
                          ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-500/30 dark:bg-emerald-500/5'
                          : 'border-gray-200 dark:border-gray-800'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-mono font-bold text-[11px] text-gray-900 dark:text-white flex items-center gap-1.5">
                          <span>{p.code}</span>
                          {p.isCritical && (
                            <span className="px-1 py-0.5 rounded bg-rose-100 text-rose-700 text-[9px] font-sans uppercase">
                              Critical
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">{p.description}</p>
                      </div>
                      <span
                        className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                          checked ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      >
                        {checked && <Check className="w-3.5 h-3.5" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-xs">
          <form
            onSubmit={handleCreateRole}
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 space-y-3 text-xs"
          >
            <h4 className="text-base font-bold text-gray-900 dark:text-white">Create Custom Role</h4>
            <div>
              <label className="block font-semibold mb-1">Role Name *</label>
              <input
                type="text"
                value={rName}
                onChange={(e) => setRName(e.target.value)}
                placeholder="e.g. Security Auditor"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Role Slug *</label>
              <input
                type="text"
                value={rSlug}
                onChange={(e) => setRSlug(e.target.value)}
                placeholder="e.g. security_auditor"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-mono bg-transparent"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Hierarchy Level (11 - 95)</label>
              <input
                type="number"
                min={11}
                max={95}
                value={rHierarchy}
                onChange={(e) => setRHierarchy(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-mono-num bg-transparent"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Description</label>
              <textarea
                rows={2}
                value={rDesc}
                onChange={(e) => setRDesc(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRoleModal(false)}
                className="w-1/3 py-2 rounded-lg border border-gray-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button type="submit" className="w-2/3 py-2 rounded-lg bg-[#465FFF] text-white font-semibold cursor-pointer">
                Create Role
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Permission Modal */}
      {showPermModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-xs">
          <form
            onSubmit={handleCreatePermission}
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 space-y-3 text-xs"
          >
            <h4 className="text-base font-bold text-gray-900 dark:text-white">Register Custom Permission</h4>
            <div>
              <label className="block font-semibold mb-1">Permission Code *</label>
              <input
                type="text"
                value={pCode}
                onChange={(e) => setPCode(e.target.value)}
                placeholder="e.g. reports.export"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-mono bg-transparent"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Display Name *</label>
              <input
                type="text"
                value={pName}
                onChange={(e) => setPName(e.target.value)}
                placeholder="Export Reports"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Category *</label>
              <input
                type="text"
                value={pCategory}
                onChange={(e) => setPCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Description</label>
              <input
                type="text"
                value={pDesc}
                onChange={(e) => setPDesc(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPermModal(false)}
                className="w-1/3 py-2 rounded-lg border border-gray-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button type="submit" className="w-2/3 py-2 rounded-lg bg-[#292933] text-white font-semibold cursor-pointer">
                Add Permission
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
