"use client";

import { useEffect, useState, type FormEvent } from 'react';
import { Badge, surfaceCard } from '@/components/ui';

type User = {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
};

type SupabaseStatus = {
  configured: boolean;
  hasAnonKey: boolean;
  hasServiceRoleKey: boolean;
};

export function UserManagementPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Viewer');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [status, setStatus] = useState<SupabaseStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function fetchSettingsAndUsers() {
    try {
      setFetchLoading(true);
      // Fetch Supabase configuration status
      const configRes = await fetch('/api/settings/supabase');
      if (configRes.ok) {
        const configData = await configRes.json();
        setStatus(configData);
      }

      // Fetch users
      const usersRes = await fetch('/api/admin/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (usersData.ok) {
          setUsers(usersData.users);
        }
      }
    } catch (err) {
      console.error('Failed to load user management details', err);
    } finally {
      setFetchLoading(false);
    }
  }

  useEffect(() => {
    fetchSettingsAndUsers();
  }, []);

  function startEdit(user: User) {
    setEditingUser(user);
    setEmail(user.email);
    setFullName(user.full_name ?? '');
    setPhone(user.phone ?? '');
    setPassword('');
    setRole(user.role);
    setMessage('');
    setErrorMsg('');
  }

  function cancelEdit() {
    setEditingUser(null);
    setEmail('');
    setFullName('');
    setPhone('');
    setPassword('');
    setRole('Viewer');
    setMessage('');
    setErrorMsg('');
  }

  async function handleCreateOrUpdateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setErrorMsg('');

      if (!editingUser) {
      if (!email || !password || !role) {
        setErrorMsg('Email, password, and role are required.');
        setLoading(false);
        return;
      }
    } else {
      if (!role) {
        setErrorMsg('Role is required.');
        setLoading(false);
        return;
      }
    }

    try {
      const url = '/api/admin/users';
      const method = editingUser ? 'PATCH' : 'POST';
      const body = editingUser
          ? {
              userId: editingUser.user_id,
              full_name: fullName,
              phone,
              role,
              password: password || undefined,
            }
          : {
              email,
              password,
              full_name: fullName,
              phone,
              role,
            };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? `Unable to ${editingUser ? 'update' : 'create'} user.`);
      }

      setMessage(editingUser ? 'User updated successfully!' : `User created successfully! Role: ${role}`);
      cancelEdit();
      
      // Refresh user list
      fetchSettingsAndUsers();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : `Unable to ${editingUser ? 'update' : 'create'} user.`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    setLoading(true);
    setMessage('');
    setErrorMsg('');

    try {
      const response = await fetch(`/api/admin/users?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Unable to delete user.');
      }

      setMessage('User deleted successfully.');
      fetchSettingsAndUsers();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to delete user.');
    } finally {
      setLoading(false);
    }
  }

  const isSupabaseConfigured = status?.configured ?? false;
  const isServiceRoleKeyMissing = isSupabaseConfigured && !status?.hasServiceRoleKey;

  return (
    <div className={`p-5 ${surfaceCard} xl:col-span-2`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-text">User Management</h3>
          <p className="mt-1 text-sm text-muted">
            Create users, assign role-based permissions (Admin, Cost Controller, Project Manager, Viewer), and manage credentials.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge tone={isSupabaseConfigured ? 'accent' : 'default'}>
            {isSupabaseConfigured ? 'Supabase Auth' : 'Local DB Demo'}
          </Badge>
        </div>
      </div>

      {isServiceRoleKeyMissing && (
        <div className="mt-4 rounded-2xl border border-warning/20 bg-warning/5 p-4 text-xs text-warning leading-relaxed">
          <b className="text-text">Missing Admin Permissions:</b> Supabase connection is active, but the <b className="text-text">Service Role Key</b> has not been saved.
          Creating and listing auth users programmatically requires administrative authorization.
          Please enter the service role key in the connection panel above to unlock user management features.
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Create / Edit User Form */}
        <form onSubmit={handleCreateOrUpdateUser} className="space-y-4 rounded-2xl border border-white/5 bg-white/[0.01] p-5 lg:col-span-1">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-text">
            {editingUser ? 'Edit User' : 'Create User'}
          </h4>
          
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted">Full Name</span>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Abdullah Ahmed"
              className="w-full rounded-xl border border-line/70 bg-panel/70 px-4 py-2.5 text-sm text-text outline-none placeholder:text-muted/40 focus:border-accent/50"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted">Phone</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+966..."
              className="w-full rounded-xl border border-line/70 bg-panel/70 px-4 py-2.5 text-sm text-text outline-none placeholder:text-muted/40 focus:border-accent/50"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted">
              Email Address {editingUser ? '' : '*'}
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="abdullah@detasad.com"
              required={!editingUser}
              disabled={Boolean(editingUser)}
              className="w-full rounded-xl border border-line/70 bg-panel/70 px-4 py-2.5 text-sm text-text outline-none placeholder:text-muted/40 focus:border-accent/50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted">
              Password {editingUser ? '(leave blank to keep unchanged)' : '*'}
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={editingUser ? 'Leave blank to keep unchanged' : '••••••••'}
              required={!editingUser}
              className="w-full rounded-xl border border-line/70 bg-panel/70 px-4 py-2.5 text-sm text-text outline-none placeholder:text-muted/40 focus:border-accent/50"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted">Attached Role *</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-line/70 bg-panel/70 px-4 py-2.5 text-sm text-text outline-none focus:border-accent/50 [&>option]:bg-bg [&>option]:text-text"
            >
              <option value="Admin">Admin</option>
              <option value="Cost Controller">Cost Controller</option>
              <option value="Project Manager">Project Manager</option>
              <option value="Viewer">Viewer</option>
            </select>
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || (isSupabaseConfigured && isServiceRoleKeyMissing)}
              className="flex-1 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-bg transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (editingUser ? 'Saving...' : 'Creating...') : (editingUser ? 'Save Changes' : 'Create User')}
            </button>
            {editingUser && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-xl border border-line bg-panel px-4 py-3 text-sm font-semibold text-text transition hover:bg-white/[0.02]"
              >
                Cancel
              </button>
            )}
          </div>

          {message && <p className="text-center text-xs text-success bg-success/5 py-2 px-3 rounded-lg">{message}</p>}
          {errorMsg && <p className="text-center text-xs text-danger bg-danger/5 py-2 px-3 rounded-lg">{errorMsg}</p>}
        </form>

        {/* Users List Table */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-text">Active Users</h4>
          {fetchLoading ? (
            <div className="text-center py-10 text-sm text-muted">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted border border-dashed border-white/10 rounded-2xl">
              No users found. Create your first user on the left.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/[0.01]">
              <table className="w-full border-collapse text-left text-sm text-text">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-semibold uppercase tracking-wider text-muted">
                    <th className="px-4 py-3">User / Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Created At</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((user) => (
                    <tr key={user.user_id} className="transition hover:bg-white/[0.01]">
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-text">{user.full_name || 'No Name'}</div>
                        <div className="text-xs text-muted">{user.email}</div>
                        {user.phone ? <div className="text-xs text-muted">{user.phone}</div> : null}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          tone={
                            user.role === 'Admin'
                              ? 'accent'
                              : user.role === 'Cost Controller'
                                ? 'warning'
                                : user.role === 'Project Manager'
                                  ? 'success'
                                  : 'default'
                          }
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(user)}
                            disabled={loading}
                            className="rounded-lg border border-line bg-panel px-2.5 py-1.5 text-xs font-semibold text-text transition hover:bg-white/[0.02] disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user.user_id)}
                            disabled={loading}
                            className="rounded-lg border border-danger/20 bg-danger/5 px-2.5 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger/10 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
