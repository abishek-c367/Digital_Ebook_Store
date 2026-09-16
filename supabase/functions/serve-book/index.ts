import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const bookId = url.searchParams.get("bookId");

    if (!bookId) {
      return new Response(JSON.stringify({ error: "Book ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authToken = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!authToken) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: userData } = await supabase.auth.getUser(authToken);
    if (!userData.user) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: book } = await supabase
      .from("books")
      .select("id, private_file_path, published, price_cents")
      .eq("id", bookId)
      .eq("published", true)
      .maybeSingle();

    if (!book || !book.private_file_path) {
      return new Response(JSON.stringify({ error: "Book not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Free books: any registered user may read. Paid books: this is the
    // actual gate on the file bytes, so it must check ownership itself —
    // never trust that the caller already passed verify-access.
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
        return new Response(JSON.stringify({ error: "You need to purchase this book to read it." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from("book-content")
      .download(book.private_file_path);

    if (downloadError || !fileData) {
      return new Response(JSON.stringify({ error: "Unable to load book content" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const arrayBuffer = await fileData.arrayBuffer();

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=book.pdf",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to serve book" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
