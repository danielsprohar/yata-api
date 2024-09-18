import { Priority, TaskStatus } from "@prisma/client";
import {
  IsArray,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

export class CreateTaskDto {
  @IsOptional()
  ownerId?: string;

  @IsUUID()
  workspaceId: string;

  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsISO8601()
  dueDate?: Date;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsString()
  rrule?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(16, { each: true })
  tags?: string[];
}
