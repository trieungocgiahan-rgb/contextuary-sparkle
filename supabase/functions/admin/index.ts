// Admin seed-review actions for the GitHub Pages build (github-pages/). Ports the Lovable
// app's admin.functions.ts: the RPCs are only granted to service_role, so this function
// checks the caller is an admin and then calls them with the service-role key, which
// Supabase provides to Edge Functions automatically.
//
// Self-contained on purpose (no import from ../_shared) so it can be deployed by pasting
// this single file into the Supabase Dashboard's Edge Function editor.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

// ---------- HTTP helpers ----------

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// New-format Supabase API keys (sb_publishable_…, sb_secret_…) are opaque strings, not
// JWTs. supabase-js defaults to sending them as `Authorization: Bearer <key>` whenever a
// client has no other Authorization header set, which the gateway rejects as an invalid
// JWT for the service-role client below — strip that default and rely on `apikey` alone.
function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (isNewSupabaseApiKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

/**
 * Verifies the caller's Supabase session and returns a client that acts as that user,
 * so row-level security still applies to everything the function reads or writes.
 */
async function requireUser(req: Request): Promise<{ supabase: SupabaseClient; userId: string }> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) throw new HttpError(401, "Unauthorized");

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anonKey) throw new HttpError(500, "Supabase environment is not configured");

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "Unauthorized");
  return { supabase, userId: data.user.id };
}

/** Wraps a handler with CORS preflight handling and JSON error responses. */
function serve(handler: (req: Request) => Promise<Response>) {
  Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
    try {
      return await handler(req);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      console.error(e);
      return json({ error: "Something went wrong. Please try again." }, 500);
    }
  });
}

// ---------- Handler ----------

serve(async (req) => {
  const { supabase, userId } = await requireUser(req);

  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!role) throw new HttpError(403, "Forbidden");

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey, {
    global: { fetch: createSupabaseFetch(serviceRoleKey) },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  if (body.action === "list") {
    const { data, error } = await admin.rpc("admin_list_review_words");
    if (error) throw new HttpError(500, "Unable to load review list");
    return json(data ?? []);
  }

  if (body.action === "resolve") {
    const id = String(body.id ?? "");
    const resolution = String(body.resolution ?? "");
    const newWord = String(body.newWord ?? "").slice(0, 64);
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(400, "Invalid id");
    if (!["approve", "delete", "replace"].includes(resolution)) {
      throw new HttpError(400, "Invalid action");
    }
    if (resolution === "replace" && !/^[a-zA-Z' -]{1,64}$/.test(newWord)) {
      throw new HttpError(400, "Invalid replacement word");
    }
    const { error } = await admin.rpc("admin_resolve_sat_word", {
      _id: id,
      _action: resolution,
      _new_word: newWord,
    });
    if (error) throw new HttpError(500, "Unable to update word");
    return json({ ok: true });
  }

  throw new HttpError(400, "Unknown action");
});
