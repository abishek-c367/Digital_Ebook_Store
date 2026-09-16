import { useEffect, useState } from 'react';
import { Loader2, UserPlus, Trash2, ShieldCheck, User, X, CreditCard } from 'lucide-react';
import { showToast } from '@/components/Toast';
import { useAuth } from '@/lib/AuthContext';
import {
  listAllUsers, createUserAccount, deleteUserAccount, setUserRole, type AdminUserRow,
} from '@/lib/adminUsers';
import { formatDate } from '@/lib/books';

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'paid' | 'admin'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'customer'>('customer');

  function load() {
    setLoading(true);
    listAllUsers()
      .then(setUsers)
      .catch((err) => showToast('error', err instanceof Error ? err.message : 'Failed to load users.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail || !newPassword) return;
    setCreating(true);
    try {
      await createUserAccount(newEmail, newPassword, newName, newRole);
      showToast('success', 'Account created.');
      setShowCreate(false);
      setNewEmail(''); setNewPassword(''); setNewName(''); setNewRole('customer');
      load();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to create account.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(u: AdminUserRow) {
    if (!confirm(`Remove ${u.email}'s account? This cannot be undone.`)) return;
    setPendingId(u.id);
    try {
      await deleteUserAccount(u.id);
      showToast('success', 'Account removed.');
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to remove account.');
    } finally {
      setPendingId(null);
    }
  }

  async function handleToggleRole(u: AdminUserRow) {
    const nextRole = u.role === 'admin' ? 'customer' : 'admin';
    setPendingId(u.id);
    try {
      await setUserRole(u.id, nextRole);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: nextRole } : x)));
      showToast('success', nextRole === 'admin' ? 'Granted admin access.' : 'Removed admin access.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to update role.');
    } finally {
      setPendingId(null);
    }
  }

  const filtered = users.filter((u) => {
    if (filter === 'paid') return u.is_paying_customer;
    if (filter === 'admin') return u.role === 'admin';
    return true;
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-light text-ink-900">Registered Users</h1>
          <p className="mt-1 text-sm text-ink-600">
            Every account signed up on the store, separate from the Customers page (which only shows buyers).
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <UserPlus className="h-4 w-4" />
          Add Account
        </button>
      </div>

      <div className="mt-6 flex gap-2">
        {(['all', 'paid', 'admin'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              filter === f ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
            }`}
          >
            {f === 'all' ? `All (${users.length})` : f === 'paid' ? `Paying customers (${users.filter((u) => u.is_paying_customer).length})` : `Admins (${users.filter((u) => u.role === 'admin').length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-ink-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border border-ink-200 bg-white py-16 text-center">
          <p className="text-sm text-ink-500">No accounts match this filter.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-ink-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-200 bg-ink-50 text-xs uppercase tracking-editorial text-ink-500">
              <tr>
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Last sign-in</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{u.name || u.email}</p>
                    <p className="text-xs text-ink-500">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.role === 'admin' ? 'bg-gold-50 text-gold-700' : 'bg-ink-100 text-ink-600'
                    }`}>
                      {u.role === 'admin' ? <ShieldCheck className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      {u.role === 'admin' ? 'Admin' : 'Customer'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.is_paying_customer ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-700">
                        <CreditCard className="h-3 w-3" /> Paid
                      </span>
                    ) : (
                      <span className="text-xs text-ink-400">Registered only</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-600">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3 text-ink-600">{u.last_sign_in_at ? formatDate(u.last_sign_in_at) : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleToggleRole(u)}
                        disabled={pendingId === u.id || u.id === currentUser?.id}
                        className="rounded-md border border-ink-200 px-2.5 py-1 text-xs text-ink-600 hover:bg-ink-50 disabled:opacity-40"
                        title={u.id === currentUser?.id ? "You can't change your own role" : undefined}
                      >
                        {u.role === 'admin' ? 'Revoke admin' : 'Make admin'}
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={pendingId === u.id || u.id === currentUser?.id}
                        className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-40"
                        title={u.id === currentUser?.id ? "You can't delete your own account" : 'Remove account'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-ink-900">Add Account</h2>
              <button onClick={() => setShowCreate(false)} className="text-ink-400 hover:text-ink-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="label-field">Name</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="label-field">Email *</label>
                <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="label-field">Password *</label>
                <input type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field" />
                <p className="mt-1 text-xs text-ink-500">At least 8 characters. Share this with the person separately.</p>
              </div>
              <div>
                <label className="label-field">Role</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value as 'admin' | 'customer')} className="input-field">
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
