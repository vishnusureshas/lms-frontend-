'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useAdminListUsersQuery, useAdminUpdateUserMutation, useAdminDeleteUserMutation, useBanUserMutation, useUnbanUserMutation, useBulkUserActionsMutation } from '@/services/api';
import type { User, PaginationMeta } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { SkeletonList } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { cn, timeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Users,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCog,
  GraduationCap,
  BookOpen,
  Plus,
  Trash2,
  UserPlus,
  Ban,
  CheckCircle,
  SquareCheck,
  Square,
  Trash,
  ShieldOff,
} from 'lucide-react';

const roleConfig: Record<string, { icon: any; color: string; label: string }> = {
  admin: { icon: Shield, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'Admin' },
  instructor: { icon: BookOpen, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Instructor' },
  student: { icon: GraduationCap, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', label: 'Student' },
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [updateUser] = useAdminUpdateUserMutation();
  const [deleteUser] = useAdminDeleteUserMutation();
  const [banUser] = useBanUserMutation();
  const [unbanUser] = useUnbanUserMutation();
  const [bulkUserActions] = useBulkUserActionsMutation();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useAdminListUsersQuery({
    page,
    limit: 15,
    role: roleFilter || undefined,
    search: search || undefined,
  });

  const users = data?.data || [];
  const meta = data?.meta as PaginationMeta | undefined;

  const handleRoleChange = async (userId: string, newRole: string, userName: string) => {
    try {
      await updateUser({ id: userId, data: { full_name: userName, role: newRole as any } }).unwrap();
      toast.success(`User role updated to ${newRole}`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update role');
    }
  };

  const handleToggleActive = async (u: any) => {
    try {
      await updateUser({ id: u.id, data: { is_active: !u.is_active } as any }).unwrap();
      toast.success(u.is_active ? 'User deactivated' : 'User activated');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Delete user "${userName}"? This cannot be undone.`)) return;
    try {
      await deleteUser(userId).unwrap();
      toast.success(`User "${userName}" deleted`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete user');
    }
  };

  const handleBanUser = async (userId: string, userName: string) => {
    const reason = prompt(`Ban "${userName}"?\nEnter a reason (optional):`);
    if (reason === null) return;
    try {
      await banUser({ id: userId, reason: reason || undefined, isPermanent: true }).unwrap();
      toast.success(`User "${userName}" has been banned`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId: string, userName: string) => {
    if (!confirm(`Unban "${userName}"?`)) return;
    try {
      await unbanUser(userId).unwrap();
      toast.success(`User "${userName}" has been unbanned`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to unban user');
    }
  };

  // ── Bulk Selection ──
  const allVisibleIds = users.map((u: any) => u.id);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id: string) => selectedIds.has(id));
  const someSelected = allVisibleIds.some((id: string) => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allVisibleIds));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Bulk Actions ──
  const handleBulkAction = async (action: string) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const label = action.replace('_', ' ');
    if (!confirm(`Perform "${label}" on ${ids.length} user(s)?`)) return;

    try {
      const result = await bulkUserActions({
        userIds: ids,
        action: action as any,
      }).unwrap();
      toast.success(result.data?.message || `${label} applied to ${result.data?.processed} user(s)`);
      setSelectedIds(new Set());
    } catch (err: any) {
      toast.error(err?.data?.message || `Failed to perform ${label}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">User Management</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {meta ? `${meta.total} user${meta.total !== 1 ? 's' : ''} registered` : 'Manage platform users'}
          </p>
        </div>
        <Link
          href="/dashboard/admin/users/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-all"
        >
          <UserPlus className="h-4 w-4" />
          Create User
        </Link>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-500/10 border border-primary-500/20">
          <span className="text-sm text-primary-300 font-medium">{selectedIds.size} selected</span>
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={() => handleBulkAction('activate')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
            >
              Activate
            </button>
            <button
              onClick={() => handleBulkAction('deactivate')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all"
            >
              Deactivate
            </button>
            <button
              onClick={() => handleBulkAction('ban')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-1"
            >
              <ShieldOff className="h-3 w-3" /> Ban
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all flex items-center gap-1"
            >
              <Trash className="h-3 w-3" /> Delete
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Select All */}
        {users.length > 0 && (
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all"
            title={allSelected ? 'Deselect all' : 'Select all'}
          >
            {allSelected ? (
              <SquareCheck className="h-4 w-4 text-primary-400" />
            ) : someSelected ? (
              <div className="h-4 w-4 rounded border-2 border-primary-400 bg-primary-500/20 flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-sm bg-primary-400" />
              </div>
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>
        )}
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {/* Role filter */}
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-primary-500/50 appearance-none cursor-pointer min-w-[140px]"
        >
          <option value="" className="bg-slate-900">All Roles</option>
          <option value="student" className="bg-slate-900">Students</option>
          <option value="instructor" className="bg-slate-900">Instructors</option>
          <option value="admin" className="bg-slate-900">Admins</option>
        </select>
      </div>

      {/* Users List */}
      {isLoading ? (
        <Card glass>
          <CardContent className="p-6">
            <SkeletonList rows={8} />
          </CardContent>
        </Card>
      ) : error ? (
        <Alert type="error">Failed to load users. Ensure the backend is running.</Alert>
      ) : users.length === 0 ? (
        <Card glass>
          <CardContent className="py-16 text-center">
            <Users className="h-14 w-14 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">No users found</h3>
            <p className="text-sm text-slate-500">Try adjusting your search or filter</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {users.map((u: any) => {
              const role = roleConfig[u.role] || roleConfig.student;
              const RoleIcon = role.icon;

              return (
                <Card key={u.id} glass hover>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleSelect(u.id)}
                        className="flex-shrink-0"
                        title={selectedIds.has(u.id) ? 'Deselect' : 'Select'}
                      >
                        {selectedIds.has(u.id) ? (
                          <SquareCheck className="h-4 w-4 text-primary-400" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-600" />
                        )}
                      </button>

                      {/* Avatar */}
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-600/20 flex items-center justify-center text-sm font-bold text-primary-400 flex-shrink-0 border border-white/[0.06]">
                        {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-white text-sm truncate">{u.full_name}</span>
                          <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium flex items-center gap-1', role.color)}>
                            <RoleIcon className="h-3 w-3" />
                            {role.label}
                          </span>
                          {!u.is_active && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              Inactive
                            </span>
                          )}
                          {u.ban && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                              <Ban className="h-2.5 w-2.5" />
                              Banned{u.ban.is_permanent ? ' (permanent)' : ''}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span>{u.email}</span>
                          <span>Joined {timeAgo(u.created_at)}</span>
                          {u.last_login_at && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span>Last login {timeAgo(u.last_login_at)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Verified Badge */}
                      {u.is_verified && (
                        <div className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <span className="text-emerald-400 text-xs font-medium">Verified</span>
                        </div>
                      )}

                      {/* Admin Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        {/* Role Changer */}
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value, u.full_name)}
                          className="px-2 py-1 rounded-lg bg-white/[0.06] border border-white/[0.08] text-xs text-white focus:outline-none cursor-pointer appearance-none hover:bg-white/[0.1] transition-all"
                          title="Change role"
                        >
                          <option value="student" className="bg-slate-900">Student</option>
                          <option value="instructor" className="bg-slate-900">Instructor</option>
                          <option value="admin" className="bg-slate-900">Admin</option>
                        </select>

                        {/* Activate/Deactivate */}
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={cn(
                            'p-2 rounded-xl transition-all',
                            u.is_active
                              ? 'text-slate-500 hover:text-amber-400 hover:bg-amber-500/10'
                              : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                          )}
                          title={u.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {u.is_active ? (
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10.5 1.5L8.25 3.75l5.25 5.25L3 18l1.5 1.5L15 10.5l5.25 5.25 2.25-2.25L15 6l-3-3-1.5 1.5z"/>
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 18a8 8 0 118-8 8 8 0 01-8 8z"/>
                              <path d="M12 7v5l3 3"/>
                            </svg>
                          )}
                        </button>

                        {/* Ban/Unban */}
                        {u.ban ? (
                          <button
                            onClick={() => handleUnbanUser(u.id, u.full_name)}
                            className="p-2 rounded-xl text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all"
                            title="Unban user"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBanUser(u.id, u.full_name)}
                            className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Ban user"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteUser(u.id, u.full_name)}
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-slate-500">Page {meta.page} of {meta.totalPages}</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-slate-600">...</span>}
                      <button
                        onClick={() => setPage(p)}
                        className={cn(
                          'h-8 min-w-[32px] px-2 rounded-lg text-sm font-medium transition-all',
                          p === page ? 'bg-primary-500/15 text-primary-400' : 'text-slate-400 hover:text-white hover:bg-white/10'
                        )}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={page >= meta.totalPages}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
