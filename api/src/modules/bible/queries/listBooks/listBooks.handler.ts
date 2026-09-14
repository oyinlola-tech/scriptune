import { QueryHandler } from "@zudojs/cqrs";
import { toBookDto, toTranslationSummary, type BookDto, type TranslationDto } from "../../../../dtos/index.js";
import type { BookRepository } from "../../../../repositories/index.js";
import type { BibleLookup } from "../../../../services/bible/index.js";
import { LIST_BOOKS, type ListBooksQuery } from "./listBooks.query.js";

export interface BookListDto {
  readonly translation: Pick<TranslationDto, "code" | "name">;
  readonly books: readonly BookDto[];
}

export class ListBooksHandler extends QueryHandler<ListBooksQuery, BookListDto> {
  public readonly queryType = LIST_BOOKS;

  private readonly lookup: BibleLookup;
  private readonly books: BookRepository;

  public constructor(lookup: BibleLookup, books: BookRepository) {
    super();
    this.lookup = lookup;
    this.books = books;
  }

  public async execute(query: ListBooksQuery): Promise<BookListDto> {
    const translation = await this.lookup.requireTranslation(query.translation);
    const books = await this.books.findForTranslation(translation.id);
    return { translation: toTranslationSummary(translation), books: books.map(toBookDto) };
  }
}
