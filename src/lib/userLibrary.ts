import { supabase } from './supabase';
import type { Purchase, ReadingProgress, Book } from '@/types';

export async function fetchUserPurchases(): Promise<(Purchase & { book: Book })[]> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return [];

  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', session.session.user.id)
    .maybeSingle();

  const userEmail = profile?.email || session.session.user.email;

  const { data, error } = await supabase
    .from('purchases')
    .select('*, book:books(*)')
    .eq('email', userEmail)
    .eq('status', 'completed')
    .order('purchased_at', { ascending: false });

  if (error) throw error;
  return data as (Purchase & { book: Book })[];
}

export async function fetchReadingProgress(bookId: string): Promise<ReadingProgress | null> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', session.session.user.id)
    .maybeSingle();

  const userEmail = profile?.email || session.session.user.email;

  const { data, error } = await supabase
    .from('reading_progress')
    .select('*')
    .eq('book_id', bookId)
    .or(`user_id.eq.${session.session.user.id},email.eq.${userEmail}`)
    .maybeSingle();

  if (error) throw error;
  return data as ReadingProgress | null;
}

export async function upsertReadingProgress(
  bookId: string,
  currentPage: number,
  progressPercentage: number
): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', session.session.user.id)
    .maybeSingle();

  const userEmail = profile?.email || session.session.user.email;
  const userId = session.session.user.id;

  const { data: existing } = await supabase
    .from('reading_progress')
    .select('id')
    .eq('book_id', bookId)
    .or(`user_id.eq.${userId},email.eq.${userEmail}`)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('reading_progress')
      .update({
        current_page: currentPage,
        progress_percentage: progressPercentage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('reading_progress').insert({
      user_id: userId,
      email: userEmail,
      book_id: bookId,
      current_page: currentPage,
      progress_percentage: progressPercentage,
    });
  }
}

export async function checkUserOwnsBook(bookId: string): Promise<boolean> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', session.session.user.id)
    .maybeSingle();

  const userEmail = profile?.email || session.session.user.email;

  const { data, error } = await supabase
    .from('purchases')
    .select('id')
    .eq('book_id', bookId)
    .eq('email', userEmail)
    .eq('status', 'completed')
    .maybeSingle();

  if (error) return false;
  return !!data;
}
