import { useEffect, useRef, useState } from "react";
import { BookOpen, ShieldCheck, TrendingUp, Flame } from "lucide-react";
import { SectionReveal } from "./decorations";

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const started = useRef(false);
  useEffect(() => {
    if (!ref.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(target);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const tick = (now: number) => {
              const p = Math.min(1, (now - start) / duration);
              const eased = 1 - Math.pow(1 - p, 3);
              setValue(Math.round(target * eased));
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.4 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, duration]);
  return { ref, value };
}

function Sparkline({ points, color }: { points: number[]; color: string }) {
  const w = 100;
  const h = 30;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-full" preserveAspectRatio="none">
      <path d={path} stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const STATS = [
  { icon: BookOpen, label: "Words Learned", value: 642, suffix: "", trend: "+28 this week", color: "var(--primary)", spark: [3, 5, 4, 7, 6, 9, 10, 12] },
  { icon: ShieldCheck, label: "Mastered", value: 391, suffix: "", trend: "61% of total", color: "oklch(0.55 0.18 150)", spark: [2, 3, 3, 5, 6, 7, 8, 9] },
  { icon: TrendingUp, label: "Quiz Accuracy", value: 86, suffix: "%", trend: "+12% this week", color: "oklch(0.55 0.2 240)", spark: [50, 60, 58, 65, 70, 78, 82, 86] },
  { icon: Flame, label: "Learning Streak", value: 42, suffix: "", trend: "days in a row", color: "oklch(0.65 0.2 40)", spark: [1, 3, 5, 8, 12, 20, 30, 42] },
];

function StatCard({ stat, i }: { stat: (typeof STATS)[number]; i: number }) {
  const { ref, value } = useCountUp(stat.value);
  return (
    <SectionReveal delay={i * 0.05}>
      <div ref={ref} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
          {stat.label}
        </div>
        <div className="mt-2 text-3xl font-bold text-foreground">
          {value.toLocaleString()}
          {stat.suffix}
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">{stat.trend}</div>
        <div className="mt-2">
          <Sparkline points={stat.spark} color={stat.color} />
        </div>
      </div>
    </SectionReveal>
  );
}

export function Stats() {
  return (
    <section id="about" className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <SectionReveal className="text-center">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">Track your progress</h2>
        </SectionReveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <StatCard key={s.label} stat={s} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
