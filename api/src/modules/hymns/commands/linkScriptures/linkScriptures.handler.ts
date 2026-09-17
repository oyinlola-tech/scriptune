import { CommandHandler } from "@zudojs/cqrs";
import { NotFoundError } from "@zudojs/errors";
import type { HymnLinkRepository, MatchedReferenceInput } from "../../../../repositories/index.js";
import { findScriptureEchoes } from "../../../../utils/text/index.js";
import { LINK_SCRIPTURES, type LinkScripturesCommand, type LinkScripturesResult } from "./linkScriptures.command.js";

export class LinkScripturesHandler extends CommandHandler<LinkScripturesCommand, LinkScripturesResult> {
  public readonly commandType = LINK_SCRIPTURES;

  private readonly links: HymnLinkRepository;

  public constructor(links: HymnLinkRepository) {
    super();
    this.links = links;
  }

  /** Two reads, the comparison in memory, one write: the database is not asked to do any matching. */
  public async execute(command: LinkScripturesCommand): Promise<LinkScripturesResult> {
    const startedAt = performance.now();
    const [verses, hymns] = await Promise.all([this.links.listScriptureWords(command.translation), this.links.listHymnWords(command.language)]);
    if (verses.length === 0) {
      throw new NotFoundError(`The ${command.translation} translation is not imported, so there is nothing to compare the hymns with.`);
    }
    const echoes = findScriptureEchoes(
      verses.map((verse) => ({ bookId: verse.bookId, chapter: verse.chapter, verse: verse.verse, words: verse.normalizedText.split(" ") })),
      hymns.map((hymn) => ({ hymnId: hymn.hymnId, words: hymn.normalizedLyrics.split(" ") })),
    );
    // A hymn can have several texts; keep each hymn-and-verse pair once, with its best phrase.
    const unique = new Map<string, MatchedReferenceInput>();
    for (const echo of echoes) {
      const key = `${echo.hymnId}:${echo.bookId}:${echo.chapter}:${echo.verse}`;
      if (!unique.has(key)) unique.set(key, { hymnId: echo.hymnId, bookId: echo.bookId, chapter: echo.chapter, verse: echo.verse, note: `Shares the words “${echo.phrase}”` });
    }
    const links = await this.links.replaceMatchedReferences([...unique.values()]);
    return { hymnsCompared: hymns.length, hymnsLinked: new Set([...unique.values()].map((row) => row.hymnId)).size, links, durationMs: Math.round(performance.now() - startedAt) };
  }
}
