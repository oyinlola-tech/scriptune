import { api } from "./client";
import type {
  AuthSessionDto, BookDto, ChapterDto, CollectionDetailDto, CollectionDto, CollectionItemDto, HistoryEntryDto, HistoryEntryInput,
  HymnalDto, HymnalEntryDto, HymnDetailDto, HymnSearchHitDto, HymnSummaryDto, LibraryTargetType, NoteDto, PageDto,
  RecognitionMode, RecognitionResultDto, SavedItemDto, SearchAllResultDto, TranslationDto, UserDto, VerseDetailDto, VerseSearchHitDto,
} from "./types";

const q = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text === "" ? "" : `?${text}`;
};

const publicCache = { auth: false, next: { revalidate: 3600 } } as const;

export const bible = {
  translations: () => api<{ translations: TranslationDto[] }>("/bible/translations", publicCache),
  books: (translation: string) => api<{ translation: { code: string; name: string }; books: BookDto[] }>(`/bible/${translation}/books`, publicCache),
  chapter: (translation: string, book: string, chapter: number) => api<ChapterDto>(`/bible/${translation}/${book}/${chapter}`, publicCache),
  verse: (translation: string, book: string, chapter: number, verse: number, context = 2) =>
    api<VerseDetailDto>(`/bible/${translation}/${book}/${chapter}/${verse}${q({ context })}`, publicCache),
  search: (translation: string, text: string, limit = 10) =>
    api<{ translation: { code: string }; query: string; results: VerseSearchHitDto[] }>(`/bible/${translation}/search${q({ q: text, limit })}`, { auth: false }),
};

export const hymns = {
  list: (params: { page?: number; limit?: number; hymnal?: string; topic?: string; language?: string } = {}) =>
    api<PageDto<HymnSummaryDto>>(`/hymns${q(params)}`, publicCache),
  get: (slug: string) => api<HymnDetailDto>(`/hymns/${slug}`, publicCache),
  search: (text: string, limit = 10) => api<{ query: string; results: HymnSearchHitDto[] }>(`/hymns/search${q({ q: text, limit })}`, { auth: false }),
  hymnals: () => api<{ hymnals: HymnalDto[] }>("/hymnals", publicCache),
  hymnal: (slug: string, page = 1, limit = 50) => api<{ hymnal: HymnalDto; entries: PageDto<HymnalEntryDto> }>(`/hymnals/${slug}${q({ page, limit })}`, publicCache),
  byNumber: (slug: string, number: number) => api<HymnDetailDto>(`/hymnals/${slug}/${number}`, publicCache),
  forVerse: (translation: string, book: string, chapter: number, verse: number) =>
    api<{ reference: string; hymns: { slug: string; title: string; firstLine: string | null }[] }>(`/bible/${translation}/${book}/${chapter}/${verse}/related`, publicCache),
};

export const search = {
  all: (text: string, type: "all" | "verses" | "hymns" = "all", limit = 8) => api<SearchAllResultDto>(`/search${q({ q: text, type, limit })}`, { auth: false }),
};

export const recognition = {
  text: (text: string, mode: RecognitionMode, language = "auto") =>
    api<RecognitionResultDto>("/recognize/text", { method: "POST", body: { text, mode, language } }),
  audio: (blob: Blob, mode: RecognitionMode, language = "auto") => {
    const form = new FormData();
    form.set("audio", blob, `clip.${blob.type.includes("mp4") ? "mp4" : "webm"}`);
    form.set("mode", mode);
    form.set("language", language);
    return api<RecognitionResultDto>("/recognize/audio", { method: "POST", body: form });
  },
  attempt: (id: string) => api<RecognitionResultDto>(`/recognize/attempts/${id}`, { auth: false }),
};

export const auth = {
  register: (email: string, password: string, name?: string) => api<AuthSessionDto>("/auth/register", { method: "POST", body: { email, password, name }, auth: false }),
  login: (email: string, password: string) => api<AuthSessionDto>("/auth/login", { method: "POST", body: { email, password }, auth: false }),
  logout: (refreshToken?: string) => api<void>("/auth/logout", { method: "POST", body: refreshToken === undefined ? undefined : { refreshToken } }),
  me: () => api<{ user: UserDto }>("/auth/me"),
  deleteAccount: () => api<void>("/auth/me", { method: "DELETE" }),
  googleExchange: (code: string) => api<AuthSessionDto>("/auth/google/exchange", { method: "POST", body: { code }, auth: false }),
};

export const library = {
  saved: (type?: LibraryTargetType) => api<{ items: SavedItemDto[] }>(`/library/saved${q({ type })}`),
  save: (type: LibraryTargetType, key: string) => api<SavedItemDto>("/library/saved", { method: "POST", body: { type, key } }),
  unsave: (type: LibraryTargetType, key: string) => api<void>(`/library/saved/${type}/${encodeURIComponent(key)}`, { method: "DELETE" }),
  collections: () => api<{ collections: CollectionDto[] }>("/library/collections"),
  collection: (slug: string) => api<CollectionDetailDto>(`/library/collections/${slug}`),
  createCollection: (name: string, description?: string | null) => api<CollectionDto>("/library/collections", { method: "POST", body: { name, description } }),
  updateCollection: (slug: string, patch: { name?: string; description?: string | null }) => api<CollectionDto>(`/library/collections/${slug}`, { method: "PATCH", body: patch }),
  deleteCollection: (slug: string) => api<void>(`/library/collections/${slug}`, { method: "DELETE" }),
  addToCollection: (slug: string, type: LibraryTargetType, key: string, note?: string | null) =>
    api<CollectionItemDto>(`/library/collections/${slug}/items`, { method: "POST", body: { type, key, note } }),
  removeFromCollection: (slug: string, type: LibraryTargetType, key: string) =>
    api<void>(`/library/collections/${slug}/items/${type}/${encodeURIComponent(key)}`, { method: "DELETE" }),
  notes: () => api<{ notes: NoteDto[] }>("/library/notes"),
  putNote: (type: LibraryTargetType, key: string, body: string) => api<NoteDto>(`/library/notes/${type}/${encodeURIComponent(key)}`, { method: "PUT", body: { body } }),
  deleteNote: (type: LibraryTargetType, key: string) => api<void>(`/library/notes/${type}/${encodeURIComponent(key)}`, { method: "DELETE" }),
  history: (limit = 50) => api<{ entries: HistoryEntryDto[] }>(`/library/history${q({ limit })}`),
  addHistory: (entry: HistoryEntryInput) => api<{ added: number }>("/library/history", { method: "POST", body: entry }),
  importHistory: (entries: HistoryEntryInput[]) => api<{ added: number }>("/library/history/import", { method: "POST", body: { entries } }),
  clearHistory: () => api<void>("/library/history", { method: "DELETE" }),
};

export { parseVerseKey, targetPath, verseKey } from "@scriptune/contracts";
