import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBoardDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  name: string;

  @IsUUID()
  workspaceId: string;

  @IsOptional()
  @MaxLength(255)
  description?: string;
}
