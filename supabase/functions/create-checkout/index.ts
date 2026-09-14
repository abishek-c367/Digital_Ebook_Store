import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { bookId } = await req.json();

    if (!bookId) {
      return new Response(JSON.stringify({ error: "Book ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the book
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("*")
      .eq("id", bookId)
      .maybeSingle();

    if (bookError || !book) {
      return new Response(JSON.stringify({ error: "Book not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!book.published) {
      return new Response(JSON.stringify({ error: "Book is not available for purchase" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user email from auth token if available
    let customerEmail: string | undefined;
    const authToken = req.headers.get("X-Auth-Token");
    if (authToken) {
      const { data: userData } = await supabase.auth.getUser(authToken);
      customerEmail = userData.user?.email;
    }

    const siteUrl = req.headers.get("origin") || req.headers.get("referer") || "https://folio.example.com";

    // If Stripe is not configured, use a mock checkout flow for development
    if (!stripeSecretKey) {
      // Create a pending purchase record
      const { data: purchase, error: purchaseError } = await supabase
        .from("purchases")
        .insert({
          book_id: bookId,
          email: customerEmail || "guest@folio.local",
          payment_provider: "mock",
          payment_id: `mock_${Date.now()}`,
          amount_cents: book.price_cents,
          currency: book.currency,
          status: "completed",
          purchased_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (purchaseError) {
        return new Response(JSON.stringify({ error: "Failed to create purchase" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Redirect to success page with mock session ID
      const mockSessionId = `mock_session_${purchase.id}`;
      return new Response(JSON.stringify({
        url: `${siteUrl}/purchase-success?session_id=${mockSessionId}`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Real Stripe checkout
    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "mode": "payment",
        "line_items[0][price_data][currency]": book.currency,
        "line_items[0][price_data][unit_amount]": String(book.price_cents),
        "line_items[0][price_data][product_data][name]": book.title,
        "line_items[0][price_data][product_data][description]": book.description?.slice(0, 200) || "",
        "line_items[0][quantity]": "1",
        "success_url": `${siteUrl}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
        "cancel_url": `${siteUrl}/books/${book.slug}`,
        "metadata[book_id]": bookId,
        "metadata[book_title]": book.title,
        ...(customerEmail ? { "customer_email": customerEmail } : {}),
      }),
    });

    const session = await stripeResponse.json();

    if (!stripeResponse.ok) {
      return new Response(JSON.stringify({ error: session.error?.message || "Failed to create checkout session" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
