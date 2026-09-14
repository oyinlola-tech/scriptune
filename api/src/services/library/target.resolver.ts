import type { QueryBus } from "@zudojs/cqrs";
import { toTypeDto, type HymnTargetDto, type LibraryTargetDto, type VerseTargetDto } from "../../dtos/index.js";
import type { LibraryTarget } from "../../models/index.js";
import { GetVersesByKeysQuery } from "../../modules/bible/queries/index.js";
import { GetHymnSummariesQuery } from "../../modules/hymns/queries/index.js";
import { parseVerseKey } from "./targetKey.helper.js";

export function targetId(target: LibraryTarget): string {
  return `${target.targetType}:${target.targetKey}`;
}

/**
 * Resolves saved targets to their current content in two batched queries,
 * one per kind. A target whose content is gone resolves with null content,
 * so a member's library never breaks when the catalogue changes.
 */
export class LibraryTargetResolver {
  private readonly queryBus: QueryBus;

  public constructor(queryBus: QueryBus) {
    this.queryBus = queryBus;
  }

  public async resolve(targets: readonly LibraryTarget[]): Promise<ReadonlyMap<string, LibraryTargetDto>> {
    const hymnSlugs = [...new Set(targets.filter((target) => target.targetType === "HYMN").map((target) => target.targetKey))];
    const verseKeys = [...new Set(targets.filter((target) => target.targetType === "VERSE").map((target) => target.targetKey))];
    const [hymns, verses] = await Promise.all([
      hymnSlugs.length === 0 ? Promise.resolve([]) : this.queryBus.execute<GetHymnSummariesQuery, readonly HymnTargetDto[]>(new GetHymnSummariesQuery(hymnSlugs)),
      verseKeys.length === 0
        ? Promise.resolve([])
        : this.queryBus.execute<GetVersesByKeysQuery, readonly VerseTargetDto[]>(
            new GetVersesByKeysQuery(verseKeys.flatMap((key) => parseVerseKey(key) ?? [])),
          ),
    ]);
    const hymnBySlug = new Map(hymns.map((hymn) => [hymn.slug, hymn]));
    const verseByKey = new Map(verses.map((verse) => [`${verse.translation}:${verse.book}:${verse.chapter}:${verse.verse}`, verse]));
    const resolved = new Map<string, LibraryTargetDto>();
    for (const target of targets) {
      resolved.set(targetId(target), {
        type: toTypeDto(target.targetType),
        key: target.targetKey,
        hymn: target.targetType === "HYMN" ? (hymnBySlug.get(target.targetKey) ?? null) : null,
        verse: target.targetType === "VERSE" ? (verseByKey.get(target.targetKey) ?? null) : null,
      });
    }
    return resolved;
  }
}
