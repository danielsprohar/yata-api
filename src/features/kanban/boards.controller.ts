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
  UnauthorizedException,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { isUUID } from 'class-validator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { FindOneParam } from '../../core/dto/find-one-param';
import { WorkspaceNotFoundException } from '../workspaces/exception/workspace-not-found.exception';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@ApiBearerAuth()
@ApiTags('boards')
@ApiUnauthorizedResponse({ type: UnauthorizedException })
@Controller('boards')
@UseGuards(JwtAuthGuard)
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async create(@Body() dto: CreateBoardDto) {
    try {
      return await this.boardsService.create(dto);
    } catch (e) {
      console.error(e);
      if (e instanceof WorkspaceNotFoundException) {
        throw e;
      }
      throw new UnprocessableEntityException(e.message);
    }
  }

  @Get()
  findAll(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    if (page && Number.isNaN(Number.parseInt(page))) {
      throw new BadRequestException('Invalid page value');
    }
    if (pageSize && Number.isNaN(Number.parseInt(pageSize))) {
      throw new BadRequestException('Invalid pageSize value');
    }
    if (workspaceId && !isUUID(workspaceId)) {
      throw new BadRequestException('Invalid workspaceId value');
    }
    return this.boardsService.findAll(
      page ? Math.max(0, parseInt(page, 10)) : 0,
      pageSize ? Math.max(1, parseInt(pageSize, 10)) : 10,
      workspaceId,
    );
  }

  @Get(':id')
  findOne(@Param() params: FindOneParam) {
    return this.boardsService.findOne(params.id);
  }

  @Patch(':id')
  update(@Param() params: FindOneParam, @Body() dto: UpdateBoardDto) {
    return this.boardsService.update(params.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param() params: FindOneParam) {
    return this.boardsService.remove(params.id);
  }
}
