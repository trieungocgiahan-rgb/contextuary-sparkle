import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { X, Zap, Loader2, CheckCircle2, XCircle } from "lucide-react";

import { wordsQueryOptions } from "@/lib/queries";
import { loadSession, clearSession } from "@/lib/practice-session";
import {
  generatePassage,
  evaluateSentence,
  generateMisusePair,
  type PassageChallenge,
  type SentenceEval,
  type MisuseChallenge,
} from "@/lib/ai-challenge.api";
import type { WordRow } from "@/lib/vocab.api";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/practice/ai")({
  head: () => ({ meta: [{ title: "AI Challenge — Contextuary" }] }),
  component: AiChallengePage,
});

type Step =
  | { kind: "passage"; data: PassageChallenge; qIdx: number; picked: number | null }
  | { kind: "misuse"; word: string; data: MisuseChallenge | null; picked: number | null }
  | { kind: "write"; word: string; sentence: string; result: SentenceEval | null };

function AiChallengePage() {
  const navigate = useNavigate();
  const cfg = useMemo(() => (typeof window !== "undefined" ? loadSession() : null), []);
  const { data: allWords = [] } = useQuery(wordsQueryOptions());

  const [steps, setSteps] = useState<Step[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const gPassage = generatePassage;
  const gMisuse = generateMisusePair;
  const gEval = evaluateSentence;

  useEffect(() => {
    if (!cfg || cfg.mode !== "ai" || !allWords.length) return;

    let pool: WordRow[] = allWords;
    const s = cfg.scope;
    if (s.kind === "selected") pool = allWords.filter((w) => s.ids.includes(w.id));
    else if (s.kind === "today") {
      const t = new Date().toISOString().slice(0, 10);
      pool = allWords.filter((w) => w.created_at.slice(0, 10) === t);
    } else if (s.kind === "favorites") pool = allWords.filter((w) => w.is_favorite);
    else if (s.kind === "status") pool = allWords.filter((w) => s.statuses.includes(w.status));

    if (pool.length < 3) {
      toast.error("AI Challenge needs at least 3 words in the selection.");
      navigate({ to: "/words" });
      return;
    }

    const shuffled = pool.slice().sort(() => Math.random() - 0.5);
    const cap = 10;
    const built: Step[] = [];

    // 1 passage (3-5 words) contributes N comprehension questions
    const passageWords = shuffled.slice(0, Math.min(5, Math.max(3, Math.floor(shuffled.length / 2))));
    setLoading(true);
    gPassage({ data: { wordIds: passageWords.map((w) => w.id) } })
      .then((p) => {
        built.push({ kind: "passage", data: p, qIdx: 0, picked: null });
        // Add misuse + write for remaining slots
        let i = 0;
        while (built.length + (p.questions.length - 1) < cap && i < shuffled.length) {
          const w = shuffled[i++];
          if (passageWords.some((pw) => pw.id === w.id)) continue;
          if (built.length % 2 === 0) built.push({ kind: "write", word: w.word, sentence: "", result: null });
          else built.push({ kind: "misuse", word: w.word, data: null, picked: null });
          if (built.length + (p.questions.length - 1) >= cap) break;
        }
        setSteps(built);
        setLoading(false);
      })
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "AI failed");
        navigate({ to: "/words" });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg?.mode, allWords.length]);

  if (!cfg) return <div className="p-8 text-center text-muted-foreground">No session.</div>;
  if (loading || !steps.length) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Generating your AI Challenge…</p>
          <p className="text-xs text-muted-foreground/70">This takes a few seconds.</p>
        </div>
      </div>
    );
  }

  if (done) {
    const totalQ = steps.reduce(
      (a, s) => a + (s.kind === "passage" ? s.data.questions.length : 1),
      0,
    );
    return (
      <div className="mx-auto max-w-xl p-6 text-center">
        <Zap className="mx-auto mb-3 h-10 w-10 text-primary" />
        <h1 className="mb-2 text-3xl font-bold">Challenge complete</h1>
        <p className="mb-6 text-muted-foreground">
          You scored {score} of {totalQ}.
        </p>
        <div className="flex justify-center gap-2">
          <Button onClick={() => { clearSession(); navigate({ to: "/words" }); }}>Back to My Words</Button>
        </div>
      </div>
    );
  }

  const step = steps[idx];
  const totalSteps = steps.length;
  const progress = (idx / totalSteps) * 100;

  function advance(gotPoint: boolean) {
    if (gotPoint) setScore((s) => s + 1);
    if (idx + 1 >= steps.length) setDone(true);
    else setIdx(idx + 1);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col p-4 lg:p-6">
      <div className="mb-3 flex items-center justify-between">
        <Button size="icon" variant="ghost" onClick={() => {
          if (confirm("Exit AI Challenge?")) { clearSession(); navigate({ to: "/words" }); }
        }}>
          <X className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Zap className="h-3.5 w-3.5 text-primary" />
          Step {idx + 1} of {totalSteps}
        </div>
        <div className="w-8" />
      </div>
      <Progress value={progress} className="mb-6" />

      {step.kind === "passage" && (
        <PassageStep
          step={step}
          onDone={(pts) => advance(pts > 0)}
          onUpdate={(s) => setSteps((all) => all.map((x, k) => (k === idx ? s : x)))}
          setScore={setScore}
        />
      )}
      {step.kind === "misuse" && (
        <MisuseStep
          step={step}
          gMisuse={gMisuse}
          onUpdate={(s) => setSteps((all) => all.map((x, k) => (k === idx ? s : x)))}
          onDone={(ok) => advance(ok)}
        />
      )}
      {step.kind === "write" && (
        <WriteStep
          step={step}
          gEval={gEval}
          onUpdate={(s) => setSteps((all) => all.map((x, k) => (k === idx ? s : x)))}
          onDone={(ok) => advance(ok)}
        />
      )}
    </div>
  );
}

