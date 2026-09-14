import type { PrismaClient } from "../../generated/prisma/client.js";
import type { OAuthSignInModel } from "../../models/index.js";

export interface CreateOAuthSignInInput {
  readonly state: string;
  readonly provider: string;
  readonly codeVerifier: string;
  readonly redirectTo: string | null;
  readonly expiresAt: Date;
}

export interface OAuthSignInRepository {
  create(input: CreateOAuthSignInInput): Promise<OAuthSignInModel>;
  findPending(state: string): Promise<OAuthSignInModel | null>;
  attachExchangeCode(state: string, exchangeCode: string, userId: string): Promise<void>;
  /** Marks the exchange code used and returns the sign-in exactly once. */
  consumeExchangeCode(exchangeCode: string): Promise<OAuthSignInModel | null>;
  purgeExpired(): Promise<number>;
}

export class PrismaOAuthSignInRepository implements OAuthSignInRepository {
  private readonly prisma: PrismaClient;

  public constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async create(input: CreateOAuthSignInInput): Promise<OAuthSignInModel> {
    return this.prisma.oAuthSignIn.create({ data: input });
  }

  public async findPending(state: string): Promise<OAuthSignInModel | null> {
    const row = await this.prisma.oAuthSignIn.findUnique({ where: { state } });
    if (row === null || row.consumedAt !== null || row.exchangeCode !== null || row.expiresAt.getTime() <= Date.now()) {
      return null;
    }
    return row;
  }

  public async attachExchangeCode(state: string, exchangeCode: string, userId: string): Promise<void> {
    await this.prisma.oAuthSignIn.update({ where: { state }, data: { exchangeCode, userId } });
  }

  public async consumeExchangeCode(exchangeCode: string): Promise<OAuthSignInModel | null> {
    const now = new Date();
    const updated = await this.prisma.oAuthSignIn.updateMany({
      where: { exchangeCode, consumedAt: null, expiresAt: { gt: now } },
      data: { consumedAt: now },
    });
    if (updated.count !== 1) {
      return null;
    }
    return this.prisma.oAuthSignIn.findUnique({ where: { exchangeCode } });
  }

  public async purgeExpired(): Promise<number> {
    const result = await this.prisma.oAuthSignIn.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    return result.count;
  }
}
