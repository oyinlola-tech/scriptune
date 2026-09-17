/** Response shapes of the Scriptune API, mirrored from api/src/dtos. */

export interface ApiErrorBody {
  error: { code: string; message: string; status: number; requestId?: string; details?: unknown };
}

export interface TranslationDto {
  code: string;
  name: string;
  language: string;
  description: string | null;
  rightsStatus: string;
  isDefault: boolean;
  verseCount: number;
}

/** What a reading view needs to label a translation and honour its licence. */
export interface TranslationSummaryDto {
  code: string;
  name: string;
  language: string;
  rightsStatus: string;
  /** The copyright notice an open licence requires beside the text; null for public-domain texts. */
  notice: string | null;
}

export interface BookDto {
  slug: string;
  name: string;
  /** The name in the translation's own language ("Saamu"), or null where the English name serves. */
  localName: string | null;
  abbreviation: string;
  testament: "OLD" | "NEW";
  /** True for the seven books Catholic editions include and Protestant ones omit. */
  deuterocanonical: boolean;
  order: number;
  chapterCount: number;
}

export interface VerseDto {
  reference: string;
  book: { slug: string; name: string; localName: string | null; abbreviation: string };
  chapter: number;
  verse: number;
  text: string;
}

export interface ChapterDto {
  translation: TranslationSummaryDto;
  book: BookDto;
  chapter: number;
  verses: VerseDto[];
}

export interface VerseDetailDto {
  translation: TranslationSummaryDto;
  verse: VerseDto;
  context: { before: VerseDto[]; after: VerseDto[] };
}

/** A passage related to a verse, with the text of its first verse in the translation being read. */
export interface CrossReferenceDto {
  /** "Hebrews 1:10", or "Proverbs 8:22-30" for a passage; always with the English book name. */
  reference: string;
  book: { slug: string; name: string; localName: string | null; abbreviation: string };
  chapter: number;
  verse: number;
  /** Last verse when the link is to a passage, otherwise null. */
  endVerse: number | null;
  text: string;
}

export interface CrossReferencesDto {
  translation: TranslationSummaryDto;
  reference: string;
  references: CrossReferenceDto[];
  /** Credit the data's licence asks for. */
  source: { name: string; url: string; licence: string };
}

export interface VerseSearchHitDto extends VerseDto {
  /** Code of the translation this text comes from, e.g. "KJV" or "WEB". */
  translation: string;
  score: number;
}

export interface Stanza {
  number: number | null;
  kind: "verse" | "chorus";
  lines: string[];
}

export interface HymnTextDto {
  language: string;
  variant: string;
  title: string;
  firstLine: string;
  stanzas: Stanza[];
  rightsStatus: string;
}

export interface HymnPlacementDto {
  hymnal: { slug: string; title: string };
  number: number;
  section?: string;
}

export interface HymnSummaryDto {
  slug: string;
  title: string;
  firstLine: string | null;
  language: string | null;
  placements: HymnPlacementDto[];
}

export interface HymnDetailDto {
  slug: string;
  title: string;
  alternateTitles: string[];
  year: number | null;
  meter: string | null;
  tuneName: string | null;
  rightsStatus: string;
  texts: HymnTextDto[];
  contributors: { role: string; name: string; slug: string; years?: string }[];
  placements: HymnPlacementDto[];
  topics: { slug: string; name: string }[];
  scriptureReferences: { reference: string; book: string; chapter: number; verseStart: number | null; verseEnd: number | null; note?: string }[];
}

export interface HymnSearchHitDto {
  slug: string;
  title: string;
  firstLine: string;
  language: string;
  score: number;
}

export interface HymnalDto {
  slug: string;
  title: string;
  edition: string | null;
  year: number | null;
  publisher: string | null;
  description: string | null;
  rightsStatus: string;
  entryCount: number;
}

export interface HymnalEntryDto {
  number: number;
  section?: string;
  hymn: { slug: string; title: string; firstLine: string | null };
}

export interface PageDto<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type RecognitionMode = "bible" | "hymn" | "auto";

export interface VerseCandidate {
  type: "verse";
  confidence: number;
  score: number;
  translation: string;
  reference: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface HymnCandidate {
  type: "hymn";
  confidence: number;
  score: number;
  slug: string;
  title: string;
  firstLine: string;
  language: string;
}

export type RecognitionCandidate = VerseCandidate | HymnCandidate;

export interface RecognitionResultDto {
  attemptId: string;
  mode: "BIBLE" | "HYMN" | "AUTO";
  inputType: "AUDIO" | "TEXT";
  transcript: string;
  transcription: { provider: string; confidence: number | null; latencyMs: number | null } | null;
  candidates: RecognitionCandidate[];
  best: RecognitionCandidate | null;
  durationMs: number;
  createdAt: string;
}

export interface SearchAllResultDto {
  query: string;
  /** `translation` is the one that was searched, or null when every translation was; each hit names its own. */
  verses: { translation: string | null; results: VerseSearchHitDto[] } | null;
  hymns: { results: HymnSearchHitDto[] } | null;
}

export interface UserDto {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  roles: string[];
  createdAt: string;
}

export interface TokensDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
}

export interface AuthSessionDto {
  user: UserDto;
  tokens: TokensDto;
  sessionId: string;
}

export type LibraryTargetType = "hymn" | "verse";

export interface LibraryTargetDto {
  type: LibraryTargetType;
  key: string;
  hymn: { slug: string; title: string; firstLine: string | null } | null;
  verse: { reference: string; translation: string; book: string; chapter: number; verse: number; text: string } | null;
}

export interface SavedItemDto {
  target: LibraryTargetDto;
  savedAt: string;
}

export interface CollectionDto {
  slug: string;
  name: string;
  description: string | null;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionItemDto {
  target: LibraryTargetDto;
  position: number;
  note: string | null;
  addedAt: string;
}

export interface CollectionDetailDto extends Omit<CollectionDto, "itemCount"> {
  items: CollectionItemDto[];
}

export interface NoteDto {
  target: LibraryTargetDto;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryEntryDto {
  id: string;
  kind: "identify" | "search" | "view";
  mode: string | null;
  query: string;
  target: LibraryTargetDto | null;
  attemptId: string | null;
  occurredAt: string;
}

export interface HistoryEntryInput {
  kind: "identify" | "search" | "view";
  mode?: string | null;
  query: string;
  type?: LibraryTargetType;
  key?: string;
  attemptId?: string;
  occurredAt?: string;
}

/** A book in a corpus export; verses point at it by `order`. */
export interface BibleExportBookDto {
  order: number;
  slug: string;
  name: string;
  localName: string | null;
  abbreviation: string;
  testament: "OLD" | "NEW";
  deuterocanonical: boolean;
  chapterCount: number;
}

/** One verse as `[bookOrder, chapter, verse, text]`. */
export type BibleExportVerseRow = [number, number, number, string];

/** A whole translation, for offline reading and search on the device. */
export interface BibleExportDto {
  translation: TranslationSummaryDto;
  generatedAt: string;
  verseCount: number;
  books: BibleExportBookDto[];
  verses: BibleExportVerseRow[];
}

export interface HymnalExportHymnDto {
  number: number;
  slug: string;
  title: string;
  language: string;
  firstLine: string;
  stanzas: Stanza[];
}

/** A whole hymnal with its words, for offline reading and search on the device. */
export interface HymnalExportDto {
  hymnal: { slug: string; title: string; edition: string | null; year: number | null; rightsStatus: string };
  generatedAt: string;
  hymnCount: number;
  hymns: HymnalExportHymnDto[];
}
