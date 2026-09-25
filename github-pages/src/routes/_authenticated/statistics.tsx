import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { statsQueryOptions } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { STATUS_META } from "@/lib/vocab";

export const Route = createFileRoute("/_authenticated/statistics")({
  head: () => ({
    meta: [
      { title: "Statistics — Contextuary" },
      { name: "description", content: "Track your SAT vocabulary progress: words learned, quiz accuracy, and mastery over time." },
      { property: "og:title", content: "Statistics — Contextuary" },
      { property: "og:description", content: "Your vocabulary learning progress at a glance." },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  const { data } = useQuery(statsQueryOptions());
  if (!data) return <div className="p-8 text-muted-foreground">Loading…</div>;

  const statusData = (["new", "learning", "reviewing", "mastered"] as const).map((s) => ({
    name: STATUS_META[s].label,
    value: data[s],
    fill: STATUS_META[s].fg,
  }));

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Statistics</h1>
        <p className="text-sm text-muted-foreground">Consistency compounds.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Total words" value={data.totalWords} />
        <Stat label="Mastered" value={data.mastered} />
        <Stat label="Quiz accuracy" value={`${data.quizAccuracy}%`} />
        <Stat label="In progress" value={data.learning + data.reviewing} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Words over time</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.wordsOverTime}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quiz accuracy trend</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.quizAccuracyTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="accuracy" stroke="var(--primary)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Status breakdown</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Most missed</CardTitle></CardHeader>
          <CardContent>
            {data.mostMissed.length === 0 ? (
              <p className="text-sm text-muted-foreground">No quiz misses yet. Great job!</p>
            ) : (
              <ul className="space-y-2">
                {data.mostMissed.map((m) => (
                  <li key={m.word} className="flex items-center justify-between rounded-lg bg-muted/40 p-2 text-sm">
                    <span className="font-medium">{m.word}</span>
                    <span className="text-muted-foreground">{m.misses} miss{m.misses > 1 ? "es" : ""}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-1 text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
