import { CommandHandler } from "@zudojs/cqrs";
import type { HymnLinkRepository, HymnRelationInput } from "../../../../repositories/index.js";
import { canonicalBookAt } from "../../../../utils/text/bibleBook.helper.js";
import { looksLikeSolfa, relateHymns } from "../../../../utils/text/index.js";
import { RELATE_HYMNS, type RelateHymnsCommand, type RelateHymnsResult } from "./relateHymns.command.js";

function reasonFor(sharedChapter: string | null): string {
  if (sharedChapter === null) return "Similar words";
  const [bookId, chapter] = sharedChapter.split(":");
  const book = canonicalBookAt(Number(bookId))?.name;
  return book === undefined ? "Similar words" : `Both draw on ${book} ${chapter}`;
}

export class RelateHymnsHandler extends CommandHandler<RelateHymnsCommand, RelateHymnsResult> {
  public readonly commandType = RELATE_HYMNS;

  private readonly links: HymnLinkRepository;

  public constructor(links: HymnLinkRepository) {
    super();
    this.links = links;
  }

  /** One read, the comparison in memory, one write. */
  public async execute(_command: RelateHymnsCommand): Promise<RelateHymnsResult> {
    const startedAt = performance.now();
    // Entries whose "title" is a line of sol-fa are not hymns a reader should be sent to.
    const rows = (await this.links.listRelatableHymns()).filter((row) => !looksLikeSolfa(row.title));
    const relations = relateHymns(rows.map((row) => ({ hymnId: row.hymnId, language: row.language, words: row.normalizedLyrics.split(" "), chapters: row.chapters })));
    // A hymn with texts in two languages is compared once per language; keep each pair's best score.
    const best = new Map<string, HymnRelationInput>();
    for (const relation of relations) {
      const key = `${relation.hymnId}:${relation.relatedHymnId}`;
      const existing = best.get(key);
      if (existing === undefined || existing.score < relation.score) best.set(key, { hymnId: relation.hymnId, relatedHymnId: relation.relatedHymnId, score: relation.score, reason: reasonFor(relation.sharedChapter) });
    }
    const stored = await this.links.replaceRelations([...best.values()]);
    return { hymnsCompared: rows.length, hymnsWithRelations: new Set([...best.values()].map((row) => row.hymnId)).size, relations: stored, durationMs: Math.round(performance.now() - startedAt) };
  }
}
