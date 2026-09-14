import type { PrismaClient } from "../../../generated/prisma/client.js";
import type { SourceModel } from "../../../models/index.js";

export interface SourceUpsertInput {
  readonly slug: string;
  readonly name: string;
  readonly url?: string | null;
  readonly edition?: string | null;
  readonly license: string;
  readonly rightsStatus: string;
  readonly retrievedAt: Date;
  readonly notes?: string | null;
}

export interface SourceRepository {
  upsert(input: SourceUpsertInput): Promise<SourceModel>;
}

export class PrismaSourceRepository implements SourceRepository {
  private readonly prisma: PrismaClient;

  public constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async upsert(input: SourceUpsertInput): Promise<SourceModel> {
    const data = {
      name: input.name,
      url: input.url ?? null,
      edition: input.edition ?? null,
      license: input.license,
      rightsStatus: input.rightsStatus,
      retrievedAt: input.retrievedAt,
      notes: input.notes ?? null,
    };
    return this.prisma.source.upsert({
      where: { slug: input.slug },
      create: { slug: input.slug, ...data },
      update: data,
    });
  }
}
