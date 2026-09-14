import { Query } from "@zudojs/cqrs";

export const LIST_HYMNS_FOR_VERSE = "hymns.listHymnsForVerse" as const;

/** Finds hymns whose scripture references cover a verse. */
export class ListHymnsForVerseQuery extends Query<typeof LIST_HYMNS_FOR_VERSE> {
  public readonly book: string;
  public readonly chapter: number;
  public readonly verse: number;

  public constructor(book: string, chapter: number, verse: number) {
    super(LIST_HYMNS_FOR_VERSE);
    this.book = book;
    this.chapter = chapter;
    this.verse = verse;
  }
}
