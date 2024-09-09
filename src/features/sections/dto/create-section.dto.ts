import { IsNumberString, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateSectionDto {
  @IsString()
  @MaxLength(32)
  name: string;

  @IsNumberString()
  position: number;

  @IsUUID()
  projectId: string;
}
