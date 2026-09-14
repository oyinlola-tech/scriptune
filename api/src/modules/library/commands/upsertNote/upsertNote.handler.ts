import { CommandHandler } from "@zudojs/cqrs";
import { toNoteDto, type NoteDto } from "../../../../dtos/index.js";
import type { NoteRepository } from "../../../../repositories/index.js";
import type { LibraryTargetResolver } from "../../../../services/library/index.js";
import { UPSERT_NOTE, type UpsertNoteCommand } from "./upsertNote.command.js";

export class UpsertNoteHandler extends CommandHandler<UpsertNoteCommand, NoteDto> {
  public readonly commandType = UPSERT_NOTE;

  private readonly notes: NoteRepository;
  private readonly resolver: LibraryTargetResolver;

  public constructor(notes: NoteRepository, resolver: LibraryTargetResolver) {
    super();
    this.notes = notes;
    this.resolver = resolver;
  }

  public async execute(command: UpsertNoteCommand): Promise<NoteDto> {
    const note = await this.notes.upsert(command.userId, command.target, command.body);
    return toNoteDto(note, await this.resolver.resolve([note]));
  }
}
