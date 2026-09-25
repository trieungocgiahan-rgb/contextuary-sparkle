import { Link } from "@tanstack/react-router";
import { ArrowRight, Twitter, Instagram, Youtube, MessageCircle } from "lucide-react";
import { Sparkle } from "./decorations";
import { logoUrl } from "@/lib/assets";


const COLUMNS = [
  {
    title: "Product",
    links: ["Features", "How it works", "Pricing", "Updates"],
  },
  {
    title: "Resources",
    links: ["Blog", "Study tips", "SAT vocabulary list", "Help center"],
  },
  {
    title: "Company",
    links: ["About", "Contact", "Privacy", "Terms"],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-sidebar text-sidebar-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        {Array.from({ length: 12 }).map((_, i) => (
          <Sparkle
            key={i}
            className="absolute text-sidebar-primary/50"
            size={10 + (i % 3) * 4}
          />
        ))}
      </div>
      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.4fr_3fr]">
        <div>
          <h3 className="text-2xl font-bold leading-tight">
            Ready to transform
            <br />
            your vocabulary?
          </h3>
          <p className="mt-3 max-w-xs text-sm opacity-75">
            Join thousands of learners who are mastering SAT words the smart way.
          </p>
          <Link
            to="/auth"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-sidebar-primary px-5 py-2.5 text-sm font-medium text-sidebar-primary-foreground transition-all hover:opacity-90"
          >
            Get started for free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-sm font-semibold">{col.title}</div>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm opacity-70 transition-opacity hover:opacity-100">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <img src={logoUrl} alt="" className="h-5 w-5 rounded" />
              Contextuary
            </div>

            <p className="mt-3 text-sm opacity-70">
              Understand words.
              <br />
              In context. For real.
            </p>
            <div className="mt-4 flex gap-3 opacity-80">
              <Twitter className="h-4 w-4" />
              <Instagram className="h-4 w-4" />
              <Youtube className="h-4 w-4" />
              <MessageCircle className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
      <div className="relative border-t border-sidebar-border">
        <div className="mx-auto max-w-7xl px-6 py-5 text-center text-xs opacity-60">
          © 2026 Contextuary. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
