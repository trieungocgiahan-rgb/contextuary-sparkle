import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Search, Plus, BookMarked, Brain, BarChart3, Tag, Settings } from "lucide-react";
import { SectionReveal, Sparkle } from "./decorations";

const ROWS = [
  { word: "ubiquitous", meaning: "phổ biến, xuất hiện ở khắp nơi", example: "Smartphones have become ubiquitous in modern life.", status: "Mastered", statusClass: "bg-status-mastered text-status-mastered-fg", tag: "Society", tagClass: "bg-tag-society" },
  { word: "mitigate", meaning: "giảm nhẹ, làm dịu", example: "New policies aim to mitigate the negative effects.", status: "Reviewing", statusClass: "bg-status-reviewing text-status-reviewing-fg", tag: "Environment", tagClass: "bg-tag-environment" },
  { word: "salient", meaning: "nổi bật, đáng chú ý", example: "The red design made the message more salient.", status: "Learning", statusClass: "bg-status-learning text-status-learning-fg", tag: "Psychology", tagClass: "bg-tag-psychology" },
  { word: "arbitrary", meaning: "tùy tiện, không dựa trên nguyên tắc", example: "The decision seemed arbitrary and unfair.", status: "Mastered", statusClass: "bg-status-mastered text-status-mastered-fg", tag: "Justice", tagClass: "bg-tag-justice" },
];

export function DashboardPreview() {
  return (
    <section id="pricing" className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 rounded-3xl border border-border bg-accent/40 p-8 md:p-12 lg:grid-cols-[1fr_1.8fr] lg:items-center">
          <SectionReveal>
            <div className="text-xs font-semibold uppercase tracking-wide text-primary">
              Your vocabulary hub
            </div>
            <h2 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">
              All your words.
              <br />
              All in one place.
            </h2>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Organize, review, and master your vocabulary with ease.
            </p>
            <Link
              to="/auth"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md"
            >
              Explore the dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </SectionReveal>

          <SectionReveal delay={0.1}>
            <motion.div
              whileHover={{ scale: 1.02, rotate: -0.4 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden rounded-2xl border border-border bg-background shadow-xl"
            >
              <div className="grid grid-cols-[140px_1fr] md:grid-cols-[180px_1fr]">
                <div className="bg-sidebar p-4 text-sidebar-foreground">
                  <div className="flex items-center gap-1.5 text-sm font-semibold">
                    Contextuary <Sparkle className="text-sidebar-primary" size={10} />
                  </div>
                  <nav className="mt-6 space-y-1 text-xs">
                    <div className="flex items-center gap-2 rounded-md bg-sidebar-accent px-2 py-1.5">
                      <BookMarked className="h-3.5 w-3.5" /> My Words
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 opacity-70">
                      <Brain className="h-3.5 w-3.5" /> Quiz
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 opacity-70">
                      <BarChart3 className="h-3.5 w-3.5" /> Statistics
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 opacity-70">
                      <Tag className="h-3.5 w-3.5" /> Tags
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 opacity-70">
                      <Settings className="h-3.5 w-3.5" /> Settings
                    </div>
                  </nav>
                  <div className="mt-6 rounded-lg bg-sidebar-accent p-3">
                    <div className="flex items-center justify-between text-[10px] opacity-80">
                      <span>Overview</span>
                      <span>This Week</span>
                    </div>
                    <div className="mt-2 text-[10px] opacity-70">Total Words</div>
                    <div className="text-xl font-bold">642</div>
                    <div className="mt-2 text-[10px] opacity-70">Mastered</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold">391</span>
                      <span className="text-[10px] text-sidebar-primary">61%</span>
                    </div>
                    <div className="mt-2 text-[10px] opacity-70">Quiz Accuracy</div>
                    <div className="text-lg font-bold">86%</div>
                  </div>
                </div>
                <div className="p-4 md:p-5">
                  <div className="text-sm font-semibold text-foreground">My Words</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    Your personal SAT vocabulary library.
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5">
                      <Search className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">Search a word…</span>
                    </div>
                    <button className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-medium text-primary-foreground">
                      <Plus className="h-3 w-3" /> Add Word
                    </button>
                  </div>
                  <div className="mt-3 overflow-hidden rounded-lg border border-border">
                    <div className="grid grid-cols-[1fr_1fr_1.5fr_0.7fr_0.7fr] gap-2 border-b border-border bg-muted/50 px-3 py-2 text-[10px] font-semibold uppercase text-muted-foreground">
                      <span>Word</span>
                      <span>Vietnamese Meaning</span>
                      <span className="hidden md:inline">Example (SAT Style)</span>
                      <span>Status</span>
                      <span>Tags</span>
                    </div>
                    {ROWS.map((r) => (
                      <div
                        key={r.word}
                        className="grid grid-cols-[1fr_1fr_1.5fr_0.7fr_0.7fr] gap-2 border-b border-border/60 px-3 py-2 text-[11px] last:border-b-0"
                      >
                        <span className="font-medium text-foreground">{r.word}</span>
                        <span className="text-muted-foreground">{r.meaning}</span>
                        <span className="hidden truncate text-muted-foreground md:inline">{r.example}</span>
                        <span>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${r.statusClass}`}>
                            {r.status}
                          </span>
                        </span>
                        <span>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium text-foreground/80 ${r.tagClass}`}>
                            {r.tag}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
