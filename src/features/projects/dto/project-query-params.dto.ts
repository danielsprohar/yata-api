import { IsOptional, IsUUID } from "class-validator";
import { PageQueryParams } from "../../../core/dto/page-query-params.dto";

export class ProjectQueryParams extends PageQueryParams {
  @IsOptional()
  @IsUUID()
  workspaceId?: string;
}
