import { useEffect, useState } from 'react';
import { Loader2, Mail, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDate, formatPrice } from '@/lib/books';

interface CustomerRow {
  email: string;
  purchase_count: number;
  total_spent: number;
  first_purchase: string;
  last_purchase: string;
  books: string[];
}

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('purchases')
      .select('email, amount_cents, status, purchased_at, created_at, book:books(title)')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error || !data) {
          setLoading(false);
          return;
        }

        const map = new Map<string, CustomerRow>();
        for (const p of data as Array<{ email: string; amount_cents: number; purchased_at: string; created_at: string; book: { title: string }[] | null }>) {
          const email = p.email;
          const existing = map.get(email);
          const date = p.purchased_at || p.created_at;
          const bookTitle = p.book?.[0]?.title;
          if (existing) {
            existing.purchase_count++;
            existing.total_spent += p.amount_cents;
            existing.first_purchase = date < existing.first_purchase ? date : existing.first_purchase;
            existing.last_purchase = date > existing.last_purchase ? date : existing.last_purchase;
            if (bookTitle && !existing.books.includes(bookTitle)) {
              existing.books.push(bookTitle);
            }
          } else {
            map.set(email, {
              email,
              purchase_count: 1,
              total_spent: p.amount_cents,
              first_purchase: date,
              last_purchase: date,
              books: bookTitle ? [bookTitle] : [],
            });
          }
        }
        setCustomers(Array.from(map.values()));
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1 className="font-serif text-3xl font-light text-ink-900">Customers</h1>
      <p className="mt-1 text-sm text-ink-600">View customers who have purchased books.</p>

      {loading ? (
        <div className="mt-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-ink-400" />
        </div>
      ) : customers.length === 0 ? (
        <div className="mt-8 rounded-xl border border-ink-200 bg-white py-16 text-center">
          <p className="text-sm text-ink-500">No customers yet.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer) => (
            <div key={customer.email} className="rounded-xl border border-ink-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-100">
                  <Mail className="h-5 w-5 text-ink-500" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">{customer.email}</p>
                  <p className="text-xs text-ink-500">{customer.purchase_count} {customer.purchase_count === 1 ? 'purchase' : 'purchases'}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-500">Total spent</span>
                  <span className="text-ink-900">{formatPrice(customer.total_spent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">First purchase</span>
                  <span className="text-ink-700">{formatDate(customer.first_purchase)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">Last purchase</span>
                  <span className="text-ink-700">{formatDate(customer.last_purchase)}</span>
                </div>
              </div>

              {customer.books.length > 0 && (
                <div className="mt-4 border-t border-ink-100 pt-3">
                  <p className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-editorial text-ink-500">
                    <BookOpen className="h-3.5 w-3.5" />
                    Purchased Books
                  </p>
                  <div className="space-y-1">
                    {customer.books.map((title, i) => (
                      <p key={i} className="text-xs text-ink-700">{title}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
