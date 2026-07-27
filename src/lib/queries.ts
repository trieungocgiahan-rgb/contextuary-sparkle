import { queryOptions, infiniteQueryOptions } from "@tanstack/react-query";
import { listWords, listTags, getStats, getProfile, listFallbackWords, isAdmin } from "./vocab.functions";
import { listDailyPicks, getDailyProgress } from "./daily-picks.functions";

export const wordsQueryOptions = () =>
  queryOptions({ queryKey: ["words"], queryFn: () => listWords() });

export const tagsQueryOptions = () =>
  queryOptions({ queryKey: ["tags"], queryFn: () => listTags() });

export const statsQueryOptions = () =>
  queryOptions({ queryKey: ["stats"], queryFn: () => getStats() });

export const profileQueryOptions = () =>
  queryOptions({ queryKey: ["profile"], queryFn: () => getProfile() });

export const fallbackWordsQueryOptions = () =>
  queryOptions({ queryKey: ["fallback-words"], queryFn: () => listFallbackWords(), staleTime: 5 * 60_000 });

export const isAdminQueryOptions = () =>
  queryOptions({ queryKey: ["is-admin"], queryFn: () => isAdmin() });

export const dailyProgressQueryOptions = (date: string) =>
  queryOptions({
    queryKey: ["daily-progress", date],
    queryFn: () => getDailyProgress({ data: { date } }),
  });

export const dailyPicksInfiniteQueryOptions = () =>
  infiniteQueryOptions({
    queryKey: ["daily-picks"],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      listDailyPicks({ data: { offset: pageParam as number, limit: 20 } }),
    getNextPageParam: (last, all) =>
      last.hasMore ? (all.length) * 20 : undefined,
  });
