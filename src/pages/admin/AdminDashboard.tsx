import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, BookOpen, ShoppingCart, Users, TrendingUp, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatDate } from '@/lib/books';

interface DashboardStats {
  totalRevenue: number;
  totalSales: number;
  totalBooks: number;
  totalCustomers: number;
  recentPurchases: Array<{
    id: string;
    email: string;
    amount_cents: number;
    status: string;
    purchased_at: string | null;
    book: { title: string }[] | null;
  }>;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalSales: 0,
    totalBooks: 0,
    totalCustomers: 0,
    recentPurchases: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('purchases').select('amount_cents, status').eq('status', 'completed'),
      supabase.from('books').select('id', { count: 'exact', head: true }),
      supabase.from('purchases')
        .select('id, email, amount_cents, status, purchased_at, book:books(title)')
        .order('created_at', { ascending: false })
        .limit(10),
    ]).then(([revenueRes, booksRes, recentRes]) => {
      const completedPurchases = (revenueRes.data as Array<{ amount_cents: number; status: string; email: string }>) || [];
      const revenue = completedPurchases.reduce((sum, p) => sum + p.amount_cents, 0);
      const uniqueEmails = new Set(completedPurchases.map((p) => p.email));

      setStats({
        totalRevenue: revenue,
        totalSales: completedPurchases.length,
        totalBooks: booksRes.count || 0,
        totalCustomers: uniqueEmails.size,
        recentPurchases: (recentRes.data as DashboardStats['recentPurchases']) || [],
      });
      setLoading(false);
    });
  }, []);

  const statCards = [
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: DollarSign, color: 'text-accent-600', bg: 'bg-accent-50' },
    { label: 'Books Sold', value: stats.totalSales.toString(), icon: ShoppingCart, color: 'text-gold-600', bg: 'bg-gold-50' },
    { label: 'Total Books', value: stats.totalBooks.toString(), icon: BookOpen, color: 'text-ink-700', bg: 'bg-ink-100' },
    { label: 'Customers', value: stats.totalCustomers.toString(), icon: Users, color: 'text-accent-600', bg: 'bg-accent-50' },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl font-light text-ink-900">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-600">Overview of your publishing platform.</p>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-ink-200 bg-white p-5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <p className="mt-3 text-xs uppercase tracking-editorial text-ink-500">{stat.label}</p>
            <p className="mt-1 font-serif text-2xl text-ink-900">
              {loading ? '—' : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent purchases */}
      <div className="mt-8 rounded-xl border border-ink-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-ink-900">Recent Purchases</h2>
          <Link to="/admin/orders" className="flex items-center gap-1 text-sm text-ink-600 transition-colors hover:text-ink-900">
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {stats.recentPurchases.length === 0 ? (
          <div className="mt-6 text-center py-8">
            <TrendingUp className="mx-auto h-8 w-8 text-ink-300" strokeWidth={1} />
            <p className="mt-2 text-sm text-ink-500">No purchases yet.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-editorial text-ink-500">
                  <th className="pb-3 pr-4 font-medium">Customer</th>
                  <th className="pb-3 pr-4 font-medium">Book</th>
                  <th className="pb-3 pr-4 font-medium">Amount</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPurchases.map((purchase) => (
                  <tr key={purchase.id} className="border-b border-ink-50 last:border-0">
                    <td className="py-3 pr-4 text-ink-700">{purchase.email}</td>
                    <td className="py-3 pr-4 text-ink-700">{purchase.book?.[0]?.title || '—'}</td>
                    <td className="py-3 pr-4 text-ink-700">{formatPrice(purchase.amount_cents)}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        purchase.status === 'completed'
                          ? 'bg-accent-50 text-accent-700'
                          : purchase.status === 'pending'
                          ? 'bg-gold-50 text-gold-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {purchase.status}
                      </span>
                    </td>
                    <td className="py-3 text-ink-500">{formatDate(purchase.purchased_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
