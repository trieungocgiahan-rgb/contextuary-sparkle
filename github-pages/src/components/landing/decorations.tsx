import { motion } from "framer-motion";

export function Sparkle({ className = "", size = 16 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M12 2l1.8 6.4L20 10l-6.2 1.6L12 18l-1.8-6.4L4 10l6.2-1.6L12 2z"
        fill="currentColor"
      />
    </svg>
  );
}

const DRIFT_WORDS = [
  "ubiquitous",
  "mitigate",
  "salient",
  "arbitrary",
  "ephemeral",
  "candid",
  "prudent",
  "verbose",
];

export function DriftingBackdrop({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const wordClass = tone === "light" ? "text-white/[0.08]" : "text-primary/10";
  const sparkClass = tone === "light" ? "text-pink-200/50" : "text-primary/30";
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {DRIFT_WORDS.map((w, i) => (
        <motion.span
          key={w}
          className={`absolute select-none font-serif italic ${wordClass}`}
          style={{
            fontSize: 24 + ((i * 7) % 28),
            top: `${(i * 13) % 90}%`,
            left: `${(i * 23) % 92}%`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 12, 0],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 14 + i * 1.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.6,
          }}
        >
          {w}
        </motion.span>
      ))}
      {Array.from({ length: 10 }).map((_, i) => (
        <motion.div
          key={i}
          className={`absolute ${sparkClass}`}
          style={{
            top: `${(i * 37) % 95}%`,
            left: `${(i * 53) % 95}%`,
          }}
          animate={{
            scale: [0.6, 1, 0.6],
            opacity: [0.2, 0.6, 0.2],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 6 + (i % 4),
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.4,
          }}
        >
          <Sparkle size={12 + (i % 3) * 4} />
        </motion.div>
      ))}
    </div>
  );
}

export function SectionReveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
