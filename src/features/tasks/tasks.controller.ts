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
} from "@nestjs/common";
import { isUUID } from "class-validator";
import { UserProfile } from "../../auth/decorators/user-profile.decorator";
import { FindOneParam } from "../../core/dto/find-one-param";
import { AddTagsDto } from "./dto/add-tags.dto";
import { ConnectTagsDto } from "./dto/connect-tags.dto";
import { CreateTaskDto } from "./dto/create-task.dto";
import { TaskQueryParams } from "./dto/task-query-params.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { TasksService } from "./tasks.service";

@Controller("tasks")
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // =========================================================================
  // Tags
  // =========================================================================

  @Post(":id/tags")
  async addTags(
    @UserProfile("id") userId: string,
    @Param() params: FindOneParam,
    @Body() dto: AddTagsDto,
  ) {
    return this.tasksService.addTags(params.id, userId, dto.tags);
  }

  @Patch(":id/tags")
  async connectTags(
    @Param() params: FindOneParam,
    @Body() dto: ConnectTagsDto,
  ) {
    return this.tasksService.connectTags(params.id, dto.tagIds);
  }

  @Patch(":id/tags/:tagId/remove")
  async removeTag(
    @UserProfile("id") userId: string,
    @Param() params: FindOneParam,
    @Param("tagId") tagId: string,
  ) {
    if (!isUUID(tagId)) {
      throw new BadRequestException("Invalid tagId. Must be a valid UUID.");
    }

    return this.tasksService.removeTag(params.id, tagId, userId);
  }

  // =========================================================================

  @Post()
  @HttpCode(HttpStatus.OK)
  async create(@UserProfile("id") userId: string, @Body() dto: CreateTaskDto) {
    return await this.tasksService.create(dto, userId);
  }

  @Get()
  fetch(
    @UserProfile("id") userId: string,
    @Query() queryParams: TaskQueryParams,
  ) {
    return this.tasksService.findMany(queryParams, userId);
  }

  @Get(":id")
  async findOne(
    @UserProfile("id") userId: string,
    @Param() params: FindOneParam,
  ) {
    return await this.tasksService.findOne(params.id, userId);
  }

  @Patch(":id")
  async update(
    @UserProfile("id") userId: string,
    @Param() params: FindOneParam,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(params.id, userId, updateTaskDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async remove(
    @UserProfile("id") userId: string,
    @Param() params: FindOneParam,
  ) {
    await this.tasksService.remove(params.id, userId);
  }
}
