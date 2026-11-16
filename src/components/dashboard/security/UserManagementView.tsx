import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Shield,
  UserCheck,
  UserX,
  Lock,
  Search,
  Download,
  Plus,
  Edit,
  Eye,
  KeyRound,
  LogOut,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Sliders,
  Ban,
  Unlock,
  X
} from 'lucide-react';
import { apiRequest } from '../../../services/apiClient';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import {
  AccountStatus,
  AdminInvitationRecord,
  LoginHistoryRecord,
  PermissionRecord,
  RoleRecord,
  UserDashboardStats,
  UserProfile,
  UserSessionRecord
} from '../../../types';
import { PasswordStrengthMeter } from '../../auth/PasswordStrengthMeter';

interface UserManagementViewProps {
  presetFilter?: 'all' | 'admins' | 'staff' | 'customers';
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ presetFilter = 'all' }) => {
  const { hasPermission } = useAuth();
  const { addToast } = useNotification();

  const [stats, setStats] = useState<UserDashboardStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionRecord[]>([]);
  const [invitations, setInvitations] = useState<AdminInvitationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'fullName' | 'email' | 'lastLoginAt'>('createdAt');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMode, setCreateMode] = useState<'invite' | 'direct'>('invite');
  const [cFullName, setCFullName] = useState('');
  const [cUsername, setCUsername] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cDesignation, setCDesignation] = useState('Operations Staff');
  const [cRoleIds, setCRoleIds] = useState<string[]>([]);
  const [cStatus, setCStatus] = useState<'active' | 'inactive'>('active');
  const [cPassword, setCPassword] = useState('');
  const [createdInviteLink, setCreatedInviteLink] = useState('');
  const [copiedInvite, setCopiedInvite] = useState(false);

  const [detailUser, setDetailUser] = useState<{
    user: UserProfile;
    sessions: UserSessionRecord[];
    loginHistory: LoginHistoryRecord[];
    overrides: Array<{ permissionId: string; effect: 'allow' | 'deny' }>;
  } | null>(null);
  const [editUserModal, setEditUserModal] = useState<UserProfile | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDesignation, setEditDesignation] = useState('');

  const [roleAssignModal, setRoleAssignModal] = useState<UserProfile | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const [overrideModal, setOverrideModal] = useState<UserProfile | null>(null);
  const [overrideMap, setOverrideMap] = useState<Record<string, 'default' | 'allow' | 'deny'>>({});

  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    danger?: boolean;
    onConfirm: () => Promise<void>;
  } | null>(null);

  const [resetResultLink, setResetResultLink] = useState<{ email: string; link: string; path: string } | null>(null);

  useEffect(() => {
    if (presetFilter === 'customers') setRoleFilter('customer');
    else if (presetFilter === 'admins') setRoleFilter('administrator');
    else if (presetFilter === 'staff') setRoleFilter('staff');
    else setRoleFilter('all');
    setPage(1);
  }, [presetFilter]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        search,
        role: roleFilter,
        status: statusFilter,
        sortBy,
        sortDir,
        page: String(page),
        pageSize: '12'
      });
      if (dateFrom) qs.set('dateFrom', dateFrom);
      if (dateTo) qs.set('dateTo', dateTo);

      const [statsRes, usersRes, invRes] = await Promise.all([
        apiRequest<{ stats: UserDashboardStats }>('/api/admin/users/stats'),
        apiRequest<{ users: UserProfile[]; pagination: { totalPages: number } }>(`/api/admin/users?${qs.toString()}`),
        apiRequest<{ invitations: AdminInvitationRecord[] }>('/api/admin/users/invitations/list')
      ]);

      setStats(statsRes.stats);
      // For 'admins' preset show both superadmin and administrator if filter isn't narrowed elsewhere
      let loadedUsers = usersRes.users;
      if (presetFilter === 'admins' && roleFilter === 'administrator') {
        const allRes = await apiRequest<{ users: UserProfile[] }>('/api/admin/users?pageSize=100');
        loadedUsers = allRes.users.filter((u) =>
          (u.roles || []).some((r) => r.slug === 'superadmin' || r.slug === 'administrator')
        );
      }
      setUsers(loadedUsers);
      setTotalPages(usersRes.pagination.totalPages);
      setInvitations(invRes.invitations.filter((i) => !i.acceptedAt && !i.revokedAt));

      if (hasPermission('roles.view')) {
        const rolesRes = await apiRequest<{ roles: RoleRecord[] }>('/api/admin/roles');
        setRoles(rolesRes.roles);
      }
      if (hasPermission('permissions.view')) {
        const permRes = await apiRequest<{ permissions: PermissionRecord[] }>('/api/admin/permissions');
        setAllPermissions(permRes.permissions);
      }
    } catch (err: any) {
      addToast('Load Error', err.message || 'Could not load user directory.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, dateFrom, dateTo, sortBy, sortDir, page, presetFilter, hasPermission, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest<{ inviteLink?: string }>('/api/admin/users', {
        method: 'POST',
        body: {
          mode: createMode,
          fullName: cFullName,
          username: cUsername,
          email: cEmail,
          phoneNumber: cPhone,
          designation: cDesignation,
          roleIds: cRoleIds,
          accountStatus: cStatus,
          password: createMode === 'direct' ? cPassword : undefined
        }
      });
      if (createMode === 'invite' && res.inviteLink) {
        setCreatedInviteLink(`${window.location.origin}${res.inviteLink}`);
        addToast('Invitation Issued', `Invitation created for ${cEmail}.`, 'success');
      } else {
        setShowCreateModal(false);
        addToast('User Created', `Account provisioned for ${cEmail}.`, 'success');
      }
      setCFullName('');
      setCUsername('');
      setCEmail('');
      setCPhone('');
      setCPassword('');
      loadData();
    } catch (err: any) {
      addToast('Creation Failed', err.message || 'Could not create user.', 'error');
    }
  };

  const handleOpenDetail = async (userId: string) => {
    try {
      const res = await apiRequest<{
        user: UserProfile;
        sessions: UserSessionRecord[];
        loginHistory: LoginHistoryRecord[];
        overrides: Array<{ permissionId: string; effect: 'allow' | 'deny' }>;
      }>(`/api/admin/users/${userId}`);
      setDetailUser(res);
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to load user details.', 'error');
    }
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserModal) return;
    try {
      await apiRequest(`/api/admin/users/${editUserModal.uid}`, {
        method: 'PUT',
        body: {
          fullName: editFullName,
          username: editUsername,
          phoneNumber: editPhone,
          designation: editDesignation
        }
      });
      setEditUserModal(null);
      addToast('User Updated', 'User account information saved.', 'success');
      loadData();
    } catch (err: any) {
      addToast('Update Failed', err.message || 'Could not update user.', 'error');
    }
  };

  const handleAssignRolesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleAssignModal) return;
    try {
      await apiRequest(`/api/admin/users/${roleAssignModal.uid}/assign-role`, {
        method: 'POST',
        body: { roleIds: selectedRoleIds }
      });
      setRoleAssignModal(null);
      addToast('Roles Assigned', 'User RBAC roles updated cleanly.', 'success');
      loadData();
    } catch (err: any) {
      addToast('Role Assignment Failed', err.message || 'Action denied.', 'error');
    }
  };

  const handleSaveOverrides = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideModal) return;
    const overrides = Object.entries(overrideMap)
      .filter(([, effect]) => effect !== 'default')
      .map(([permissionId, effect]) => ({ permissionId, effect }));
    try {
      await apiRequest(`/api/admin/users/${overrideModal.uid}/permissions`, {
        method: 'POST',
        body: { overrides }
      });
      setOverrideModal(null);
      addToast('Permissions Saved', 'User-level permission overrides updated.', 'success');
      loadData();
    } catch (err: any) {
      addToast('Failed', err.message || 'Could not update overrides.', 'error');
    }
  };

  const statusBadge = (status?: AccountStatus) => {
    const s = status || 'active';
    if (s === 'active') return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300';
    if (s === 'suspended' || s === 'locked') return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300';
    if (s === 'pending_verification') return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300';
    return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {[
            { label: 'Total Users', value: stats.totalUsers, icon: Users, accent: 'text-[#465FFF]' },
            { label: 'Administrators', value: stats.totalAdministrators, icon: Shield, accent: 'text-purple-600' },
            { label: 'Staff Accounts', value: stats.totalStaff, icon: UserCheck, accent: 'text-sky-600' },
            { label: 'Customers', value: stats.totalCustomers, icon: Users, accent: 'text-emerald-600' },
            { label: 'Active / Suspended / Locked', value: `${stats.activeUsers} / ${stats.suspendedUsers} / ${stats.lockedUsers}`, icon: Lock, accent: 'text-amber-600' }
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{card.label}</span>
                  <Icon className={`w-4 h-4 ${card.accent}`} />
                </div>
                <p className="mt-2 text-lg sm:text-xl font-bold font-mono-num text-gray-900 dark:text-white">
                  {card.value}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Pending Invitations Strip */}
      {invitations.length > 0 && hasPermission('users.create') && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 dark:border-blue-500/20 dark:bg-blue-500/5 p-4 space-y-2">
          <p className="text-xs font-bold text-blue-950 dark:text-blue-200">
            Pending Team Invitations ({invitations.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-blue-200 dark:border-gray-700 text-xs flex items-center gap-2"
              >
                <span className="font-semibold">{inv.fullName}</span>
                <span className="text-gray-500">({inv.email})</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                  {inv.roleNames.join(', ')}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await apiRequest(`/api/admin/users/invitations/${inv.id}/revoke`, { method: 'POST' });
                    addToast('Invitation Revoked', `Revoked invite for ${inv.email}.`, 'info');
                    loadData();
                  }}
                  className="text-rose-600 hover:underline font-semibold ml-1 cursor-pointer"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar & Table Card */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {presetFilter === 'admins'
                  ? 'Administrator Accounts'
                  : presetFilter === 'staff'
                  ? 'Staff Accounts'
                  : presetFilter === 'customers'
                  ? 'Customer Accounts'
                  : 'All System Users & Access Directory'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Backend-enforced RBAC with confirmation guards and full audit logging
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`/api/admin/users?format=csv&search=${encodeURIComponent(search)}&role=${roleFilter}&status=${statusFilter}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </a>

              {hasPermission('users.create') && (
                <button
                  type="button"
                  onClick={() => {
                    setCreatedInviteLink('');
                    if (roles.length > 0 && cRoleIds.length === 0) {
                      const staffRole = roles.find((r) => r.slug === 'staff') || roles[0];
                      setCRoleIds([staffRole.id]);
                    }
                    setShowCreateModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#465FFF] hover:bg-[#3641F5] text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add / Invite User</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs">
            <div className="relative lg:col-span-2">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search ID, name, username, email, phone..."
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-xs focus:outline-none focus:border-[#465FFF]"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs"
            >
              <option value="all">All Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.slug}>
                  {r.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="locked">Locked</option>
              <option value="deactivated">Deactivated</option>
            </select>

            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              title="Registered From"
              className="px-2.5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-xs"
            />

            <div className="flex gap-1.5">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs"
              >
                <option value="createdAt">Registered</option>
                <option value="fullName">Name</option>
                <option value="email">Email</option>
                <option value="lastLoginAt">Last Login</option>
              </select>
              <button
                type="button"
                onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                className="px-2.5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold cursor-pointer"
              >
                {sortDir === 'desc' ? '↓' : '↑'}
              </button>
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800 text-[10px] uppercase text-gray-500">
              <tr>
                <th className="py-3 px-4">User / ID</th>
                <th className="py-3 px-4">Username &amp; Contact</th>
                <th className="py-3 px-4">Roles</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Verification / MFA</th>
                <th className="py-3 px-4">Registered / Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-500">
                    Loading user directory...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-500">
                    No matching users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.uid} className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02]">
                    <td className="py-3 px-4">
                      <p className="font-bold text-gray-900 dark:text-white">{u.fullName || u.displayName}</p>
                      <p className="text-[10px] font-mono-num text-gray-400">{u.uid}</p>
                      {u.designation && <p className="text-[11px] text-gray-500">{u.designation}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-mono text-[11px] font-semibold text-gray-800 dark:text-gray-200">
                        @{u.username}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">{u.email}</p>
                      {u.phoneNumber && (
                        <p className="text-[11px] font-mono-num text-gray-500">{u.phoneNumber}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(u.roles || [{ id: 'c', slug: u.role, name: u.role, hierarchyLevel: 10 }]).map((r) => (
                          <span
                            key={r.id}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              r.slug === 'superadmin'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300'
                                : r.slug === 'administrator'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
                                : r.slug === 'customer'
                                ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                            }`}
                          >
                            {r.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${statusBadge(u.status)}`}>
                        {(u.status || 'active').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 space-y-1">
                      <span
                        className={`block text-[11px] font-semibold ${
                          u.emailVerified ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {u.emailVerified ? '✓ Email Verified' : '• Unverified'}
                      </span>
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          u.mfaEnabled
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                        }`}
                      >
                        {u.mfaEnabled ? 'MFA TOTP Active' : 'MFA Off'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono-num text-[11px] text-gray-500">
                      <p>Reg: {new Date(u.createdAt).toLocaleDateString()}</p>
                      <p>Last: {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(u.uid)}
                          title="View Details, Sessions & Login History"
                          className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                        </button>

                        {hasPermission('users.update') && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditUserModal(u);
                              setEditFullName(u.fullName || u.displayName);
                              setEditUsername(u.username || '');
                              setEditPhone(u.phoneNumber || '');
                              setEditDesignation(u.designation || '');
                            }}
                            title="Edit User"
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5 text-[#465FFF]" />
                          </button>
                        )}

                        {hasPermission('roles.assign') && (
                          <button
                            type="button"
                            onClick={() => {
                              setRoleAssignModal(u);
                              setSelectedRoleIds((u.roles || []).map((r) => r.id));
                            }}
                            title="Assign Roles"
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                          >
                            <Shield className="w-3.5 h-3.5 text-purple-600" />
                          </button>
                        )}

                        {hasPermission('permissions.assign') && (
                          <button
                            type="button"
                            onClick={async () => {
                              const detail = await apiRequest<{
                                overrides: Array<{ permissionId: string; effect: 'allow' | 'deny' }>;
                              }>(`/api/admin/users/${u.uid}`);
                              const map: Record<string, 'default' | 'allow' | 'deny'> = {};
                              for (const ov of detail.overrides) {
                                map[ov.permissionId] = ov.effect;
                              }
                              setOverrideMap(map);
                              setOverrideModal(u);
                            }}
                            title="Permission Overrides"
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5 text-sky-600" />
                          </button>
                        )}

                        {u.status !== 'active' && hasPermission('users.activate') && (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmAction({
                                title: u.status === 'locked' ? 'Unlock User Account' : 'Activate User Account',
                                message: `Restore "${u.email}" to active status?`,
                                onConfirm: async () => {
                                  await apiRequest(`/api/admin/users/${u.uid}/status`, {
                                    method: 'PATCH',
                                    body: { status: 'active' }
                                  });
                                  addToast('Account Activated', `${u.email} is now active.`, 'success');
                                  loadData();
                                }
                              })
                            }
                            title={u.status === 'locked' ? 'Unlock Account' : 'Activate Account'}
                            className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer"
                          >
                            {u.status === 'locked' ? <Unlock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>
                        )}

                        {u.status === 'active' && hasPermission('users.suspend') && (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmAction({
                                title: 'Suspend User Account',
                                message: `Immediately suspend "${u.email}" and terminate all active sessions?`,
                                danger: true,
                                onConfirm: async () => {
                                  await apiRequest(`/api/admin/users/${u.uid}/status`, {
                                    method: 'PATCH',
                                    body: { status: 'suspended' }
                                  });
                                  addToast('Account Suspended', `${u.email} has been suspended.`, 'info');
                                  loadData();
                                }
                              })
                            }
                            title="Suspend User"
                            className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {u.status === 'active' && hasPermission('users.deactivate') && (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmAction({
                                title: 'Deactivate User Account',
                                message: `Deactivate "${u.email}"? They will lose access immediately until reactivated.`,
                                danger: true,
                                onConfirm: async () => {
                                  await apiRequest(`/api/admin/users/${u.uid}/status`, {
                                    method: 'PATCH',
                                    body: { status: 'deactivated' }
                                  });
                                  addToast('Account Deactivated', `${u.email} deactivated.`, 'info');
                                  loadData();
                                }
                              })
                            }
                            title="Deactivate User"
                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-rose-50 text-rose-600 cursor-pointer"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {hasPermission('users.update') && (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmAction({
                                title: 'Initiate Password Reset Workflow',
                                message: `Issue a single-use password reset token for ${u.email} and sign out active sessions?`,
                                onConfirm: async () => {
                                  const res = await apiRequest<{ resetLink?: string }>(`/api/admin/users/${u.uid}/reset-password`, {
                                    method: 'POST'
                                  });
                                  if (res.resetLink) {
                                    setResetResultLink({
                                      email: u.email,
                                      path: res.resetLink,
                                      link: `${window.location.origin}${res.resetLink}`
                                    });
                                  }
                                  addToast('Reset Initiated', `Password reset workflow created for ${u.email}.`, 'success');
                                }
                              })
                            }
                            title="Initiate Password Reset"
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                          </button>
                        )}

                        {hasPermission('security.sessions.revoke') && (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmAction({
                                title: 'Revoke All Active Sessions',
                                message: `Terminate all logged-in devices for ${u.email}?`,
                                danger: true,
                                onConfirm: async () => {
                                  const res = await apiRequest<{ revokedCount: number }>(`/api/admin/users/${u.uid}/revoke-sessions`, {
                                    method: 'POST'
                                  });
                                  addToast('Sessions Revoked', `Terminated ${res.revokedCount} session(s).`, 'info');
                                }
                              })
                            }
                            title="Revoke All Sessions"
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-rose-50 cursor-pointer"
                          >
                            <LogOut className="w-3.5 h-3.5 text-rose-600" />
                          </button>
                        )}

                        {hasPermission('users.delete') && u.role !== 'superadmin' && (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmAction({
                                title: 'Delete User Permanently',
                                message: `Permanently delete account "${u.email}"? Audit trail records will be preserved.`,
                                danger: true,
                                onConfirm: async () => {
                                  await apiRequest(`/api/admin/users/${u.uid}`, { method: 'DELETE' });
                                  addToast('User Deleted', `${u.email} removed.`, 'info');
                                  loadData();
                                }
                              })
                            }
                            title="Delete User"
                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs">
          <span className="text-gray-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: GENERATED PASSWORD RESET LINK */}
      {resetResultLink && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
              <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>Password Reset Link Ready</span>
              </h4>
              <button
                type="button"
                onClick={() => setResetResultLink(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Single-use reset workflow created for <strong className="text-gray-900 dark:text-white">{resetResultLink.email}</strong>.
            </p>
            <div className="p-3 rounded-lg border border-amber-300 bg-amber-50">
              <code className="block text-[11px] font-mono text-amber-950 break-all">{resetResultLink.link}</code>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(resetResultLink.link);
                  addToast('Copied', 'Reset link copied.', 'success');
                }}
                className="px-3 py-2 rounded-lg bg-amber-900 hover:bg-amber-950 text-white font-semibold cursor-pointer flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </button>
              <Link
                to={resetResultLink.path}
                onClick={() => setResetResultLink(null)}
                className="px-3 py-2 rounded-lg bg-[#465FFF] hover:bg-[#3641F5] text-white font-semibold cursor-pointer"
              >
                Open Reset Page
              </Link>
              <button
                type="button"
                onClick={() => setResetResultLink(null)}
                className="ml-auto px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / INVITE USER */}
      {showCreateModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 space-y-4 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
              <h4 className="text-base font-bold text-gray-900 dark:text-white">
                Add or Invite Authorized User
              </h4>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdInviteLink ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                  <p className="font-bold">Single-Use Invitation Link Generated</p>
                  <p>Share this time-limited onboarding URL with the invited team member so they can set their strong 12+ char password:</p>
                  <code className="block p-2.5 rounded bg-white border border-emerald-200 font-mono text-[11px] break-all">
                    {createdInviteLink}
                  </code>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdInviteLink);
                      setCopiedInvite(true);
                      setTimeout(() => setCopiedInvite(false), 1800);
                    }}
                    className="flex-1 py-2.5 rounded-lg bg-[#465FFF] text-white font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedInvite ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedInvite ? 'Copied Link' : 'Copy Onboarding Link'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-lg border border-gray-300 font-semibold cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateUserSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-gray-100 dark:bg-gray-800">
                  {[
                    { id: 'invite', label: 'Send Secure Invitation' },
                    { id: 'direct', label: 'Direct Account Creation' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setCreateMode(m.id as 'invite' | 'direct')}
                      className={`py-2 rounded-md font-semibold cursor-pointer ${
                        createMode === m.id ? 'bg-white dark:bg-gray-900 shadow-xs text-[#465FFF]' : 'text-gray-500'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={cFullName}
                      onChange={(e) => setCFullName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Username *</label>
                    <input
                      type="text"
                      value={cUsername}
                      onChange={(e) => setCUsername(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Email *</label>
                    <input
                      type="email"
                      value={cEmail}
                      onChange={(e) => setCEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      value={cPhone}
                      onChange={(e) => setCPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Designation</label>
                    <input
                      type="text"
                      value={cDesignation}
                      onChange={(e) => setCDesignation(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Initial Account Status</label>
                    <select
                      value={cStatus}
                      onChange={(e) => setCStatus(e.target.value as 'active' | 'inactive')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Assigned Roles *</label>
                  <div className="grid grid-cols-2 gap-2 p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg max-h-36 overflow-y-auto">
                    {roles.map((r) => (
                      <label key={r.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cRoleIds.includes(r.id)}
                          onChange={(e) =>
                            setCRoleIds((prev) =>
                              e.target.checked ? [...prev, r.id] : prev.filter((id) => id !== r.id)
                            )
                          }
                          className="rounded accent-[#465FFF]"
                        />
                        <span>
                          {r.name} <span className="text-[10px] text-gray-400">({r.hierarchyLevel})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {createMode === 'direct' && (
                  <div>
                    <label className="block font-semibold mb-1">Password (min 12 chars for team roles) *</label>
                    <input
                      type="password"
                      value={cPassword}
                      onChange={(e) => setCPassword(e.target.value)}
                      minLength={8}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent"
                      required
                    />
                    <PasswordStrengthMeter password={cPassword} minLength={12} />
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="w-1/3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-2 rounded-lg bg-[#465FFF] hover:bg-[#3641F5] text-white font-semibold cursor-pointer"
                  >
                    {createMode === 'invite' ? 'Generate Secure Invite' : 'Create User Account'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: VIEW USER DETAILS, SESSIONS & LOGIN HISTORY */}
      {detailUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 space-y-4 my-6 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h4 className="text-base font-bold text-gray-900 dark:text-white">
                  {detailUser.user.fullName} (@{detailUser.user.username})
                </h4>
                <p className="text-gray-500">{detailUser.user.email} · {detailUser.user.designation}</p>
              </div>
              <button type="button" onClick={() => setDetailUser(null)} className="text-gray-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <p className="font-bold uppercase text-[10px] text-gray-500">Effective RBAC Permissions ({detailUser.user.permissions?.length || 0})</p>
              <div className="flex flex-wrap gap-1.5">
                {(detailUser.user.permissions || []).map((p) => (
                  <span key={p} className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-[10px]">
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-bold uppercase text-[10px] text-gray-500">Active Sessions ({detailUser.sessions.length})</p>
              {detailUser.sessions.length === 0 ? (
                <p className="text-gray-400">No active sessions.</p>
              ) : (
                detailUser.sessions.map((s) => (
                  <div key={s.id} className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{s.deviceName}</p>
                      <p className="text-[11px] text-gray-500 font-mono-num">IP: {s.ipAddress} · Active {new Date(s.lastActivityAt).toLocaleString()}</p>
                    </div>
                    {hasPermission('security.sessions.revoke') && (
                      <button
                        type="button"
                        onClick={async () => {
                          await apiRequest(`/api/admin/sessions/${s.id}`, { method: 'DELETE' });
                          addToast('Session Terminated', 'Session revoked.', 'info');
                          handleOpenDetail(detailUser.user.uid);
                        }}
                        className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 font-semibold cursor-pointer"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="space-y-2">
              <p className="font-bold uppercase text-[10px] text-gray-500">Recent Login History</p>
              <div className="max-h-44 overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-lg divide-y divide-gray-100 dark:divide-gray-800">
                {detailUser.loginHistory.map((h) => (
                  <div key={h.id} className="p-2 flex items-center justify-between text-[11px]">
                    <span>{new Date(h.createdAt).toLocaleString()} · {h.deviceName} ({h.ipAddress})</span>
                    <span className={`font-bold ${h.success ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {h.success ? 'Success' : h.failureReason || 'Failed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {editUserModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-xs">
          <form
            onSubmit={handleSaveEditUser}
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 space-y-3 text-xs"
          >
            <h4 className="text-base font-bold text-gray-900 dark:text-white pb-2 border-b border-gray-200 dark:border-gray-800">
              Edit User: {editUserModal.email}
            </h4>
            <div>
              <label className="block font-semibold mb-1">Full Name</label>
              <input
                type="text"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Username</label>
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Mobile Number</label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Designation</label>
              <input
                type="text"
                value={editDesignation}
                onChange={(e) => setEditDesignation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditUserModal(null)}
                className="w-1/3 py-2 rounded-lg border border-gray-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-2/3 py-2 rounded-lg bg-[#465FFF] text-white font-semibold cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ASSIGN ROLES */}
      {roleAssignModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-xs">
          <form
            onSubmit={handleAssignRolesSubmit}
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 space-y-4 text-xs"
          >
            <h4 className="text-base font-bold text-gray-900 dark:text-white">
              Assign Roles for {roleAssignModal.fullName}
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {roles.map((r) => (
                <label
                  key={r.id}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedRoleIds.includes(r.id)}
                    onChange={(e) =>
                      setSelectedRoleIds((prev) =>
                        e.target.checked ? [...prev, r.id] : prev.filter((id) => id !== r.id)
                      )
                    }
                    className="mt-0.5 rounded accent-[#465FFF]"
                  />
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {r.name} <span className="font-mono text-[10px] text-gray-400">Lvl {r.hierarchyLevel}</span>
                    </p>
                    <p className="text-[11px] text-gray-500">{r.description}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRoleAssignModal(null)}
                className="w-1/3 py-2 rounded-lg border border-gray-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button type="submit" className="w-2/3 py-2 rounded-lg bg-[#465FFF] text-white font-semibold cursor-pointer">
                Save Role Assignment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: PERMISSION OVERRIDES */}
      {overrideModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-xs">
          <form
            onSubmit={handleSaveOverrides}
            className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 space-y-4 text-xs"
          >
            <h4 className="text-base font-bold text-gray-900 dark:text-white">
              Permission Overrides for {overrideModal.fullName}
            </h4>
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 border border-gray-200 dark:border-gray-800 rounded-lg">
              {allPermissions.map((perm) => (
                <div key={perm.id} className="p-2.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono font-bold text-gray-800 dark:text-gray-200">{perm.code}</p>
                    <p className="text-[11px] text-gray-500">{perm.name}</p>
                  </div>
                  <select
                    value={overrideMap[perm.id] || 'default'}
                    onChange={(e) =>
                      setOverrideMap((prev) => ({
                        ...prev,
                        [perm.id]: e.target.value as 'default' | 'allow' | 'deny'
                      }))
                    }
                    className="px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 font-semibold"
                  >
                    <option value="default">Inherit Role</option>
                    <option value="allow">Explicit Allow</option>
                    <option value="deny">Explicit Deny</option>
                  </select>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOverrideModal(null)}
                className="w-1/3 py-2 rounded-lg border border-gray-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button type="submit" className="w-2/3 py-2 rounded-lg bg-[#465FFF] text-white font-semibold cursor-pointer">
                Save Overrides
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CONFIRMATION DIALOG FOR SENSITIVE ACTIONS */}
      {confirmAction && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-gray-950/75 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  confirmAction.danger ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">{confirmAction.title}</h4>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{confirmAction.message}</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-700 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await confirmAction.onConfirm();
                  } catch (err: any) {
                    addToast('Action Failed', err.message || 'Operation rejected by backend policy.', 'error');
                  } finally {
                    setConfirmAction(null);
                  }
                }}
                className={`flex-1 py-2 rounded-lg text-white font-bold cursor-pointer ${
                  confirmAction.danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#465FFF] hover:bg-[#3641F5]'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
