import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { isAdminQueryOptions } from "@/lib/queries";
import { listReviewWords, resolveReviewWord, type ReviewRow } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/seed")({
  head: () => ({ meta: [{ title: "Seed Review — Admin" }] }),
  component: AdminSeedPage,
});

function AdminSeedPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: admin, isLoading } = useQuery(isAdminQueryOptions());
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!admin) { navigate({ to: "/words" }); return; }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, isLoading]);

  async function refresh() {
    setLoading(true);
    try {
      setRows(await listReviewWords());
    } catch {
      toast.error("Unable to load review list");
    }
    setLoading(false);
  }

  async function resolve(id: string, action: "approve" | "delete" | "replace", newWord?: string) {
    try {
      await resolveReviewWord({ data: { id, action, newWord: newWord ?? "" } });
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["words"] });
      refresh();
    } catch {
      toast.error("Unable to update word");
    }
  }


  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Checking access…</div>;
  if (!admin) return null;

  return (
    <div className="mx-auto max-w-4xl p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Seed Review</h1>
        <p className="text-sm text-muted-foreground">
          {rows.length} word{rows.length === 1 ? "" : "s"} flagged during seeding.
        </p>
      </header>
      <div className="rounded-2xl bg-card shadow-sm">
        {loading && <div className="p-4 text-sm text-muted-foreground">Loading…</div>}
        {!loading && rows.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">Nothing to review 🎉</div>
        )}
        {rows.map((r) => (
          <ReviewItem key={r.id} row={r} onResolve={resolve} />
        ))}
      </div>
    </div>
  );
}

function ReviewItem({ row, onResolve }: { row: ReviewRow; onResolve: (id: string, action: "approve" | "delete" | "replace", w?: string) => void }) {
  const [edit, setEdit] = useState(row.suggested_correction ?? "");
  return (
    <div className="flex flex-wrap items-center gap-3 border-b p-4 last:border-b-0">
      <div className="min-w-[120px]">
        <div className="font-semibold">{row.word}</div>
        <div className="text-xs text-muted-foreground">#{row.frequency_rank}</div>
      </div>
      <div className="min-w-[200px] flex-1 text-sm text-muted-foreground">{row.review_reason}</div>
      <Input value={edit} onChange={(e) => setEdit(e.target.value)} className="w-40" placeholder="Correction" />
      <div className="flex gap-1.5">
        <Button size="sm" variant="outline" onClick={() => onResolve(row.id, "replace", edit)} disabled={!edit.trim()}>
          Replace
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onResolve(row.id, "approve")}>Keep</Button>
        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onResolve(row.id, "delete")}>
          Delete
        </Button>
      </div>
    </div>
  );
}
