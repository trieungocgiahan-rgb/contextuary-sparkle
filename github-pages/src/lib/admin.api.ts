// Admin seed-review actions need the service-role key, so they run in the `admin`
// Supabase Edge Function (supabase/functions/admin), which checks the caller's role.
import { invokeFunction } from "@/integrations/supabase/client";

export type ReviewRow = {
  id: string;
  word: string;
  review_reason: string | null;
  suggested_correction: string | null;
  frequency_rank: number;
};

export async function listReviewWords(): Promise<ReviewRow[]> {
  return invokeFunction<ReviewRow[]>("admin", { action: "list" });
}

export async function resolveReviewWord({
  data,
}: {
  data: { id: string; action: string; newWord?: string };
}) {
  return invokeFunction<{ ok: true }>("admin", {
    action: "resolve",
    id: data.id,
    resolution: data.action,
    newWord: data.newWord ?? "",
  });
}
