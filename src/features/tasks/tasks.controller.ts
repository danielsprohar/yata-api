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
import { CreateTaskDto } from "./dto/create-task.dto";
import { TaskQueryParams } from "./dto/task-query-params.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { TasksService } from "./tasks.service";

@Controller("tasks")
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

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
    return this.tasksService.fetch(queryParams, userId);
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
