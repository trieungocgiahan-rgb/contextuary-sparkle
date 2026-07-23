import { FileText, Sparkles, BookOpen, Target } from "lucide-react";
import { SectionReveal } from "./decorations";

const STEPS = [
  { icon: FileText, title: "Paste any SAT passage", desc: "Drop a paragraph or enter your own." },
  { icon: Sparkles, title: "AI extracts vocabulary", desc: "We find the most useful SAT words in context." },
  { icon: BookOpen, title: "Understand in context", desc: "Get clear meanings, examples, collocations, and memory hints." },
  { icon: Target, title: "Practice & master", desc: "Generate quizzes and track your progress." },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <SectionReveal className="text-center">
          <h2 className="inline-flex items-center gap-2 text-3xl font-bold text-foreground md:text-4xl">
            How Contextuary works
            <Sparkles className="h-6 w-6 text-primary" />
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">A smarter way to learn SAT vocabulary</p>
        </SectionReveal>
        <div className="relative mt-16 grid gap-6 md:grid-cols-4">
          <div className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent md:block" />
          {STEPS.map((s, i) => (
            <SectionReveal key={s.title} delay={i * 0.08}>
              <div className="group relative rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                <div className="mb-4 flex items-center justify-between">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
                    {i + 1}
                  </div>
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
