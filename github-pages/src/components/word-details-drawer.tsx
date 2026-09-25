import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Volume2, Star, Trash2 } from "lucide-react";
import { STATUS_OPTIONS, STATUS_META } from "@/lib/vocab";
import type { WordRow } from "@/lib/vocab.api";
import { toast } from "sonner";
import { speak } from "@/lib/tts";
import { useIsMobile } from "@/hooks/use-mobile";

type Tag = { id: string; name: string; color: string };

export function WordDetailsDrawer({
  word,
  tags,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: {
  word: WordRow | null;
  tags: Tag[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onUpdate: (patch: Partial<WordRow>) => void;
  onDelete: () => void;
}) {
  const isMobile = useIsMobile();
  if (!word) return null;
  const tag = tags.find((t) => t.id === word.tag_id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile
            ? "h-[92dvh] w-full overflow-y-auto rounded-t-3xl px-5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-6 [&>button]:h-11 [&>button]:w-11 [&>button]:top-3 [&>button]:right-3 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:bg-muted"
            : "w-full overflow-y-auto sm:max-w-lg"
        }
      >
        <SheetHeader>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pr-12">
            <SheetTitle className="text-3xl font-bold">{word.word}</SheetTitle>
            {word.ipa && <span className="text-sm text-muted-foreground">{word.ipa}</span>}
          </div>
          <SheetDescription className="text-base font-medium text-foreground">
            {word.vietnamese_meaning}
          </SheetDescription>
        </SheetHeader>


        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => speak(word.word).catch(() => toast.error("TTS failed"))}>
            <Volume2 className="mr-1 h-4 w-4" /> Pronounce
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpdate({ is_favorite: !word.is_favorite })}
          >
            <Star className={word.is_favorite ? "mr-1 h-4 w-4 fill-primary text-primary" : "mr-1 h-4 w-4"} />
            {word.is_favorite ? "Favorited" : "Favorite"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-destructive"
            onClick={() => {
              if (confirm(`Delete "${word.word}"?`)) onDelete();
            }}
          >
            <Trash2 className="mr-1 h-4 w-4" /> Delete
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
            <Select value={word.status} onValueChange={(v) => onUpdate({ status: v as WordRow["status"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Tag</label>
            <Select
              value={word.tag_id ?? "none"}
              onValueChange={(v) => onUpdate({ tag_id: v === "none" ? null : v })}
            >
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {tags.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {word.nuance_note && (
          <Section title="Nuance">
            <p className="text-sm leading-relaxed text-muted-foreground">{word.nuance_note}</p>
          </Section>
        )}

        {word.examples.length > 0 && (
          <Section title="SAT-style examples">
            <ol className="space-y-2">
              {word.examples.map((e, i) => (
                <li key={i} className="rounded-lg bg-muted/40 p-3 text-sm">
                  {highlightWord(e, word.word)}
                </li>
              ))}
            </ol>
          </Section>
        )}

        {word.collocations.length > 0 && (
          <Section title="Common collocations">
            <div className="flex flex-wrap gap-1.5">
              {word.collocations.map((c, i) => (
                <Badge key={i} variant="secondary">{c}</Badge>
              ))}
            </div>
          </Section>
        )}

        {(word.synonyms.length > 0 || word.antonyms.length > 0) && (
          <Section title="Synonyms & antonyms">
            {word.synonyms.length > 0 && (
              <div className="mb-2">
                <div className="mb-1 text-xs font-medium text-muted-foreground">Synonyms</div>
                <div className="flex flex-wrap gap-1.5">
                  {word.synonyms.map((s, i) => (
                    <Badge key={i} className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
            {word.antonyms.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">Antonyms</div>
                <div className="flex flex-wrap gap-1.5">
                  {word.antonyms.map((s, i) => (
                    <Badge key={i} className="bg-rose-100 text-rose-800 hover:bg-rose-100">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
          </Section>
        )}

        {word.memory_hint && (
          <Section title="Memory hint">
            <p className="rounded-lg border border-dashed p-3 text-sm italic text-muted-foreground">
              {word.memory_hint}
            </p>
          </Section>
        )}

        {tag && (
          <div className="mt-4 text-xs text-muted-foreground">
            Tagged as <Badge variant="outline" style={{ color: tag.color, borderColor: tag.color }}>{tag.name}</Badge>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function highlightWord(sentence: string, word: string) {
  const re = new RegExp(`(${word})`, "gi");
  const parts = sentence.split(re);
  return parts.map((p, i) =>
    p.toLowerCase() === word.toLowerCase() ? (
      <strong key={i} className="text-primary">{p}</strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}
