import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowRight, Shield, Sparkles, Heart } from "lucide-react";
import { logoUrl, signinBgUrl } from "@/lib/assets";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Contextuary" },
      { name: "description", content: "Sign in to your Contextuary SAT vocabulary library with Google." },
      { property: "og:title", content: "Sign in — Contextuary" },
      { property: "og:description", content: "Access your personal SAT vocabulary and quizzes." },
    ],
  }),
  component: AuthPage,
});

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.44 1.18 4.95l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}

const QUOTES = [
  { text: "Words are the keys to understanding the world.", author: "More than memorization, it's mastery." },
  { text: "Context is everything — meaning lives between the lines.", author: "Learn how words breathe." },
  { text: "A larger vocabulary is a larger world.", author: "One word at a time." },
  { text: "Read closely. Think clearly. Write beautifully.", author: "The Contextuary way." },
];

function SparkleIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2l1.8 6.4L20 10l-6.2 1.6L12 18l-1.8-6.4L4 10l6.2-1.6L12 2z" />
    </svg>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/words", replace: true });
    });
  }, [navigate]);

  useEffect(() => {
    const id = setInterval(() => setQuoteIdx((i) => (i + 1) % QUOTES.length), 5000);
    return () => clearInterval(id);
  }, []);

  // Supabase sends the browser back here with ?code=…; the client exchanges it for a
  // session on load and the effect above forwards to /words. Add this URL to
  // Supabase → Authentication → URL Configuration → Redirect URLs.
  const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}auth`;

  async function google() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message ?? "Google sign-in failed");
    }
  }

  async function emailLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "Couldn't send the sign-in link");
      return;
    }
    setEmailSent(true);
  }

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-background">
      {/* Background illustration */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center lg:bg-[position:50%_100%]"
        style={{
          // Falls back to the gradient until you add public/signin-bg.png.
          backgroundImage: `url(${signinBgUrl}), radial-gradient(circle at 20% 20%, rgba(139,92,246,0.18), transparent 55%), radial-gradient(circle at 80% 90%, rgba(103,51,220,0.14), transparent 50%)`,
        }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:py-12"
      >
        <div className="flex flex-1 items-center justify-center lg:justify-end">
          {/* RIGHT — auth card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-lg"
          >
            <div className="rounded-3xl border border-border/60 bg-card/90 p-8 shadow-[0_30px_80px_-30px_rgba(103,51,220,0.35)] backdrop-blur-sm sm:p-10">
              {/* Logo + wordmark */}
              <Link to="/" className="flex items-center justify-center gap-3">
                <img src={logoUrl} alt="Contextuary logo" className="h-11 w-11 object-contain" />
                <span className="text-3xl font-bold tracking-tight text-foreground">Contextuary</span>
                <SparkleIcon size={18} className="text-primary" />
              </Link>

              <p className="mt-4 text-center text-base text-muted-foreground">
                Understand words. In context.{" "}
                <span className="font-semibold text-primary">For real.</span>
              </p>

              {/* Info chip */}
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <SparkleIcon size={16} />
                </div>
                <p className="text-sm leading-relaxed text-foreground/80">
                  Your AI-powered SAT vocabulary companion.
                  <br className="hidden sm:block" /> Learn smarter, remember longer.
                </p>
              </div>

              {/* Google button */}
              <motion.div whileHover={{ y: -1 }} transition={{ duration: 0.2 }} className="mt-6">
                <Button
                  onClick={google}
                  disabled={loading}
                  size="lg"
                  variant="outline"
                  className="group w-full justify-between rounded-2xl border-2 border-primary bg-card px-5 py-6 text-base font-semibold text-foreground shadow-sm hover:bg-primary/5"
                >
                  <span className="flex items-center gap-3">
                    <GoogleIcon />
                    <span className="text-primary">
                      {loading ? "Connecting…" : "Continue with Google"}
                    </span>
                  </span>
                  <ArrowRight className="h-5 w-5 text-primary transition-transform group-hover:translate-x-1" />
                </Button>
              </motion.div>

              {/* Email magic link */}
              <div className="mt-5 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                or
                <div className="h-px flex-1 bg-border" />
              </div>
              {emailSent ? (
                <p className="mt-4 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-center text-sm text-foreground/80">
                  Check <span className="font-semibold">{email}</span> for a sign-in link. Open it in
                  this browser.
                </p>
              ) : (
                <form onSubmit={emailLink} className="mt-4 flex gap-2">
                  <Input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-xl"
                    aria-label="Email address"
                  />
                  <Button type="submit" disabled={loading} className="h-11 rounded-xl px-4">
                    Email me a link
                  </Button>
                </form>
              )}

              {/* Feature trio */}
              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-border/60 pt-6">
                {[
                  { Icon: Shield, title: "Private & Secure", desc: "Your data is encrypted and never shared." },
                  { Icon: Sparkles, title: "AI-Powered", desc: "Smart explanations tailored to you." },
                  { Icon: Heart, title: "Made for You", desc: "Your personal vocabulary library, anywhere." },
                ].map(({ Icon, title, desc }) => (
                  <div key={title} className="flex flex-col items-center text-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="mt-2 text-xs font-semibold text-foreground">{title}</div>
                    <div className="mt-1 text-[11px] leading-snug text-muted-foreground">{desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quote carousel */}
            <div className="mt-6 rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <span className="font-serif text-2xl leading-none text-primary">“</span>
                <div className="min-h-[48px] flex-1">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={quoteIdx}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.35 }}
                      className="text-center text-sm text-foreground/80"
                    >
                      <p>{QUOTES[quoteIdx].text}</p>
                      <p className="mt-1 text-xs text-muted-foreground">— {QUOTES[quoteIdx].author}</p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
              <div className="mt-3 flex justify-center gap-1.5">
                {QUOTES.map((_, i) => (
                  <button
                    key={i}
                    aria-label={`Quote ${i + 1}`}
                    onClick={() => setQuoteIdx(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === quoteIdx ? "w-5 bg-primary" : "w-1.5 bg-primary/25"
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Contextuary. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link to="/" className="hover:text-foreground">Privacy</Link>
            <Link to="/" className="hover:text-foreground">Terms</Link>
            <Link to="/" className="hover:text-foreground">Contact</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
