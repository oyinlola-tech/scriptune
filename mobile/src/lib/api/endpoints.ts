import type {
  CrossReferencesDto,
  AuthSessionDto, BookDto, ChapterDto, CollectionDetailDto, CollectionDto, CollectionItemDto, HistoryEntryDto, HistoryEntryInput, HymnalDto,
  HymnalEntryDto, HymnDetailDto, HymnSummaryDto, LibraryTargetType, NoteDto, PageDto, RecognitionMode, RecognitionResultDto, SavedItemDto,
  SearchAllResultDto, TranslationDto, TranslationSummaryDto, UserDto, VerseDetailDto,
} from "@scriptune/contracts";
import { api } from "./client";

const q = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text === "" ? "" : `?${text}`;
};

const anonymous = { auth: false } as const;

export const bible = {
  translations: () => api<{ translations: TranslationDto[] }>("/bible/translations", anonymous),
  books: (translation: string) => api<{ translation: TranslationSummaryDto; books: BookDto[] }>(`/bible/${translation}/books`, anonymous),
  chapter: (translation: string, book: string, chapter: number) => api<ChapterDto>(`/bible/${translation}/${book}/${chapter}`, anonymous),
  crossReferences: (translation: string, book: string, chapter: number, verse: number) => api<CrossReferencesDto>(`/bible/${translation}/${book}/${chapter}/${verse}/cross-references`, anonymous),
  verse: (translation: string, book: string, chapter: number, verse: number) => api<VerseDetailDto>(`/bible/${translation}/${book}/${chapter}/${verse}`, anonymous),
};

export const hymns = {
  forVerse: (translation: string, book: string, chapter: number, verse: number) =>
    api<{ reference: string; hymns: { slug: string; title: string; firstLine: string | null }[] }>(`/bible/${translation}/${book}/${chapter}/${verse}/related`, anonymous),
  list: (page = 1, pageSize = 50) => api<PageDto<HymnSummaryDto>>(`/hymns${q({ page, pageSize })}`, anonymous),
  get: (slug: string) => api<HymnDetailDto>(`/hymns/${slug}`, anonymous),
  hymnals: () => api<{ hymnals: HymnalDto[] }>("/hymnals", anonymous),
  hymnal: (slug: string, page = 1, limit = 100) => api<{ hymnal: HymnalDto; entries: PageDto<HymnalEntryDto> }>(`/hymnals/${slug}${q({ page, limit })}`, anonymous),
  byNumber: (slug: string, number: number) => api<HymnDetailDto>(`/hymnals/${slug}/${number}`, anonymous),
};

export const search = {
  all: (query: string, translation?: string) => api<SearchAllResultDto>(`/search${q({ q: query, translation })}`, anonymous),
};

export const recognition = {
  text: (text: string, mode: RecognitionMode = "auto", language = "auto") =>
    api<RecognitionResultDto>("/recognize/text", { method: "POST", body: { text, mode, language } }),
  /** `file` is the shape React Native's FormData accepts: { uri, name, type }. */
  audio: (file: { uri: string; name: string; type: string }, mode: RecognitionMode = "auto", language = "auto") => {
    const form = new FormData();
    form.append("audio", file as unknown as Blob);
    form.append("mode", mode);
    form.append("language", language);
    return api<RecognitionResultDto>("/recognize/audio", { method: "POST", body: form });
  },
  attempt: (id: string) => api<RecognitionResultDto>(`/recognize/attempts/${id}`, anonymous),
};

export const auth = {
  register: (email: string, password: string, displayName?: string) =>
    api<AuthSessionDto>("/auth/register", { method: "POST", body: { email, password, displayName }, auth: false }),
  login: (email: string, password: string) => api<AuthSessionDto>("/auth/login", { method: "POST", body: { email, password }, auth: false }),
  logout: (refreshToken: string) => api<void>("/auth/logout", { method: "POST", body: { refreshToken } }),
  me: () => api<{ user: UserDto }>("/auth/me"),
  deleteAccount: () => api<void>("/auth/me", { method: "DELETE" }),
  exchangeGoogle: (code: string) => api<AuthSessionDto>("/auth/google/exchange", { method: "POST", body: { code }, auth: false }),
};

export const library = {
  saved: () => api<{ items: SavedItemDto[] }>("/library/saved"),
  save: (type: LibraryTargetType, key: string) => api<SavedItemDto>("/library/saved", { method: "POST", body: { type, key } }),
  unsave: (type: LibraryTargetType, key: string) => api<void>(`/library/saved/${type}/${encodeURIComponent(key)}`, { method: "DELETE" }),
  collections: () => api<{ collections: CollectionDto[] }>("/library/collections"),
  history: (limit = 50) => api<{ entries: HistoryEntryDto[] }>(`/library/history${q({ limit })}`),
  addHistory: (entry: HistoryEntryInput) => api<{ added: number }>("/library/history", { method: "POST", body: entry }),
  importHistory: (entries: HistoryEntryInput[]) => api<{ added: number }>("/library/history/import", { method: "POST", body: { entries } }),
  clearHistory: () => api<void>("/library/history", { method: "DELETE" }),
  collection: (slug: string) => api<CollectionDetailDto>(`/library/collections/${slug}`),
  createCollection: (name: string) => api<CollectionDto>("/library/collections", { method: "POST", body: { name } }),
  deleteCollection: (slug: string) => api<void>(`/library/collections/${slug}`, { method: "DELETE" }),
  addToCollection: (slug: string, type: LibraryTargetType, key: string) => api<CollectionItemDto>(`/library/collections/${slug}/items`, { method: "POST", body: { type, key } }),
  removeFromCollection: (slug: string, type: LibraryTargetType, key: string) => api<void>(`/library/collections/${slug}/items/${type}/${encodeURIComponent(key)}`, { method: "DELETE" }),
  notes: () => api<{ notes: NoteDto[] }>("/library/notes"),
  putNote: (type: LibraryTargetType, key: string, body: string) => api<NoteDto>(`/library/notes/${type}/${encodeURIComponent(key)}`, { method: "PUT", body: { body } }),
  deleteNote: (type: LibraryTargetType, key: string) => api<void>(`/library/notes/${type}/${encodeURIComponent(key)}`, { method: "DELETE" }),
};
