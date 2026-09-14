import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

/**
 * Hymns and verses are cached for a week so recently opened ones read
 * offline. Library queries are short-lived and never persisted.
 */
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, gcTime: 7 * 24 * 60 * 60 * 1000, retry: 1 } },
});

export const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: "scriptune.cache" });

export const persistOptions = {
  persister,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  dehydrateOptions: { shouldDehydrateQuery: (query: { queryKey: readonly unknown[]; state: { status: string } }) => query.state.status === "success" && query.queryKey[0] !== "library" && query.queryKey[0] !== "offline" },
};

export const keys = {
  books: (translation: string) => ["books", translation] as const,
  chapter: (translation: string, book: string, chapter: number) => ["chapter", translation, book, chapter] as const,
  hymn: (slug: string) => ["hymn", slug] as const,
  hymnals: () => ["hymnals"] as const,
  hymnal: (slug: string) => ["hymnal", slug] as const,
  verse: (translation: string, book: string, chapter: number, verse: number) => ["verse", translation, book, chapter, verse] as const,
  search: (query: string) => ["search", query] as const,
  saved: () => ["library", "saved"] as const,
  collections: () => ["library", "collections"] as const,
  collection: (slug: string) => ["library", "collections", slug] as const,
  notes: () => ["library", "notes"] as const,
  history: () => ["library", "history"] as const,
};
