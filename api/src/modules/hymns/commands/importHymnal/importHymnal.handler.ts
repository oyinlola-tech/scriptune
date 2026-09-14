import { CommandHandler } from "@zudojs/cqrs";
import { ValidationError } from "@zudojs/errors";
import type { Stanza } from "../../../../models/index.js";
import type {
  HymnalRepository,
  HymnImportEntry,
  HymnImportRepository,
  SourceRepository,
} from "../../../../repositories/index.js";
import { HymnSlugAllocator } from "../../../../services/hymns/index.js";
import { normalizeText } from "../../../../utils/text/text.helper.js";
import {
  IMPORT_HYMNAL,
  type ImportHymnalCommand,
  type ImportHymnalResult,
  type ImportHymnEntryInput,
  type ImportHymnTextInput,
} from "./importHymnal.command.js";

/** Joins stanzas into the plain text used for display fallbacks and search. */
export function stanzasToLyrics(stanzas: readonly Stanza[]): string {
  return stanzas.map((stanza) => stanza.lines.join("\n")).join("\n\n");
}

export function firstLineOf(stanzas: readonly Stanza[]): string {
  const verse = stanzas.find((stanza) => stanza.kind === "verse") ?? stanzas[0];
  return verse?.lines[0] ?? "";
}

export class ImportHymnalHandler extends CommandHandler<ImportHymnalCommand, ImportHymnalResult> {
  public readonly commandType = IMPORT_HYMNAL;

  private readonly sources: SourceRepository;
  private readonly hymnals: HymnalRepository;
  private readonly hymns: HymnImportRepository;

  public constructor(sources: SourceRepository, hymnals: HymnalRepository, hymns: HymnImportRepository) {
    super();
    this.sources = sources;
    this.hymnals = hymnals;
    this.hymns = hymns;
  }

  public async execute(command: ImportHymnalCommand): Promise<ImportHymnalResult> {
    const startedAt = performance.now();
    const { source: sourceInput, hymnal: hymnalInput, entries } = command.input;
    const numbers = new Set(entries.map((entry) => entry.number));
    if (numbers.size !== entries.length) {
      throw new ValidationError("Each hymnal number may appear only once in an import.");
    }

    const source = await this.sources.upsert(sourceInput);
    const hymnal = await this.hymnals.upsert({ ...hymnalInput, sourceId: source.id });
    const [byImportKey, taken] = await Promise.all([this.hymns.findSlugsByImportKey(), this.hymns.findTakenSlugs()]);
    const slugs = new HymnSlugAllocator(byImportKey, taken);

    const rows = entries.map((entry) => this.toImportEntry(entry, hymnal.slug, hymnal.id, source.id, slugs));
    const hymnCount = await this.hymns.importEntries(rows);
    await this.hymns.analyze();

    return { hymnalId: hymnal.id, hymnalSlug: hymnal.slug, hymnCount, durationMs: Math.round(performance.now() - startedAt) };
  }

  private toImportEntry(entry: ImportHymnEntryInput, hymnalSlug: string, hymnalId: string, sourceId: string, slugs: HymnSlugAllocator): HymnImportEntry {
    const languages: readonly ImportHymnTextInput[] = entry.texts ?? [{ language: entry.language ?? "en", title: entry.title, stanzas: entry.stanzas ?? [] }];
    const usable = languages.filter((text) => text.stanzas.length > 0);
    if (usable.length === 0 || entry.title.trim() === "") {
      throw new ValidationError(`Hymn ${entry.number} of ${hymnalSlug} has no title or no stanzas.`);
    }
    const importKey = `${hymnalSlug}:${entry.number}`;
    const rightsStatus = entry.rightsStatus ?? "public-domain";
    const seen = new Set<string>();
    const texts = usable.map((text) => {
      if (seen.has(text.language)) {
        throw new ValidationError(`Hymn ${entry.number} of ${hymnalSlug} repeats the language "${text.language}".`);
      }
      seen.add(text.language);
      const lyrics = stanzasToLyrics(text.stanzas);
      const firstLine = firstLineOf(text.stanzas);
      const title = (text.title ?? entry.title).trim();
      return {
        language: text.language,
        variant: "default",
        title,
        stanzas: text.stanzas,
        lyrics,
        firstLine,
        normalizedLyrics: normalizeText(lyrics),
        normalizedFirstLine: normalizeText(firstLine),
        rightsStatus,
        sourceId,
      };
    });
    return {
      hymn: { importKey, slug: slugs.allocate(importKey, entry.title, entry.number), canonicalTitle: entry.title.trim(), rightsStatus, sourceId },
      texts,
      hymnalId,
      number: entry.number,
      section: entry.section ?? null,
    };
  }
}
