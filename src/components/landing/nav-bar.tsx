import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { logoUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";

// Every link points at a section that exists on this page.
const NAV_LINKS = [
  { label: "Features", hash: "features" },
  { label: "How it works", hash: "how" },
  { label: "Practice", hash: "practice" },
  { label: "Progress", hash: "progress" },
];

export function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Over the dark hero the nav is light-on-dark; once scrolled it becomes a white bar.
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/70 bg-background/85 shadow-sm backdrop-blur-md"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <Link
          to="/"
          hash="top"
          className={cn(
            "flex items-center gap-2.5 text-lg font-semibold transition-colors",
            scrolled ? "text-foreground" : "text-white",
          )}
        >
          <img src={logoUrl} alt="" className="h-8 w-8 rounded-lg shadow-sm" />
          Contextuary
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.hash}
              to="/"
              hash={l.hash}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                scrolled
                  ? "text-muted-foreground hover:bg-accent hover:text-foreground"
                  : "text-white/80 hover:bg-white/10 hover:text-white",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/auth"
            className={cn(
              "hidden rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:inline-flex",
              scrolled
                ? "text-foreground hover:bg-accent"
                : "text-white hover:bg-white/10",
            )}
          >
            Log in
          </Link>
          <Link
            to="/words"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
              scrolled ? "btn-ombre" : "bg-white text-primary shadow-lg hover:bg-white/90",
            )}
          >
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
