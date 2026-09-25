import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.local " +
      "(or set them as GitHub Actions variables for the Pages build).",
  );
}

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
    // New Supabase API keys (sb_publishable_…, sb_secret_…) are opaque strings, not
    // JWTs. supabase-js defaults to sending them as `Authorization: Bearer <key>` when
    // there's no active user session, which GoTrue/PostgREST reject as an invalid JWT —
    // drop that default and rely on the `apikey` header instead.
    if (isNewSupabaseApiKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  global: {
    fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
  },
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // PKCE returns ?code=… instead of #access_token=…, which plays nicely with
    // client-side routing on a static host.
    flowType: "pkce",
  },
});

/** Returns the signed-in user's id, or throws if the session has expired. */
export async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error("Unauthorized: please sign in again");
  return id;
}

/**
 * Calls a Supabase Edge Function (see /supabase/functions) and unwraps its JSON.
 * Edge Functions hold the secrets (AI key, service role) that can't ship to a browser.
 */
export async function invokeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    // FunctionsHttpError carries the Response; surface the function's own message.
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      const payload = (await ctx.json().catch(() => null)) as { error?: string } | null;
      if (payload?.error) throw new Error(payload.error);
    }
    throw new Error(error.message);
  }
  return data as T;
}
