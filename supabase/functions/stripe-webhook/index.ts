import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function verifyStripeSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sig = encoder.encode(signature);
    const data = encoder.encode(payload);
    return await crypto.subtle.verify("HMAC", key, sig, data);
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeSecretKey) {
      return new Response(JSON.stringify({ error: "Stripe not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.text();
    const signature = req.headers.get("stripe-signature") || "";

    // For production, verify the webhook signature
    if (stripeWebhookSecret && signature) {
      const isValid = await verifyStripeSignature(body, signature, stripeWebhookSecret);
      if (!isValid) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const event = JSON.parse(body);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const bookId = session.metadata?.book_id;
      const customerEmail = session.customer_details?.email || session.customer_email;

      if (!bookId || !customerEmail) {
        return new Response(JSON.stringify({ error: "Missing metadata" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check for duplicate purchase
      const { data: existing } = await supabase
        .from("purchases")
        .select("id")
        .eq("payment_provider", "stripe")
        .eq("payment_id", session.id)
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch book for price
      const { data: book } = await supabase
        .from("books")
        .select("price_cents, currency")
        .eq("id", bookId)
        .maybeSingle();

      // Create purchase record
      await supabase.from("purchases").insert({
        book_id: bookId,
        email: customerEmail,
        payment_provider: "stripe",
        payment_id: session.id,
        amount_cents: session.amount_total || book?.price_cents || 0,
        currency: session.currency || book?.currency || "usd",
        status: "completed",
        purchased_at: new Date().toISOString(),
      });
    }

    if (event.type === "charge.refunded") {
      const charge = event.data.object;
      await supabase
        .from("purchases")
        .update({ status: "refunded" })
        .eq("payment_id", charge.payment_intent);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
