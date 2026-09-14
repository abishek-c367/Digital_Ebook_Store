import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Library as LibraryIcon, ArrowRight, Clock } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { BookCover } from '@/components/BookCover';
import { fetchBooks, formatDate } from '@/lib/books';
import { fetchReadingProgress } from '@/lib/userLibrary';
import { useAuth } from '@/lib/AuthContext';
import type { Book, ReadingProgress } from '@/types';

interface LibraryItem {
  book: Book;
  progress: ReadingProgress | null;
}

export function LibraryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooks()
      .then(async (books) => {
        const enriched = await Promise.all(
          books.map(async (book) => {
            const progress = await fetchReadingProgress(book.id);
            return { book, progress };
          })
        );
        setItems(enriched);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-ink-900" />
      </div>
    );
  }

  return (
    <>
      <SEO title="My Library — Folio" />

      <section className="border-b border-ink-200/60 bg-ink-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <LibraryIcon className="h-7 w-7 text-ink-900" strokeWidth={1.5} />
            <div>
              <h1 className="font-serif text-4xl font-light text-ink-900">My Library</h1>
              <p className="mt-1 text-sm text-ink-600">
                {items.length} {items.length === 1 ? 'book' : 'books'} available to read
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ink-100">
              <BookOpen className="h-10 w-10 text-ink-400" strokeWidth={1} />
            </div>
            <h2 className="mt-6 font-serif text-2xl font-light text-ink-900">No books available yet</h2>
            <p className="mt-2 max-w-sm text-sm text-ink-600">
              There are no published books in the library yet. Check back soon.
            </p>
            <Link to="/books" className="btn-primary mt-6">
              Browse Books
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <div
                key={item.book.id}
                className="flex gap-5 rounded-xl border border-ink-200 bg-white p-5 transition-shadow duration-300 hover:shadow-elegant animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <Link to={`/books/${item.book.slug}`} className="flex-shrink-0">
                  <BookCover coverUrl={item.book.cover_url} title={item.book.title} size="sm" />
                </Link>
                <div className="flex flex-1 flex-col">
                  <Link to={`/books/${item.book.slug}`}>
                    <h3 className="font-serif text-lg leading-tight text-ink-900 transition-colors hover:text-ink-700">
                      {item.book.title}
                    </h3>
                  </Link>
                  <p className="mt-1 text-xs text-ink-500">{item.book.author}</p>

                  <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-500">
                    <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Added {formatDate(item.book.created_at)}
                  </div>

                  {item.progress && item.progress.progress_percentage > 0 ? (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-ink-500">
                        <span>{Math.round(item.progress.progress_percentage)}% read</span>
                        <span>Page {item.progress.current_page}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100">
                        <div
                          className="h-full rounded-full bg-accent-500 transition-all"
                          style={{ width: `${item.progress.progress_percentage}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-ink-500">Not started yet</p>
                  )}

                  <div className="mt-auto pt-4">
                    <Link to={`/read/session:${item.book.id}`} className="btn-primary w-full !py-2 text-xs">
                      {item.progress && item.progress.progress_percentage > 0 ? 'Continue Reading' : 'Start Reading'}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
