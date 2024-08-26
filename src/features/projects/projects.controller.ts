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
import { isNumber } from 'class-validator';
import { FindOneParam } from '../../core/dto/find-one-param';
import { WorkspaceNotFoundException } from '../workspaces/exception/workspace-not-found.exception';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(@Body() createProjectDto: CreateProjectDto) {
    try {
      return await this.projectsService.create(createProjectDto);
    } catch (e) {
      console.error(e);
      if (e instanceof WorkspaceNotFoundException) {
        throw new NotFoundException();
      }
      throw new UnprocessableEntityException(e);
    }
  }

  @Get()
  findAll(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    if (page && !isNumber(page)) {
      throw new BadRequestException('Invalid page value');
    }
    if (pageSize && !isNumber(pageSize)) {
      throw new BadRequestException('Invalid pageSize value');
    }

    return this.projectsService.findAll(
      page ? Math.max(0, parseInt(page, 10)) : 0,
      pageSize ? Math.max(1, parseInt(pageSize, 10)) : 10,
    );
  }

  @Get(':id')
  async findOne(@Param() params: FindOneParam) {
    try {
      return await this.projectsService.findOne(params.id);
    } catch (e) {
      if (e instanceof WorkspaceNotFoundException) {
        throw new NotFoundException();
      }
      console.error(e);
      throw new UnprocessableEntityException(e);
    }
  }

  @Patch(':id')
  async update(
    @Param() params: FindOneParam,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    try {
      return this.projectsService.update(params.id, updateProjectDto);
    } catch (e) {
      if (e instanceof WorkspaceNotFoundException) {
        throw new NotFoundException();
      }
      console.error(e);
      throw new UnprocessableEntityException(e);
    }
  }

  @Delete(':id')
  async remove(@Param() params: FindOneParam) {
    try {
      await this.projectsService.remove(params.id);
    } catch (e) {
      if (e instanceof WorkspaceNotFoundException) {
        throw new NotFoundException();
      }
      console.error(e);
      throw new UnprocessableEntityException(e);
    }
  }
}
