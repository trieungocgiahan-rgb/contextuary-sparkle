import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Search, Sparkles, Star, Trash2, Volume2, Filter } from "lucide-react";
import { toast } from "sonner";

import { wordsQueryOptions, tagsQueryOptions } from "@/lib/queries";
import { createWord, deleteWord, updateWord, type WordRow } from "@/lib/vocab.functions";
import { generateWordDetails } from "@/lib/ai.functions";
import { STATUS_OPTIONS, STATUS_META } from "@/lib/vocab";
import { speak } from "@/lib/tts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { WordDetailsDrawer } from "@/components/word-details-drawer";
import { DailyPicksBar } from "@/components/daily-picks-bar";
import type { SatWord } from "@/lib/daily-picks.functions";
import { PracticePickerDialog } from "@/components/practice-picker";
import { validateWord } from "@/lib/validation.functions";
import { OverviewCard } from "@/components/app-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";


export const Route = createFileRoute("/_authenticated/words")({
  head: () => ({
    meta: [
      { title: "My Words — Contextuary" },
      { name: "description", content: "Your personal SAT vocabulary library with Vietnamese meanings and contextual examples." },
      { property: "og:title", content: "My Words — Contextuary" },
      { property: "og:description", content: "Your personal SAT vocabulary library." },
    ],
  }),
  component: WordsPage,
});

function WordsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: words = [] } = useQuery(wordsQueryOptions());
  const { data: tags = [] } = useQuery(tagsQueryOptions());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewSat, setPreviewSat] = useState<SatWord | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const isMobile = useIsMobile();

  const create = useServerFn(createWord);
  const del = useServerFn(deleteWord);
  const upd = useServerFn(updateWord);
  const generate = useServerFn(generateWordDetails);
  const validate = useServerFn(validateWord);

  const filtered = words.filter((w) => {
    if (search && !w.word.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && w.status !== statusFilter) return false;
    if (tagFilter !== "all" && w.tag_id !== tagFilter) return false;
    return true;
  });

  const selected = selectedId ? words.find((w) => w.id === selectedId) ?? null : null;

  const updateMut = useMutation({
    mutationFn: (v: { id: string; patch: Partial<WordRow> }) => upd({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["words"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["words"] });
      setSelectedId(null);
      toast.success("Word removed");
    },
  });

  async function handleAdd(overrideWord?: string) {
    const w = (overrideWord ?? newWord).trim().toLowerCase();
    if (!w) return;
    setBusy(true);
    setSuggestion(null);
    setValidationError(null);
    try {
      const v = await validate({ data: { word: w } });
      if (!v.ok) {
        setValidationError(v.message);
        if (v.reason === "misspelled" && v.suggestion) setSuggestion(v.suggestion);
        setBusy(false);
        return;
      }
      const details = await generate({ data: { word: w } });
      const tag = tags.find((t) => t.name.toLowerCase() === details.suggested_tag.toLowerCase());
      const inserted = await create({
        data: {
          word: w,
          ipa: details.ipa,
          vietnamese_meaning: details.vietnamese_meaning,
          nuance_note: details.nuance_note,
          examples: details.examples,
          collocations: details.collocations,
          synonyms: details.synonyms,
          antonyms: details.antonyms,
          memory_hint: details.memory_hint,
          part_of_speech: v.partOfSpeech ?? null,
          tag_id: tag?.id ?? null,
          status: "new",
        },
      });
      qc.invalidateQueries({ queryKey: ["words"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      setAddOpen(false);
      setNewWord("");
      toast.success(`Added "${w}"`);
      if (inserted?.id) setSelectedId(inserted.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate word");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-4 py-5 sm:p-6 lg:p-8">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">My Words</h1>
          <p className="text-sm text-muted-foreground">
            {words.length} words · Understand them in context.
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => setPracticeOpen(true)}>
            <Sparkles className="mr-2 h-4 w-4" /> Practice
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Add Word
              </Button>
            </DialogTrigger>
            <DialogContent
              className={
                isMobile
                  ? "flex h-[100dvh] max-h-[100dvh] max-w-none translate-x-0 translate-y-0 left-0 top-0 grid-rows-[auto_1fr_auto] rounded-none p-5 pb-[calc(env(safe-area-inset-bottom)+20px)]"
                  : undefined
              }
            >
              <DialogHeader>
                <DialogTitle>Add a new word</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 overflow-y-auto">
                <Input
                  placeholder="e.g. ubiquitous"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !busy && handleAdd()}
                  autoFocus
                />
                {validationError && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    {validationError}
                    {suggestion && (
                      <Button size="sm" variant="outline" className="mt-2 w-full sm:ml-2 sm:mt-0 sm:w-auto" onClick={() => { setNewWord(suggestion); handleAdd(suggestion); }}>
                        Use "{suggestion}"
                      </Button>
                    )}
                  </div>
                )}
                <p className="text-sm text-muted-foreground sm:text-xs">
                  Contextuary will validate and generate IPA, meaning, examples and more.
                </p>
              </div>
              <DialogFooter className="mt-auto gap-2 sm:mt-0">
                <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setAddOpen(false)} disabled={busy}>Cancel</Button>
                <Button className="w-full sm:w-auto" onClick={() => handleAdd()} disabled={busy || !newWord.trim()}>
                  {busy ? "Working…" : "Validate & Add"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <OverviewCard className="mb-4 lg:hidden" />

      <DailyPicksBar onPreview={setPreviewSat} />

      <div className="mb-4 rounded-2xl bg-card p-4 shadow-sm">

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:min-w-[220px] sm:flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search words…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-11 w-full sm:h-9 sm:w-[160px]">
                <Filter className="mr-2 h-4 w-4 shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="h-11 w-full sm:h-9 sm:w-[160px]">
                <SelectValue placeholder="All tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tags</SelectItem>
                {tags.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Mobile: stacked cards */}
      <div className="space-y-3 md:hidden">
        {filtered.length === 0 && (
          <div className="rounded-2xl bg-card py-12 text-center text-sm text-muted-foreground shadow-sm">
            {words.length === 0 ? "No words yet — add your first one!" : "No matching words."}
          </div>
        )}
        {filtered.map((w) => {
          const tag = tags.find((t) => t.id === w.tag_id);
          const meta = STATUS_META[w.status];
          return (
            <div
              key={w.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedId(w.id)}
              onKeyDown={(e) => e.key === "Enter" && setSelectedId(w.id)}
              className="rounded-2xl bg-card p-4 shadow-sm transition active:scale-[0.99]"
            >
              <div className="flex items-baseline gap-2">
                {w.is_favorite && <Star className="h-4 w-4 shrink-0 fill-primary text-primary" />}
                <span className="text-lg font-semibold">{w.word}</span>
                {w.ipa && <span className="truncate text-sm text-muted-foreground">{w.ipa}</span>}
              </div>
              <p className="mt-1 text-base leading-relaxed text-muted-foreground">
                {w.vietnamese_meaning}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{ backgroundColor: meta.bg, color: meta.fg }}
                >
                  {meta.label}
                </span>
                {tag && (
                  <Badge
                    variant="secondary"
                    style={{ backgroundColor: `${tag.color}22`, color: tag.color, borderColor: `${tag.color}55` }}
                    className="border"
                  >
                    {tag.name}
                  </Badge>
                )}
              </div>
              <div className="mt-3 flex items-center gap-1 border-t border-border/60 pt-2" onClick={(e) => e.stopPropagation()}>
                <Button size="icon" variant="ghost" aria-label={`Listen to ${w.word}`} onClick={() => speak(w.word).catch(() => toast.error("TTS failed"))}>
                  <Volume2 className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Toggle favorite"
                  onClick={() => updateMut.mutate({ id: w.id, patch: { is_favorite: !w.is_favorite } })}
                >
                  <Star className={w.is_favorite ? "h-5 w-5 fill-primary text-primary" : "h-5 w-5"} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Delete word"
                  className="ml-auto"
                  onClick={() => { if (confirm(`Delete "${w.word}"?`)) deleteMut.mutate(w.id); }}
                >
                  <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop / tablet: table */}
      <div className="hidden rounded-2xl bg-card shadow-sm md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[220px]">Word</TableHead>
              <TableHead>Meaning</TableHead>
              <TableHead className="w-[140px]">Tag</TableHead>
              <TableHead className="w-[140px]">Status</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  {words.length === 0 ? "No words yet — add your first one!" : "No matching words."}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((w) => {
              const tag = tags.find((t) => t.id === w.tag_id);
              const meta = STATUS_META[w.status];
              return (
                <TableRow
                  key={w.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedId(w.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {w.is_favorite && <Star className="h-3 w-3 fill-primary text-primary" />}
                      <span className="font-semibold">{w.word}</span>
                      {w.ipa && <span className="text-xs text-muted-foreground">{w.ipa}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[420px] truncate text-sm text-muted-foreground">
                    {w.vietnamese_meaning}
                  </TableCell>
                  <TableCell>
                    {tag && (
                      <Badge
                        variant="secondary"
                        style={{ backgroundColor: `${tag.color}22`, color: tag.color, borderColor: `${tag.color}55` }}
                        className="border"
                      >
                        {tag.name}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: meta.bg, color: meta.fg }}
                    >
                      {meta.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button size="icon" variant="ghost" onClick={() => speak(w.word).catch(() => toast.error("TTS failed"))}>
                      <Volume2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        updateMut.mutate({ id: w.id, patch: { is_favorite: !w.is_favorite } })
                      }
                    >
                      <Star className={w.is_favorite ? "h-4 w-4 fill-primary text-primary" : "h-4 w-4"} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Delete "${w.word}"?`)) deleteMut.mutate(w.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>


      <WordDetailsDrawer
        word={selected}
        tags={tags}
        open={!!selected}
        onOpenChange={(o) => !o && setSelectedId(null)}
        onUpdate={(patch) => selected && updateMut.mutate({ id: selected.id, patch })}
        onDelete={() => selected && deleteMut.mutate(selected.id)}
      />

      <SatPreviewSheet
        word={previewSat}
        onOpenChange={(o) => !o && setPreviewSat(null)}
      />

      <PracticePickerDialog open={practiceOpen} onOpenChange={setPracticeOpen} />
    </div>
  );
}



function SatPreviewSheet({
  word,
  onOpenChange,
}: {
  word: SatWord | null;
  onOpenChange: (o: boolean) => void;
}) {
  if (!word) return null;
  return (
    <Sheet open={!!word} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-baseline gap-3">
            <SheetTitle className="text-3xl font-bold">{word.word}</SheetTitle>
            {word.pronunciation && (
              <span className="text-sm text-muted-foreground">{word.pronunciation}</span>
            )}
          </div>
          {word.vietnamese_meaning && (
            <SheetDescription className="text-base font-medium text-foreground">
              {word.vietnamese_meaning}
            </SheetDescription>
          )}
        </SheetHeader>
        <div className="mt-4 space-y-4 text-sm">
          <div className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary inline-block">
            #{word.frequency_rank} in the SAT bank
          </div>
          {word.example_sentence && (
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Example
              </div>
              <p className="rounded-lg bg-muted/40 p-3">{word.example_sentence}</p>
            </div>
          )}
          {word.memory_hint && (
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Memory hint
              </div>
              <p className="rounded-lg border border-dashed p-3 italic text-muted-foreground">
                {word.memory_hint}
              </p>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Tap the + on the chip to add this word to your library.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

