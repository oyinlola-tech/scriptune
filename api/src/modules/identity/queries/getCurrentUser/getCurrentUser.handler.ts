import { QueryHandler } from "@zudojs/cqrs";
import { UnauthorizedError } from "@zudojs/errors";
import { toUserDto, type UserDto } from "../../../../dtos/index.js";
import type { UserRepository } from "../../../../repositories/index.js";
import { GET_CURRENT_USER, type GetCurrentUserQuery } from "./getCurrentUser.query.js";

export class GetCurrentUserHandler extends QueryHandler<GetCurrentUserQuery, UserDto> {
  public readonly queryType = GET_CURRENT_USER;

  private readonly users: UserRepository;

  public constructor(users: UserRepository) {
    super();
    this.users = users;
  }

  public async execute(query: GetCurrentUserQuery): Promise<UserDto> {
    const user = await this.users.findById(query.userId);
    if (user === null || !user.active) {
      throw new UnauthorizedError("This account is no longer available.");
    }
    return toUserDto(user);
  }
}
