import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { User } from "../model/user.model";

export const UserProfile = createParamDecorator<keyof User | undefined>(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return data ? request.user[data] : request.user;
  },
);
