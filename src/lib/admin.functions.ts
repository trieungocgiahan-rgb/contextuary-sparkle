import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ReviewRow = {
  id: string;
  word: string;
  review_reason: string | null;
  suggested_correction: string | null;
  frequency_rank: number;
};

async function assertAdmin(
  supabase: { from: (t: string) => any },
  userId: string,
) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export const listReviewWords = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ReviewRow[]> => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabaseAdmin as any).rpc("admin_list_review_words");
    if (error) throw new Error("Unable to load review list");
    return (data ?? []) as ReviewRow[];
  });

export const resolveReviewWord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; action: string; newWord?: string }) => {
    const id = String(input?.id ?? "");
    const action = String(input?.action ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid id");
    if (!["approve", "delete", "replace"].includes(action)) throw new Error("Invalid action");
    const newWord = String(input?.newWord ?? "").slice(0, 64);
    if (action === "replace" && !/^[a-zA-Z' -]{1,64}$/.test(newWord)) {
      throw new Error("Invalid replacement word");
    }
    return { id, action, newWord };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin as any).rpc("admin_resolve_sat_word", {
      _id: data.id,
      _action: data.action,
      _new_word: data.newWord,
    });
    if (error) throw new Error("Unable to update word");
    return { ok: true };
  });
