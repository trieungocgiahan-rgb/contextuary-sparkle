import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Check, RotateCcw, Trophy, X } from "lucide-react";
import { SectionReveal } from "./decorations";
import { cn } from "@/lib/utils";

// A real, playable sample so visitors can feel the quiz before signing up.
const QUESTIONS = [
  {
    prompt: (
      <>
        What does <span className="font-semibold text-primary">mitigate</span> mean?
      </>
    ),
    options: [
      "to increase in intensity",
      "to completely remove",
      "to make something less severe",
      "to remain unchanged",
    ],
    answer: 2,
    explain: "Mitigate means to make something less severe (giảm nhẹ), not to remove it entirely.",
  },
  {
    prompt: (
      <>
        Choose the word that best completes the sentence: “The evidence was so ____ that no one
        could ignore it.”
      </>
    ),
    options: ["salient", "arbitrary", "ephemeral", "candid"],
    answer: 0,
    explain: "Salient means most noticeable or important (nổi bật), so it fits evidence nobody can ignore.",
  },
  {
    prompt: (
      <>
        Which is the closest synonym of <span className="font-semibold text-primary">ephemeral</span>?
      </>
    ),
    options: ["permanent", "fleeting", "ubiquitous", "prudent"],
    answer: 1,
    explain: "Ephemeral means lasting a very short time (phù du, chóng tàn), just like fleeting.",
  },
];

const LETTERS = ["A", "B", "C", "D"];

export function QuizPreview() {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const done = i >= QUESTIONS.length;
  const q = QUESTIONS[Math.min(i, QUESTIONS.length - 1)];

  function choose(idx: number) {
    if (picked !== null) return;
    setPicked(idx);
    if (idx === q.answer) setScore((s) => s + 1);
  }
  function next() {
    setPicked(null);
    setI((n) => n + 1);
  }
  function restart() {
    setI(0);
    setPicked(null);
    setScore(0);
  }

  return (
    <section id="practice" className="scroll-mt-20 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 rounded-[2rem] border border-primary/15 bg-gradient-to-br from-fuchsia-50 via-card to-accent/70 p-8 shadow-sm md:p-12 lg:grid-cols-[1fr_1.8fr] lg:items-center">
          <SectionReveal>
            <div className="text-xs font-bold uppercase tracking-widest text-spark">
              Try it now, no sign-up
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Practice smarter,
              <br />
              <span className="text-ombre">not harder.</span>
            </h2>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Six question types (meaning, fill-in-the-blank, synonyms and more) are generated from
              the words in your library. Plus flashcards and AI challenges.
            </p>
            <Link
              to="/practice"
              className="btn-ombre mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all"
            >
              Practice your own words <ArrowRight className="h-4 w-4" />
            </Link>
          </SectionReveal>

          <SectionReveal delay={0.1}>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-primary/10">
              {!done ? (
                <>
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>Sample quiz</span>
                    <span>
                      {i + 1} / {QUESTIONS.length}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="btn-ombre h-full rounded-full transition-all duration-300"
                      style={{ width: `${((i + (picked !== null ? 1 : 0)) / QUESTIONS.length) * 100}%` }}
                    />
                  </div>
                  <p className="mt-5 text-base font-medium text-foreground">{q.prompt}</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {q.options.map((o, idx) => {
                      const isAnswer = idx === q.answer;
                      const isPicked = idx === picked;
                      const revealed = picked !== null;
                      return (
                        <button
                          key={o}
                          type="button"
                          onClick={() => choose(idx)}
                          disabled={revealed}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border-2 px-3 py-3 text-left text-sm transition-all",
                            !revealed && "border-border hover:border-primary/50 hover:bg-accent/50",
                            revealed && isAnswer && "border-emerald-500 bg-emerald-50 text-emerald-900",
                            revealed && isPicked && !isAnswer && "border-destructive bg-red-50 text-red-900",
                            revealed && !isAnswer && !isPicked && "border-border opacity-50",
                          )}
                        >
                          <span
                            className={cn(
                              "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                              revealed && isAnswer
                                ? "bg-emerald-500 text-white"
                                : revealed && isPicked
                                  ? "bg-destructive text-white"
                                  : "bg-muted text-muted-foreground",
                            )}
                          >
                            {revealed && isAnswer ? (
                              <Check className="h-4 w-4" />
                            ) : revealed && isPicked ? (
                              <X className="h-4 w-4" />
                            ) : (
                              LETTERS[idx]
                            )}
                          </span>
                          <span className="flex-1">{o}</span>
                        </button>
                      );
                    })}
                  </div>
                  <AnimatePresence>
                    {picked !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 flex flex-col gap-3 rounded-xl bg-accent/60 p-4 sm:flex-row sm:items-center"
                      >
                        <p className="flex-1 text-sm text-foreground">
                          <span
                            className={cn(
                              "font-bold",
                              picked === q.answer ? "text-emerald-600" : "text-destructive",
                            )}
                          >
                            {picked === q.answer ? "Correct! " : "Not quite. "}
                          </span>
                          {q.explain}
                        </p>
                        <button
                          type="button"
                          onClick={next}
                          className="btn-ombre inline-flex shrink-0 items-center justify-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold"
                        >
                          {i + 1 < QUESTIONS.length ? "Next question" : "See score"}
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="btn-ombre flex h-16 w-16 items-center justify-center rounded-2xl">
                    <Trophy className="h-8 w-8" />
                  </div>
                  <div className="mt-4 text-3xl font-bold text-foreground">
                    {score} / {QUESTIONS.length}
                  </div>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    In Contextuary, every answer moves a word toward{" "}
                    <span className="font-semibold text-foreground">Mastered</span>, and the
                    words you miss come back until they stick.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Link
                      to="/practice"
                      className="btn-ombre inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold"
                    >
                      Practice your own words <ArrowRight className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={restart}
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-accent"
                    >
                      <RotateCcw className="h-4 w-4" /> Try again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
