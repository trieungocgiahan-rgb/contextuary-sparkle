import { motion } from "framer-motion";
import { useState } from "react";
import { SectionReveal } from "./decorations";

export function InAction() {
  const [hovered, setHovered] = useState(false);
  return (
    <section id="features" className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 rounded-3xl border border-border bg-accent/40 p-8 md:p-12 lg:grid-cols-[1fr_2fr]">
          <SectionReveal>
            <div className="text-xs font-semibold uppercase tracking-wide text-primary">
              Interactive demo
            </div>
            <h2 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">
              See Contextuary <span className="font-serif italic">in action</span>
            </h2>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Hover over a word to see how Contextuary explains it in context.
            </p>
            <svg className="mt-6 h-16 w-24 text-primary/40" viewBox="0 0 100 60" fill="none" aria-hidden>
              <path d="M10 10 Q 50 10, 60 40 T 90 50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
              <path d="M85 45 L92 50 L86 55" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </SectionReveal>

          <SectionReveal delay={0.1}>
            <div className="grid gap-6 md:grid-cols-2">
              <div
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
              >
                <p className="text-base leading-relaxed text-foreground">
                  The committee's decision appeared{" "}
                  <span className="cursor-pointer rounded bg-primary/15 px-1 font-semibold text-primary">
                    arbitrary
                  </span>{" "}
                  to many observers, as it lacked a clear rationale and seemed inconsistent with previous policies.
                </p>
              </div>
              <motion.div
                initial={false}
                animate={{ opacity: hovered ? 1 : 0.55, y: hovered ? 0 : 6 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border border-border bg-card p-5 shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="text-lg font-semibold text-foreground">arbitrary</div>
                  <span className="rounded-full bg-status-mastered px-2 py-0.5 text-[10px] font-medium text-status-mastered-fg">
                    Mastered
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">/ˈɑːrbɪtreri/</div>
                <p className="mt-3 text-sm font-medium text-foreground">
                  tùy tiện, không dựa trên nguyên tắc
                </p>
                <div className="mt-3 text-xs">
                  <span className="font-semibold text-destructive">NOT</span>{" "}
                  <span className="text-muted-foreground">random (ngẫu nhiên)</span>
                </div>
                <div className="mt-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">Example</div>
                  <p className="mt-1 text-xs text-foreground">
                    The decision seemed <span className="font-semibold text-primary">arbitrary</span> and unfair.
                  </p>
                </div>
                <div className="mt-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">Memory hint</div>
                  <p className="mt-1 text-xs text-foreground">
                    Arbi = random trong đầu → làm theo ý mình.
                  </p>
                </div>
                <button className="mt-3 text-xs font-medium text-primary hover:underline">
                  + Save to library
                </button>
              </motion.div>
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
