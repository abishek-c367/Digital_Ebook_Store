import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Every action requires the caller to be a signed-in admin.
    const authToken = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!authToken) return json({ error: "Authentication required" }, 401);

    const { data: callerData } = await supabase.auth.getUser(authToken);
    if (!callerData.user) return json({ error: "Authentication required" }, 401);

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", callerData.user.id)
      .maybeSingle();

    if (callerProfile?.role !== "admin") {
      return json({ error: "Admin access required" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    if (action === "list") {
      const page = body.page || 1;
      const perPage = body.perPage || 100;

      const { data: authList, error: authError } = await supabase.auth.admin.listUsers({ page, perPage });
      if (authError) return json({ error: "Failed to list users" }, 500);

      const { data: profiles } = await supabase.from("profiles").select("id, role, name, email, created_at");
      const profileMap = new Map((profiles || []).map((p: { id: string }) => [p.id, p]));

      const { data: purchases } = await supabase
        .from("purchases")
        .select("email")
        .eq("status", "completed");
      const payingEmails = new Set((purchases || []).map((p: { email: string }) => p.email.toLowerCase()));

      const users = authList.users.map((u) => {
        const profile = profileMap.get(u.id);
        const email = (profile?.email || u.email || "").toLowerCase();
        return {
          id: u.id,
          email: u.email,
          name: profile?.name || null,
          role: profile?.role || "customer",
          created_at: profile?.created_at || u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          is_paying_customer: payingEmails.has(email),
        };
      });

      return json({ users, total: authList.total || users.length });
    }

    if (action === "create") {
      const { email, password, name, role } = body;
      if (!email || !password) return json({ error: "Email and password are required" }, 400);
      if (password.length < 8) return json({ error: "Password must be at least 8 characters" }, 400);

      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: name || email },
      });

      if (createError || !created.user) {
        return json({ error: createError?.message || "Failed to create user" }, 500);
      }

      if (role === "admin") {
        await supabase.from("profiles").update({ role: "admin" }).eq("id", created.user.id);
      }

      return json({ success: true, userId: created.user.id });
    }

    if (action === "setRole") {
      const { userId, role } = body;
      if (!userId || !["admin", "customer"].includes(role)) {
        return json({ error: "A valid userId and role are required" }, 400);
      }
      if (userId === callerData.user.id && role !== "admin") {
        return json({ error: "You cannot remove your own admin access." }, 400);
      }
      const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
      if (error) return json({ error: "Failed to update role" }, 500);
      return json({ success: true });
    }

    if (action === "delete") {
      const { userId } = body;
      if (!userId) return json({ error: "userId is required" }, 400);
      if (userId === callerData.user.id) {
        return json({ error: "You cannot delete your own account." }, 400);
      }
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) return json({ error: "Failed to delete user" }, 500);
      return json({ success: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch {
    return json({ error: "Internal server error" }, 500);
  }
});
