// Web build: no on-device copy, so every reader says "not here" and the caller fetches.
import type { BookDto, ChapterDto, HymnDetailDto, VerseDetailDto } from "@scriptune/contracts";

export async function readLocalVerse(): Promise<VerseDetailDto | null> { return null; }
export async function readLocalHymn(): Promise<HymnDetailDto | null> { return null; }
export async function listLocalBooks(): Promise<{ translation: { code: string; name: string }; books: BookDto[] } | null> { return null; }
export async function readLocalChapter(): Promise<ChapterDto | null> { return null; }
