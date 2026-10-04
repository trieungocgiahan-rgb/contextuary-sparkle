import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Check, Play } from "lucide-react";
import { DriftingBackdrop, Sparkle } from "./decorations";
import { HeroShowcase } from "./hero-showcase";

const CHIPS = ["ubiquitous", "mitigate", "salient", "arbitrary"];
const POINTS = ["Vietnamese meanings", "SAT-style examples", "Quizzes & flashcards"];

export function Hero() {
  const navigate = useNavigate();
  const [word, setWord] = useState("");

  // Adding a word is the app's core action: send the visitor straight to it. Signed-out
  // visitors go through sign-in first and land back on the prefilled Add Word dialog.
  function addWord(w: string) {
    const clean = w.trim().toLowerCase();
    navigate({ to: "/words", search: clean ? { add: clean } : {} });
  }

  return (
    <section
      id="top"
      className="relative overflow-hidden rounded-b-[2.5rem] bg-ombre pb-20 pt-28 text-white md:pb-28 md:pt-36"
    >
      <DriftingBackdrop tone="light" />
      <div className="relative mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col justify-center"
        >
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
            <Sparkle size={12} className="text-pink-200" />
            SAT vocabulary, explained in Vietnamese
          </span>
          <h1 className="mt-6 text-5xl font-bold leading-[1.02] tracking-tight md:text-6xl lg:text-7xl">
            Understand words.
            <br />
            <span className="text-ombre-light font-serif font-normal italic">In context.</span>
            <br />
            For real.
          </h1>
          <p className="mt-6 max-w-md text-base text-white/80 md:text-lg">
            Add any SAT word and get its Vietnamese meaning, real SAT-style examples and a memory
            hint. Then lock it in with quizzes, flashcards and AI challenges.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              addWord(word);
            }}
            className="mt-8 flex max-w-md items-center gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-black/30"
          >
            <input
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="Type any SAT word…"
              aria-label="SAT word to add"
              className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <button
              type="submit"
              className="btn-ombre inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
            >
              Add word <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-4 flex max-w-md flex-wrap items-center gap-2">
            <span className="text-xs text-white/60">Try:</span>
            {CHIPS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => addWord(c)}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white transition-all hover:bg-white/20"
              >
                {c}
              </button>
            ))}
          </div>

          <Link
            to="/"
            hash="practice"
            className="mt-8 inline-flex w-fit items-center gap-2 text-sm font-semibold text-white transition-opacity hover:opacity-80"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
              <Play className="h-3.5 w-3.5 fill-current" />
            </span>
            Try a sample quiz, no sign-up
          </Link>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/75">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-pink-200" /> {p}
              </li>
            ))}
          </ul>
        </motion.div>

        <HeroShowcase onAddWord={addWord} />
      </div>
    </section>
  );
}
