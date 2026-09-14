import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { BookCard } from '@/components/BookCard';
import { BookGridSkeleton } from '@/components/Skeletons';
import { fetchBooks, fetchCategories } from '@/lib/books';
import type { Book, Category } from '@/types';

type SortOption = 'newest' | 'oldest' | 'price-low' | 'price-high' | 'title';

export function BooksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');

  const activeCategory = searchParams.get('category') || 'all';
  const activeSort = (searchParams.get('sort') as SortOption) || 'newest';
  const activeSearch = searchParams.get('q') || '';

  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchBooks({
      category: activeCategory !== 'all' ? activeCategory : undefined,
      search: activeSearch || undefined,
      sort: activeSort,
    })
      .then(setBooks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeCategory, activeSort, activeSearch]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all' && value !== 'newest') {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('q', searchInput);
  };

  const featuredBooks = useMemo(() => books.filter((b) => b.featured), [books]);
  const allBooks = useMemo(() => books, [books]);

  return (
    <>
      <SEO
        title="All Books — Folio"
        description="Browse our complete catalog of premium e-books on AI, machine learning, programming, mathematics, science, and philosophy."
      />

      {/* Page header */}
      <section className="border-b border-ink-200/60 bg-ink-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <span className="eyebrow">Catalog</span>
          <h1 className="mt-2 font-serif text-4xl font-light text-ink-900 sm:text-5xl">All Books</h1>
          <p className="mt-3 max-w-2xl font-serif text-lg text-ink-600">
            Explore our growing collection of carefully crafted e-books.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Search + filters */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" strokeWidth={1.5} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search books..."
              className="input-field pl-10"
            />
          </form>

          <div className="flex items-center gap-3">
            <select
              value={activeCategory}
              onChange={(e) => updateParam('category', e.target.value)}
              className="rounded-lg border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 transition-all focus:border-ink-900 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>{cat.name}</option>
              ))}
            </select>

            <select
              value={activeSort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="rounded-lg border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 transition-all focus:border-ink-900 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="title">Title A–Z</option>
            </select>
          </div>
        </div>

        {/* Category pills */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => updateParam('category', 'all')}
            className={`rounded-full px-4 py-2 text-sm tracking-editorial transition-all ${
              activeCategory === 'all'
                ? 'bg-ink-900 text-ink-50'
                : 'border border-ink-200 bg-white text-ink-600 hover:border-ink-400'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateParam('category', cat.slug)}
              className={`rounded-full px-4 py-2 text-sm tracking-editorial transition-all ${
                activeCategory === cat.slug
                  ? 'bg-ink-900 text-ink-50'
                  : 'border border-ink-200 bg-white text-ink-600 hover:border-ink-400'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="mt-10">
            <BookGridSkeleton count={8} />
          </div>
        ) : allBooks.length === 0 ? (
          <div className="mt-20 text-center">
            <p className="font-serif text-2xl text-ink-700">No books found.</p>
            <p className="mt-2 text-sm text-ink-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            {featuredBooks.length > 0 && activeCategory === 'all' && !activeSearch && (
              <div className="mt-10">
                <h2 className="mb-6 font-serif text-2xl font-light text-ink-900">Featured</h2>
                <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
                  {featuredBooks.map((book, i) => (
                    <div key={book.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                      <BookCard book={book} index={i} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10">
              {featuredBooks.length > 0 && activeCategory === 'all' && !activeSearch && (
                <h2 className="mb-6 font-serif text-2xl font-light text-ink-900">All Books</h2>
              )}
              <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
                {allBooks.map((book, i) => (
                  <div key={book.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                    <BookCard book={book} index={i} />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
