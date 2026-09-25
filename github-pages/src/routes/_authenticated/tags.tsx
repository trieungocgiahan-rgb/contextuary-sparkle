import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { tagsQueryOptions } from "@/lib/queries";
import { createTag, deleteTag, updateTag } from "@/lib/vocab.api";
import { TAG_COLORS } from "@/lib/vocab";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tags")({
  head: () => ({
    meta: [
      { title: "Tags — Contextuary" },
      { name: "description", content: "Organize your SAT vocabulary with custom colored tags." },
      { property: "og:title", content: "Tags — Contextuary" },
      { property: "og:description", content: "Custom tags for your vocabulary library." },
    ],
  }),
  component: TagsPage,
});

function TagsPage() {
  const qc = useQueryClient();
  const { data: tags = [] } = useQuery(tagsQueryOptions());
  const create = createTag;
  const del = deleteTag;
  const upd = updateTag;
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(TAG_COLORS[0]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["tags"] });

  const createMut = useMutation({
    mutationFn: () => create({ data: { name, color } }),
    onSuccess: () => {
      invalidate();
      setName("");
      toast.success("Tag created");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: invalidate,
  });

  const updMut = useMutation({
    mutationFn: (v: { id: string; color: string }) => upd({ data: v }),
    onSuccess: invalidate,
  });

  return (
    <div className="mx-auto max-w-3xl p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Tags</h1>
        <p className="text-sm text-muted-foreground">Group your words by theme or topic.</p>
      </header>

      <Card className="mb-6">
        <CardHeader><CardTitle>New tag</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Tag name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {TAG_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  "h-7 w-7 rounded-full border-2 transition",
                  color === c ? "border-foreground scale-110" : "border-transparent",
                )}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
          <Button onClick={() => name.trim() && createMut.mutate()} disabled={!name.trim() || createMut.isPending}>
            <Plus className="mr-2 h-4 w-4" /> Add tag
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Your tags</CardTitle></CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tags yet.</p>
          ) : (
            <ul className="divide-y">
              {tags.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-3">
                  <span className="h-4 w-4 rounded-full" style={{ backgroundColor: t.color }} />
                  <span className="flex-1 font-medium">{t.name}</span>
                  <div className="flex gap-1">
                    {TAG_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => updMut.mutate({ id: t.id, color: c })}
                        className={cn(
                          "h-5 w-5 rounded-full border-2 transition",
                          t.color === c ? "border-foreground" : "border-transparent hover:scale-110",
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => confirm(`Delete "${t.name}"?`) && delMut.mutate(t.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
