export interface UserModel {
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
  readonly avatarUrl: string | null;
  readonly roles: readonly string[];
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly lastLoginAt: Date | null;
}

export interface OAuthAccountModel {
  readonly id: string;
  readonly userId: string;
  readonly provider: string;
  readonly providerId: string;
  readonly email: string | null;
  readonly createdAt: Date;
}