function PassageStep({
  step, onDone, onUpdate, setScore,
}: {
  step: Extract<Step, { kind: "passage" }>;
  onDone: (points: number) => void;
  onUpdate: (s: Extract<Step, { kind: "passage" }>) => void;
  setScore: (u: (s: number) => number) => void;
}) {
  const q = step.data.questions[step.qIdx];
  const showFeedback = step.picked !== null;
  const correct = step.picked === q.answer_index;

  function pick(i: number) {
    if (showFeedback) return;
    onUpdate({ ...step, picked: i });
    if (i === q.answer_index) setScore((s) => s + 1);
  }
  function next() {
    if (step.qIdx + 1 >= step.data.questions.length) onDone(0);
    else onUpdate({ ...step, qIdx: step.qIdx + 1, picked: null });
  }

  return (
    <div className="rounded-2xl bg-card p-6 shadow-sm">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">Passage in context</div>
      <p className="mb-5 rounded-xl bg-muted/40 p-4 text-sm leading-relaxed">{step.data.passage}</p>
      <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
        Question about: <span className="font-semibold text-foreground">{q.word}</span>
      </div>
      <h3 className="mb-4 text-lg font-semibold">{q.prompt}</h3>
      <div className="space-y-2">
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => pick(i)}
            disabled={showFeedback}
            className={cn(
              "flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm transition",
              !showFeedback && "hover:border-primary hover:bg-primary/5",
              showFeedback && i === q.answer_index && "border-emerald-500 bg-emerald-50",
              showFeedback && step.picked === i && i !== q.answer_index && "border-rose-500 bg-rose-50",
            )}
          >
            <span>{opt}</span>
            {showFeedback && i === q.answer_index && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
            {showFeedback && step.picked === i && i !== q.answer_index && <XCircle className="h-4 w-4 text-rose-600" />}
          </button>
        ))}
      </div>
      {showFeedback && (
        <>
          <div className={cn("mt-4 rounded-lg border p-3 text-sm", correct ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900")}>
            {q.explanation}
          </div>
          <Button className="mt-4 w-full" onClick={next}>
            {step.qIdx + 1 >= step.data.questions.length ? "Continue" : "Next question"}
          </Button>
        </>
      )}
    </div>
  );
}

