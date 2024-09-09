import {
  BadRequestException,
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
  UnprocessableEntityException,
} from "@nestjs/common";
import { isUUID } from "class-validator";
import { FindOneParam } from "../../core/dto/find-one-param";
import { ProjectNotFoundException } from "../projects/exception/project-not-found.exception";
import { CreateSectionDto } from "./dto/create-section.dto";
import { UpdateSectionDto } from "./dto/update-section.dto";
import { SectionsService } from "./sections.service";

@Controller("sections")
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async create(@Body() createSectionDto: CreateSectionDto) {
    try {
      return await this.sectionsService.create(createSectionDto);
    } catch (e) {
      console.error(e);
      if (e instanceof ProjectNotFoundException) {
        throw e;
      }
      throw new UnprocessableEntityException(e);
    }
  }

  @Get()
  findAll(
    @Query("page") page: string,
    @Query("pageSize") pageSize: string,
    @Query("projectId") projectId: string,
  ) {
    if (page && Number.isNaN(Number.parseInt(page))) {
      throw new BadRequestException("Invalid page value");
    }
    if (pageSize && Number.isNaN(Number.parseInt(pageSize))) {
      throw new BadRequestException("Invalid pageSize value");
    }
    if (projectId && !isUUID(projectId)) {
      throw new BadRequestException("Invalid projectId value");
    }

    return this.sectionsService.fetch(
      page ? Math.max(0, parseInt(page, 10)) : 0,
      pageSize ? Math.max(1, parseInt(pageSize, 10)) : 10,
      projectId,
    );
  }

  @Get(":id")
  async findById(@Param() params: FindOneParam) {
    return this.sectionsService.findById(params.id);
  }

  @Patch(":id")
  async update(
    @Param() params: FindOneParam,
    @Body() updateSectionDto: UpdateSectionDto,
  ) {
    return this.sectionsService.update(params.id, updateSectionDto);
  }

  @Delete(":id")
  async delete(@Param() params: FindOneParam) {
    return this.sectionsService.delete(params.id);
  }
}
