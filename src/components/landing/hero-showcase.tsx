import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  Check,
  Flame,
  Layers,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Volume2,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { speakText } from "@/lib/speech";
import { cn } from "@/lib/utils";

// Hero right column: a bento grid where every tile previews a real feature and opens it.

const reveal = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" as const, delay: 0.15 + i * 0.08 },
});

function Eyebrow({ icon, children, light }: { icon: ReactNode; children: ReactNode; light?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider",
        light ? "text-white/70" : "text-primary",
      )}
    >
      {icon}
      {children}
    </div>
  );
}

const glass =
  "rounded-2xl border border-white/15 bg-white/10 text-white shadow-xl backdrop-blur-md transition-colors hover:bg-white/15";
const solid = "rounded-2xl bg-card text-foreground shadow-2xl shadow-black/30";

const PILLS = [
  { icon: CalendarCheck, label: "Daily Picks", to: "/words" },
  { icon: Layers, label: "Flashcards", to: "/practice" },
  { icon: Zap, label: "AI Challenge", to: "/practice" },
  { icon: Target, label: "6 quiz types", to: "/", hash: "practice" },
];

export function HeroShowcase({ onAddWord }: { onAddWord: (word: string) => void }) {
  const ring = 2 * Math.PI * 22;
  return (
    <div className="relative self-center">
      <div className="absolute -inset-6 rounded-full bg-fuchsia-400/25 blur-3xl" aria-hidden />

      <div className="relative grid grid-cols-1 gap-3.5 sm:grid-cols-5">
        {/* 1. Read in context */}
        <motion.div {...reveal(0)} className="sm:col-span-5">
          <Link to="/" hash="features" className={cn(glass, "group block p-5")}>
            <div className="flex items-center justify-between">
              <Eyebrow light icon={<BookOpen className="h-3.5 w-3.5" />}>
                Learn from SAT passages
              </Eyebrow>
              <ArrowRight className="h-4 w-4 text-white/60 transition-transform group-hover:translate-x-1" />
            </div>
            <p className="mt-2.5 text-sm leading-relaxed">
              The{" "}
              <span className="rounded bg-white px-1 font-semibold text-primary">ubiquitous</span>{" "}
              influence of technology has transformed the way we communicate, making information
              accessible at our fingertips.
            </p>
          </Link>
        </motion.div>

        {/* 2. AI word card */}
        <motion.div {...reveal(1)} className={cn(solid, "p-5 sm:col-span-3 sm:row-span-2")}>
          <Eyebrow icon={<Sparkles className="h-3.5 w-3.5" />}>AI word card</Eyebrow>
          <div className="mt-2 flex items-start justify-between gap-2">
            <div>
              <div className="text-2xl font-bold tracking-tight">ubiquitous</div>
              <button
                type="button"
                onClick={() => speakText("ubiquitous")}
                className="mt-0.5 inline-flex items-center gap-1.5 rounded-md text-xs text-muted-foreground transition-colors hover:text-primary"
                aria-label="Hear how ubiquitous is pronounced"
              >
                /juːˈbɪkwɪtəs/ <Volume2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className="rounded-full bg-status-mastered px-2 py-0.5 text-[10px] font-semibold text-status-mastered-fg">
              Mastered
            </span>
          </div>
          <p className="mt-3 text-sm font-semibold">xuất hiện ở khắp nơi, phổ biến đến mức khó tránh khỏi</p>
          <div className="mt-3 rounded-lg border-l-4 border-primary bg-accent/60 p-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wide text-primary">Example</div>
            <p className="mt-1 text-xs">
              Smartphones have become <span className="font-semibold text-primary">ubiquitous</span> in
              modern life.
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["omnipresent", "pervasive", "widespread"].map((s) => (
              <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground/80">
                {s}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onAddWord("ubiquitous")}
            className="btn-ombre mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all"
          >
            <Plus className="h-3.5 w-3.5" /> Save to my library
          </button>
        </motion.div>

        {/* 3. Quiz */}
        <motion.div {...reveal(2)} className="hidden sm:col-span-2 sm:block">
          <Link to="/" hash="practice" className={cn(solid, "group flex h-full flex-col p-4")}>
            <Eyebrow icon={<Target className="h-3.5 w-3.5" />}>Smart quiz</Eyebrow>
            <p className="mt-2 text-xs font-medium">
              What does <span className="font-semibold text-primary">mitigate</span> mean?
            </p>
            <div className="mt-2 space-y-1.5">
              <div className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground">
                to increase
              </div>
              <div className="flex items-center justify-between rounded-md border-2 border-emerald-500 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-900">
                to make less severe <Check className="h-3.5 w-3.5 text-emerald-600" />
              </div>
            </div>
            <div className="mt-auto flex items-center justify-between pt-2 text-[11px] font-semibold text-primary">
              Try a sample quiz
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </motion.div>

        {/* 4. Progress */}
        <motion.div {...reveal(3)} className="hidden sm:col-span-2 sm:block">
          <Link to="/" hash="progress" className={cn(glass, "group flex h-full flex-col p-4")}>
            <Eyebrow light icon={<TrendingUp className="h-3.5 w-3.5" />}>
              Track mastery
            </Eyebrow>
            <div className="mt-2 flex items-center gap-3">
              <div className="relative h-14 w-14 shrink-0">
                <svg viewBox="0 0 50 50" className="h-full w-full -rotate-90">
                  <circle cx="25" cy="25" r="22" strokeWidth="5" className="stroke-white/15" fill="none" />
                  <circle
                    cx="25"
                    cy="25"
                    r="22"
                    strokeWidth="5"
                    fill="none"
                    stroke="url(#hero-ring)"
                    strokeLinecap="round"
                    strokeDasharray={ring}
                    strokeDashoffset={ring * 0.28}
                  />
                  <defs>
                    <linearGradient id="hero-ring" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#f0abfc" />
                      <stop offset="1" stopColor="#ffffff" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">72%</span>
              </div>
              <div className="text-xs leading-snug">
                <div className="font-semibold">Mastered</div>
                <div className="mt-1 flex items-center gap-1 text-white/75">
                  <Flame className="h-3.5 w-3.5 text-orange-300" /> 12-day streak
                </div>
              </div>
            </div>
            <div className="mt-auto flex items-center justify-between pt-2 text-[11px] font-semibold text-white/85">
              See progress
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </motion.div>

        {/* 5. More features */}
        <motion.div {...reveal(4)} className="flex flex-wrap gap-2 sm:col-span-5">
          {PILLS.map((p) => (
            <Link
              key={p.label}
              to={p.to}
              hash={p.hash}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              <p.icon className="h-3.5 w-3.5 text-pink-200" />
              {p.label}
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
