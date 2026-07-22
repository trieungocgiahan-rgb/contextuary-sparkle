import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Sparkles } from "lucide-react";

import { wordsQueryOptions } from "@/lib/queries";
import { generateQuiz, type QuizQuestion } from "@/lib/ai.functions";
import { saveQuizResult } from "@/lib/vocab.functions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/quiz")({
  head: () => ({
    meta: [
      { title: "Quiz — Contextuary" },
      { name: "description", content: "Test yourself on your SAT vocabulary with mixed meaning and cloze questions." },
      { property: "og:title", content: "Quiz — Contextuary" },
      { property: "og:description", content: "Adaptive vocabulary quizzes based on your words." },
    ],
  }),
  component: QuizPage,
});

type Result = { word_id: string; correct: boolean; question_type: string };

function QuizPage() {
  const qc = useQueryClient();
  const { data: words = [] } = useQuery(wordsQueryOptions());
  const gen = useServerFn(generateQuiz);
  const save = useServerFn(saveQuizResult);
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [starting, setStarting] = useState(false);

  const eligible = words.filter((w) => !!w.vietnamese_meaning);

  async function start(scope: "all" | "learning") {
    const pool = scope === "learning"
      ? eligible.filter((w) => w.status === "learning" || w.status === "reviewing" || w.status === "new")
      : eligible;
    if (!pool.length) return toast.error("Add some words first!");
    const ids = pool.slice(0, 20).map((w) => w.id);
    setStarting(true);
    try {
      const qs = await gen({ data: { wordIds: ids } });
      if (!qs.length) return toast.error("Not enough content to build a quiz");
      setQuestions(qs);
      setIdx(0);
      setResults([]);
      setAnswered(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Quiz failed");
    } finally {
      setStarting(false);
    }
  }

  async function pick(option: number) {
    if (!questions || answered !== null) return;
    const q = questions[idx];
    const correct = option === q.answer_index;
    setAnswered(option);
    setResults((r) => [...r, { word_id: q.word_id, correct, question_type: q.type }]);
  }

  async function next() {
    if (!questions) return;
    if (idx + 1 >= questions.length) {
      // finish
      try {
        const r = await save({ data: { results } });
        toast.success(`Score: ${r.score}/${r.total}`);
        qc.invalidateQueries({ queryKey: ["stats"] });
        qc.invalidateQueries({ queryKey: ["words"] });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save");
      }
      setQuestions(null);
      return;
    }
    setIdx(idx + 1);
    setAnswered(null);
  }

  if (!questions) {
    return (
      <div className="mx-auto max-w-2xl p-6 lg:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Quiz</h1>
          <p className="text-sm text-muted-foreground">Practice makes contextual.</p>
        </header>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Ready to review?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {eligible.length} words available. Each session is up to 20 mixed questions
              (meaning + cloze). Correct answers move words toward mastery.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => start("all")} disabled={starting || !eligible.length}>
                {starting ? "Preparing…" : "Quiz all words"}
              </Button>
              <Button variant="outline" onClick={() => start("learning")} disabled={starting || !eligible.length}>
                Focus on learning
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const q = questions[idx];
  const progress = ((idx + (answered !== null ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-8">
      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>Question {idx + 1} of {questions.length}</span>
        <span>{results.filter((r) => r.correct).length} correct</span>
      </div>
      <Progress value={progress} className="mb-6" />
      <Card>
        <CardHeader>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {q.type === "meaning" ? "Meaning" : "Fill in the blank"}
          </div>
          <CardTitle className="mt-1 text-xl leading-relaxed">{q.prompt}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {q.options.map((opt, i) => {
            const isCorrect = i === q.answer_index;
            const isPicked = answered === i;
            const showState = answered !== null;
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={answered !== null}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm transition",
                  !showState && "hover:border-primary hover:bg-primary/5",
                  showState && isCorrect && "border-emerald-500 bg-emerald-50",
                  showState && isPicked && !isCorrect && "border-rose-500 bg-rose-50",
                )}
              >
                <span>{opt}</span>
                {showState && isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                {showState && isPicked && !isCorrect && <XCircle className="h-4 w-4 text-rose-600" />}
              </button>
            );
          })}
          {answered !== null && (
            <div className="pt-4">
              <Button className="w-full" onClick={next}>
                {idx + 1 >= questions.length ? "Finish quiz" : "Next question"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
