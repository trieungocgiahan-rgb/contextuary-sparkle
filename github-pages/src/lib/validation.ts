// Client-safe helpers. Deterministic checks + Levenshtein.

export const BASIC_STOPLIST = new Set([
  "love", "hate", "big", "small", "good", "bad", "happy", "sad", "run", "walk",
  "eat", "drink", "sleep", "go", "come", "see", "look", "hear", "say", "tell",
  "make", "do", "get", "give", "take", "find", "want", "need", "like", "know",
  "think", "feel", "have", "be", "is", "are", "was", "were", "will", "would",
  "cat", "dog", "house", "car", "food", "water", "day", "night", "man", "woman",
  "boy", "girl", "child", "friend", "family", "school", "book", "money", "job",
  "work", "play", "read", "write", "buy", "sell", "help", "start", "stop", "open",
  "close", "new", "old", "young", "hot", "cold", "warm", "cool", "fast", "slow",
  "high", "low", "up", "down", "in", "out", "on", "off", "yes", "no", "maybe",
  "hello", "goodbye", "please", "thanks", "sorry", "very", "much", "many", "few",
  "some", "all", "any", "every", "first", "last", "next", "here", "there", "now",
  "then", "today", "yesterday", "tomorrow", "morning", "evening", "week", "month",
  "year", "time", "place", "thing", "person", "way", "life", "world", "hand", "eye",
  "foot", "head", "heart", "mother", "father", "brother", "sister", "baby", "kid",
]);

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1]
        ? prev
        : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[n];
}
