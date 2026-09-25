// Admin seed-review actions for the GitHub Pages build (github-pages/). Ports the Lovable
// app's admin.functions.ts: the RPCs are only granted to service_role, so this function
// checks the caller is an admin and then calls them with the service-role key, which
// Supabase provides to Edge Functions automatically.
import { createClient } from "npm:@supabase/supabase-js@2";
import { HttpError, json, requireUser, serve } from "../_shared/http.ts";

serve(async (req) => {
  const { supabase, userId } = await requireUser(req);

  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!role) throw new HttpError(403, "Forbidden");

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
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
