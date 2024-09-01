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
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { FindOneParam } from '../../core/dto/find-one-param';
import { CreateKanbanColumnDto } from './dto/create-kanban-column.dto';
import { UpdateKanbanDto } from './dto/update-kanban-column.dto';
import { KanbanService } from './kanban.service';

@Controller('kanban')
export class KanbanController {
  constructor(private readonly kanbanService: KanbanService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  create(@Body() createKanbanDto: CreateKanbanColumnDto) {
    return this.kanbanService.create(createKanbanDto);
  }

  @Get()
  findAll(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('projectId') projectId: string,
  ) {
    if (page && Number.isNaN(Number.parseInt(page))) {
      throw new BadRequestException('Invalid page value');
    }
    if (pageSize && Number.isNaN(Number.parseInt(pageSize))) {
      throw new BadRequestException('Invalid pageSize value');
    }
    if (projectId && !isUUID(projectId)) {
      throw new BadRequestException('Invalid projectId value');
    }
    return this.kanbanService.findAll(
      page ? Math.max(0, parseInt(page, 10)) : 0,
      pageSize ? Math.max(1, parseInt(pageSize, 10)) : 10,
      projectId,
    );
  }

  @Get(':id')
  findOne(@Param() params: FindOneParam) {
    return this.kanbanService.findOne(params.id);
  }

  @Patch(':id')
  update(
    @Param() params: FindOneParam,
    @Body() updateKanbanDto: UpdateKanbanDto,
  ) {
    return this.kanbanService.update(params.id, updateKanbanDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param() params: FindOneParam) {
    return this.kanbanService.remove(params.id);
  }
}
