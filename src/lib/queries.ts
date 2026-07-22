import { queryOptions } from "@tanstack/react-query";
import { listWords, listTags, getStats, getProfile } from "./vocab.functions";

export const wordsQueryOptions = () =>
  queryOptions({ queryKey: ["words"], queryFn: () => listWords() });

export const tagsQueryOptions = () =>
  queryOptions({ queryKey: ["tags"], queryFn: () => listTags() });

export const statsQueryOptions = () =>
  queryOptions({ queryKey: ["stats"], queryFn: () => getStats() });

export const profileQueryOptions = () =>
  queryOptions({ queryKey: ["profile"], queryFn: () => getProfile() });
