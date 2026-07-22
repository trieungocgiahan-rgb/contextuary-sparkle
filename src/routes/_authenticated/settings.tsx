import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { profileQueryOptions } from "@/lib/queries";
import { updateProfile } from "@/lib/vocab.functions";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Contextuary" },
      { name: "description", content: "Manage your Contextuary profile, daily goal, and account." },
      { property: "og:title", content: "Settings — Contextuary" },
      { property: "og:description", content: "Manage your profile and account." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: profile } = useQuery(profileQueryOptions());
  const upd = useServerFn(updateProfile);
  const [displayName, setDisplayName] = useState("");
  const [dailyGoal, setDailyGoal] = useState(10);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setDailyGoal(profile.daily_goal ?? 10);
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: () => upd({ data: { display_name: displayName, daily_goal: dailyGoal } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Saved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Personalize your Contextuary.</p>
      </header>

      <Card className="mb-4">
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="dn">Display name</Label>
            <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dg">Daily goal (words)</Label>
            <Input
              id="dg"
              type="number"
              min={1}
              max={100}
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value) || 10)}
            />
          </div>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>Save changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <CardContent>
          <Button variant="outline" onClick={signOut}>Sign out</Button>
        </CardContent>
      </Card>
    </div>
  );
}
