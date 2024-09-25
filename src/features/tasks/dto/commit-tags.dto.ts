import { IsArray, IsNotEmpty, IsUUID, MaxLength } from "class-validator";

export class CommitTagsDto {
  @IsArray()
  @IsNotEmpty({ each: true })
  @MaxLength(16, { each: true })
  newTagNames: string[];

  @IsArray()
  @IsUUID("4", { each: true })
  tagIds: string[];
}
