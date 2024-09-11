import {
  IsBooleanString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @MaxLength(255)
  description: string;

  @IsOptional()
  @IsBooleanString()
  public?: boolean;
}
