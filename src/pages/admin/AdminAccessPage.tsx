import { useEffect, useState } from 'react';
import { Loader2, KeyRound, Ban, RefreshCw, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/books';
import { showToast } from '@/components/Toast';

interface AccessRow {
  id: string;
  email: string;
  book_id: string;
  expires_at: string | null;
  revoked: boolean;
  created_at: string;
  book: { title: string }[] | null;
  purchase: { email: string }[] | null;
}

export function AdminAccessPage() {
  const [tokens, setTokens] = useState<AccessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadTokens = () => {
    setLoading(true);
    supabase
      .from('access_tokens')
      .select('id, email, book_id, expires_at, revoked, created_at, book:books(title), purchase:purchases(email)')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!error && data) {
          setTokens(data as unknown as AccessRow[]);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    loadTokens();
  }, []);

  const handleRevoke = async (token: AccessRow) => {
    setActionLoading(token.id);
    const { error } = await supabase
      .from('access_tokens')
      .update({ revoked: true })
      .eq('id', token.id);
    if (error) {
      showToast('error', 'Failed to revoke access.');
    } else {
      showToast('success', 'Access revoked.');
      loadTokens();
    }
    setActionLoading(null);
  };

  const handleRestore = async (token: AccessRow) => {
    setActionLoading(token.id);
    const { error } = await supabase
      .from('access_tokens')
      .update({ revoked: false })
      .eq('id', token.id);
    if (error) {
      showToast('error', 'Failed to restore access.');
    } else {
      showToast('success', 'Access restored.');
      loadTokens();
    }
    setActionLoading(null);
  };

  return (
    <div>
      <h1 className="font-serif text-3xl font-light text-ink-900">Access Management</h1>
      <p className="mt-1 text-sm text-ink-600">Manage reading access tokens. Revoke or restore access as needed.</p>

      {loading ? (
        <div className="mt-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-ink-400" />
        </div>
      ) : tokens.length === 0 ? (
        <div className="mt-8 rounded-xl border border-ink-200 bg-white py-16 text-center">
          <KeyRound className="mx-auto h-10 w-10 text-ink-300" strokeWidth={1} />
          <p className="mt-3 text-sm text-ink-500">No access tokens issued yet.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-ink-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-editorial text-ink-500">
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Book</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Expires</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token) => {
                const isExpired = token.expires_at && new Date(token.expires_at) < new Date();
                return (
                  <tr key={token.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/50">
                    <td className="px-4 py-3 text-ink-700">{token.email}</td>
                    <td className="px-4 py-3 text-ink-700">{token.book?.[0]?.title || '—'}</td>
                    <td className="px-4 py-3">
                      {token.revoked ? (
                        <span className="inline-flex rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">Revoked</span>
                      ) : isExpired ? (
                        <span className="inline-flex rounded-full bg-gold-50 px-2.5 py-0.5 text-xs font-medium text-gold-700">Expired</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-medium text-accent-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-500">{token.expires_at ? formatDate(token.expires_at) : 'Never'}</td>
                    <td className="px-4 py-3 text-ink-500">{formatDate(token.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        {token.revoked ? (
                          <button
                            onClick={() => handleRestore(token)}
                            disabled={actionLoading === token.id}
                            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-accent-600 transition-colors hover:bg-accent-50"
                          >
                            {actionLoading === token.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                            Restore
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRevoke(token)}
                            disabled={actionLoading === token.id}
                            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-red-600 transition-colors hover:bg-red-50"
                          >
                            {actionLoading === token.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Ban className="h-3.5 w-3.5" />
                            )}
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
