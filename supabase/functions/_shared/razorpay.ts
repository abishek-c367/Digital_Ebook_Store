// Shared helpers for verifying and looking up Razorpay Payment Links.
// Used by both the post-payment redirect handler (verify-razorpay-payment)
// and the webhook handler (razorpay-webhook), so a purchase is recorded
// exactly once no matter which path fires first.

export async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function timingSafeEqualHex(a: string, b: string): Promise<boolean> {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export interface RazorpayPaymentLinkDetails {
  id: string;
  short_url: string;
  amount: number;
  currency: string;
  status: string;
  reference_id: string | null;
  customer?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
}

export async function fetchRazorpayPaymentLink(
  paymentLinkId: string,
  keyId: string,
  keySecret: string,
): Promise<RazorpayPaymentLinkDetails | null> {
  const auth = btoa(`${keyId}:${keySecret}`);
  const response = await fetch(`https://api.razorpay.com/v1/payment_links/${paymentLinkId}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!response.ok) return null;
  return await response.json();
}

// Normalizes a Razorpay short_url for comparison (trims whitespace/trailing slash).
export function normalizeLink(url: string): string {
  return url.trim().replace(/\/+$/, "").toLowerCase();
}
