import { Command } from "@zudojs/cqrs";

export const LINK_SCRIPTURES = "hymns.linkScriptures" as const;

export interface LinkScripturesResult {
  readonly hymnsCompared: number;
  readonly hymnsLinked: number;
  readonly links: number;
  readonly durationMs: number;
}

/** Finds where hymns quote scripture and stores the links, replacing earlier matches. */
export class LinkScripturesCommand extends Command<typeof LINK_SCRIPTURES> {
  /** Translation whose wording the hymns are compared with, and the language of the hymns compared. */
  public readonly translation: string;
  public readonly language: string;

  public constructor(translation = "KJV", language = "en") {
    super(LINK_SCRIPTURES);
    this.translation = translation;
    this.language = language;
  }
}
