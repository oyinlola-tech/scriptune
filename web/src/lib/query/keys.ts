/** Query keys, one namespace per API area. */
export const keys = {
  saved: (type?: string) => ["library", "saved", type ?? "all"] as const,
  collections: () => ["library", "collections"] as const,
  collection: (slug: string) => ["library", "collections", slug] as const,
  notes: () => ["library", "notes"] as const,
  history: () => ["library", "history"] as const,
  hymnSearch: (text: string) => ["hymns", "search", text] as const,
  verseSearch: (translation: string, text: string) => ["bible", "search", translation, text] as const,
  searchAll: (text: string, type: string) => ["search", type, text] as const,
  attempt: (id: string) => ["recognition", "attempt", id] as const,
};
