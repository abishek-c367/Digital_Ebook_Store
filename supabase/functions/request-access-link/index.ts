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
    const { email, bookId } = await req.json();

    if (!email || !bookId) {
      return new Response(JSON.stringify({ error: "Email and book ID are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the purchase exists
    const { data: purchase } = await supabase
      .from("purchases")
      .select("id, email, status")
      .eq("book_id", bookId)
      .eq("email", email.toLowerCase())
      .eq("status", "completed")
      .maybeSingle();

    if (!purchase) {
      return new Response(JSON.stringify({ error: "We couldn't find a completed purchase associated with this email." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Revoke old tokens for this purchase
    await supabase
      .from("access_tokens")
      .update({ revoked: true })
      .eq("purchase_id", purchase.id)
      .eq("revoked", false);

    // Generate new token
    const rawToken = generateToken();
    const tokenHash = await hashToken(rawToken);

    await supabase.from("access_tokens").insert({
      purchase_id: purchase.id,
      token_hash: tokenHash,
      email: email.toLowerCase(),
      book_id: bookId,
      expires_at: null,
      revoked: false,
    });

    // Send email if configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const siteUrl = req.headers.get("origin") || req.headers.get("referer") || "https://folio.example.com";
    const readLink = `${siteUrl}/read/${rawToken}`;

    if (resendApiKey) {
      const { data: book } = await supabase
        .from("books")
        .select("title")
        .eq("id", bookId)
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
          subject: `Your reading link: ${book?.title || "Your book"}`,
          html: `
            <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <h1 style="font-size: 28px; font-weight: 300; color: #1a1918;">Your reading link is ready.</h1>
              <p style="font-size: 16px; color: #5d5b58; line-height: 1.6;">
                Click below to continue reading ${book?.title ? `<strong>${book.title}</strong>` : "your book"}.
              </p>
              <a href="${readLink}" style="display: inline-block; background: #1a1918; color: #f6f6f4; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 14px; letter-spacing: 0.04em; margin: 20px 0;">Read Book</a>
              <p style="font-size: 14px; color: #8e8b7c;">This link is unique to you. Please do not share it.</p>
            </div>
          `,
        }),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to generate access link" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
