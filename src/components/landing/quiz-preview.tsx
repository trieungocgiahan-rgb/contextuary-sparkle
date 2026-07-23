import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { SectionReveal } from "./decorations";

const OPTIONS = [
  { letter: "A", text: "to increase in intensity" },
  { letter: "B", text: "to completely remove" },
  { letter: "C", text: "to make something less severe", correct: true },
  { letter: "D", text: "to remain unchanged" },
];

export function QuizPreview() {
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 rounded-3xl border border-border bg-accent/40 p-8 md:p-12 lg:grid-cols-[1fr_1.8fr] lg:items-center">
          <SectionReveal>
            <div className="text-xs font-semibold uppercase tracking-wide text-primary">
              AI-generated practice
            </div>
            <h2 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">
              Practice smarter,
              <br />
              not harder.
            </h2>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Generate quizzes in seconds based on the words you're learning.
            </p>
            <Link
              to="/auth"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md"
            >
              Try a sample quiz <ArrowRight className="h-4 w-4" />
            </Link>
          </SectionReveal>

          <SectionReveal delay={0.1}>
            <div className="relative grid gap-4 md:grid-cols-[2fr_1fr]">
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="rounded-2xl border border-border bg-card p-6 shadow-lg"
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    What does <span className="font-semibold text-primary">mitigate</span> mean?
                  </span>
                  <span>1 / 10</span>
                </div>
                <div className="mt-4 space-y-2">
                  {OPTIONS.map((o) => (
                    <div
                      key={o.letter}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-all ${
                        o.correct
                          ? "border-primary/40 bg-primary/10 text-foreground"
                          : "border-border bg-background text-foreground"
                      }`}
                    >
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-semibold ${
                          o.correct
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {o.letter}
                      </span>
                      <span className="flex-1">{o.text}</span>
                      {o.correct && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  ))}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 text-center shadow-lg"
              >
                <div className="relative mb-3 h-14 w-14">
                  <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90">
                    <circle cx="20" cy="20" r="16" strokeWidth="4" className="stroke-muted" fill="none" />
                    <circle cx="20" cy="20" r="16" strokeWidth="4" className="stroke-primary" fill="none" strokeDasharray={2 * Math.PI * 16} strokeDashoffset={2 * Math.PI * 16 * 0.14} strokeLinecap="round" />
                  </svg>
                  <Check className="absolute inset-0 m-auto h-6 w-6 text-primary" />
                </div>
                <div className="text-lg font-bold text-primary">Correct!</div>
                <p className="mt-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">mitigate</span> means to make something less severe.
                </p>
                <button className="mt-4 inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                  Next question <ArrowRight className="h-3 w-3" />
                </button>
              </motion.div>
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
