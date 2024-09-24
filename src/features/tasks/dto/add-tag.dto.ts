import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class AddTagDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(16)
  tag: string;
}
