import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Settings, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";

import {
  dailyPicksInfiniteQueryOptions,
  dailyProgressQueryOptions,
} from "@/lib/queries";
import { addDailyPick, type SatWord } from "@/lib/daily-picks.functions";
import { Button } from "@/components/ui/button";

function localDateISO() {
  // en-CA locale gives YYYY-MM-DD in the local timezone
  return new Date().toLocaleDateString("en-CA");
}

export function DailyPicksBar({
  onPreview,
}: {
  onPreview: (w: SatWord) => void;
}) {
  const qc = useQueryClient();
  const [date, setDate] = useState(localDateISO());
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());

  // Roll date at local midnight
  useEffect(() => {
    const iv = setInterval(() => {
      const d = localDateISO();
      setDate((prev) => (prev === d ? prev : d));
    }, 60_000);
    return () => clearInterval(iv);
  }, []);

  const picksQ = useInfiniteQuery(dailyPicksInfiniteQueryOptions());
  const progressQ = useQuery(dailyProgressQueryOptions(date));
  const add = useServerFn(addDailyPick);

  const items = useMemo(
    () => (picksQ.data?.pages.flatMap((p) => p.items) ?? []).filter((it) => !addingIds.has(it.id)),
    [picksQ.data, addingIds],
  );
  const hasMore = picksQ.hasNextPage;
  const goal = progressQ.data?.daily_goal ?? 10;
  const added = progressQ.data?.words_added ?? 0;

  const addMut = useMutation({
    mutationFn: (id: string) => add({ data: { satWordId: id, date } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["words"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["daily-progress"] });
    },
    onError: (e, id) => {
      setAddingIds((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      toast.error(e instanceof Error ? e.message : "Failed to add word");
    },
  });

  function handleAdd(id: string) {
    setAddingIds((prev) => new Set(prev).add(id));
    addMut.mutate(id);
  }

  // Scroll container ref for arrow buttons + infinite scroll sentinel
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchNextPage = picksQ.fetchNextPage;
  const isFetchingNextPage = picksQ.isFetchingNextPage;
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && hasMore && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: scrollerRef.current, rootMargin: "0px 400px 0px 0px", threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, isFetchingNextPage, fetchNextPage, items.length]);

  function scrollBy(dir: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 220, behavior: "smooth" });
  }

  const showEmpty = !picksQ.isLoading && items.length === 0 && !hasMore;

  return (
    <div className="mb-4 rounded-2xl border border-border/70 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <h2 className="text-sm font-semibold">Daily Picks</h2>
          <span className="text-xs text-muted-foreground">
            {added} / {goal} added today
          </span>
        </div>
        <Link
          to="/settings"
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <Settings className="h-3.5 w-3.5" />
          Daily goal: {goal}
        </Link>
      </div>

      {showEmpty ? (
        <div className="py-3 text-center text-sm text-muted-foreground">
          You've added every word 🎉
        </div>
      ) : (
        <div className="relative">
          <button
            aria-label="Scroll left"
            onClick={() => scrollBy(-1)}
            className="absolute left-1 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white/95 shadow-sm transition hover:bg-white sm:flex"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            aria-label="Scroll right"
            onClick={() => scrollBy(1)}
            className="absolute right-1 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white/95 shadow-sm transition hover:bg-white sm:flex"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div
            ref={scrollerRef}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto py-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] sm:snap-none sm:gap-2.5 sm:px-9 [&::-webkit-scrollbar]:hidden"
          >
            <AnimatePresence initial={false} mode="popLayout">
              {items.map((w) => (
                <Chip
                  key={w.id}
                  word={w}
                  onPreview={() => onPreview(w)}
                  onAdd={() => handleAdd(w.id)}
                />
              ))}
            </AnimatePresence>

            {picksQ.isFetchingNextPage || picksQ.isLoading
              ? Array.from({ length: 4 }).map((_, i) => <ShimmerChip key={`s${i}`} />)
              : null}

            <div ref={sentinelRef} className="h-1 w-1 shrink-0" />
          </div>
        </div>
      )}
    </div>
  );
}


function Chip({
  word,
  onPreview,
  onAdd,
}: {
  word: SatWord;
  onPreview: () => void;
  onAdd: () => void;
}) {
  const [flashing, setFlashing] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="relative w-[78vw] max-w-[300px] shrink-0 snap-center sm:w-[188px] sm:snap-align-none"
    >
      <button
        type="button"
        onClick={onPreview}
        className={`group relative flex h-[120px] w-full flex-col justify-between overflow-hidden rounded-xl p-4 text-left text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md sm:h-[104px] sm:p-3 ${
          flashing ? "ring-2 ring-emerald-300" : ""
        }`}
        style={{
          background: flashing
            ? "linear-gradient(135deg,#10B981,#34D399)"
            : "linear-gradient(135deg,#6D3FEC,#8B5CF6)",
        }}
      >
        <div className="min-w-0 pr-12">
          <div className="truncate text-lg font-semibold leading-tight sm:text-base">{word.word}</div>
          {word.pronunciation && (
            <div className="truncate text-xs font-normal text-white/80 sm:text-[11px]">
              {word.pronunciation}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[11px] font-medium uppercase tracking-wide text-white/80 sm:text-[10px]">
            {word.frequency_rank === 1
              ? "#1 Most common"
              : `#${word.frequency_rank}`}
          </span>
        </div>
      </button>
      <button
        type="button"
        aria-label={`Add ${word.word}`}
        onClick={(e) => {
          e.stopPropagation();
          setFlashing(true);
          setTimeout(onAdd, 180);
        }}
        className="absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary shadow transition hover:scale-110 sm:h-7 sm:w-7"
      >
        {flashing ? <Check className="h-5 w-5 sm:h-3.5 sm:w-3.5" /> : <Plus className="h-5 w-5 sm:h-3.5 sm:w-3.5" />}
      </button>
    </motion.div>
  );
}

function ShimmerChip() {
  return (
    <div className="h-[120px] w-[78vw] max-w-[300px] shrink-0 animate-pulse rounded-xl bg-muted sm:h-[104px] sm:w-[188px]" />
  );
}

