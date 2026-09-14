import { QueryHandler } from "@zudojs/cqrs";
import { NotFoundError } from "@zudojs/errors";
import { toScriptureReferenceDto, type ScriptureReferenceDto } from "../../../../dtos/index.js";
import type { HymnLinkRepository } from "../../../../repositories/index.js";
import { findCanonicalBook } from "../../../../utils/text/bibleBook.helper.js";
import { LIST_HYMNS_FOR_VERSE, type ListHymnsForVerseQuery } from "./listHymnsForVerse.query.js";

export interface HymnForVerseDto {
  readonly slug: string;
  readonly title: string;
  readonly firstLine: string | null;
  readonly references: readonly ScriptureReferenceDto[];
}

export interface HymnsForVerseDto {
  readonly reference: string;
  readonly hymns: readonly HymnForVerseDto[];
}

export class ListHymnsForVerseHandler extends QueryHandler<ListHymnsForVerseQuery, HymnsForVerseDto> {
  public readonly queryType = LIST_HYMNS_FOR_VERSE;

  private readonly links: HymnLinkRepository;

  public constructor(links: HymnLinkRepository) {
    super();
    this.links = links;
  }

  public async execute(query: ListHymnsForVerseQuery): Promise<HymnsForVerseDto> {
    const book = findCanonicalBook(query.book);
    if (book === undefined) {
      throw new NotFoundError(`Book "${query.book}" was not found.`);
    }
    const hymns = await this.links.findHymnsForVerse(book.order, query.chapter, query.verse);
    return {
      reference: `${book.name} ${query.chapter}:${query.verse}`,
      hymns: hymns.map((hymn) => ({ ...hymn, references: hymn.references.map(toScriptureReferenceDto) })),
    };
  }
}
