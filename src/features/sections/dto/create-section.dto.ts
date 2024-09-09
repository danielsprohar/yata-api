import { IsNumber, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateSectionDto {
  @IsString()
  @MaxLength(32)
  name: string;

  @IsNumber()
  position: number;

  @IsUUID()
  projectId: string;
}
