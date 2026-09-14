import { CommandHandler } from "@zudojs/cqrs";
import type { NoteRepository } from "../../../../repositories/index.js";
import { DELETE_NOTE, type DeleteNoteCommand } from "./deleteNote.command.js";

export class DeleteNoteHandler extends CommandHandler<DeleteNoteCommand, boolean> {
  public readonly commandType = DELETE_NOTE;

  private readonly notes: NoteRepository;

  public constructor(notes: NoteRepository) {
    super();
    this.notes = notes;
  }

  public async execute(command: DeleteNoteCommand): Promise<boolean> {
    return this.notes.remove(command.userId, command.target);
  }
}
