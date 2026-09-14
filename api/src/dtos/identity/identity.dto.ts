import type { TokenPair } from "@zudojs/auth";
import type { UserModel } from "../../models/index.js";

export interface UserDto {
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
  readonly avatarUrl: string | null;
  readonly roles: readonly string[];
  readonly createdAt: string;
}

export interface TokensDto {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
  readonly tokenType: "Bearer";
}

/** Returned by register, login, refresh-with-user and Google exchange. */
export interface AuthSessionDto {
  readonly user: UserDto;
  readonly tokens: TokensDto;
  readonly sessionId: string;
}

export function toUserDto(user: UserModel): UserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    roles: user.roles,
    createdAt: user.createdAt.toISOString(),
  };
}

export function toTokensDto(tokens: TokenPair): TokensDto {
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
    tokenType: "Bearer",
  };
}
