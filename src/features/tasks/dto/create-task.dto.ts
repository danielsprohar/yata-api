import { Priority, TaskStatus } from '@prisma/client';
import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateTaskDto {
  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsUUID()
  parentTaskId: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsOptional()
  @IsISO8601()
  dueDate: Date;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;
}
