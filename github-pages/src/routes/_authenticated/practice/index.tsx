import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap } from "lucide-react";

import { PracticePickerDialog } from "@/components/practice-picker";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/practice/")({
  head: () => ({
    meta: [
      { title: "Practice — Contextuary" },
      { name: "description", content: "Set up a quiz or flashcard session from your vocabulary." },
      { property: "og:title", content: "Practice — Contextuary" },
      { property: "og:description", content: "Set up a quiz or flashcard session from your vocabulary." },
    ],
  }),
  component: PracticeSetupPage,
});

function PracticeSetupPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <GraduationCap className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Practice</h1>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Choose your words, question types and session length, then start.
      </p>
      <Button className="mt-5" onClick={() => setOpen(true)}>
        Set up a session
      </Button>

      <PracticePickerDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) navigate({ to: "/practice" });
        }}
      />
    </div>
  );
}
