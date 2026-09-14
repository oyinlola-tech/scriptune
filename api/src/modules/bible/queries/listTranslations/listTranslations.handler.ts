import { QueryHandler } from "@zudojs/cqrs";
import { toTranslationDto, type TranslationDto } from "../../../../dtos/index.js";
import type { TranslationRepository } from "../../../../repositories/index.js";
import { LIST_TRANSLATIONS, type ListTranslationsQuery } from "./listTranslations.query.js";

export class ListTranslationsHandler extends QueryHandler<ListTranslationsQuery, readonly TranslationDto[]> {
  public readonly queryType = LIST_TRANSLATIONS;

  private readonly translations: TranslationRepository;

  public constructor(translations: TranslationRepository) {
    super();
    this.translations = translations;
  }

  public async execute(): Promise<readonly TranslationDto[]> {
    const translations = await this.translations.findAll();
    return translations.map(toTranslationDto);
  }
}
