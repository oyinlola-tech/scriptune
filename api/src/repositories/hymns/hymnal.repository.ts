import type { PrismaClient } from "../../generated/prisma/client.js";
import { toStanzas, type HymnalEntryListingModel, type HymnalModel, type Stanza } from "../../models/index.js";

export interface HymnalUpsertInput {
  readonly slug: string;
  readonly title: string;
  readonly edition?: string | null;
  readonly year?: number | null;
  readonly publisher?: string | null;
  readonly description?: string | null;
  readonly rightsStatus: string;
  readonly sourceId?: string | null;
}

export interface HymnalWithCount extends HymnalModel {
  readonly entryCount: number;
}

/** A hymnal entry with the hymn's primary text, as used by corpus exports. */
export interface HymnalExportEntryModel {
  readonly number: number;
  readonly slug: string;
  readonly title: string;
  readonly language: string;
  readonly firstLine: string;
  readonly stanzas: readonly Stanza[];
}

export interface HymnalRepository {
  findAll(): Promise<readonly HymnalWithCount[]>;
  /** Every entry of a hymnal with its words, in number order. */
  listEntriesWithTexts(hymnalId: string): Promise<readonly HymnalExportEntryModel[]>;
  findBySlug(slug: string): Promise<HymnalWithCount | null>;
  upsert(input: HymnalUpsertInput): Promise<HymnalModel>;
  listEntries(hymnalId: string, page: number, limit: number): Promise<readonly HymnalEntryListingModel[]>;
  findEntry(hymnalId: string, number: number): Promise<HymnalEntryListingModel | null>;
}

const LISTING_INCLUDE = {
  hymn: {
    select: {
      slug: true,
      canonicalTitle: true,
      texts: { select: { firstLine: true }, orderBy: { language: "asc" as const }, take: 1 },
    },
  },
} as const;

type EntryRow = {
  readonly id: string;
  readonly hymnalId: string;
  readonly hymnId: string;
  readonly number: number;
  readonly section: string | null;
  readonly hymn: { readonly slug: string; readonly canonicalTitle: string; readonly texts: readonly { readonly firstLine: string }[] };
};

function toListing(row: EntryRow): HymnalEntryListingModel {
  return {
    id: row.id,
    hymnalId: row.hymnalId,
    hymnId: row.hymnId,
    number: row.number,
    section: row.section,
    hymnSlug: row.hymn.slug,
    title: row.hymn.canonicalTitle,
    firstLine: row.hymn.texts[0]?.firstLine ?? null,
  };
}

export class PrismaHymnalRepository implements HymnalRepository {
  private readonly prisma: PrismaClient;

  public constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async findAll(): Promise<readonly HymnalWithCount[]> {
    const rows = await this.prisma.hymnal.findMany({
      orderBy: { title: "asc" },
      include: { _count: { select: { entries: true } } },
    });
    return rows.map(({ _count, ...hymnal }) => ({ ...hymnal, entryCount: _count.entries }));
  }

  public async findBySlug(slug: string): Promise<HymnalWithCount | null> {
    const row = await this.prisma.hymnal.findUnique({
      where: { slug },
      include: { _count: { select: { entries: true } } },
    });
    if (row === null) {
      return null;
    }
    const { _count, ...hymnal } = row;
    return { ...hymnal, entryCount: _count.entries };
  }

  public async upsert(input: HymnalUpsertInput): Promise<HymnalModel> {
    const data = {
      title: input.title,
      edition: input.edition ?? null,
      year: input.year ?? null,
      publisher: input.publisher ?? null,
      description: input.description ?? null,
      rightsStatus: input.rightsStatus,
      sourceId: input.sourceId ?? null,
    };
    return this.prisma.hymnal.upsert({ where: { slug: input.slug }, create: { slug: input.slug, ...data }, update: data });
  }

  public async listEntriesWithTexts(hymnalId: string): Promise<readonly HymnalExportEntryModel[]> {
    const rows = await this.prisma.hymnalEntry.findMany({
      where: { hymnalId },
      orderBy: { number: "asc" },
      select: {
        number: true,
        hymn: { select: { slug: true, canonicalTitle: true, texts: { select: { language: true, title: true, firstLine: true, stanzas: true }, orderBy: { language: "asc" }, take: 1 } } },
      },
    });
    return rows.flatMap((row) => {
      const text = row.hymn.texts[0];
      if (text === undefined) return [];
      return [{ number: row.number, slug: row.hymn.slug, title: text.title, language: text.language, firstLine: text.firstLine, stanzas: toStanzas(text.stanzas) }];
    });
  }

  public async listEntries(hymnalId: string, page: number, limit: number): Promise<readonly HymnalEntryListingModel[]> {
    const rows = await this.prisma.hymnalEntry.findMany({
      where: { hymnalId },
      orderBy: { number: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      include: LISTING_INCLUDE,
    });
    return rows.map(toListing);
  }

  public async findEntry(hymnalId: string, number: number): Promise<HymnalEntryListingModel | null> {
    const row = await this.prisma.hymnalEntry.findUnique({
      where: { hymnalId_number: { hymnalId, number } },
      include: LISTING_INCLUDE,
    });
    return row === null ? null : toListing(row);
  }
}
