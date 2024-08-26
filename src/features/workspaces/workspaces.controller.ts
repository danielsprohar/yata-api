import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FindOneParam } from '../../core/dto/find-one-param';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspaceNotFoundException } from './exception/workspace-not-found.exception';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  create(@Body() createWorkspaceDto: CreateWorkspaceDto) {
    return this.workspacesService.create(createWorkspaceDto);
  }

  @Get()
  findAll(
    @Query('page') page: string = '0',
    @Query('pageSize') pageSize: string = '10',
  ) {
    return this.workspacesService.findAll(+page, +pageSize);
  }

  @Get(':id')
  async findOne(@Param() params: FindOneParam) {
    try {
      return await this.workspacesService.findOne(params.id);
    } catch (e) {
      if (e instanceof WorkspaceNotFoundException) {
        throw new NotFoundException();
      }
      console.error(e);
      throw new UnprocessableEntityException();
    }
  }

  @Patch(':id')
  async update(
    @Param() params: FindOneParam,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    try {
      return await this.workspacesService.update(params.id, updateWorkspaceDto);
    } catch (e) {
      if (e instanceof WorkspaceNotFoundException) {
        throw new NotFoundException();
      }
      console.error(e);
      throw new UnprocessableEntityException(e);
    }
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param() params: FindOneParam) {
    try {
      await this.workspacesService.remove(params.id);
    } catch (e) {
      if (e instanceof WorkspaceNotFoundException) {
        throw new NotFoundException();
      }
      console.error(e);
      throw new UnprocessableEntityException(e);
    }
  }
}
