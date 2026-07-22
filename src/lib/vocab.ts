export const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "learning", label: "Learning" },
  { value: "reviewing", label: "Reviewing" },
  { value: "mastered", label: "Mastered" },
] as const;

export type WordStatus = (typeof STATUS_OPTIONS)[number]["value"];

export const STATUS_META: Record<
  WordStatus,
  { label: string; bg: string; fg: string; ring: string }
> = {
  mastered: {
    label: "Mastered",
    bg: "bg-status-mastered",
    fg: "text-status-mastered-fg",
    ring: "ring-status-mastered-fg/20",
  },
  reviewing: {
    label: "Reviewing",
    bg: "bg-status-reviewing",
    fg: "text-status-reviewing-fg",
    ring: "ring-status-reviewing-fg/20",
  },
  learning: {
    label: "Learning",
    bg: "bg-status-learning",
    fg: "text-status-learning-fg",
    ring: "ring-status-learning-fg/20",
  },
  new: {
    label: "New",
    bg: "bg-status-new",
    fg: "text-status-new-fg",
    ring: "ring-status-new-fg/20",
  },
};

export const TAG_COLORS = [
  "society",
  "environment",
  "psychology",
  "justice",
  "science",
  "abstract",
  "emotion",
  "academic",
  "general",
  "nature",
] as const;

export type TagColor = (typeof TAG_COLORS)[number];

export function tagBgClass(color: string): string {
  const c = TAG_COLORS.includes(color as TagColor) ? color : "general";
  return `bg-tag-${c} text-foreground/80`;
}

export const QUOTES = [
  { text: "The limits of my language mean the limits of my world.", author: "Ludwig Wittgenstein" },
  { text: "Words are, of course, the most powerful drug used by mankind.", author: "Rudyard Kipling" },
  { text: "A different language is a different vision of life.", author: "Federico Fellini" },
  { text: "One language sets you in a corridor for life. Two languages open every door along the way.", author: "Frank Smith" },
  { text: "Language is the road map of a culture.", author: "Rita Mae Brown" },
];
