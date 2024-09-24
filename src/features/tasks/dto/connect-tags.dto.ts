import { IsUUID } from "class-validator";

export class ConnectTagsDto {
  @IsUUID("4", { each: true })
  tagIds: string[];
}
