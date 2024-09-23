import { PageQueryParams } from "../../../core/dto/page-query-params.dto";

export interface TagsQueryParams extends PageQueryParams {
  taskId?: string;
  ownerId: string;
}
