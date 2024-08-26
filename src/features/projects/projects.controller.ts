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
import { WorkspaceNotFoundException } from '../workspaces/exception/workspace-not-found.exception';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  findAll(
    @Query('page') page: string = '0',
    @Query('pageSize') pageSize: string = '10',
  ) {
    return this.projectsService.findAll(+page, +pageSize);
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
