import type { PrismaClient } from "../../generated/prisma/client.js";
import type { LibraryTarget, LibraryTargetTypeName, SavedItemModel } from "../../models/index.js";

export interface SavedItemRepository {
  list(userId: string, targetType?: LibraryTargetTypeName): Promise<readonly SavedItemModel[]>;
  save(userId: string, target: LibraryTarget): Promise<SavedItemModel>;
  remove(userId: string, target: LibraryTarget): Promise<boolean>;
  isSaved(userId: string, target: LibraryTarget): Promise<boolean>;
}

export class PrismaSavedItemRepository implements SavedItemRepository {
  private readonly prisma: PrismaClient;

  public constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async list(userId: string, targetType?: LibraryTargetTypeName): Promise<readonly SavedItemModel[]> {
    return this.prisma.savedItem.findMany({
      where: { userId, ...(targetType === undefined ? {} : { targetType }) },
      orderBy: { createdAt: "desc" },
    });
  }

  public async save(userId: string, target: LibraryTarget): Promise<SavedItemModel> {
    return this.prisma.savedItem.upsert({
      where: { userId_targetType_targetKey: { userId, targetType: target.targetType, targetKey: target.targetKey } },
      create: { userId, targetType: target.targetType, targetKey: target.targetKey },
      update: {},
    });
  }

  public async remove(userId: string, target: LibraryTarget): Promise<boolean> {
    const result = await this.prisma.savedItem.deleteMany({ where: { userId, targetType: target.targetType, targetKey: target.targetKey } });
    return result.count > 0;
  }

  public async isSaved(userId: string, target: LibraryTarget): Promise<boolean> {
    const row = await this.prisma.savedItem.findUnique({
      where: { userId_targetType_targetKey: { userId, targetType: target.targetType, targetKey: target.targetKey } },
      select: { id: true },
    });
    return row !== null;
  }
}
