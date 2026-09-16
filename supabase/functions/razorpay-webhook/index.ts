import { createClient } from 'npm:@supabase/supabase-js@2';
import { hmacSha256Hex, timingSafeEqualHex } from '../_shared/razorpay.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Razorpay-Signature",
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

// Configure this URL as the webhook endpoint in the Razorpay dashboard
// (Settings → Webhooks), subscribed to at least "payment_link.paid" and
// "refund.created". This is the reliable path for recording a purchase —
// it fires server-to-server even if the buyer closes their browser before
// the redirect back to the site completes.
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    if (!webhookSecret) {
      return new Response(JSON.stringify({ error: "Webhook not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";
    const expected = await hmacSha256Hex(webhookSecret, body);

    if (!signature || !(await timingSafeEqualHex(expected, signature))) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(body);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (event.event === "payment_link.paid") {
      const link = event.payload?.payment_link?.entity;
      const payment = event.payload?.payment?.entity;

      if (!link || !payment) {
        return new Response(JSON.stringify({ received: true, skipped: "missing entities" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: existing } = await supabase
        .from("purchases")
        .select("id")
        .eq("payment_provider", "razorpay")
        .eq("payment_id", payment.id)
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: book } = await supabase
        .from("books")
        .select("id")
        .eq("razorpay_payment_link", link.short_url)
        .maybeSingle();

      if (!book) {
        return new Response(JSON.stringify({ received: true, skipped: "no matching book" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const buyerEmail = (link.customer?.email || payment.email || "").toLowerCase();
      if (!buyerEmail) {
        return new Response(JSON.stringify({ received: true, skipped: "no buyer email" }), {
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

      const { data: purchase } = await supabase
        .from("purchases")
        .insert({
          user_id: userId,
          book_id: book.id,
          email: buyerEmail,
          payment_provider: "razorpay",
          payment_id: payment.id,
          amount_cents: link.amount,
          currency: (link.currency || "INR").toLowerCase(),
          status: "completed",
          purchased_at: new Date().toISOString(),
        })
        .select("id, book_id, email")
        .single();

      if (purchase) {
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

        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
          const { data: bookInfo } = await supabase.from("books").select("title").eq("id", book.id).maybeSingle();
          const siteUrl = Deno.env.get("SITE_URL") || "https://folio.example.com";
          try {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                from: "Folio <noreply@folio.example.com>",
                to: purchase.email,
                subject: `Your book is ready: ${bookInfo?.title || "Your purchase"}`,
                html: `<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                  <h1 style="font-size: 28px; font-weight: 300; color: #1a1918;">Your book is ready to read.</h1>
                  <p style="font-size: 16px; color: #5d5b58; line-height: 1.6;">Your payment was successful. Sign in at ${siteUrl} and open My Library to start reading ${bookInfo?.title ? `<strong>${bookInfo.title}</strong>` : "your book"}.</p>
                </div>`,
              }),
            });
          } catch {
            // Non-fatal — the purchase is already recorded.
          }
        }
      }
    }

    if (event.event === "refund.created" || event.event === "payment.refunded") {
      const payment = event.payload?.payment?.entity;
      if (payment?.id) {
        await supabase
          .from("purchases")
          .update({ status: "refunded" })
          .eq("payment_provider", "razorpay")
          .eq("payment_id", payment.id);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
