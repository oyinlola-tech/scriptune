import type { PrismaClient } from "../../generated/prisma/client.js";
import type { HistoryEntryModel, HistoryKindName, LibraryTargetTypeName } from "../../models/index.js";

export interface HistoryEntryInput {
  readonly kind: HistoryKindName;
  readonly mode?: string | null;
  readonly query: string;
  readonly targetType?: LibraryTargetTypeName | null;
  readonly targetKey?: string | null;
  readonly attemptId?: string | null;
  readonly occurredAt: Date;
}

export interface HistoryRepository {
  list(userId: string, limit: number): Promise<readonly HistoryEntryModel[]>;
  add(userId: string, entries: readonly HistoryEntryInput[]): Promise<number>;
  clear(userId: string): Promise<number>;
  /** Keeps only the newest `keep` entries for a user. */
  trim(userId: string, keep: number): Promise<number>;
}

export class PrismaHistoryRepository implements HistoryRepository {
  private readonly prisma: PrismaClient;

  public constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async list(userId: string, limit: number): Promise<readonly HistoryEntryModel[]> {
    return this.prisma.historyEntry.findMany({ where: { userId }, orderBy: { occurredAt: "desc" }, take: limit });
  }

  public async add(userId: string, entries: readonly HistoryEntryInput[]): Promise<number> {
    if (entries.length === 0) {
      return 0;
    }
    const result = await this.prisma.historyEntry.createMany({
      data: entries.map((entry) => ({
        userId,
        kind: entry.kind,
        mode: entry.mode ?? null,
        query: entry.query,
        targetType: entry.targetType ?? null,
        targetKey: entry.targetKey ?? null,
        attemptId: entry.attemptId ?? null,
        occurredAt: entry.occurredAt,
      })),
    });
    return result.count;
  }

  public async clear(userId: string): Promise<number> {
    const result = await this.prisma.historyEntry.deleteMany({ where: { userId } });
    return result.count;
  }

  public async trim(userId: string, keep: number): Promise<number> {
    const stale = await this.prisma.historyEntry.findMany({
      where: { userId },
      orderBy: { occurredAt: "desc" },
      skip: keep,
      select: { id: true },
    });
    if (stale.length === 0) {
      return 0;
    }
    const result = await this.prisma.historyEntry.deleteMany({ where: { id: { in: stale.map((row) => row.id) } } });
    return result.count;
  }
}
