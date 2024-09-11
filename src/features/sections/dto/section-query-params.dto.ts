import { IsUUID } from "class-validator";
import { PageQueryParams } from "../../../core/dto/page-query-params.dto";

export class SectionQueryParams extends PageQueryParams {
  @IsUUID()
  projectId: string;
}
