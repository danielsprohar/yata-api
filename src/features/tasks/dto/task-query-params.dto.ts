import { IsISO8601, IsOptional, IsUUID } from "class-validator";
import { PageQueryParams } from "../../../core/dto/page-query-params.dto";
import { IsTaskPriorityFilter } from "../validators/task-priority-filter.validator";
import { IsTaskStatusFilter } from "../validators/task-status-filter.validator";

export class TaskQueryParams extends PageQueryParams {
  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsTaskStatusFilter()
  status?: string;

  @IsOptional()
  @IsTaskPriorityFilter()
  priority?: string;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}
