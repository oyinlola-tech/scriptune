import { toSessionId, toUserId, type AuthSession, type CreateSessionOptions, type SessionStore, type TokenRevocationStore } from "@zudojs/auth";
import type { SessionId, TokenId, UserId } from "@zudojs/constants";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { isConflictError } from "@zudojs/database";

/** Sessions in PostgreSQL, so logout works across API instances. */
export class PrismaSessionStore implements SessionStore {
  private readonly prisma: PrismaClient;
  private readonly defaultTtlSeconds: number;

  public constructor(prisma: PrismaClient, defaultTtlSeconds: number) {
    this.prisma = prisma;
    this.defaultTtlSeconds = defaultTtlSeconds;
  }

  public async create(options: CreateSessionOptions): Promise<AuthSession> {
    const now = Date.now();
    const ttl = (options.ttlSeconds ?? this.defaultTtlSeconds) * 1000;
    const row = await this.prisma.session.create({
      data: {
        userId: options.userId,
        userAgent: options.userAgent ?? null,
        ip: options.ip ?? null,
        expiresAt: new Date(now + ttl),
        absoluteExpiresAt: options.absoluteTtlSeconds === undefined ? null : new Date(now + options.absoluteTtlSeconds * 1000),
      },
    });
    return toAuthSession(row);
  }

  public async get(sessionId: SessionId): Promise<AuthSession | null> {
    const row = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (row === null || row.expiresAt.getTime() <= Date.now()) {
      return null;
    }
    return toAuthSession(row);
  }

  public async touch(sessionId: SessionId): Promise<void> {
    const now = new Date();
    await this.prisma.session.updateMany({
      where: { id: sessionId },
      data: { lastActivityAt: now, expiresAt: new Date(now.getTime() + this.defaultTtlSeconds * 1000) },
    });
  }

  public async destroy(sessionId: SessionId): Promise<void> {
    await this.prisma.session.deleteMany({ where: { id: sessionId } });
  }

  public async destroyAllForUser(userId: UserId): Promise<void> {
    await this.prisma.session.deleteMany({ where: { userId } });
  }
}

function toAuthSession(row: {
  readonly id: string;
  readonly userId: string;
  readonly userAgent: string | null;
  readonly ip: string | null;
  readonly createdAt: Date;
  readonly lastActivityAt: Date;
  readonly expiresAt: Date;
  readonly absoluteExpiresAt: Date | null;
}): AuthSession {
  return {
    id: toSessionId(row.id),
    userId: toUserId(row.userId),
    ...(row.userAgent === null ? {} : { userAgent: row.userAgent }),
    ...(row.ip === null ? {} : { ip: row.ip }),
    createdAt: row.createdAt,
    lastActivityAt: row.lastActivityAt,
    expiresAt: row.expiresAt,
    ...(row.absoluteExpiresAt === null ? {} : { absoluteExpiresAt: row.absoluteExpiresAt }),
  };
}

/** Used refresh-token ids, so a replayed refresh token is detected on any instance. */
export class PrismaTokenRevocationStore implements TokenRevocationStore {
  private readonly prisma: PrismaClient;

  public constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async revoke(tokenId: TokenId, expiresAt: number): Promise<void> {
    await this.revokeIfNotRevoked(tokenId, expiresAt);
  }

  public async isRevoked(tokenId: TokenId): Promise<boolean> {
    const row = await this.prisma.revokedToken.findUnique({ where: { tokenId } });
    return row !== null;
  }

  public async revokeIfNotRevoked(tokenId: TokenId, expiresAt: number): Promise<boolean> {
    try {
      await this.prisma.revokedToken.create({ data: { tokenId, expiresAt: new Date(expiresAt * 1000) } });
      return true;
    } catch (error) {
      if (isConflictError(error)) {
        return false;
      }
      throw error;
    }
  }
}
