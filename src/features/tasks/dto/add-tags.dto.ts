import { IsArray, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class AddTagsDto {
  @IsArray()
  @IsNotEmpty({ each: true })
  @MaxLength(16, { each: true })
  @IsString({ each: true })
  tags: string[];
}
