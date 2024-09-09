import { IsString, IsUUID, MaxLength } from "class-validator";

export class CreateSectionDto {
  @IsString()
  @MaxLength(32)
  name: string;

  @IsUUID()
  projectId: string;
}
