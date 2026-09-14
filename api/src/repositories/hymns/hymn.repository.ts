import type { PrismaClient } from "../../generated/prisma/client.js";
import { toStanzas, type HymnDetailModel, type HymnSummaryModel } from "../../models/index.js";

export interface HymnListFilter {
  readonly page: number;
  readonly limit: number;
  readonly hymnalSlug?: string;
  readonly topicSlug?: string;
  readonly language?: string;
}

export interface HymnSummaryLite {
  readonly slug: string;
  readonly canonicalTitle: string;
  readonly firstLine: string | null;
}

export interface HymnRepository {
  findBySlug(slug: string): Promise<HymnDetailModel | null>;
  findSummariesBySlugs(slugs: readonly string[]): Promise<readonly HymnSummaryLite[]>;
  list(filter: HymnListFilter): Promise<{ readonly items: readonly HymnSummaryModel[]; readonly total: number }>;
}


export class PrismaHymnRepository implements HymnRepository {
  private readonly prisma: PrismaClient;

  public constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async findBySlug(slug: string): Promise<HymnDetailModel | null> {
    const row = await this.prisma.hymn.findUnique({
      where: { slug },
      include: {
        texts: { orderBy: [{ language: "asc" }, { variant: "asc" }] },
        alternateTitles: true,
        contributors: { include: { person: true } },
        hymnalEntries: { include: { hymnal: true }, orderBy: { hymnal: { title: "asc" } } },
        topics: { include: { topic: true } },
        scriptureReferences: { orderBy: [{ bookId: "asc" }, { chapter: "asc" }] },
      },
    });
    if (row === null) {
      return null;
    }
    const { texts, alternateTitles, contributors, hymnalEntries, topics, scriptureReferences, ...hymn } = row;
    return {
      ...hymn,
      texts: texts.map((text) => ({ ...text, stanzas: toStanzas(text.stanzas) })),
      alternateTitles: alternateTitles.map((entry) => entry.title),
      contributors: contributors.map((entry) => ({ role: entry.role, person: entry.person })),
      placements: hymnalEntries,
      topics: topics.map((entry) => entry.topic),
      scriptureReferences,
    };
  }

  public async findSummariesBySlugs(slugs: readonly string[]): Promise<readonly HymnSummaryLite[]> {
    const rows = await this.prisma.hymn.findMany({
      where: { slug: { in: [...slugs] } },
      select: { slug: true, canonicalTitle: true, texts: { select: { firstLine: true }, orderBy: { language: "asc" }, take: 1 } },
    });
    return rows.map((row) => ({ slug: row.slug, canonicalTitle: row.canonicalTitle, firstLine: row.texts[0]?.firstLine ?? null }));
  }

  public async list(filter: HymnListFilter): Promise<{ readonly items: readonly HymnSummaryModel[]; readonly total: number }> {
    const where = {
      ...(filter.hymnalSlug === undefined ? {} : { hymnalEntries: { some: { hymnal: { slug: filter.hymnalSlug } } } }),
      ...(filter.topicSlug === undefined ? {} : { topics: { some: { topic: { slug: filter.topicSlug } } } }),
      ...(filter.language === undefined ? {} : { texts: { some: { language: filter.language } } }),
    };
    const [rows, total] = await Promise.all([
      this.prisma.hymn.findMany({
        where,
        orderBy: { canonicalTitle: "asc" },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        include: {
          texts: { select: { firstLine: true, language: true }, orderBy: { language: "asc" }, take: 1 },
          hymnalEntries: { include: { hymnal: { select: { slug: true, title: true } } } },
        },
      }),
      this.prisma.hymn.count({ where }),
    ]);
    return {
      total,
      items: rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        canonicalTitle: row.canonicalTitle,
        firstLine: row.texts[0]?.firstLine ?? null,
        language: row.texts[0]?.language ?? null,
        placements: row.hymnalEntries.map((entry) => ({ hymnalSlug: entry.hymnal.slug, hymnalTitle: entry.hymnal.title, number: entry.number })),
      })),
    };
  }
}
