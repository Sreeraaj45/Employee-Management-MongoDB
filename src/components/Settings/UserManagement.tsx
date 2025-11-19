import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  Trash2,
  Key,
  Save,
  X,
  Shield,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useUserManagement } from '../../hooks/useUserManagement';
import { useAuth } from '../../hooks/useAuth';
import { showDeleteConfirm, showSuccess, showError } from '../../lib/sweetAlert';

type Role = 'Admin' | 'Lead' | 'HR';

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  [k: string]: any;
};

export const UserManagement: React.FC = () => {
  const { users, isLoading, createUser, deleteUser, updateUserRole } = useUserManagement();
  const { user: currentUser } = useAuth();

  // Local copy for optimistic UI where needed
  const [localUsers, setLocalUsers] = useState<User[]>([]);
  useEffect(() => {
    setLocalUsers(users ?? []);
  }, [users]);

  // Form / modals
  const [formData, setFormData] = useState({ email: '', name: '', role: 'HR' as Role });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCredentials, setShowCredentials] = useState<any>(null);

  // Role change confirm modal (keeps original flow)
  const [showRoleChangeModal, setShowRoleChangeModal] = useState<{
    userId: string;
    userName: string;
    currentRole: Role;
    newRole: Role;
  } | null>(null);
  const [confirmingRole, setConfirmingRole] = useState(false);

  // Loading states
  const [creatingUser, setCreatingUser] = useState(false);
  const [updatingRoleFor, setUpdatingRoleFor] = useState<string | null>(null);

  // Table controls
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'All' | Role>('All');
  const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'asc' | 'desc' } | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number | 'All'>(10);

  // Derived list: filter, search, sort
  const filteredUsers = useMemo(() => {
    let list = [...localUsers];
    if (filterRole !== 'All') list = list.filter((u) => u.role === filterRole);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (u) => (u.name && u.name.toLowerCase().includes(q)) || (u.email && u.email.toLowerCase().includes(q))
      );
    }
    if (sortConfig) {
      const { key, direction } = sortConfig;
      list.sort((a, b) => {
        const av = (a[key] ?? '').toString().toLowerCase();
        const bv = (b[key] ?? '').toString().toLowerCase();
        return direction === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return list;
  }, [localUsers, filterRole, searchQuery, sortConfig]);

  const totalPages = perPage === 'All' ? 1 : Math.max(1, Math.ceil(filteredUsers.length / (perPage as number)));
  const paginatedUsers =
    perPage === 'All' ? filteredUsers : filteredUsers.slice((page - 1) * (perPage as number), page * (perPage as number));

  // keep page valid
  useEffect(() => {
    if (page > totalPages) setPage(totalPages || 1);
  }, [totalPages, page]);

  // reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterRole, sortConfig, perPage]);

  // Sorting handler (keeps the same logic + icons you wanted)
  const handleSort = (key: keyof User) => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
  };

  // CREATE user (calls createUser(email, name, role) to match hook signature)
  const handleCreateUser = async (e?: React.FormEvent | undefined) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    if (!formData.email.trim() || !formData.name.trim()) {
      showError('Please fill all fields');
      return;
    }

    setCreatingUser(true);
    try {
      // <-- Important: pass 3 args (email, name, role) as your hook requires
      const result: any = await createUser(formData.email, formData.name, formData.role);
      if (result.success) {
        // show credentials if provided
        if (result.credentials) setShowCredentials(result.credentials);
        setFormData({ email: '', name: '', role: 'HR' });
        setShowCreateForm(false);
        showSuccess('User Created', `User "${formData.name}" has been successfully created.`);
        // users -> localUsers will sync via useEffect when hook updates users
      } else {
        showError('Create Failed', result.error || 'Failed to create user');
      }
    } catch (err) {
      showError('Create Failed', 'Unexpected error while creating user');
    } finally {
      setCreatingUser(false);
    }
  };

  // DELETE user (keeps original confirm flow)
  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      showError('Cannot Delete Account', 'You cannot delete your own account.');
      return;
    }

    const user = localUsers.find((u) => u.id === userId);
    const result = await showDeleteConfirm(
      'Delete User',
      'Are you sure you want to delete this user? This action cannot be undone.',
      user?.name || 'this user'
    );
    if (!result.isConfirmed) return;

    const deleteResult: any = await deleteUser(userId);
    if (deleteResult.success) {
      showSuccess('User Deleted', `User "${user?.name || 'Unknown'}" has been successfully deleted.`);
      // localUsers will sync from hook
    } else {
      showError('Delete Failed', deleteResult.error || 'Failed to delete user');
    }
  };

  // ROLE change: original flow — open confirmation modal first
  const handleRoleChange = (userId: string, newRole: Role) => {
    if (userId === currentUser?.id) {
      showError('Cannot Change Own Role', 'You cannot change your own role.');
      return;
    }
    const user = localUsers.find((u) => u.id === userId);
    if (!user) return showError('User Not Found', 'The selected user could not be found.');

    setShowRoleChangeModal({
      userId,
      userName: user.name,
      currentRole: user.role,
      newRole,
    });
  };

  // Confirm role change — call updateUserRole(userId, newRole)
  const confirmRoleChange = async () => {
    if (!showRoleChangeModal) return;
    const { userId, newRole, userName } = showRoleChangeModal;

    setConfirmingRole(true);
    try {
      const res: any = await updateUserRole(userId, newRole);
      if (res.success) {
        // update local copy (optimistic)
        setLocalUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
        showSuccess('Role Updated', `User "${userName}" role has been successfully changed to ${newRole}.`);
        setShowRoleChangeModal(null);
      } else {
        showError('Role Change Failed', res.error || 'Failed to change user role');
      }
    } catch {
      showError('Role Change Failed', 'Unexpected error while changing role');
    } finally {
      setConfirmingRole(false);
    }
  };

  const RoleDropdown: React.FC<{ user: User; onSelect: (r: Role) => void; loading?: boolean }> = ({
  user,
  onSelect,
  loading,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const roleColor = (r: Role) => 
    r === 'Admin' ? 'text-purple-600 border-purple-600' : 
    r === 'Lead' ? 'text-blue-600 border-blue-600' : 
    'text-emerald-600 border-emerald-600';
  
  const roles: Role[] = ['HR', 'Lead', 'Admin'];

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-28 flex items-center justify-between px-3 py-1.5 text-sm border rounded bg-white hover:bg-slate-50 ${roleColor(user.role)}`}
        title="Change role"
      >
        <span>{user.role}</span>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-28 bg-white border border-slate-200 rounded shadow-lg z-50">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => {
                setOpen(false);
                if (r !== user.role) onSelect(r);
              }}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 ${
                r === user.role ? 'font-semibold' : ''
              } text-gray-900`}
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};


  // show loading while the whole users list is being fetched
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-slate-400 to-blue-400 text-white rounded-lg hover:from-slate-500 hover:to-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Create User</span>
        </button>
      </div>

      {/* Controls: no background card, search + filter same height */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-blue-200 h-9"
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as 'All' | Role)}
            className="text-sm border border-slate-200 rounded px-2 py-2 focus:ring-1 focus:ring-blue-200 h-9"
            aria-label="Filter by role"
          >
            <option value="All">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Lead">Lead</option>
            <option value="HR">HR</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-visible relative">
        <table className="w-full text-sm relative">
          <thead className="bg-slate-50">
            <tr>
              {['name', 'email', 'role'].map((col) => (
                <th
                  key={col}
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase cursor-pointer select-none hover:text-blue-600"
                  onClick={() => handleSort(col as keyof User)}
                >
                  <div className="flex items-center gap-1">
                    {col === 'name' && 'Name'}
                    {col === 'email' && 'Email'}
                    {col === 'role' && 'Role'}
                    {sortConfig?.key === col ? (
                      sortConfig.direction === 'asc' ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                </th>
              ))}
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-slate-100">
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-6 text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  {/* Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={
                          user.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=ddd`
                        }
                        alt={user.name}
                        className="w-9 h-9 rounded-full object-cover border"
                      />
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate text-sm">{user.name}</div>
                      </div>
                    </div>
                  </td>

                  {/* Email (separate column) */}
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-600 truncate">{user.email}</div>
                  </td>

                  {/* Role (custom dropdown that opens role-change modal) */}
                  <td className="px-4 py-3">
                    <RoleDropdown
                      user={user}
                      // selecting a new role opens the confirm modal (original flow)
                      onSelect={(r) => handleRoleChange(user.id, r)}
                      loading={updatingRoleFor === user.id}
                    />
                  </td>

                  {/* Actions (only icons, aligned right) */}
                  <td className="px-4 py-3 text-right">
                    {user.id !== currentUser?.id ? (
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 border border-rose-200 text-rose-500 rounded text-sm hover:bg-rose-50"
                        title="Delete user"
                        aria-label={`Delete ${user.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <div className="flex items-center justify-end gap-1 text-blue-600 text-sm">
                        <Shield className="h-4 w-4" /> You
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination (right aligned, no "/page" text) */}
      {filteredUsers.length > 0 && (
        <div className="flex items-center justify-end gap-3">
          <select
            value={perPage}
            onChange={(e) => {
              const v = e.target.value;
              setPerPage(v === 'All' ? 'All' : parseInt(v, 10));
            }}
            className="text-sm border border-slate-300 rounded px-2 py-1"
            aria-label="Rows per page"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="All">All</option>
          </select>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 border border-slate-300 rounded disabled:opacity-50"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1 text-sm text-gray-600">
              {(() =>
                Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`px-2 py-1 border rounded ${page === i + 1 ? 'bg-slate-100 border-slate-300' : 'border-slate-200'}`}
                  >
                    {i + 1}
                  </button>
                )))()}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 border border-slate-300 rounded disabled:opacity-50"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="text-sm text-gray-600">
            {perPage === 'All'
              ? `Showing ${filteredUsers.length}`
              : `Showing ${(page - 1) * (perPage as number) + 1}-${Math.min(page * (perPage as number), filteredUsers.length)}`}
          </div>
        </div>
      )}

      {/* Create User Modal (original form submit pattern, uses createUser(email, name, role)) */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Create New User</h3>
              <button onClick={() => setShowCreateForm(false)} className="p-2 hover:bg-slate-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                >
                  <option value="HR">HR</option>
                  <option value="Lead">Lead</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Default Password:</p>
                <p className="font-mono text-sm font-medium text-gray-900">{formData.role.toLowerCase()}1234</p>
                <p className="text-xs text-gray-500 mt-1">User can change this password after first login</p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-slate-400 to-blue-400 text-white rounded-lg hover:from-slate-500 hover:to-blue-500 transition-colors"
                >
                  {creatingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>{creatingUser ? 'Creating...' : 'Create User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credentials Display Modal */}
      {showCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-300 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">User Created Successfully!</h3>
              <p className="text-gray-600 mb-6">Share these credentials with the new user:</p>

              <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-left">
                <div>
                  <span className="text-sm text-gray-600">Email:</span>
                  <p className="font-mono text-sm font-medium text-gray-900">{showCredentials.email}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Password:</span>
                  <p className="font-mono text-sm font-medium text-gray-900">{showCredentials.password}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Role:</span>
                  <p className="font-mono text-sm font-medium text-gray-900">{showCredentials.role}</p>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-4 mb-6">The user should change their password after first login</p>

              <button
                onClick={() => setShowCredentials(null)}
                className="px-6 py-2 bg-gradient-to-r from-slate-400 to-blue-400 text-white rounded-lg hover:from-slate-500 hover:to-blue-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Confirmation Modal (original) */}
      {showRoleChangeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded flex items-center justify-center">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Change User Role</h3>
              </div>
              <button onClick={() => setShowRoleChangeModal(null)} className="p-2 hover:bg-slate-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">!</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-700 mb-1">Security Notice</h4>
                    <p className="text-sm text-blue-600">
                      Changing user roles affects their access permissions throughout the system. This action will be logged.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-sm text-gray-600">User:</span>
                <p className="font-medium text-gray-900">{showRoleChangeModal.userName}</p>
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <span className="text-sm text-gray-600">Current Role:</span>
                  <p className="font-medium text-gray-900">{showRoleChangeModal.currentRole}</p>
                </div>
                <div className="text-gray-400">→</div>
                <div>
                  <span className="text-sm text-gray-600">New Role:</span>
                  <p className="font-medium text-gray-900">{showRoleChangeModal.newRole}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg text-xs text-gray-600">
                {showRoleChangeModal.newRole === 'Admin' && <p>• Full system access, can manage users, employees, and all data</p>}
                {showRoleChangeModal.newRole === 'Lead' && <p>• Can manage employees and projects, view financial data</p>}
                {showRoleChangeModal.newRole === 'HR' && <p>• Can view and edit employees, access reports</p>}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowRoleChangeModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRoleChange}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  disabled={confirmingRole}
                >
                  {confirmingRole ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                  <span>{confirmingRole ? 'Updating...' : 'Confirm Role Change'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
