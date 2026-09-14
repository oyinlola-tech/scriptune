import type { Prisma, PrismaClient } from "../../../generated/prisma/client.js";
import type { Stanza } from "../../../models/index.js";

export interface HymnUpsertInput {
  readonly importKey: string;
  readonly slug: string;
  readonly canonicalTitle: string;
  readonly rightsStatus: string;
  readonly sourceId: string | null;
  readonly year?: number | null;
  readonly meter?: string | null;
  readonly tuneName?: string | null;
}

export interface HymnTextUpsertInput {
  readonly language: string;
  readonly variant: string;
  readonly title: string;
  readonly stanzas: readonly Stanza[];
  readonly lyrics: string;
  readonly firstLine: string;
  readonly normalizedLyrics: string;
  readonly normalizedFirstLine: string;
  readonly rightsStatus: string;
  readonly sourceId: string | null;
}

export interface HymnImportEntry {
  readonly hymn: HymnUpsertInput;
  /** One text per language (for example English and Yoruba of the same hymn). */
  readonly texts: readonly HymnTextUpsertInput[];
  readonly hymnalId: string;
  readonly number: number;
  readonly section?: string | null;
}

export interface HymnImportRepository {
  findSlugsByImportKey(): Promise<ReadonlyMap<string, string>>;
  findTakenSlugs(): Promise<ReadonlySet<string>>;
  importEntries(entries: readonly HymnImportEntry[]): Promise<number>;
  analyze(): Promise<void>;
}

const IMPORT_BATCH_SIZE = 100;

async function upsertEntry(tx: Prisma.TransactionClient, entry: HymnImportEntry): Promise<void> {
  const { hymn, texts } = entry;
  const hymnData = {
    canonicalTitle: hymn.canonicalTitle,
    rightsStatus: hymn.rightsStatus,
    sourceId: hymn.sourceId,
    year: hymn.year ?? null,
    meter: hymn.meter ?? null,
    tuneName: hymn.tuneName ?? null,
  };
  const saved = await tx.hymn.upsert({
    where: { importKey: hymn.importKey },
    create: { importKey: hymn.importKey, slug: hymn.slug, ...hymnData },
    update: hymnData,
    select: { id: true },
  });
  for (const text of texts) {
    const textData = {
      title: text.title,
      stanzas: text.stanzas.map((stanza) => ({ number: stanza.number, kind: stanza.kind, lines: [...stanza.lines] })),
      lyrics: text.lyrics,
      firstLine: text.firstLine,
      normalizedLyrics: text.normalizedLyrics,
      normalizedFirstLine: text.normalizedFirstLine,
      rightsStatus: text.rightsStatus,
      sourceId: text.sourceId,
    };
    await tx.hymnText.upsert({
      where: { hymnId_language_variant: { hymnId: saved.id, language: text.language, variant: text.variant } },
      create: { hymnId: saved.id, language: text.language, variant: text.variant, ...textData },
      update: textData,
    });
  }
  await tx.hymnalEntry.upsert({
    where: { hymnalId_number: { hymnalId: entry.hymnalId, number: entry.number } },
    create: { hymnalId: entry.hymnalId, hymnId: saved.id, number: entry.number, section: entry.section ?? null },
    update: { hymnId: saved.id, section: entry.section ?? null },
  });
}

/** Write side of hymns: idempotent imports keyed by hymnal slug and number. */
export class PrismaHymnImportRepository implements HymnImportRepository {
  private readonly prisma: PrismaClient;

  public constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async findSlugsByImportKey(): Promise<ReadonlyMap<string, string>> {
    const rows = await this.prisma.hymn.findMany({ where: { importKey: { not: null } }, select: { importKey: true, slug: true } });
    return new Map(rows.flatMap((row) => (row.importKey === null ? [] : [[row.importKey, row.slug]])));
  }

  public async findTakenSlugs(): Promise<ReadonlySet<string>> {
    const rows = await this.prisma.hymn.findMany({ select: { slug: true } });
    return new Set(rows.map((row) => row.slug));
  }

  public async importEntries(entries: readonly HymnImportEntry[]): Promise<number> {
    let imported = 0;
    for (let offset = 0; offset < entries.length; offset += IMPORT_BATCH_SIZE) {
      const batch = entries.slice(offset, offset + IMPORT_BATCH_SIZE);
      await this.prisma.$transaction(
        async (tx) => {
          for (const entry of batch) {
            await upsertEntry(tx, entry);
          }
        },
        { timeout: 120_000, maxWait: 10_000 },
      );
      imported += batch.length;
    }
    return imported;
  }

  public async analyze(): Promise<void> {
    await this.prisma.$executeRawUnsafe("VACUUM ANALYZE hymn_texts");
  }
}
