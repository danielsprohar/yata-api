import { IsNotEmpty, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateTagDto {
  @IsString()
  @MaxLength(16)
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsNotEmpty()
  taskId: string;
}
