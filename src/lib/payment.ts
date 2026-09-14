import { supabase } from './supabase';

const EDGE_FUNCTION_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  };
}

export async function createCheckoutSession(bookId: string): Promise<{ url: string | null; error: string | null }> {
  try {
    const { data: session } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    };
    if (session?.session?.access_token) {
      headers['X-Auth-Token'] = session.session.access_token;
    }

    const response = await fetch(`${EDGE_FUNCTION_BASE}/create-checkout`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ bookId }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Failed to create checkout session' }));
      return { url: null, error: err.error || 'Failed to start checkout' };
    }

    const data = await response.json();
    return { url: data.url, error: null };
  } catch {
    return { url: null, error: 'Unable to connect to the payment service' };
  }
}

export async function verifyPurchaseAndGenerateLink(
  sessionId: string,
  email: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const response = await fetch(`${EDGE_FUNCTION_BASE}/generate-access-link`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ sessionId, email }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Failed to verify purchase' }));
      return { success: false, error: err.error || 'Unable to verify your purchase' };
    }

    const data = await response.json();
    return { success: data.success, error: data.error ?? null };
  } catch {
    return { success: false, error: 'Unable to connect to the server' };
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
