import { supabase } from './supabase';
import type { Book } from '@/types';

const EDGE_FUNCTION_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  };
}

/**
 * Builds the URL for the "Buy Book" / "Get Book" button. Appends the
 * buyer's name and email as Razorpay prefill query params so they don't
 * have to retype them on the Razorpay checkout page.
 */
export function buildRazorpayCheckoutUrl(book: Book, email?: string | null, name?: string | null): string | null {
  if (!book.razorpay_payment_link) return null;
  try {
    const url = new URL(book.razorpay_payment_link);
    if (email) url.searchParams.set('prefill[email]', email);
    if (name) url.searchParams.set('prefill[name]', name);
    return url.toString();
  } catch {
    return book.razorpay_payment_link;
  }
}

interface RazorpayRedirectParams {
  razorpay_payment_id: string;
  razorpay_payment_link_id: string;
  razorpay_payment_link_reference_id?: string;
  razorpay_payment_link_status: string;
  razorpay_signature: string;
  email?: string;
}

export async function verifyRazorpayPayment(
  params: RazorpayRedirectParams
): Promise<{ success: boolean; error: string | null; readLink: string | null; bookSlug: string | null; bookTitle: string | null }> {
  try {
    const response = await fetch(`${EDGE_FUNCTION_BASE}/verify-razorpay-payment`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return { success: false, error: data.error || 'Unable to verify your payment', readLink: null, bookSlug: null, bookTitle: null };
    }

    return {
      success: !!data.success,
      error: data.error ?? null,
      readLink: data.readLink ?? null,
      bookSlug: data.bookSlug ?? null,
      bookTitle: data.bookTitle ?? null,
    };
  } catch {
    return { success: false, error: 'Unable to connect to the server', readLink: null, bookSlug: null, bookTitle: null };
  }
}

export async function verifyAccessToken(
  token: string
): Promise<{ authorized: boolean; bookId: string | null; email: string | null; error: string | null }> {
  try {
    const response = await fetch(`${EDGE_FUNCTION_BASE}/verify-access`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Access verification failed' }));
      return { authorized: false, bookId: null, email: null, error: err.error };
    }

    const data = await response.json();
    return {
      authorized: data.authorized,
      bookId: data.bookId,
      email: data.email,
      error: data.error ?? null,
    };
  } catch {
    return { authorized: false, bookId: null, email: null, error: 'Unable to verify access' };
  }
}

export async function requestNewAccessLink(
  email: string,
  bookId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const response = await fetch(`${EDGE_FUNCTION_BASE}/request-access-link`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, bookId }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Request failed' }));
      return { success: false, error: err.error };
    }

    const data = await response.json();
    return { success: data.success, error: data.error ?? null };
  } catch {
    return { success: false, error: 'Unable to connect to the server' };
  }
}

// Re-exported here so callers don't need to know about supabase directly.
export async function getCurrentUserEmail(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.email ?? null;
}
