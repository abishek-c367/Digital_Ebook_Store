import { supabase } from './supabase';
import type { Book, Category } from '@/types';

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data as Category[];
}

export async function fetchBooks(filters?: {
  category?: string;
  search?: string;
  featured?: boolean;
  sort?: 'newest' | 'oldest' | 'price-low' | 'price-high' | 'title';
}): Promise<Book[]> {
  let query = supabase.from('books').select('*, category:categories(*)');

  query = query.eq('published', true);

  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category.slug', filters.category);
  }

  if (filters?.featured) {
    query = query.eq('featured', true);
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,author.ilike.%${filters.search}%`);
  }

  switch (filters?.sort) {
    case 'oldest':
      query = query.order('created_at', { ascending: true });
      break;
    case 'price-low':
      query = query.order('price_cents', { ascending: true });
      break;
    case 'price-high':
      query = query.order('price_cents', { ascending: false });
      break;
    case 'title':
      query = query.order('title', { ascending: true });
      break;
    default:
      query = query.order('sort_order', { ascending: true }).order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Book[];
}

export async function fetchBookBySlug(slug: string): Promise<Book | null> {
  const { data, error } = await supabase
    .from('books')
    .select('*, category:categories(*)')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();
  if (error) throw error;
  return data as Book | null;
}

export async function fetchBookById(id: string): Promise<Book | null> {
  const { data, error } = await supabase
    .from('books')
    .select('*, category:categories(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Book | null;
}

export function formatPrice(cents: number, currency: string = 'usd'): string {
  const symbol = currency === 'usd' ? '$' : currency === 'eur' ? '€' : currency === 'inr' ? '₹' : '£';
  return `${symbol}${(cents / 100).toFixed(2)}`;
}

export function isFreeBook(book: { price_cents: number }): boolean {
  return book.price_cents <= 0;
}

export function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
