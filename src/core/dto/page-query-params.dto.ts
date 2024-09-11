import { Prisma } from "@prisma/client";
import { IsEnum, IsNumberString, IsOptional } from "class-validator";

export class PageQueryParams {
  @IsNumberString()
  @IsOptional()
  page: string;

  @IsNumberString()
  @IsOptional()
  pageSize: string;

  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  dir?: string;
}