function MisuseStep({
  step, gMisuse, onUpdate, onDone,
}: {
  step: Extract<Step, { kind: "misuse" }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gMisuse: any;
  onUpdate: (s: Extract<Step, { kind: "misuse" }>) => void;
  onDone: (ok: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (step.data || loading) return;
    setLoading(true);
    gMisuse({ data: { word: step.word } })
      .then((d: MisuseChallenge) => onUpdate({ ...step, data: d }))
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!step.data) {
    return <div className="rounded-2xl bg-card p-8 text-center shadow-sm"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></div>;
  }
  const showFeedback = step.picked !== null;
  const correct = step.picked === step.data.correct_index;
  return (
    <div className="rounded-2xl bg-card p-6 shadow-sm">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">Spot the misuse</div>
      <div className="mb-4 text-sm text-muted-foreground">
        Which sentence uses <span className="font-semibold text-foreground">{step.data.word}</span> correctly?
      </div>
      <div className="space-y-2">
        {step.data.sentences.map((s, i) => (
          <button
            key={i}
            onClick={() => !showFeedback && onUpdate({ ...step, picked: i })}
            disabled={showFeedback}
            className={cn(
              "block w-full rounded-lg border p-4 text-left text-sm transition",
              !showFeedback && "hover:border-primary hover:bg-primary/5",
              showFeedback && i === step.data!.correct_index && "border-emerald-500 bg-emerald-50",
              showFeedback && step.picked === i && i !== step.data!.correct_index && "border-rose-500 bg-rose-50",
            )}
          >
            {s}
          </button>
        ))}
      </div>
      {showFeedback && (
        <>
          <div className={cn("mt-4 rounded-lg border p-3 text-sm", correct ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900")}>
            {step.data.explanation}
          </div>
          <Button className="mt-4 w-full" onClick={() => onDone(correct)}>Continue</Button>
        </>
      )}
    </div>
  );
}

function WriteStep({
  step, gEval, onUpdate, onDone,
}: {
  step: Extract<Step, { kind: "write" }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gEval: any;
  onUpdate: (s: Extract<Step, { kind: "write" }>) => void;
  onDone: (ok: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  async function submit() {
    if (!step.sentence.trim() || loading) return;
    setLoading(true);
    try {
      const r = await gEval({ data: { word: step.word, sentence: step.sentence } });
      onUpdate({ ...step, result: r });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI failed");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="rounded-2xl bg-card p-6 shadow-sm">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">Write your own sentence</div>
      <div className="mb-4 text-sm text-muted-foreground">
        Use <span className="text-lg font-bold text-foreground">{step.word}</span> in a natural, correct sentence.
      </div>
      <Textarea
        rows={4}
        value={step.sentence}
        onChange={(e) => onUpdate({ ...step, sentence: e.target.value })}
        placeholder={`Write a sentence using "${step.word}"…`}
        disabled={!!step.result || loading}
      />
      {!step.result && (
        <Button className="mt-4 w-full" onClick={submit} disabled={loading || !step.sentence.trim()}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Evaluating…</> : "Get feedback"}
        </Button>
      )}
      {step.result && (
        <>
          <div className={cn("mt-4 rounded-lg border p-4 text-sm",
            step.result.verdict === "correct" && "border-emerald-200 bg-emerald-50",
            step.result.verdict === "awkward" && "border-amber-200 bg-amber-50",
            step.result.verdict === "wrong" && "border-rose-200 bg-rose-50",
          )}>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide">
              {step.result.verdict}
            </div>
            <p className="mb-2">{step.result.feedback}</p>
            <p className="text-xs text-muted-foreground">Suggested: <em>{step.result.fix}</em></p>
          </div>
          <Button className="mt-4 w-full" onClick={() => onDone(step.result!.verdict === "correct")}>
            Continue
          </Button>
        </>
      )}
    </div>
  );
}
