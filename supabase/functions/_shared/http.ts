// Shared helpers for the Edge Functions used by the GitHub Pages build (github-pages/).
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Verifies the caller's Supabase session and returns a client that acts as that user,
 * so row-level security still applies to everything the function reads or writes.
 */
export async function requireUser(
  req: Request,
): Promise<{ supabase: SupabaseClient; userId: string }> {
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
export function serve(handler: (req: Request) => Promise<Response>) {
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
