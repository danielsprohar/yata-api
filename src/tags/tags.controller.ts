import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { QueryParams } from '../dto/query-params.dto';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) { }

  @Post()
  async create(@Body() createTagDto: CreateTagDto) {
    return await this.tagsService.create(createTagDto);
  }

  @Get()
  async findAll(@Query() query: QueryParams) {
    return await this.tagsService.findAll({
      skip: query.skip ?? QueryParams.SKIP_DEFAULT,
      take: query.take ?? QueryParams.TAKE_DEFAULT,
      orderBy: {
        name: 'asc',
      },
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.tagsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTagDto: UpdateTagDto
  ) {
    const tagExists = await this.tagsService.exists(id);
    if (!tagExists) {
      throw new NotFoundException()
    }

    return await this.tagsService.update(id, updateTagDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const tagExists = await this.tagsService.exists(id);
    if (!tagExists) {
      throw new NotFoundException()
    }

    return await this.tagsService.remove(id);
  }
}
