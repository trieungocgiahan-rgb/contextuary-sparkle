import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { NavBar } from "@/components/landing/nav-bar";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { InAction } from "@/components/landing/in-action";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { QuizPreview } from "@/components/landing/quiz-preview";
import { Stats } from "@/components/landing/stats";
import { Testimonials } from "@/components/landing/testimonials";
import { Footer } from "@/components/landing/footer";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/words" });
  },
  head: () => ({
    meta: [
      { title: "Contextuary — Understand SAT words. In context. For real." },
      {
        name: "description",
        content:
          "Contextuary helps you master SAT vocabulary with AI-generated Vietnamese meanings, real-context examples, and smart quizzes.",
      },
      { property: "og:title", content: "Contextuary — Understand SAT words. In context. For real." },
      {
        property: "og:description",
        content:
          "Master SAT vocabulary through real context, smart explanations, and AI-generated practice.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main>
        <Hero />
        <HowItWorks />
        <InAction />
        <DashboardPreview />
        <QuizPreview />
        <Stats />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}
