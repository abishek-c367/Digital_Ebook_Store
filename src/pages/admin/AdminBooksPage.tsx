import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye, EyeOff, BookOpen, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatDate, isFreeBook } from '@/lib/books';
import { showToast } from '@/components/Toast';
import type { Book } from '@/types';

export function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadBooks = () => {
    setLoading(true);
    supabase
      .from('books')
      .select('*, category:categories(*)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          showToast('error', 'Failed to load books.');
          return;
        }
        setBooks(data as Book[]);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const togglePublish = async (book: Book) => {
    const { error } = await supabase
      .from('books')
      .update({ published: !book.published })
      .eq('id', book.id);
    if (error) {
      showToast('error', 'Failed to update book.');
    } else {
      showToast('success', book.published ? 'Book unpublished.' : 'Book published.');
      loadBooks();
    }
  };

  const handleDelete = async (book: Book) => {
    if (!confirm(`Delete "${book.title}"? This cannot be undone.`)) return;
    setDeleting(book.id);
    const { error } = await supabase.from('books').delete().eq('id', book.id);
    if (error) {
      showToast('error', 'Failed to delete book.');
    } else {
      showToast('success', 'Book deleted.');
      loadBooks();
    }
    setDeleting(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-light text-ink-900">Books</h1>
          <p className="mt-1 text-sm text-ink-600">Manage your book catalog.</p>
        </div>
        <Link to="/admin/books/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          Add Book
        </Link>
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-ink-400" />
        </div>
      ) : books.length === 0 ? (
        <div className="mt-12 rounded-xl border border-ink-200 bg-white py-16 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-ink-300" strokeWidth={1} />
          <p className="mt-3 text-sm text-ink-500">No books yet. Click "Add Book" to create your first one.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-ink-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-editorial text-ink-500">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {book.cover_url && (
                        <img src={book.cover_url} alt="" className="h-12 w-8 rounded object-cover" />
                      )}
                      <div>
                        <p className="font-medium text-ink-900">{book.title}</p>
                        <p className="text-xs text-ink-500">{book.author}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{book.category?.name || '—'}</td>
                  <td className="px-4 py-3 text-ink-700">
                    {isFreeBook(book) ? (
                      <span className="inline-flex rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-700">Free</span>
                    ) : (
                      formatPrice(book.price_cents, book.currency)
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      book.published ? 'bg-accent-50 text-accent-700' : 'bg-ink-100 text-ink-500'
                    }`}>
                      {book.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-500">{formatDate(book.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => togglePublish(book)}
                        className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900"
                        title={book.published ? 'Unpublish' : 'Publish'}
                      >
                        {book.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <Link
                        to={`/admin/books/${book.id}/edit`}
                        className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(book)}
                        disabled={deleting === book.id}
                        className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                        title="Delete"
                      >
                        {deleting === book.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
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
  );
}
