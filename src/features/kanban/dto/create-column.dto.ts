import { IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateColumnDto {
  @IsString()
  @MaxLength(128)
  name: string;

  @IsUUID()
  boardId: string;

  @IsOptional()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @Min(0)
  position?: number;
}
