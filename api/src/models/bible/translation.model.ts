export interface TranslationModel {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly language: string;
  readonly description: string | null;
  readonly rightsStatus: string;
  readonly sourceName: string;
  readonly sourceUrl: string | null;
  readonly isDefault: boolean;
  readonly verseCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
