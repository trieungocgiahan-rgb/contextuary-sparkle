import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { X, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Volume2, Sparkles, Clock } from "lucide-react";

import { wordsQueryOptions, fallbackWordsQueryOptions, profileQueryOptions } from "@/lib/queries";
import { buildQuiz, QUIZ_TYPE_LABELS, type QuizQuestion, type QuizType } from "@/lib/quiz-engine";
import { loadSession, clearSession } from "@/lib/practice-session";
import { saveQuizResult, type StatusChange } from "@/lib/vocab.api";
import { speakText, cancelSpeech } from "@/lib/speech";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/practice/quiz")({
  head: () => ({
    meta: [
      { title: "Quiz — Contextuary" },
      { name: "description", content: "Practice your SAT vocabulary with mixed question types." },
    ],
  }),
  component: QuizPage,
});

type Answer = { question: QuizQuestion; picked: number | null };

function QuizPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const cfg = useMemo(() => (typeof window !== "undefined" ? loadSession() : null), []);
  const { data: allWords = [] } = useQuery(wordsQueryOptions());
  const { data: fallback = [] } = useQuery(fallbackWordsQueryOptions());
  const { data: profile } = useQuery(profileQueryOptions());
  const save = saveQuizResult;

  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [idx, setIdx] = useState(0);
  const [ended, setEnded] = useState<{ changes: StatusChange[]; elapsedMs: number } | null>(null);
  const startedAt = useRef<number>(0);
  const [now, setNow] = useState(0);

  // Build session
  useEffect(() => {
    if (!cfg || cfg.type !== "quiz" || cfg.mode !== "standard") return;
    if (!allWords.length) return;

    // Resolve scope
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
    const qs = buildQuiz({
      words: pool,
      library: allWords,
      fallback: fallback.map((f) => ({
        word: f.word,
        vietnamese_meaning: f.vietnamese_meaning,
        part_of_speech: f.part_of_speech,
      })),
      enabledTypes: cfg.quizTypes as QuizType[],
      count: cfg.size,
    });
    if (!qs.length) {
      toast.error("Not enough content to build a quiz. Add more words or enable more types.");
      navigate({ to: "/words" });
      return;
    }
    setQuestions(qs);
    setAnswers(qs.map((q) => ({ question: q, picked: null })));
    setIdx(0);
    startedAt.current = Date.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg?.type, cfg?.mode, allWords.length, fallback.length]);

  // Count-up timer
  useEffect(() => {
    if (!questions || ended) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [questions, ended]);

  // Autoplay for listen questions
  useEffect(() => {
    if (!questions || ended) return;
    const q = questions[idx];
    if (q?.type === "listen" && q.play_audio) {
      const t = setTimeout(() => speakText(q.play_audio!), 200);
      return () => clearTimeout(t);
    }
  }, [idx, questions, ended]);

  useEffect(() => () => cancelSpeech(), []);

  if (!cfg) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No practice session yet.</p>
        <Button className="mt-4" onClick={() => navigate({ to: "/practice" })}>Set up a session</Button>
      </div>
    );
  }

  if (!questions) {
    return <div className="p-8 text-center text-muted-foreground">Building your quiz…</div>;
  }

  if (ended) {
    return <EndScreen answers={answers} elapsedMs={ended.elapsedMs} changes={ended.changes} />;
  }

  const q = questions[idx];
  const a = answers[idx];
  const showFeedback = a.picked !== null;
  const correct = showFeedback && a.picked === q.answer_index;
  const elapsed = Math.floor((now - startedAt.current) / 1000);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const progress = ((idx + (showFeedback ? 1 : 0)) / questions.length) * 100;

  function pick(i: number) {
    if (showFeedback) return;
    setAnswers((prev) => prev.map((x, k) => (k === idx ? { ...x, picked: i } : x)));
  }

  async function finish() {
    const results = answers.map((x) => ({
      word_id: x.question.word_id,
      correct: x.picked === x.question.answer_index,
      question_type: x.question.type,
    }));
    try {
      const r = await save({ data: { results } });
      qc.invalidateQueries({ queryKey: ["words"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      setEnded({ changes: r.changes, elapsedMs: Date.now() - startedAt.current });
      clearSession();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  }

  function next() {
    if (idx + 1 >= questions!.length) return finish();
    setIdx(idx + 1);
  }

  const filled = q.filled_sentence ?? (q.type === "closest_meaning"
    ? `${q.word} ≈ ${q.options[q.answer_index]}`
    : `${q.word} — ${q.vietnamese_meaning ?? ""}`);

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-2xl flex-col px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+96px)] sm:pb-6 lg:p-6">
      {/* Top bar */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <Button size="icon" variant="ghost" aria-label="Exit session" onClick={() => {
          if (confirm("Exit this session? Progress will be lost.")) {
            clearSession();
            navigate({ to: "/words" });
          }
        }}>
          <X className="h-5 w-5" />
        </Button>
        <div className="text-sm text-muted-foreground">
          {idx + 1} / {questions.length}
        </div>
        {profile?.show_timer !== false && (
          <div className="flex items-center gap-1 text-sm tabular-nums text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> {mm}:{ss}
          </div>
        )}
        {profile?.show_timer === false && <div className="w-8" />}
      </div>
      <Progress value={progress} className="mb-5" />

      <div className="rounded-2xl bg-card p-4 shadow-sm sm:p-6">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {QUIZ_TYPE_LABELS[q.type]}
        </div>
        <div className="mb-5 flex items-start gap-3">
          <h2 className="text-xl font-bold leading-relaxed sm:text-2xl">{q.prompt}</h2>
          {q.type === "listen" && (
            <Button size="icon" variant="outline" className="shrink-0" aria-label="Play audio" onClick={() => speakText(q.play_audio!)}>
              <Volume2 className="h-5 w-5" />
            </Button>
          )}
        </div>

        <div className="space-y-2.5">
          {q.options.map((opt, i) => {
            const isCorrect = i === q.answer_index;
            const isPicked = a.picked === i;
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={showFeedback}
                className={cn(
                  "flex min-h-[56px] w-full items-center justify-between gap-3 rounded-xl border p-4 text-left text-base transition active:scale-[0.99] sm:min-h-0 sm:p-3 sm:text-sm",
                  !showFeedback && "hover:border-primary hover:bg-primary/5",
                  showFeedback && isCorrect && "border-emerald-500 bg-emerald-50",
                  showFeedback && isPicked && !isCorrect && "border-rose-500 bg-rose-50",
                  showFeedback && !isCorrect && !isPicked && "opacity-60",
                )}
              >
                <span>{opt}</span>
                {showFeedback && isCorrect && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />}
                {showFeedback && isPicked && !isCorrect && <XCircle className="h-5 w-5 shrink-0 text-rose-600" />}
              </button>
            );
          })}
        </div>

        {showFeedback && (
          <div className="mt-5 rounded-xl border bg-muted/30 p-4 text-sm">
            <div className={cn("mb-2 font-semibold", correct ? "text-emerald-700" : "text-rose-700")}>
              {correct ? "Correct" : "Incorrect"}
            </div>
            {filled && (
              <p className="mb-2 leading-relaxed">
                <span className="font-semibold">{q.word}</span> — {filled}
              </p>
            )}
            {q.vietnamese_meaning && (
              <p className="mb-1 text-muted-foreground">{q.vietnamese_meaning}</p>
            )}
            {q.memory_hint && (
              <p className="text-xs italic text-muted-foreground">💡 {q.memory_hint}</p>
            )}
            <div className="mt-3">
              <Button size="sm" variant="outline" onClick={() => speakText(filled ?? q.word)}>
                <Volume2 className="mr-1.5 h-3.5 w-3.5" /> Listen to sentence
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-border/60 bg-background/95 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur sm:static sm:mt-4 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <Button variant="ghost" onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Previous
        </Button>
        <Button onClick={next} disabled={!showFeedback} className="min-w-[140px] flex-1 sm:flex-none">
          {idx + 1 >= questions.length ? "Finish" : "Next"} <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}


function EndScreen({ answers, elapsedMs, changes }: { answers: Answer[]; elapsedMs: number; changes: StatusChange[] }) {
  const navigate = useNavigate();
  const total = answers.length;
  const score = answers.filter((a) => a.picked === a.question.answer_index).length;
  const pct = Math.round((score / total) * 100);
  const minutes = Math.floor(elapsedMs / 60000);
  const seconds = Math.floor((elapsedMs % 60000) / 1000);
  const missed = answers.filter((a) => a.picked !== a.question.answer_index);

  const byType = new Map<QuizType, number>();
  for (const a of answers) byType.set(a.question.type, (byType.get(a.question.type) ?? 0) + 1);

  const movedByStatus = new Map<string, number>();
  for (const c of changes) {
    if (c.to === "mastered") movedByStatus.set("mastered", (movedByStatus.get("mastered") ?? 0) + 1);
    else movedByStatus.set(c.to, (movedByStatus.get(c.to) ?? 0) + 1);
  }

  function retryWrong() {
    // Just navigate — user re-picks from picker
    navigate({ to: "/words" });
    toast.info("Open Practice → Selected words to retry only the missed ones");
  }

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-8">
      <div className="mb-6 text-center">
        <Sparkles className="mx-auto mb-2 h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold">Session complete</h1>
      </div>

      <div className="rounded-2xl bg-card p-6 text-center shadow-sm">
        <div className="text-5xl font-bold tabular-nums text-primary">
          {score} / {total}
        </div>
        <div className="mt-1 text-sm text-muted-foreground">({pct}%)</div>
        <div className="mt-3 text-xs text-muted-foreground">
          Time: {minutes > 0 ? `${minutes}m ` : ""}{seconds}s
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-card p-6 shadow-sm">
        <div className="mb-3 text-sm font-semibold">Question types</div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {Array.from(byType.entries()).map(([t, c]) => (
            <div key={t} className="flex justify-between rounded-lg bg-muted/30 px-3 py-1.5">
              <span>{QUIZ_TYPE_LABELS[t]}</span>
              <span className="text-muted-foreground">{c}</span>
            </div>
          ))}
        </div>
      </div>

      {changes.length > 0 && (
        <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-6">
          <div className="mb-2 text-sm font-semibold text-primary">Library updates</div>
          <p className="text-sm text-muted-foreground">
            {Array.from(movedByStatus.entries())
              .map(([s, c]) => `${c} word${c === 1 ? "" : "s"} ${s === "mastered" ? "reached Mastered" : `moved to ${s.charAt(0).toUpperCase() + s.slice(1)}`}`)
              .join(" · ")}
          </p>
        </div>
      )}

      {missed.length > 0 && (
        <div className="mt-4 rounded-2xl bg-card p-6 shadow-sm">
          <div className="mb-3 text-sm font-semibold">Missed words ({missed.length})</div>
          <div className="space-y-1.5">
            {Array.from(new Map(missed.map((m) => [m.question.word_id, m.question.word])).values()).map((w) => (
              <div key={w} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm">
                <span className="font-medium">{w}</span>
                <Button size="sm" variant="ghost" onClick={() => navigate({ to: "/words" })}>
                  Review
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {missed.length > 0 && <Button onClick={retryWrong}>Retry wrong answers</Button>}
        <Button variant="outline" onClick={() => navigate({ to: "/words" })}>Back to My Words</Button>
      </div>
    </div>
  );
}
