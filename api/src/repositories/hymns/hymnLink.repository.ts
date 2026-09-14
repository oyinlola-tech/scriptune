import type { PrismaClient } from "../../generated/prisma/client.js";
import type { ScriptureReferenceModel, TopicModel } from "../../models/index.js";

export interface TopicWithCount extends TopicModel {
  readonly hymnCount: number;
}

/** A hymn that references a passage, with the references that matched. */
export interface HymnForVerse {
  readonly slug: string;
  readonly title: string;
  readonly firstLine: string | null;
  readonly references: readonly ScriptureReferenceModel[];
}

/** Topics and scripture references: the links between hymns and everything else. */
export interface HymnLinkRepository {
  listTopics(): Promise<readonly TopicWithCount[]>;
  findHymnsForVerse(bookId: number, chapter: number, verse: number): Promise<readonly HymnForVerse[]>;
}

export class PrismaHymnLinkRepository implements HymnLinkRepository {
  private readonly prisma: PrismaClient;

  public constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async listTopics(): Promise<readonly TopicWithCount[]> {
    const rows = await this.prisma.topic.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { hymns: true } } },
    });
    return rows.map(({ _count, ...topic }) => ({ ...topic, hymnCount: _count.hymns }));
  }

  public async findHymnsForVerse(bookId: number, chapter: number, verse: number): Promise<readonly HymnForVerse[]> {
    const rows = await this.prisma.hymnScriptureReference.findMany({
      where: {
        bookId,
        chapter,
        OR: [
          { verseStart: null },
          { verseStart: { lte: verse }, verseEnd: { gte: verse } },
          { verseStart: verse, verseEnd: null },
        ],
      },
      include: {
        hymn: {
          select: {
            slug: true,
            canonicalTitle: true,
            texts: { select: { firstLine: true }, orderBy: { language: "asc" }, take: 1 },
          },
        },
      },
      orderBy: { hymn: { canonicalTitle: "asc" } },
    });
    const bySlug = new Map<string, { slug: string; title: string; firstLine: string | null; references: ScriptureReferenceModel[] }>();
    for (const row of rows) {
      const { hymn, ...reference } = row;
      const existing = bySlug.get(hymn.slug);
      if (existing === undefined) {
        bySlug.set(hymn.slug, { slug: hymn.slug, title: hymn.canonicalTitle, firstLine: hymn.texts[0]?.firstLine ?? null, references: [reference] });
      } else {
        existing.references.push(reference);
      }
    }
    return [...bySlug.values()];
  }
}
