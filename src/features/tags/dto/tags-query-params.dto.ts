import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { PageQueryParams } from "../../../core/dto/page-query-params.dto";

export class TagsQueryParams extends PageQueryParams {
  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsOptional()
  @MaxLength(16)
  @IsString()
  q?: string;

  ownerId: string;
}
