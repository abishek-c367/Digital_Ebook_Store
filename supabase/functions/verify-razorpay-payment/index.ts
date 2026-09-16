import { createClient } from 'npm:@supabase/supabase-js@2';
import { fetchRazorpayPaymentLink, hmacSha256Hex, normalizeLink, timingSafeEqualHex } from '../_shared/razorpay.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// This function is called by the browser right after Razorpay redirects the
// buyer back to /purchase-success. Razorpay appends five query params to
// that redirect (razorpay_payment_id, razorpay_payment_link_id,
// razorpay_payment_link_reference_id, razorpay_payment_link_status,
// razorpay_signature) whenever the Payment Link has a Redirect URL
// configured in the Razorpay dashboard — see the admin book editor's help
// text for how to set that up.
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const {
      razorpay_payment_id: paymentId,
      razorpay_payment_link_id: paymentLinkId,
      razorpay_payment_link_reference_id: referenceId,
      razorpay_payment_link_status: linkStatus,
      razorpay_signature: signature,
      email: fallbackEmail,
    } = await req.json();

    if (!paymentId || !paymentLinkId || !linkStatus || !signature) {
      return new Response(JSON.stringify({ success: false, error: "Missing payment confirmation details." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!keyId || !keySecret) {
      return new Response(JSON.stringify({ success: false, error: "Payments are not configured yet. Please contact support." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the signature Razorpay sent with the redirect.
    // payload = payment_link_id | payment_link_reference_id | payment_link_status | razorpay_payment_id
    const payload = `${paymentLinkId}|${referenceId || ""}|${linkStatus}|${paymentId}`;
    const expectedSignature = await hmacSha256Hex(keySecret, payload);
    const validSignature = await timingSafeEqualHex(expectedSignature, signature);

    if (!validSignature) {
      return new Response(JSON.stringify({ success: false, error: "We couldn't verify this payment. Please contact support." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (linkStatus !== "paid") {
      return new Response(JSON.stringify({ success: false, error: "This payment was not completed." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Idempotency: if we've already recorded this payment (e.g. the webhook
    // beat the redirect), just re-issue a fresh access link.
    const { data: existingPurchase } = await supabase
      .from("purchases")
      .select("id, book_id, email, status")
      .eq("payment_provider", "razorpay")
      .eq("payment_id", paymentId)
      .maybeSingle();

    let purchase = existingPurchase;

    if (!purchase) {
      const link = await fetchRazorpayPaymentLink(paymentLinkId, keyId, keySecret);
      if (!link) {
        return new Response(JSON.stringify({ success: false, error: "Unable to look up this payment. Please contact support." }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: matchedBook } = await supabase
        .from("books")
        .select("id, currency")
        .eq("razorpay_payment_link", link.short_url)
        .maybeSingle();

      let bookId = matchedBook?.id as string | undefined;

      if (!bookId) {
        // Fall back to a loose match (protocol/trailing-slash differences).
        const { data: candidateBooks } = await supabase
          .from("books")
          .select("id, razorpay_payment_link, currency")
          .not("razorpay_payment_link", "is", null);
        const match = (candidateBooks || []).find(
          (b: { razorpay_payment_link: string | null }) =>
            b.razorpay_payment_link && normalizeLink(b.razorpay_payment_link) === normalizeLink(link.short_url),
        );
        bookId = match?.id;
      }

      if (!bookId) {
        return new Response(JSON.stringify({ success: false, error: "We couldn't match this payment to a book. Please contact support." }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const buyerEmail = (link.customer?.email || fallbackEmail || "").toLowerCase();
      if (!buyerEmail) {
        return new Response(JSON.stringify({ success: false, error: "We need an email address to link this purchase to your account." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let userId: string | null = null;
      const { data: linkedProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", buyerEmail)
        .maybeSingle();
      if (linkedProfile) userId = linkedProfile.id;

      const { data: inserted, error: insertError } = await supabase
        .from("purchases")
        .insert({
          user_id: userId,
          book_id: bookId,
          email: buyerEmail,
          payment_provider: "razorpay",
          payment_id: paymentId,
          amount_cents: link.amount,
          currency: (link.currency || "INR").toLowerCase(),
          status: "completed",
          purchased_at: new Date().toISOString(),
        })
        .select("id, book_id, email, status")
        .single();

      if (insertError || !inserted) {
        return new Response(JSON.stringify({ success: false, error: "Failed to record your purchase." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      purchase = inserted;
    }

    if (!purchase || purchase.status !== "completed") {
      return new Response(JSON.stringify({ success: false, error: "This payment has not completed yet." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawToken = generateToken();
    const tokenHash = await hashToken(rawToken);

    await supabase.from("access_tokens").insert({
      purchase_id: purchase.id,
      token_hash: tokenHash,
      email: purchase.email,
      book_id: purchase.book_id,
      expires_at: null,
      revoked: false,
    });

    const { data: book } = await supabase
      .from("books")
      .select("slug, title")
      .eq("id", purchase.book_id)
      .maybeSingle();

    return new Response(JSON.stringify({
      success: true,
      readLink: `/read/${rawToken}`,
      bookSlug: book?.slug ?? null,
      bookTitle: book?.title ?? null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
