import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UnprocessableEntityException,
} from "@nestjs/common";
import { UserProfile } from "../../auth/decorators/user-profile.decorator";
import { FindOneParam } from "../../core/dto/find-one-param";
import { WorkspaceNotFoundException } from "../workspaces/exception/workspace-not-found.exception";
import { CreateProjectDto } from "./dto/create-project.dto";
import { ProjectQueryParams } from "./dto/project-query-params.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { ProjectsService } from "./projects.service";

@Controller("projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async create(
    @UserProfile("id") userId: string,
    @Body() dto: CreateProjectDto,
  ) {
    return await this.projectsService.create(dto, userId);
  }

  @Get()
  findAll(
    @UserProfile("id") userId: string,
    @Query() queryParams: ProjectQueryParams,
  ) {
    return this.projectsService.findAll(queryParams, userId);
  }

  @Get(":id")
  async findOne(
    @UserProfile("id") userId: string,
    @Param() params: FindOneParam,
  ) {
    try {
      return await this.projectsService.findOne(params.id, userId);
    } catch (e) {
      console.error(e);
      if (e instanceof WorkspaceNotFoundException) {
        throw new NotFoundException();
      }
      throw new UnprocessableEntityException(e);
    }
  }

  @Patch(":id")
  async update(
    @UserProfile("id") userId: string,
    @Param() params: FindOneParam,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(params.id, userId, updateProjectDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @UserProfile("id") userId: string,
    @Param() params: FindOneParam,
  ) {
    await this.projectsService.remove(params.id, userId);
  }
}
