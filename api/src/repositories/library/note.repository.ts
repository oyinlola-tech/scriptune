import type { PrismaClient } from "../../generated/prisma/client.js";
import type { LibraryTarget, NoteModel } from "../../models/index.js";

export interface NoteRepository {
  list(userId: string): Promise<readonly NoteModel[]>;
  find(userId: string, target: LibraryTarget): Promise<NoteModel | null>;
  upsert(userId: string, target: LibraryTarget, body: string): Promise<NoteModel>;
  remove(userId: string, target: LibraryTarget): Promise<boolean>;
}

export class PrismaNoteRepository implements NoteRepository {
  private readonly prisma: PrismaClient;

  public constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async list(userId: string): Promise<readonly NoteModel[]> {
    return this.prisma.note.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
  }

  public async find(userId: string, target: LibraryTarget): Promise<NoteModel | null> {
    return this.prisma.note.findUnique({
      where: { userId_targetType_targetKey: { userId, targetType: target.targetType, targetKey: target.targetKey } },
    });
  }

  public async upsert(userId: string, target: LibraryTarget, body: string): Promise<NoteModel> {
    return this.prisma.note.upsert({
      where: { userId_targetType_targetKey: { userId, targetType: target.targetType, targetKey: target.targetKey } },
      create: { userId, targetType: target.targetType, targetKey: target.targetKey, body },
      update: { body },
    });
  }

  public async remove(userId: string, target: LibraryTarget): Promise<boolean> {
    const result = await this.prisma.note.deleteMany({ where: { userId, targetType: target.targetType, targetKey: target.targetKey } });
    return result.count > 0;
  }
}
