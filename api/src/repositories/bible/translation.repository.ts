import type { PrismaClient } from "../../generated/prisma/client.js";
import type { TranslationModel } from "../../models/index.js";

export interface TranslationUpsertInput {
  readonly code: string;
  readonly name: string;
  readonly language: string;
  readonly description?: string | null;
  readonly rightsStatus: string;
  readonly sourceName: string;
  readonly sourceUrl?: string | null;
  readonly isDefault?: boolean;
}

export interface TranslationRepository {
  findAll(): Promise<readonly TranslationModel[]>;
  findByCode(code: string): Promise<TranslationModel | null>;
  upsert(input: TranslationUpsertInput): Promise<TranslationModel>;
  setVerseCount(id: string, verseCount: number): Promise<void>;
}

export class PrismaTranslationRepository implements TranslationRepository {
  private readonly prisma: PrismaClient;

  public constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async findAll(): Promise<readonly TranslationModel[]> {
    return this.prisma.translation.findMany({ orderBy: [{ isDefault: "desc" }, { code: "asc" }] });
  }

  public async findByCode(code: string): Promise<TranslationModel | null> {
    return this.prisma.translation.findUnique({ where: { code } });
  }

  public async upsert(input: TranslationUpsertInput): Promise<TranslationModel> {
    const data = {
      name: input.name,
      language: input.language,
      description: input.description ?? null,
      rightsStatus: input.rightsStatus,
      sourceName: input.sourceName,
      sourceUrl: input.sourceUrl ?? null,
      isDefault: input.isDefault ?? false,
    };
    return this.prisma.translation.upsert({
      where: { code: input.code },
      create: { code: input.code, ...data },
      update: data,
    });
  }

  public async setVerseCount(id: string, verseCount: number): Promise<void> {
    await this.prisma.translation.update({ where: { id }, data: { verseCount } });
  }
}
