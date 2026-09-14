import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { sessionId, email } = await req.json();

    if (!sessionId || !email) {
      return new Response(JSON.stringify({ error: "Session ID and email are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let purchase: { id: string; book_id: string; email: string; status: string; user_id: string | null } | null = null;

    // Handle mock checkout (development mode)
    if (sessionId.startsWith("mock_session_")) {
      const purchaseId = sessionId.replace("mock_session_", "");
      const { data, error } = await supabase
        .from("purchases")
        .select("id, book_id, email, status, user_id")
        .eq("id", purchaseId)
        .maybeSingle();

      if (error || !data) {
        return new Response(JSON.stringify({ error: "Purchase not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      purchase = data;

      // In mock mode, update the purchase email to match what the user entered
      // This ensures the purchase shows up in their library
      if (purchase.email !== email.toLowerCase()) {
        await supabase
          .from("purchases")
          .update({ email: email.toLowerCase() })
          .eq("id", purchase.id);
      }

      // Try to link the purchase to a user account if one exists with this email
      const { data: linkUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email.toLowerCase())
        .maybeSingle();

      if (linkUser && !purchase.user_id) {
        await supabase
          .from("purchases")
          .update({ user_id: linkUser.id })
          .eq("id", purchase.id);
      }
    } else {
      // Real Stripe — verify the session
      const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

      if (!stripeSecretKey) {
        return new Response(JSON.stringify({ error: "Payment system not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const stripeResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
        headers: { "Authorization": `Bearer ${stripeSecretKey}` },
      });

      const session = await stripeResponse.json();

      if (!stripeResponse.ok || session.payment_status !== "paid") {
        return new Response(JSON.stringify({ error: "Payment not completed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const bookId = session.metadata?.book_id;
      const customerEmail = session.customer_details?.email || session.customer_email;

      if (!bookId) {
        return new Response(JSON.stringify({ error: "Missing book information" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify the email matches the purchase
      if (customerEmail && customerEmail.toLowerCase() !== email.toLowerCase()) {
        return new Response(JSON.stringify({ error: "We couldn't find a completed purchase associated with this email." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find the purchase record
      const { data, error } = await supabase
        .from("purchases")
        .select("id, book_id, email, status, user_id")
        .eq("payment_id", sessionId)
        .eq("status", "completed")
        .maybeSingle();

      if (error || !data) {
        return new Response(JSON.stringify({ error: "Purchase not found or not completed" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      purchase = data;
    }

    if (!purchase) {
      return new Response(JSON.stringify({ error: "Purchase not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (purchase.status !== "completed") {
      return new Response(JSON.stringify({ error: "Payment has not been completed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate secure access token
    const rawToken = generateToken();
    const tokenHash = await hashToken(rawToken);

    const { error: tokenError } = await supabase.from("access_tokens").insert({
      purchase_id: purchase.id,
      token_hash: tokenHash,
      email: email.toLowerCase(),
      book_id: purchase.book_id,
      expires_at: null, // Lifetime access
      revoked: false,
    });

    if (tokenError) {
      return new Response(JSON.stringify({ error: "Failed to generate access link" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const siteUrl = req.headers.get("origin") || req.headers.get("referer") || "https://folio.example.com";
    const readLink = `${siteUrl}/read/${rawToken}`;

    console.log(`Access link for ${email}: ${readLink}`);

    // Try to send email if a notification service is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      try {
        const { data: book } = await supabase
          .from("books")
          .select("title, cover_url")
          .eq("id", purchase.book_id)
          .maybeSingle();

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Folio <noreply@folio.example.com>",
            to: email,
            subject: `Your book is ready: ${book?.title || "Your purchase"}`,
            html: `
              <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <h1 style="font-size: 28px; font-weight: 300; color: #1a1918;">Your book is ready to read.</h1>
                <p style="font-size: 16px; color: #5d5b58; line-height: 1.6;">
                  Your payment was successful. Click the button below to start reading
                  ${book?.title ? `<strong>${book.title}</strong>` : "your book"}.
                </p>
                <a href="${readLink}" style="display: inline-block; background: #1a1918; color: #f6f6f4; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 14px; letter-spacing: 0.04em; margin: 20px 0;">Read Book</a>
                <p style="font-size: 14px; color: #8e8b7c; line-height: 1.6;">
                  This link is unique to you. Do not share it with others, as it is tied to your purchase.
                </p>
              </div>
            `,
          }),
        });
      } catch {
        // Email sending failed, but the token was created
      }
    }

    // Return the read link so the frontend can redirect directly in mock/dev mode
    return new Response(JSON.stringify({ success: true, readLink }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
