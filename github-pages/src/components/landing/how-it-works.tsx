import { Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, BookOpen, Plus, Target } from "lucide-react";
import { SectionReveal } from "./decorations";

// Each step describes a real feature and opens the page where you do it.
const STEPS = [
  {
    icon: Plus,
    title: "Add a word",
    desc: "Type any SAT word, or pick one from today's Daily Picks.",
    cta: "Open My Words",
    to: "/words",
    hash: undefined,
  },
  {
    icon: BookOpen,
    title: "Understand it in context",
    desc: "AI writes the Vietnamese meaning, nuance, SAT-style examples and a memory hint.",
    cta: "See an example",
    to: "/",
    hash: "features",
  },
  {
    icon: Target,
    title: "Practice until it sticks",
    desc: "Quizzes, flashcards and AI challenges built from your own words.",
    cta: "Start practicing",
    to: "/practice",
    hash: undefined,
  },
  {
    icon: BarChart3,
    title: "Track your mastery",
    desc: "Watch words move from New to Mastered and see which ones you miss most.",
    cta: "View statistics",
    to: "/statistics",
    hash: undefined,
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 py-24 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-spark">How it works</div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            From new word to <span className="text-ombre">mastered</span> in four steps
          </h2>
        </SectionReveal>
        <div className="relative mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="pointer-events-none absolute left-8 right-8 top-[3.25rem] hidden h-0.5 bg-gradient-to-r from-primary via-fuchsia-500 to-spark opacity-30 lg:block" />
          {STEPS.map((s, i) => (
            <SectionReveal key={s.title} delay={i * 0.08}>
              <Link
                to={s.to}
                hash={s.hash}
                className="group relative flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="btn-ombre inline-flex h-11 w-11 items-center justify-center rounded-xl text-base font-bold">
                    {i + 1}
                  </div>
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {s.desc}
                </p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  {s.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
