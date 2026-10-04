import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { MousePointerClick, Plus, Volume2 } from "lucide-react";
import { SectionReveal } from "./decorations";
import { speakText } from "@/lib/speech";
import { cn } from "@/lib/utils";

type DemoWord = {
  word: string;
  ipa: string;
  meaning: string;
  not: string;
  example: string;
  hint: string;
};

const DEMO: Record<string, DemoWord> = {
  arbitrary: {
    word: "arbitrary",
    ipa: "/ˈɑːrbɪtreri/",
    meaning: "tùy tiện, không dựa trên nguyên tắc",
    not: "random (ngẫu nhiên)",
    example: "The decision seemed arbitrary and unfair.",
    hint: "Arbi = random trong đầu → làm theo ý mình.",
  },
  rationale: {
    word: "rationale",
    ipa: "/ˌræʃəˈnæl/",
    meaning: "lý do cơ bản, cơ sở lập luận",
    not: "rational (hợp lý), which is an adjective",
    example: "She explained the rationale behind the new policy.",
    hint: "Ration-ale → the reasons you ration out to explain a choice.",
  },
  inconsistent: {
    word: "inconsistent",
    ipa: "/ˌɪnkənˈsɪstənt/",
    meaning: "không nhất quán, mâu thuẫn",
    not: "irregular (bất thường)",
    example: "His account was inconsistent with the evidence.",
    hint: "in + consistent → không giữ được sự nhất quán.",
  },
};

function Hotword({
  id,
  active,
  onPick,
}: {
  id: keyof typeof DEMO;
  active: boolean;
  onPick: (id: keyof typeof DEMO) => void;
}) {
  return (
    <button
      type="button"
      onMouseEnter={() => onPick(id)}
      onFocus={() => onPick(id)}
      onClick={() => onPick(id)}
      className={cn(
        "rounded px-1 font-semibold transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-primary/12 text-primary hover:bg-primary/20",
      )}
    >
      {id}
    </button>
  );
}

export function InAction() {
  const [picked, setPicked] = useState<keyof typeof DEMO>("arbitrary");
  const w = DEMO[picked];
  return (
    <section id="features" className="scroll-mt-20 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 rounded-[2rem] border border-primary/15 bg-gradient-to-br from-accent/70 via-card to-fuchsia-50 p-8 shadow-sm md:p-12 lg:grid-cols-[1fr_2fr]">
          <SectionReveal>
            <div className="text-xs font-bold uppercase tracking-widest text-spark">
              Interactive demo
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              See Contextuary <span className="font-serif font-normal italic text-primary">in action</span>
            </h2>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Tap a highlighted word to see how Contextuary explains it: meaning, the word it's
              often confused with, an example and a memory hint.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
              <MousePointerClick className="h-4 w-4 text-primary" /> Tap or hover the words
            </div>
          </SectionReveal>

          <SectionReveal delay={0.1}>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  SAT reading passage
                </div>
                <p className="mt-3 text-base leading-loose text-foreground">
                  The committee's decision appeared{" "}
                  <Hotword id="arbitrary" active={picked === "arbitrary"} onPick={setPicked} /> to
                  many observers, as it lacked a clear{" "}
                  <Hotword id="rationale" active={picked === "rationale"} onPick={setPicked} /> and
                  seemed{" "}
                  <Hotword id="inconsistent" active={picked === "inconsistent"} onPick={setPicked} />{" "}
                  with previous policies.
                </p>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={w.word}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="rounded-2xl border border-border bg-card p-5 shadow-xl shadow-primary/10"
                >
                  <div className="text-xl font-bold text-foreground">{w.word}</div>
                  <button
                    type="button"
                    onClick={() => speakText(w.word)}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
                    aria-label={`Hear how ${w.word} is pronounced`}
                  >
                    {w.ipa} <Volume2 className="h-3.5 w-3.5" />
                  </button>
                  <p className="mt-3 text-sm font-semibold text-foreground">{w.meaning}</p>
                  <div className="mt-3 text-xs">
                    <span className="font-bold text-destructive">NOT</span>{" "}
                    <span className="text-muted-foreground">{w.not}</span>
                  </div>
                  <div className="mt-3">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-primary">
                      Example
                    </div>
                    <p className="mt-1 text-xs text-foreground">{w.example}</p>
                  </div>
                  <div className="mt-2">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-spark">
                      Memory hint
                    </div>
                    <p className="mt-1 text-xs text-foreground">{w.hint}</p>
                  </div>
                  <Link
                    to="/words"
                    search={{ add: w.word }}
                    className="btn-ombre mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" /> Save “{w.word}” to my library
                  </Link>
                </motion.div>
              </AnimatePresence>
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
