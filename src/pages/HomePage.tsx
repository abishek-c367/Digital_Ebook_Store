import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Shield, Sparkles } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { BookCard } from '@/components/BookCard';
import { BookGridSkeleton } from '@/components/Skeletons';
import { fetchBooks, fetchCategories } from '@/lib/books';
import type { Book, Category } from '@/types';

export function HomePage() {
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchBooks({ featured: true }),
      fetchCategories(),
    ])
      .then(([books, cats]) => {
        setFeaturedBooks(books);
        setCategories(cats);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <SEO
        title="Folio — Premium Digital E-Books"
        description="Explore carefully crafted e-books designed to help you understand, learn, and think deeper. Protected online reading on AI, ML, programming, and more."
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-6 animate-fade-in-up">
              <span className="eyebrow">Premium Digital Publishing</span>
              <h1 className="mt-4 font-serif text-5xl font-light leading-[1.1] text-ink-900 sm:text-6xl lg:text-7xl text-balance">
                Ideas Worth Reading.
              </h1>
              <p className="mt-6 max-w-xl font-serif text-xl leading-relaxed text-ink-600">
                Explore carefully crafted e-books designed to help you understand, learn, and think deeper.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/books" className="btn-primary group">
                  Explore Books
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link to="/about" className="btn-secondary">About the Author</Link>
              </div>
              <div className="mt-10 flex items-center gap-6 text-sm text-ink-500">
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-accent-600" strokeWidth={1.5} />
                  Protected Reading
                </span>
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-gold-500" strokeWidth={1.5} />
                  Premium Quality
                </span>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative flex justify-center lg:justify-end animate-scale-in">
                {/* Decorative book stack */}
                <div className="relative flex gap-4">
                  {featuredBooks.slice(0, 3).map((book, i) => (
                    <div
                      key={book.id}
                      className="relative"
                      style={{
                        transform: `translateY(${i * 20}px) rotate(${(i - 1) * 3}deg)`,
                        zIndex: 3 - i,
                      }}
                    >
                      <div className="aspect-[2/3] w-44 overflow-hidden rounded-lg shadow-book hover:shadow-book-hover transition-shadow duration-500 sm:w-52 lg:w-56">
                        {book.cover_url ? (
                          <img src={book.cover_url} alt={book.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-ink-200">
                            <BookOpen className="h-12 w-12 text-ink-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Books */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <span className="eyebrow">Curated Selection</span>
              <h2 className="mt-2 section-heading">Featured Books</h2>
            </div>
            <Link to="/books" className="group hidden items-center gap-1.5 text-sm tracking-editorial text-ink-600 transition-colors hover:text-ink-900 sm:flex">
              View All
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {loading ? (
            <div className="mt-12">
              <BookGridSkeleton count={4} />
            </div>
          ) : (
            <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {featuredBooks.map((book, i) => (
                <div key={book.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                  <BookCard book={book} index={i} />
                </div>
              ))}
            </div>
          )}

          <div className="mt-10 text-center sm:hidden">
            <Link to="/books" className="btn-secondary">View All Books</Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-ink-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="eyebrow">Browse by Topic</span>
            <h2 className="mt-2 section-heading">Explore Categories</h2>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/books?category=${cat.slug}`}
                className="rounded-full border border-ink-200 bg-white px-5 py-2.5 text-sm tracking-editorial text-ink-700 transition-all duration-300 hover:border-ink-900 hover:bg-ink-900 hover:text-ink-50"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Value proposition */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <span className="eyebrow">Why Folio</span>
          <h2 className="mt-2 section-heading">A reading experience built for depth.</h2>
          <p className="mt-6 font-serif text-xl leading-relaxed text-ink-600">
            Every book on Folio is selected for its craftsmanship and intellectual rigor. Read anywhere, on any device, through our protected online reader — designed to preserve the integrity of the author's work.
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <div>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-50 text-accent-600">
                <Shield className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <h3 className="mt-4 font-serif text-lg text-ink-900">Protected Reading</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">Books are read through our secure online reader, never exposed as downloadable files.</p>
            </div>
            <div>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold-50 text-gold-600">
                <Sparkles className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <h3 className="mt-4 font-serif text-lg text-ink-900">Premium Quality</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">Each book is carefully crafted and curated for intellectual depth and clarity.</p>
            </div>
            <div>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-700">
                <BookOpen className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <h3 className="mt-4 font-serif text-lg text-ink-900">Read Anywhere</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">Our reader works beautifully on desktop, tablet, and mobile with a premium experience.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink-900 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl font-light text-ink-50 sm:text-4xl text-balance">
            Begin your reading journey today.
          </h2>
          <p className="mt-4 font-serif text-lg text-ink-300">
            Discover books that will change how you think.
          </p>
          <Link to="/books" className="btn-gold mt-8">
            Browse the Catalog
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
