import type { PrismaClient } from "../../generated/prisma/client.js";
import type { CollectionItemModel, CollectionModel, CollectionSummaryModel, CollectionWithItemsModel, LibraryTarget } from "../../models/index.js";

export interface CollectionInput {
  readonly slug: string;
  readonly name: string;
  readonly description?: string | null;
}

export interface CollectionRepository {
  list(userId: string): Promise<readonly CollectionSummaryModel[]>;
  findBySlug(userId: string, slug: string): Promise<CollectionWithItemsModel | null>;
  slugExists(userId: string, slug: string): Promise<boolean>;
  create(userId: string, input: CollectionInput): Promise<CollectionModel>;
  update(collectionId: string, input: Partial<CollectionInput>): Promise<CollectionModel>;
  remove(collectionId: string): Promise<void>;
  addItem(collectionId: string, target: LibraryTarget, note: string | null): Promise<CollectionItemModel>;
  removeItem(collectionId: string, target: LibraryTarget): Promise<boolean>;
}

export class PrismaCollectionRepository implements CollectionRepository {
  private readonly prisma: PrismaClient;

  public constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async list(userId: string): Promise<readonly CollectionSummaryModel[]> {
    const rows = await this.prisma.collection.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { items: true } } },
    });
    return rows.map(({ _count, ...collection }) => ({ ...collection, itemCount: _count.items }));
  }

  public async findBySlug(userId: string, slug: string): Promise<CollectionWithItemsModel | null> {
    return this.prisma.collection.findUnique({
      where: { userId_slug: { userId, slug } },
      include: { items: { orderBy: { position: "asc" } } },
    });
  }

  public async slugExists(userId: string, slug: string): Promise<boolean> {
    const row = await this.prisma.collection.findUnique({ where: { userId_slug: { userId, slug } }, select: { id: true } });
    return row !== null;
  }

  public async create(userId: string, input: CollectionInput): Promise<CollectionModel> {
    return this.prisma.collection.create({
      data: { userId, slug: input.slug, name: input.name, description: input.description ?? null },
    });
  }

  public async update(collectionId: string, input: Partial<CollectionInput>): Promise<CollectionModel> {
    return this.prisma.collection.update({
      where: { id: collectionId },
      data: {
        ...(input.slug === undefined ? {} : { slug: input.slug }),
        ...(input.name === undefined ? {} : { name: input.name }),
        ...(input.description === undefined ? {} : { description: input.description }),
      },
    });
  }

  public async remove(collectionId: string): Promise<void> {
    await this.prisma.collection.delete({ where: { id: collectionId } });
  }

  public async addItem(collectionId: string, target: LibraryTarget, note: string | null): Promise<CollectionItemModel> {
    const last = await this.prisma.collectionItem.aggregate({ where: { collectionId }, _max: { position: true } });
    const position = (last._max.position ?? 0) + 1;
    return this.prisma.collectionItem.upsert({
      where: { collectionId_targetType_targetKey: { collectionId, targetType: target.targetType, targetKey: target.targetKey } },
      create: { collectionId, targetType: target.targetType, targetKey: target.targetKey, position, note },
      update: { note },
    });
  }

  public async removeItem(collectionId: string, target: LibraryTarget): Promise<boolean> {
    const result = await this.prisma.collectionItem.deleteMany({
      where: { collectionId, targetType: target.targetType, targetKey: target.targetKey },
    });
    return result.count > 0;
  }
}
