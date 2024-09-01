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
import { ColumnsService } from './columns.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';

@Controller('columns')
export class ColumnsController {
  constructor(private readonly columnsService: ColumnsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  create(@Body() dto: CreateColumnDto) {
    return this.columnsService.create(dto);
  }

  @Get()
  findAll(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('boardId') boardId: string,
  ) {
    if (page && Number.isNaN(Number.parseInt(page))) {
      throw new BadRequestException('Invalid page value');
    }
    if (pageSize && Number.isNaN(Number.parseInt(pageSize))) {
      throw new BadRequestException('Invalid pageSize value');
    }
    if (boardId && !isUUID(boardId)) {
      throw new BadRequestException('Invalid boardId value');
    }
    return this.columnsService.findAll(
      page ? Math.max(0, parseInt(page, 10)) : 0,
      pageSize ? Math.max(1, parseInt(pageSize, 10)) : 10,
      boardId,
    );
  }

  @Get(':id')
  findOne(@Param() params: FindOneParam) {
    return this.columnsService.findOne(params.id);
  }

  @Patch(':id')
  update(@Param() params: FindOneParam, @Body() dto: UpdateColumnDto) {
    return this.columnsService.update(params.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param() params: FindOneParam) {
    return this.columnsService.remove(params.id);
  }
}
