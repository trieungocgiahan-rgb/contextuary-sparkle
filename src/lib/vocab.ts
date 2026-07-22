export const STATUS_OPTIONS = ["new", "learning", "reviewing", "mastered"] as const;
export type WordStatus = (typeof STATUS_OPTIONS)[number];

export const STATUS_META: Record<
  WordStatus,
  { label: string; bg: string; fg: string }
> = {
  new: { label: "New", bg: "#EEF2FF", fg: "#4338CA" },
  learning: { label: "Learning", bg: "#FEF3C7", fg: "#B45309" },
  reviewing: { label: "Reviewing", bg: "#FCE7F3", fg: "#BE185D" },
  mastered: { label: "Mastered", bg: "#DCFCE7", fg: "#166534" },
};

export const TAG_COLORS = [
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#3B82F6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#6366F1",
  "#84CC16",
] as const;

export type TagColor = string;

export const QUOTES = [
  { text: "The limits of my language mean the limits of my world.", author: "Ludwig Wittgenstein" },
  { text: "Words are, of course, the most powerful drug used by mankind.", author: "Rudyard Kipling" },
  { text: "A different language is a different vision of life.", author: "Federico Fellini" },
  { text: "One language sets you in a corridor for life. Two languages open every door along the way.", author: "Frank Smith" },
  { text: "Language is the road map of a culture.", author: "Rita Mae Brown" },
];
