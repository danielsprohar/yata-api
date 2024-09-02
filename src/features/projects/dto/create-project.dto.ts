import { ProjectStatus } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateProjectDto {
  @IsUUID()
  workspaceId: string;

  @IsString()
  @MaxLength(32)
  name: string;

  @IsOptional()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}
