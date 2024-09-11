import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { UserProfile } from "../../auth/decorators/user-profile.decorator";
import { FindOneParam } from "../../core/dto/find-one-param";
import { CreateSectionDto } from "./dto/create-section.dto";
import { SectionQueryParams } from "./dto/section-query-params.dto";
import { UpdateSectionDto } from "./dto/update-section.dto";
import { SectionsService } from "./sections.service";

@Controller("sections")
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async create(
    @UserProfile("id") userId: string,
    @Body() dto: CreateSectionDto,
  ) {
    return await this.sectionsService.create(dto, userId);
  }

  @Get()
  findAll(
    @UserProfile("id") userId: string,
    @Query() queryParams: SectionQueryParams,
  ) {
    return this.sectionsService.fetch(queryParams, userId);
  }

  @Get(":id")
  async findById(
    @UserProfile("id") userId: string,
    @Param() params: FindOneParam,
  ) {
    return this.sectionsService.findById(params.id, userId);
  }

  @Patch(":id")
  async update(
    @UserProfile("id") userId: string,
    @Param() params: FindOneParam,
    @Body() updateSectionDto: UpdateSectionDto,
  ) {
    return this.sectionsService.update(params.id, userId, updateSectionDto);
  }

  @Delete(":id")
  async delete(
    @UserProfile("id") userId: string,
    @Param() params: FindOneParam,
  ) {
    return this.sectionsService.delete(params.id, userId);
  }
}
