import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, GraduationCap, BarChart3, Tags, Settings, Sparkles, Quote } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { statsQueryOptions } from "@/lib/queries";
import { QUOTES } from "@/lib/vocab";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const NAV = [
  { to: "/words", label: "My Words", icon: BookOpen },
  { to: "/quiz", label: "Quiz", icon: GraduationCap },
  { to: "/statistics", label: "Statistics", icon: BarChart3 },
  { to: "/tags", label: "Tags", icon: Tags },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: stats } = useQuery(statsQueryOptions());
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setQuoteIdx((i) => (i + 1) % QUOTES.length), 10000);
    return () => clearInterval(t);
  }, []);

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
