import { IsArray, IsUUID } from "class-validator";

export class ConnectTagsDto {
  @IsArray()
  @IsUUID("4", { each: true })
  tagIds: string[];
}
