import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import type { Book } from '@/types';
import { formatPrice, isFreeBook } from '@/lib/books';

interface BookCardProps {
  book: Book;
  index?: number;
}

export function BookCard({ book, index = 0 }: BookCardProps) {
  return (
    <Link
      to={`/books/${book.slug}`}
      className="group flex flex-col"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="relative overflow-hidden rounded-lg shadow-book transition-all duration-500 group-hover:shadow-book-hover group-hover:-translate-y-1">
        <div className="aspect-[2/3] bg-ink-200">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <BookOpen className="h-12 w-12 text-ink-400" />
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 transition-all duration-500 group-hover:opacity-100">
          <span className="inline-flex items-center rounded-md bg-ink-50/95 px-3 py-1.5 text-xs font-medium tracking-editorial text-ink-900">
            View Book
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <div className="flex items-center gap-2 text-xs tracking-editorial text-gold-600">
          {book.category && <span>{book.category.name}</span>}
        </div>
        <h3 className="mt-1.5 font-serif text-lg font-medium leading-tight text-ink-900 transition-colors group-hover:text-ink-700">
          {book.title}
        </h3>
        <p className="mt-1 text-sm text-ink-500">{book.author}</p>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-600">
          {book.description}
        </p>
        <div className="mt-3 flex items-center justify-between">
          {isFreeBook(book) ? (
            <span className="inline-flex rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-medium text-accent-700">Free</span>
          ) : (
            <span className="font-serif text-lg text-ink-900">{formatPrice(book.price_cents, book.currency)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
