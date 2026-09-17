export type ContributorRoleName = "AUTHOR" | "COMPOSER" | "TRANSLATOR" | "ARRANGER";

export interface PersonModel {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly birthYear: number | null;
  readonly deathYear: number | null;
}

export interface ContributorModel {
  readonly role: ContributorRoleName;
  readonly person: PersonModel;
}

export interface TopicModel {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
}

export interface ScriptureReferenceModel {
  readonly id: string;
  readonly hymnId: string;
  readonly bookId: number;
  readonly chapter: number;
  readonly verseStart: number | null;
  readonly verseEnd: number | null;
  readonly note: string | null;
  /** "editorial" when a hymnal states the link, "matched" when it was found by comparing the words. */
  readonly origin: string;
}

export interface SourceModel {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly url: string | null;
  readonly edition: string | null;
  readonly license: string;
  readonly rightsStatus: string;
  readonly retrievedAt: Date;
  readonly notes: string | null;
}
