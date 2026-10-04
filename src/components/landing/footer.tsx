import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { logoUrl } from "@/lib/assets";

// Only links to pages and sections that exist. App pages ask signed-out visitors to
// sign in, then continue to the page they picked.
const COLUMNS: { title: string; links: { label: string; to: string; hash?: string }[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "Features", to: "/", hash: "features" },
      { label: "How it works", to: "/", hash: "how" },
      { label: "Sample quiz", to: "/", hash: "practice" },
      { label: "Progress", to: "/", hash: "progress" },
    ],
  },
  {
    title: "Study",
    links: [
      { label: "My Words", to: "/words" },
      { label: "Practice", to: "/practice" },
      { label: "Statistics", to: "/statistics" },
      { label: "Tags", to: "/tags" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", to: "/auth" },
      { label: "Settings", to: "/settings" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-ombre mt-12 rounded-t-[2.5rem] text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.4fr_2fr]">
        <div>
          <h3 className="text-3xl font-bold leading-tight tracking-tight">
            Ready to transform
            <br />
            <span className="text-ombre-light font-serif font-normal italic">your vocabulary?</span>
          </h3>
          <p className="mt-3 max-w-xs text-sm text-white/75">
            Add your first SAT word in seconds. It's free.
          </p>
          <Link
            to="/words"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-primary shadow-lg transition-all hover:bg-white/90"
          >
            Add my first word <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-sm font-semibold">{col.title}</div>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      hash={l.hash}
                      className="text-sm text-white/70 transition-colors hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-5 text-xs text-white/60 sm:flex-row">
          <div className="flex items-center gap-2 font-semibold text-white/90">
            <img src={logoUrl} alt="" className="h-5 w-5 rounded" />
            Contextuary
          </div>
          <span>© {new Date().getFullYear()} Contextuary. Understand words. In context. For real.</span>
        </div>
      </div>
    </footer>
  );
}
