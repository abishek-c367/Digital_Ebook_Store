import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, ChevronDown, BookOpen, Check, Shield, Smartphone,
  Clock, Mail, CreditCard, Lock,
} from 'lucide-react';
import { SEO } from '@/components/SEO';
import { BookCover } from '@/components/BookCover';
import { BookDetailSkeleton } from '@/components/Skeletons';
import { fetchBookBySlug, formatPrice, formatDate, isFreeBook } from '@/lib/books';
import { buildRazorpayCheckoutUrl } from '@/lib/payment';
import { checkUserOwnsBook } from '@/lib/userLibrary';
import { useAuth } from '@/lib/AuthContext';
import type { Book } from '@/types';

export function BookDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, profile } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [owns, setOwns] = useState(false);
  const [checkingOwnership, setCheckingOwnership] = useState(false);
  const [expandedTOC, setExpandedTOC] = useState<number | null>(0);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchBookBySlug(slug)
      .then((data) => {
        setBook(data);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!user || !book || isFreeBook(book)) {
      setOwns(false);
      return;
    }
    setCheckingOwnership(true);
    checkUserOwnsBook(book.id)
      .then(setOwns)
      .finally(() => setCheckingOwnership(false));
  }, [user, book]);

  if (loading) {
    return (
      <>
        <SEO title="Loading..." />
        <BookDetailSkeleton />
      </>
    );
  }

  if (!book) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-32 text-center">
        <SEO title="Book Not Found" />
        <BookOpen className="mx-auto h-12 w-12 text-ink-300" strokeWidth={1} />
        <h1 className="mt-4 font-serif text-3xl text-ink-900">Book not found</h1>
        <p className="mt-2 text-ink-600">The book you're looking for doesn't exist or has been removed.</p>
        <Link to="/books" className="btn-primary mt-6">Browse All Books</Link>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={book.title}
        description={book.description}
        image={book.cover_url || undefined}
        type="book"
        url={`/books/${book.slug}`}
      />

      {/* Breadcrumb */}
      <div className="border-b border-ink-200/60 bg-ink-50">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/books" className="inline-flex items-center gap-1.5 text-sm tracking-editorial text-ink-500 transition-colors hover:text-ink-900">
            <ArrowLeft className="h-4 w-4" />
            Back to Books
          </Link>
        </div>
      </div>

      {/* Hero section */}
      <section className="bg-ink-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Left: Cover */}
            <div className="flex justify-center lg:justify-start animate-fade-in">
              <div className="w-64 sm:w-72 lg:w-80">
                <BookCover coverUrl={book.cover_url} title={book.title} size="xl" className="!w-full" />
              </div>
            </div>

            {/* Right: Details */}
            <div className="flex flex-col animate-fade-in-up">
              {book.category && (
                <Link
                  to={`/books?category=${book.category.slug}`}
                  className="eyebrow hover:text-gold-700"
                >
                  {book.category.name}
                </Link>
              )}
              <h1 className="mt-2 font-serif text-4xl font-light leading-tight text-ink-900 sm:text-5xl text-balance">
                {book.title}
              </h1>
              {book.subtitle && (
                <p className="mt-3 font-serif text-xl text-ink-600">{book.subtitle}</p>
              )}
              <p className="mt-2 text-sm tracking-editorial text-ink-500">by {book.author}</p>

              <p className="mt-6 font-serif text-lg leading-relaxed text-ink-700">
                {book.description}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <span className="font-serif text-3xl text-ink-900">
                  {isFreeBook(book) ? 'Free' : formatPrice(book.price_cents, book.currency)}
                </span>

                {!user && (
                  <>
                    <Link to="/signup" className="btn-primary">
                      {isFreeBook(book) ? 'Sign Up to Read Free' : 'Sign Up to Buy'}
                    </Link>
                    <Link to="/login" className="btn-secondary">
                      Sign In
                    </Link>
                  </>
                )}

                {user && isFreeBook(book) && (
                  <Link to={`/read/session:${book.id}`} className="btn-primary">
                    <BookOpen className="h-4 w-4" />
                    Read Now
                  </Link>
                )}

                {user && !isFreeBook(book) && checkingOwnership && (
                  <span className="text-sm text-ink-500">Checking your library...</span>
                )}

                {user && !isFreeBook(book) && !checkingOwnership && owns && (
                  <Link to={`/read/session:${book.id}`} className="btn-primary">
                    <BookOpen className="h-4 w-4" />
                    Read Now
                  </Link>
                )}

                {user && !isFreeBook(book) && !checkingOwnership && !owns && (
                  book.razorpay_payment_link ? (
                    <a
                      href={buildRazorpayCheckoutUrl(book, profile?.email || user.email, profile?.name) ?? '#'}
                      className="btn-primary"
                    >
                      <CreditCard className="h-4 w-4" />
                      Buy Book — {formatPrice(book.price_cents, book.currency)}
                    </a>
                  ) : (
                    <span className="flex items-center gap-2 text-sm text-ink-500">
                      <Lock className="h-4 w-4" />
                      Not available for purchase yet — check back soon.
                    </span>
                  )
                )}
              </div>

              {user && isFreeBook(book) && (
                <p className="mt-3 text-sm text-accent-600">
                  You have free access to this book with your account.
                </p>
              )}
              {user && !isFreeBook(book) && owns && (
                <p className="mt-3 text-sm text-accent-600">
                  You own this book — read it anytime from your library.
                </p>
              )}
              {user && !isFreeBook(book) && !owns && !checkingOwnership && (
                <p className="mt-3 text-sm text-ink-500">
                  Purchase this book to unlock the full reading experience. You'll get instant access after payment.
                </p>
              )}

              {/* Quick info */}
              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-ink-200 pt-6 sm:grid-cols-4">
                <div>
                  <dt className="text-xs uppercase tracking-editorial text-ink-500">Pages</dt>
                  <dd className="mt-1 text-sm text-ink-900">{book.pages || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-editorial text-ink-500">Language</dt>
                  <dd className="mt-1 text-sm text-ink-900">{book.language}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-editorial text-ink-500">Published</dt>
                  <dd className="mt-1 text-sm text-ink-900">{formatDate(book.publication_date)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-editorial text-ink-500">Format</dt>
                  <dd className="mt-1 text-sm text-ink-900">{book.format}</dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About the Book */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="section-heading">About the Book</h2>
          <div className="mt-6 space-y-4 font-serif text-lg leading-relaxed text-ink-700">
            {book.long_description?.split('\n').map((para, i) => (
              <p key={i}>{para}</p>
            )) || <p>{book.description}</p>}
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      {book.what_you_learn && book.what_you_learn.length > 0 && (
        <section className="bg-ink-50 py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="section-heading">What You'll Learn</h2>
            <ul className="mt-8 space-y-4">
              {book.what_you_learn.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent-100">
                    <Check className="h-3 w-3 text-accent-700" strokeWidth={2} />
                  </div>
                  <span className="font-serif text-lg text-ink-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Who This Book Is For */}
      {book.who_for && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="section-heading">Who This Book Is For</h2>
            <p className="mt-6 font-serif text-lg leading-relaxed text-ink-700">{book.who_for}</p>
          </div>
        </section>
      )}

      {/* Table of Contents */}
      {book.table_of_contents && book.table_of_contents.length > 0 && (
        <section className="bg-ink-50 py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="section-heading">Table of Contents</h2>
            <div className="mt-8 space-y-2">
              {book.table_of_contents.map((chapter, i) => (
                <div key={i} className="overflow-hidden rounded-lg border border-ink-200 bg-white">
                  <button
                    onClick={() => setExpandedTOC(expandedTOC === i ? null : i)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-ink-50"
                  >
                    <span className="flex items-center gap-3">
                      <span className="font-serif text-sm text-gold-600">{String(i + 1).padStart(2, '0')}</span>
                      <span className="font-serif text-lg text-ink-900">{chapter.title}</span>
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 flex-shrink-0 text-ink-400 transition-transform duration-300 ${
                        expandedTOC === i ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {expandedTOC === i && chapter.sections && (
                    <div className="border-t border-ink-100 px-5 py-3 animate-fade-in">
                      <ul className="space-y-2 pl-8">
                        {chapter.sections.map((section, j) => (
                          <li key={j} className="text-sm text-ink-600">{section}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About the Author */}
      {book.author_bio && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="section-heading">About the Author</h2>
            <p className="mt-6 font-serif text-lg leading-relaxed text-ink-700">{book.author_bio}</p>
          </div>
        </section>
      )}

      {/* FAQs */}
      {book.faqs && book.faqs.length > 0 && (
        <section className="bg-ink-50 py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="section-heading">Frequently Asked Questions</h2>
            <div className="mt-8 space-y-3">
              {book.faqs.map((faq, i) => (
                <div key={i} className="overflow-hidden rounded-lg border border-ink-200 bg-white">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === i ? null : i)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-ink-50"
                  >
                    <span className="font-serif text-lg text-ink-900">{faq.question}</span>
                    <ChevronDown
                      className={`h-5 w-5 flex-shrink-0 text-ink-400 transition-transform duration-300 ${
                        expandedFAQ === i ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {expandedFAQ === i && (
                    <div className="border-t border-ink-100 px-5 py-4 animate-fade-in">
                      <p className="text-sm leading-relaxed text-ink-600">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust badges */}
      <section className="bg-white py-12 border-t border-ink-200/60">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center text-center">
              <Shield className="h-6 w-6 text-accent-600" strokeWidth={1.5} />
              <span className="mt-2 text-xs tracking-editorial text-ink-600">Protected Reading</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Smartphone className="h-6 w-6 text-accent-600" strokeWidth={1.5} />
              <span className="mt-2 text-xs tracking-editorial text-ink-600">Mobile Friendly</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Clock className="h-6 w-6 text-accent-600" strokeWidth={1.5} />
              <span className="mt-2 text-xs tracking-editorial text-ink-600">Lifetime Access</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Mail className="h-6 w-6 text-accent-600" strokeWidth={1.5} />
              <span className="mt-2 text-xs tracking-editorial text-ink-600">Instant Access Link</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      {!user && (
        <section className="bg-ink-900 py-16">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="font-serif text-3xl font-light text-ink-50">Ready to start reading?</h2>
            <p className="mt-3 font-serif text-lg text-ink-300">
              {isFreeBook(book) ? 'Create a free account to read this book instantly.' : 'Create a free account, then buy this book to unlock it.'}
            </p>
            <Link to="/signup" className="btn-gold mt-6">
              Sign Up Free
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
