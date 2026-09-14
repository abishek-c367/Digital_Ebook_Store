import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatDate } from '@/lib/books';

interface PurchaseRow {
  id: string;
  email: string;
  amount_cents: number;
  currency: string;
  status: string;
  payment_provider: string;
  purchased_at: string | null;
  book: { title: string }[] | null;
}

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<PurchaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    let query = supabase
      .from('purchases')
      .select('id, email, amount_cents, currency, status, payment_provider, purchased_at, book:books(title)')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    query.then(({ data, error }) => {
      if (!error && data) {
        setOrders(data as unknown as PurchaseRow[]);
      }
      setLoading(false);
    });
  }, [filter]);

  return (
    <div>
      <h1 className="font-serif text-3xl font-light text-ink-900">Orders</h1>
      <p className="mt-1 text-sm text-ink-600">View all purchase transactions.</p>

      <div className="mt-6 flex gap-2">
        {['all', 'completed', 'pending', 'failed', 'refunded'].map((status) => (
          <button
            key={status}
            onClick={() => { setFilter(status); setLoading(true); }}
            className={`rounded-full px-4 py-2 text-xs capitalize tracking-editorial transition-all ${
              filter === status
                ? 'bg-ink-900 text-ink-50'
                : 'border border-ink-200 bg-white text-ink-600 hover:border-ink-400'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-ink-400" />
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-8 rounded-xl border border-ink-200 bg-white py-16 text-center">
          <p className="text-sm text-ink-500">No orders found.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-ink-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-editorial text-ink-500">
                <th className="px-4 py-3 font-medium">Order ID</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Book</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Provider</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-ink-500">{order.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-ink-700">{order.email}</td>
                  <td className="px-4 py-3 text-ink-700">{order.book?.[0]?.title || '—'}</td>
                  <td className="px-4 py-3 text-ink-700">{formatPrice(order.amount_cents, order.currency)}</td>
                  <td className="px-4 py-3 text-ink-500 capitalize">{order.payment_provider}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      order.status === 'completed' ? 'bg-accent-50 text-accent-700'
                      : order.status === 'pending' ? 'bg-gold-50 text-gold-700'
                      : order.status === 'refunded' ? 'bg-ink-100 text-ink-600'
                      : 'bg-red-50 text-red-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-500">{formatDate(order.purchased_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
