import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, Volume2, Star } from "lucide-react";
import { DriftingBackdrop } from "./decorations";

const CHIPS = ["Ubiquitous", "Mitigate", "Salient", "Arbitrary"];

export function Hero() {
  const navigate = useNavigate();
  return (
    <section id="top" className="relative overflow-hidden pb-24 pt-12 md:pb-32 md:pt-20">
      <DriftingBackdrop />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col justify-center"
        >
          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Understand words.
            <br />
            <span className="font-serif italic text-primary">In context.</span>
            <br />
            For real.
          </h1>
          <p className="mt-6 max-w-md text-base text-muted-foreground md:text-lg">
            Contextuary helps you master SAT vocabulary through real context,
            smart explanations, and AI-generated practice.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/auth" });
            }}
            className="mt-8 flex max-w-md items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm"
          >
            <input
              placeholder="Paste any SAT passage or try a word…"
              className="flex-1 border-0 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-all hover:opacity-90"
              aria-label="Try Contextuary"
            >
              <Sparkles className="h-4 w-4" />
            </button>
          </form>
          <div className="mt-4 flex max-w-md flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Try an example:</span>
            {CHIPS.map((c) => (
              <button
                key={c}
                onClick={() => navigate({ to: "/auth" })}
                className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground transition-all hover:scale-105"
              >
                {c}
              </button>
            ))}
          </div>
          <div className="mt-8 flex items-center gap-3">
            <div className="flex -space-x-2">
              {["#c4b5fd", "#a78bfa", "#8b5cf6"].map((c, i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-full border-2 border-background"
                  style={{ background: c }}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              Loved by 3,000+ ambitious learners
            </span>
          </div>
        </motion.div>

        <div className="relative flex min-h-[440px] items-center justify-center">
          <svg
            className="absolute inset-0 h-full w-full text-primary/20"
            viewBox="0 0 400 400"
            fill="none"
            aria-hidden
          >
            <ellipse cx="200" cy="200" rx="180" ry="60" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
            <ellipse cx="200" cy="200" rx="140" ry="120" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" transform="rotate(30 200 200)" />
          </svg>

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-0 top-4 w-[75%] max-w-sm rounded-2xl border border-border bg-card p-5 shadow-lg"
          >
            <p className="text-sm leading-relaxed text-foreground">
              The <span className="rounded bg-primary/15 px-1 font-semibold text-primary">ubiquitous</span> influence of technology has transformed the way we communicate, making information accessible at our fingertips.
            </p>
          </motion.div>

          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute bottom-0 right-0 w-[80%] max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-semibold text-foreground">ubiquitous</div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>/juːˈbɪkwɪtəs/</span>
                  <Volume2 className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-status-mastered px-2 py-0.5 text-[10px] font-medium text-status-mastered-fg">
                  Mastered
                </span>
                <Star className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">
              xuất hiện ở khắp nơi, phổ biến đến mức khó tránh khỏi
            </p>
            <div className="mt-3 rounded-lg bg-accent/50 p-2.5">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">SAT Context</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Dùng khi nói về sự hiện diện rộng rãi trong đời sống, công nghệ, xã hội, v.v.
              </p>
            </div>
            <div className="mt-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">Example</div>
              <p className="mt-1 text-xs text-foreground">
                Smartphones have become <span className="font-semibold text-primary">ubiquitous</span> in modern life.
              </p>
            </div>
            <button className="mt-4 w-full rounded-lg bg-primary py-2 text-xs font-medium text-primary-foreground transition-all hover:opacity-90">
              + Save to library
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
