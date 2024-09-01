import {
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
import { FindOneParam } from '../../core/dto/find-one-param';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskQueryParams } from './dto/task-query-params.dto';
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
      if (e instanceof NotFoundException) {
        throw e;
      }
      throw new UnprocessableEntityException(e);
    }
  }

  @Get()
  findAll(@Query() queryParams: TaskQueryParams) {
    return this.tasksService.findAll(queryParams);
  }

  @Get(':id')
  async findOne(@Param() params: FindOneParam) {
    try {
      return await this.tasksService.findOne(params.id);
    } catch (e) {
      console.error(e);
      if (e instanceof TaskNotFoundException) {
        throw e;
      }
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
      console.error(e);
      if (e instanceof TaskNotFoundException) {
        throw e;
      }
      throw new UnprocessableEntityException(e);
    }
  }

  @Delete(':id')
  async remove(@Param() params: FindOneParam) {
    try {
      await this.tasksService.remove(params.id);
    } catch (e) {
      console.error(e);
      if (e instanceof TaskNotFoundException) {
        throw e;
      }
      throw new UnprocessableEntityException(e);
    }
  }
}
