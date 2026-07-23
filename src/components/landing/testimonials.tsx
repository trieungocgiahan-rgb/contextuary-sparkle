import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS = [
  { quote: "Contextuary changed the way I study vocabulary. I finally remember words because I understand them in context.", author: "Jenny, SAT 1560" },
  { quote: "The Vietnamese explanations are so precise — no more guessing. It clicks the first time.", author: "Minh, SAT 1520" },
  { quote: "Quizzes feel like a game. I hit a 40-day streak without realizing.", author: "Linh, SAT 1490" },
];

export function Testimonials() {
  const [idx, setIdx] = useState(0);
  const cur = ITEMS[idx];
  return (
    <section className="py-20">
      <div className="mx-auto max-w-4xl px-6">
        <div className="relative">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIdx((idx - 1 + ITEMS.length) % ITEMS.length)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-all hover:text-foreground"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <AnimatePresence mode="wait">
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="mx-6 flex-1 text-center"
              >
                <p className="font-serif text-xl italic text-foreground md:text-2xl">
                  "{cur.quote}"
                </p>
                <div className="mt-3 text-sm text-muted-foreground">— {cur.author}</div>
              </motion.div>
            </AnimatePresence>
            <button
              onClick={() => setIdx((idx + 1) % ITEMS.length)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-all hover:text-foreground"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-6 flex justify-center gap-1.5">
            {ITEMS.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Go to testimonial ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/40"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
