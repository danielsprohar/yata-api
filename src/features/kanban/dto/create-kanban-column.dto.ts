import { IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateKanbanColumnDto {
  @IsString()
  @MaxLength(128)
  name: string;

  @IsUUID()
  projectId: string;

  @IsOptional()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @Min(0)
  position?: number;
}
