import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { isNumber, isUUID } from 'class-validator';
import { FindOneParam } from '../../core/dto/find-one-param';
import { ProjectNotFoundException } from '../projects/exception/project-not-found.exception';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskNotFoundException } from './exception/task-not-found.expection';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto) {
    try {
      return await this.tasksService.create(createTaskDto);
    } catch (e) {
      console.error(e);
      if (e instanceof TaskNotFoundException) {
        throw new NotFoundException();
      }
      if (e instanceof ProjectNotFoundException) {
        throw new BadRequestException('Invalid project ID');
      }
      throw new UnprocessableEntityException(e);
    }
  }

  @Get()
  findAll(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('projectId') projectId?: string,
    @Query('workspaceId') workspaceId?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (page && !isNumber(page)) {
      throw new BadRequestException('Invalid page value');
    }
    if (pageSize && !isNumber(pageSize)) {
      throw new BadRequestException('Invalid pageSize value');
    }
    if (projectId && !isUUID(projectId)) {
      throw new BadRequestException(
        'Invalid project ID: value must be a valid UUIDv4',
      );
    }
    if (workspaceId && !isUUID(workspaceId)) {
      throw new BadRequestException(
        'Invalid workspace ID: value must be a valid UUIDv4',
      );
    }
    if (
      status &&
      !['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].includes(status)
    ) {
      throw new BadRequestException('Invalid status value');
    }
    if (from && !Date.parse(from)) {
      throw new BadRequestException('Invalid from date');
    }
    if (to && !Date.parse(to)) {
      throw new BadRequestException('Invalid to date');
    }
    if (Number.isNaN(+page)) {
      throw new BadRequestException('Invalid page value');
    }
    if (Number.isNaN(+pageSize)) {
      throw new BadRequestException('Invalid pageSize value');
    }

    return this.tasksService.findAll(
      Math.max(0, parseInt(page, 10)),
      Math.max(1, parseInt(pageSize, 10)),
      projectId,
      workspaceId,
      status as TaskStatus,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get(':id')
  async findOne(@Param() params: FindOneParam) {
    try {
      return await this.tasksService.findOne(params.id);
    } catch (e) {
      if (e instanceof TaskNotFoundException) {
        throw new NotFoundException();
      }
      console.error(e);
      throw new UnprocessableEntityException(e);
    }
  }

  @Patch(':id')
  async update(
    @Param() params: FindOneParam,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    try {
      return this.tasksService.update(params.id, updateTaskDto);
    } catch (e) {
      if (e instanceof TaskNotFoundException) {
        throw new NotFoundException();
      }
      console.error(e);
      throw new UnprocessableEntityException(e);
    }
  }

  @Delete(':id')
  async remove(@Param() params: FindOneParam) {
    try {
      await this.tasksService.remove(params.id);
    } catch (e) {
      if (e instanceof TaskNotFoundException) {
        throw new NotFoundException();
      }
      console.error(e);
      throw new UnprocessableEntityException(e);
    }
  }
}
