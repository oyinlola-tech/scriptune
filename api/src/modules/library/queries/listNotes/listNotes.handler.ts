import { QueryHandler } from "@zudojs/cqrs";
import { toNoteDto, type NoteDto } from "../../../../dtos/index.js";
import type { NoteRepository } from "../../../../repositories/index.js";
import type { LibraryTargetResolver } from "../../../../services/library/index.js";
import { LIST_NOTES, type ListNotesQuery } from "./listNotes.query.js";

export class ListNotesHandler extends QueryHandler<ListNotesQuery, readonly NoteDto[]> {
  public readonly queryType = LIST_NOTES;

  private readonly notes: NoteRepository;
  private readonly resolver: LibraryTargetResolver;

  public constructor(notes: NoteRepository, resolver: LibraryTargetResolver) {
    super();
    this.notes = notes;
    this.resolver = resolver;
  }

  public async execute(query: ListNotesQuery): Promise<readonly NoteDto[]> {
    const notes = await this.notes.list(query.userId);
    const resolved = await this.resolver.resolve(notes);
    return notes.map((note) => toNoteDto(note, resolved));
  }
}
