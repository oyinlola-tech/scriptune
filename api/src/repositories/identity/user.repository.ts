import type { PrismaClient } from "../../generated/prisma/client.js";
import type { UserModel } from "../../models/index.js";

export interface CreateUserInput {
  readonly email: string;
  readonly name?: string | null;
  readonly avatarUrl?: string | null;
  readonly passwordHash?: string;
}

export interface OAuthLink {
  readonly provider: string;
  readonly providerId: string;
  readonly email?: string | null;
}

export interface UserRepository {
  findById(id: string): Promise<UserModel | null>;
  findByEmail(email: string): Promise<UserModel | null>;
  findByOAuth(provider: string, providerId: string): Promise<UserModel | null>;
  findPasswordHash(userId: string): Promise<string | null>;
  create(input: CreateUserInput): Promise<UserModel>;
  linkOAuth(userId: string, link: OAuthLink): Promise<void>;
  touchLogin(userId: string): Promise<void>;
  updateProfile(userId: string, profile: { readonly name?: string | null; readonly avatarUrl?: string | null }): Promise<UserModel>;
  /** Removes the user; related rows cascade in the database. */
  delete(userId: string): Promise<void>;
}

export class PrismaUserRepository implements UserRepository {
  private readonly prisma: PrismaClient;

  public constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async findById(id: string): Promise<UserModel | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  public async findByEmail(email: string): Promise<UserModel | null> {
    return this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  }

  public async findByOAuth(provider: string, providerId: string): Promise<UserModel | null> {
    const account = await this.prisma.oAuthAccount.findUnique({
      where: { provider_providerId: { provider, providerId } },
      include: { user: true },
    });
    return account?.user ?? null;
  }

  public async findPasswordHash(userId: string): Promise<string | null> {
    const credential = await this.prisma.credential.findUnique({ where: { userId }, select: { passwordHash: true } });
    return credential?.passwordHash ?? null;
  }

  public async create(input: CreateUserInput): Promise<UserModel> {
    return this.prisma.user.create({
      data: {
        email: input.email.trim().toLowerCase(),
        name: input.name ?? null,
        avatarUrl: input.avatarUrl ?? null,
        ...(input.passwordHash === undefined ? {} : { credential: { create: { passwordHash: input.passwordHash } } }),
      },
    });
  }

  public async linkOAuth(userId: string, link: OAuthLink): Promise<void> {
    await this.prisma.oAuthAccount.upsert({
      where: { provider_providerId: { provider: link.provider, providerId: link.providerId } },
      create: { userId, provider: link.provider, providerId: link.providerId, email: link.email ?? null },
      update: { userId, email: link.email ?? null },
    });
  }

  public async delete(userId: string): Promise<void> {
    await this.prisma.user.delete({ where: { id: userId } });
  }

  public async touchLogin(userId: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  }

  public async updateProfile(userId: string, profile: { readonly name?: string | null; readonly avatarUrl?: string | null }): Promise<UserModel> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(profile.name === undefined ? {} : { name: profile.name }),
        ...(profile.avatarUrl === undefined ? {} : { avatarUrl: profile.avatarUrl }),
      },
    });
  }
}
