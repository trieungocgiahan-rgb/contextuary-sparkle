import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, GraduationCap, BarChart3, Tags, Settings, Sparkles, Quote, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { statsQueryOptions } from "@/lib/queries";
import { QUOTES } from "@/lib/vocab";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const NAV = [
  { to: "/words", label: "My Words", icon: BookOpen },
  { to: "/practice/quiz", label: "Practice", icon: GraduationCap },
  { to: "/statistics", label: "Statistics", icon: BarChart3 },
  { to: "/tags", label: "Tags", icon: Tags },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const MOBILE_NAV = [
  { to: "/words", label: "Words", icon: BookOpen },
  { to: "/practice/quiz", label: "Practice", icon: GraduationCap },
  { to: "/statistics", label: "Stats", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function useStats() {
  const { data: stats } = useQuery(statsQueryOptions());
  const total = stats?.totalWords ?? 0;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const trend = useMemo(
    () =>
      (stats?.quizAccuracyTrend?.length
        ? stats.quizAccuracyTrend
        : [{ date: "-", accuracy: 0 }, { date: "-", accuracy: 0 }]
      ).slice(-10),
    [stats],
  );
  return { stats, total, pct, trend };
}

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { stats, total, pct, trend } = useStats();
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setQuoteIdx((i) => (i + 1) % QUOTES.length), 10000);
    return () => clearInterval(t);
  }, []);

  const quote = QUOTES[quoteIdx];

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex flex-col gap-1 px-6 pt-6">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">Contextuary</span>
          <Sparkles className="h-4 w-4 text-primary-glow" />
        </div>
        <p className="text-xs leading-relaxed text-sidebar-foreground/70">
          Understand words.<br />In context. For real.
        </p>
      </div>

      <nav className="mt-6 flex flex-col gap-1 px-3">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mx-3 mt-6 rounded-xl bg-sidebar-accent/40 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium text-sidebar-foreground/70">Overview</span>
          <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">This Week</span>
        </div>
        <div>
          <div className="text-[11px] text-sidebar-foreground/60">Total Words</div>
          <div className="text-2xl font-bold">{total}</div>
        </div>
        <div className="mt-3 space-y-2 text-xs">
          <SidebarBar label="Mastered" value={stats?.mastered ?? 0} pct={pct(stats?.mastered ?? 0)} />
          <SidebarBar label="Learning" value={stats?.learning ?? 0} pct={pct(stats?.learning ?? 0)} />
          <SidebarBar label="New" value={stats?.new ?? 0} pct={pct(stats?.new ?? 0)} />
        </div>
        <div className="mt-4">
          <div className="text-[11px] text-sidebar-foreground/60">Quiz Accuracy</div>
          <div className="flex items-end justify-between">
            <div className="text-2xl font-bold">{stats?.quizAccuracy ?? 0}%</div>
            <div className="h-8 w-20">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="oklch(0.82 0.15 300)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-3 mb-4 mt-auto rounded-xl border border-sidebar-border/40 p-4">
        <Quote className="mb-2 h-4 w-4 text-sidebar-foreground/50" />
        <p className="text-xs italic leading-relaxed text-sidebar-foreground/80">
          {quote.text}
        </p>
        <p className="mt-2 text-[11px] text-sidebar-foreground/50">— {quote.author}</p>
      </div>
    </aside>
  );
}

/** Compact brand header shown only on phones/tablets. */
export function MobileTopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border/70 bg-background/90 px-4 backdrop-blur-md lg:hidden">
      <Sparkles className="h-5 w-5 text-primary" />
      <span className="text-lg font-bold tracking-tight">Contextuary</span>
    </header>
  );
}

/** Bottom tab bar replacing the sidebar on phones/tablets. */
export function MobileTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
      <div className="grid grid-cols-4">
        {MOBILE_NAV.map((item) => {
          const active = pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-h-[56px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className={cn("h-5 w-5", active && "text-primary")} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Collapsible Overview card — mobile replacement for the sidebar stats block. */
export function OverviewCard({ className }: { className?: string }) {
  const { stats, total, pct, trend } = useStats();
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("rounded-2xl border border-border/70 bg-card shadow-sm", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[56px] w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold">Overview</div>
          <div className="truncate text-xs text-muted-foreground">
            {total} words · {stats?.mastered ?? 0} mastered · {stats?.quizAccuracy ?? 0}% accuracy
          </div>
        </div>
        <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="border-t border-border/60 px-4 py-4">
          <div className="space-y-3 text-xs">
            <OverviewBar label="Mastered" value={stats?.mastered ?? 0} pct={pct(stats?.mastered ?? 0)} />
            <OverviewBar label="Learning" value={stats?.learning ?? 0} pct={pct(stats?.learning ?? 0)} />
            <OverviewBar label="New" value={stats?.new ?? 0} pct={pct(stats?.new ?? 0)} />
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="text-[11px] text-muted-foreground">Quiz Accuracy</div>
              <div className="text-2xl font-bold">{stats?.quizAccuracy ?? 0}%</div>
            </div>
            <div className="h-10 w-28">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <Line type="monotone" dataKey="accuracy" stroke="var(--primary)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewBar({ label, value, pct }: { label: string; value: number; pct: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">
          {value} <span className="opacity-60">· {pct}%</span>
        </span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
}

function SidebarBar({ label, value, pct }: { label: string; value: number; pct: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sidebar-foreground/70">{label}</span>
        <span className="text-sidebar-foreground/60">
          {value} <span className="text-sidebar-foreground/40">· {pct}%</span>
        </span>
      </div>
      <Progress value={pct} className="h-1 bg-sidebar-accent/40" />
    </div>
  );
}
