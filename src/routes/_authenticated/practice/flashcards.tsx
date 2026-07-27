import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import { X, Volume2 } from "lucide-react";

import { wordsQueryOptions } from "@/lib/queries";
import { loadSession, clearSession } from "@/lib/practice-session";
import type { WordRow } from "@/lib/vocab.functions";
import { speakText, cancelSpeech } from "@/lib/speech";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/practice/flashcards")({
  head: () => ({
    meta: [{ title: "Flashcards — Contextuary" }],
  }),
  component: FlashcardsPage,
});

function FlashcardsPage() {
  const navigate = useNavigate();
  const cfg = useMemo(() => (typeof window !== "undefined" ? loadSession() : null), []);
  const { data: allWords = [] } = useQuery(wordsQueryOptions());

  const [deck, setDeck] = useState<WordRow[] | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<WordRow[]>([]);
  const [unknown, setUnknown] = useState<WordRow[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!cfg || !allWords.length) return;
    let pool = allWords;
    const s = cfg.scope;
    if (s.kind === "selected") pool = allWords.filter((w) => s.ids.includes(w.id));
    else if (s.kind === "today") {
      const t = new Date().toISOString().slice(0, 10);
      pool = allWords.filter((w) => w.created_at.slice(0, 10) === t);
    } else if (s.kind === "favorites") pool = allWords.filter((w) => w.is_favorite);
    else if (s.kind === "status") pool = allWords.filter((w) => s.statuses.includes(w.status));

    if (!pool.length) {
      toast.error("No words in that selection");
      navigate({ to: "/words" });
      return;
    }
    const shuffled = pool.slice().sort(() => Math.random() - 0.5);
    const size = cfg.size === "all" ? shuffled.length : cfg.size;
    const d = shuffled.slice(0, size);
    setDeck(d);
    setTotal(d.length);
    setKnown([]);
    setUnknown([]);
    setFlipped(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg?.type, allWords.length]);

  const card = deck && deck.length ? deck[0] : null;

  const flip = useCallback(() => setFlipped((f) => !f), []);
  const markKnown = useCallback(() => {
    if (!card || !deck) return;
    setKnown((k) => [...k, card]);
    setDeck(deck.slice(1));
    setFlipped(false);
  }, [card, deck]);
  const markUnknown = useCallback(() => {
    if (!card || !deck) return;
    setUnknown((u) => [...u, card]);
    setDeck([...deck.slice(1), card]);
    setFlipped(false);
  }, [card, deck]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === " ") { e.preventDefault(); flip(); }
      else if (e.key === "1" || e.key === "ArrowLeft") markUnknown();
      else if (e.key === "2" || e.key === "ArrowRight") markKnown();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flip, markKnown, markUnknown]);

  useEffect(() => () => cancelSpeech(), []);

  if (!cfg) {
    return <div className="p-8 text-center text-muted-foreground">No session.</div>;
  }
  if (!deck) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;

  if (!card) {
    const uniqueUnknown = Array.from(new Map(unknown.map((w) => [w.id, w])).values())
      .filter((w) => !known.some((k) => k.id === w.id));
    function again() {
      setDeck(uniqueUnknown.slice().sort(() => Math.random() - 0.5));
      setTotal(uniqueUnknown.length);
      setKnown([]);
      setUnknown([]);
    }
    return (
      <div className="mx-auto max-w-xl p-6 lg:p-8 text-center">
        <h1 className="mb-2 text-2xl font-bold">Nice work</h1>
        <p className="mb-6 text-muted-foreground">You've been through the deck.</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-emerald-50 p-4">
            <div className="text-3xl font-bold text-emerald-700">{known.length}</div>
            <div className="text-xs text-emerald-800">Đã nhớ</div>
          </div>
          <div className="rounded-2xl bg-rose-50 p-4">
            <div className="text-3xl font-bold text-rose-700">{uniqueUnknown.length}</div>
            <div className="text-xs text-rose-800">Chưa nhớ</div>
          </div>
        </div>
        <div className="mt-6 flex justify-center gap-2">
          {uniqueUnknown.length > 0 && <Button onClick={again}>Practice the unknown ones again</Button>}
          <Button variant="outline" onClick={() => { clearSession(); navigate({ to: "/words" }); }}>
            Back to My Words
          </Button>
        </div>
      </div>
    );
  }

  const progress = ((total - deck.length) / total) * 100;

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col p-4 lg:p-6">
      <div className="mb-3 flex items-center justify-between gap-4">
        <Button size="icon" variant="ghost" onClick={() => {
          if (confirm("Exit this session?")) { clearSession(); navigate({ to: "/words" }); }
        }}>
          <X className="h-4 w-4" />
        </Button>
        <div className="text-sm text-muted-foreground">
          {total - deck.length} / {total}
        </div>
        <div className="w-8" />
      </div>
      <Progress value={progress} className="mb-6" />

      <button
        type="button"
        onClick={flip}
        className={cn(
          "relative flex min-h-[380px] w-full items-center justify-center rounded-3xl border bg-card p-8 shadow-sm transition",
          "hover:shadow-md",
        )}
      >
        {!flipped ? (
          <div className="text-center">
            <div className="mb-2 text-4xl font-bold">{card.word}</div>
            {card.ipa && <div className="mb-3 text-sm text-muted-foreground">{card.ipa}</div>}
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); speakText(card.word); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); speakText(card.word); } }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs hover:bg-muted"
            >
              <Volume2 className="h-3.5 w-3.5" /> Listen
            </div>
            <div className="mt-6 text-xs uppercase tracking-wider text-muted-foreground">Tap to flip · Space</div>
          </div>
        ) : (
          <div className="w-full text-center">
            <div className="mb-3 text-2xl font-semibold text-primary">
              {card.vietnamese_meaning ?? "—"}
            </div>
            {card.examples?.[0] && (
              <p className="mb-3 text-base leading-relaxed">{card.examples[0]}</p>
            )}
            {card.memory_hint && (
              <p className="text-sm italic text-muted-foreground">💡 {card.memory_hint}</p>
            )}
          </div>
        )}
      </button>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          size="lg"
          className="border-rose-200 text-rose-700 hover:bg-rose-50"
          onClick={markUnknown}
        >
          Chưa nhớ <span className="ml-2 text-xs opacity-60">1 · ←</span>
        </Button>
        <Button
          size="lg"
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={markKnown}
        >
          Đã nhớ <span className="ml-2 text-xs opacity-80">2 · →</span>
        </Button>
      </div>
    </div>
  );
}
