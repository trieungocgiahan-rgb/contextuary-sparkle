import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Zap, Info } from "lucide-react";

import { wordsQueryOptions } from "@/lib/queries";
import { QUIZ_TYPE_LABELS, type QuizType } from "@/lib/quiz-engine";
import {
  saveSession,
  type PracticeMode,
  type PracticeType,
  type SessionConfig,
  type WordScope,
} from "@/lib/practice-session";
import { STATUS_OPTIONS, STATUS_META } from "@/lib/vocab";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";


const ALL_QUIZ_TYPES: QuizType[] = [
  "word_meaning",
  "meaning_word",
  "cloze",
  "collocation",
  "closest_meaning",
  "listen",
];

const SIZES: (10 | 20 | 50 | "all")[] = [10, 20, 50, "all"];

export function PracticePickerDialog({
  open,
  onOpenChange,
  selectedIds = [],
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  selectedIds?: string[];
}) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: words = [] } = useQuery(wordsQueryOptions());


  const [mode, setMode] = useState<PracticeMode>("standard");
  const [type, setType] = useState<PracticeType>("quiz");
  const [scopeKind, setScopeKind] = useState<WordScope["kind"]>(
    selectedIds.length ? "selected" : "all",
  );
  const [statuses, setStatuses] = useState<Set<"new" | "learning" | "reviewing" | "mastered">>(
    new Set(["new", "learning"]),
  );
  const [size, setSize] = useState<10 | 20 | 50 | "all">(20);
  const [quizTypes, setQuizTypes] = useState<Set<QuizType>>(new Set(ALL_QUIZ_TYPES));

  const resolvedScope: WordScope = useMemo(() => {
    if (scopeKind === "selected") return { kind: "selected", ids: selectedIds };
    if (scopeKind === "today") return { kind: "today" };
    if (scopeKind === "all") return { kind: "all" };
    if (scopeKind === "favorites") return { kind: "favorites" };
    return { kind: "status", statuses: Array.from(statuses) };
  }, [scopeKind, selectedIds, statuses]);

  const eligible = useMemo(() => {
    if (resolvedScope.kind === "selected") {
      const set = new Set(resolvedScope.ids);
      return words.filter((w) => set.has(w.id));
    }
    if (resolvedScope.kind === "today") {
      const today = new Date().toISOString().slice(0, 10);
      return words.filter((w) => w.created_at.slice(0, 10) === today);
    }
    if (resolvedScope.kind === "favorites") return words.filter((w) => w.is_favorite);
    if (resolvedScope.kind === "status")
      return words.filter((w) => resolvedScope.statuses.includes(w.status));
    return words;
  }, [words, resolvedScope]);

  const canStart = eligible.length > 0 && (type === "flashcards" || quizTypes.size > 0);
  const effectiveMax = mode === "ai" ? 10 : (size === "all" ? eligible.length : size);

  function start() {
    const cfg: SessionConfig = {
      mode,
      type: mode === "ai" ? "quiz" : type,
      scope: resolvedScope,
      size: mode === "ai" ? 10 : size,
      quizTypes: Array.from(quizTypes),
    };
    saveSession(cfg);
    onOpenChange(false);
    if (mode === "ai") navigate({ to: "/practice/ai" });
    else if (type === "flashcards") navigate({ to: "/practice/flashcards" });
    else navigate({ to: "/practice/quiz" });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-2xl",
          isMobile &&
            "left-0 top-0 flex h-[100dvh] max-h-[100dvh] max-w-none translate-x-0 translate-y-0 flex-col rounded-none p-5 pb-[calc(env(safe-area-inset-bottom)+16px)]",
        )}
      >
        <DialogHeader>
          <DialogTitle>Start practice</DialogTitle>
        </DialogHeader>

        <div className={cn("space-y-5", isMobile && "flex-1 overflow-y-auto pb-2")}>

          {/* MODE */}
          <div>
            <Label>Mode</Label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <ModeCard
                active={mode === "standard"}
                onClick={() => setMode("standard")}
                title="Practice"
                subtitle="Instant · Unlimited"
                icon={<Sparkles className="h-4 w-4" />}
              />
              <ModeCard
                active={mode === "ai"}
                onClick={() => setMode("ai")}
                title="AI Challenge"
                subtitle="Harder · Fresh each time"
                icon={<Zap className="h-4 w-4" />}
                badge="AI"
              />
            </div>
            {mode === "ai" && (
              <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3 w-3 shrink-0" />
                AI Challenge is capped at 10 questions and takes a moment to generate.
              </p>
            )}
          </div>

          {/* TYPE */}
          {mode === "standard" && (
            <div>
              <Label>Type</Label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <SegBtn active={type === "quiz"} onClick={() => setType("quiz")}>
                  Quiz
                </SegBtn>
                <SegBtn active={type === "flashcards"} onClick={() => setType("flashcards")}>
                  Flashcards
                </SegBtn>
              </div>
            </div>
          )}

          {/* WHICH WORDS */}
          <div>
            <Label>Which words</Label>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {selectedIds.length > 0 && (
                <SegBtn active={scopeKind === "selected"} onClick={() => setScopeKind("selected")}>
                  Selected ({selectedIds.length})
                </SegBtn>
              )}
              <SegBtn active={scopeKind === "today"} onClick={() => setScopeKind("today")}>
                Today's new
              </SegBtn>
              <SegBtn active={scopeKind === "all"} onClick={() => setScopeKind("all")}>
                All words
              </SegBtn>
              <SegBtn active={scopeKind === "favorites"} onClick={() => setScopeKind("favorites")}>
                Favorites
              </SegBtn>
              <SegBtn active={scopeKind === "status"} onClick={() => setScopeKind("status")}>
                By status
              </SegBtn>
            </div>
            {scopeKind === "status" && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((s) => {
                  const active = statuses.has(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        const next = new Set(statuses);
                        if (active) next.delete(s); else next.add(s);
                        setStatuses(next);
                      }}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition",
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      {STATUS_META[s].label}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="mt-1.5 text-xs text-muted-foreground">
              {eligible.length} words match your selection.
            </p>
          </div>

          {/* SIZE */}
          <div>
            <Label>How many</Label>
            <div className="mt-1.5 grid grid-cols-4 gap-2">
              {SIZES.map((n) => (
                <SegBtn
                  key={String(n)}
                  active={size === n}
                  onClick={() => setSize(n)}
                  disabled={mode === "ai" && n !== 10}
                >
                  {n === "all" ? "All" : n}
                </SegBtn>
              ))}
            </div>
          </div>

          {/* QUIZ TYPES */}
          {mode === "standard" && type === "quiz" && (
            <div>
              <Label>Question types</Label>
              <div className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {ALL_QUIZ_TYPES.map((t) => (
                  <label
                    key={t}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={quizTypes.has(t)}
                      onCheckedChange={(v) => {
                        const next = new Set(quizTypes);
                        if (v) next.add(t); else next.delete(t);
                        setQuizTypes(next);
                      }}
                    />
                    <span>{QUIZ_TYPE_LABELS[t]}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              {canStart
                ? `Ready — up to ${effectiveMax} question${effectiveMax === 1 ? "" : "s"}.`
                : "Pick at least one word and one question type."}
            </span>
            <Button onClick={start} disabled={!canStart}>
              Start
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</div>;
}

function SegBtn({
  active, onClick, children, disabled,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-lg border px-3 py-2 text-sm font-medium transition",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-background hover:border-primary/40 hover:bg-muted",
        disabled && "opacity-40 pointer-events-none",
      )}
    >
      {children}
    </button>
  );
}

function ModeCard({
  active, onClick, title, subtitle, icon, badge,
}: {
  active: boolean; onClick: () => void; title: string; subtitle: string;
  icon: React.ReactNode; badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition",
        active
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:border-primary/40",
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {icon} {title}
        </div>
        {badge && (
          <span className="rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
      </div>
      <div className="text-xs text-muted-foreground">{subtitle}</div>
    </button>
  );
}
