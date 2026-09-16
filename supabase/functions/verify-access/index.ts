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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ authorized: false, error: "Token is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle session-based tokens for logged-in users (from library page)
    if (token.startsWith("session:")) {
      const bookId = token.replace("session:", "");

      // Get the user from the auth token
      const authToken = req.headers.get("Authorization")?.replace("Bearer ", "");
      if (!authToken) {
        return new Response(JSON.stringify({ authorized: false, error: "Authentication required" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: userData } = await supabase.auth.getUser(authToken);
      if (!userData.user) {
        return new Response(JSON.stringify({ authorized: false, error: "Authentication required" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify the book exists and is published
      const { data: book } = await supabase
        .from("books")
        .select("id, title, price_cents")
        .eq("id", bookId)
        .eq("published", true)
        .maybeSingle();

      if (!book) {
        return new Response(JSON.stringify({ authorized: false, error: "This book is not available." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Free books: any registered user gets in. Paid books: require a
      // completed purchase tied to this account's email.
      if (book.price_cents > 0) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", userData.user.id)
          .maybeSingle();
        const buyerEmail = (profile?.email || userData.user.email || "").toLowerCase();

        const { data: purchase } = await supabase
          .from("purchases")
          .select("id")
          .eq("book_id", bookId)
          .eq("email", buyerEmail)
          .eq("status", "completed")
          .maybeSingle();

        if (!purchase) {
          return new Response(JSON.stringify({ authorized: false, error: "You need to purchase this book to read it." }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      return new Response(JSON.stringify({
        authorized: true,
        bookId,
        email: userData.user.email,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Hash the token and look it up
    const tokenHash = await hashToken(token);

    const { data: accessToken, error } = await supabase
      .from("access_tokens")
      .select("id, email, book_id, expires_at, revoked")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (error || !accessToken) {
      return new Response(JSON.stringify({ authorized: false, error: "This reading link is invalid." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (accessToken.revoked) {
      return new Response(JSON.stringify({ authorized: false, error: "This reading link has been revoked." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (accessToken.expires_at && new Date(accessToken.expires_at) < new Date()) {
      return new Response(JSON.stringify({ authorized: false, error: "This reading link has expired." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      authorized: true,
      bookId: accessToken.book_id,
      email: accessToken.email,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ authorized: false, error: "Access verification failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
