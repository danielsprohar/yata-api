import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { UserProfile } from "../../auth/decorators/user-profile.decorator";
import { FindOneParam } from "../../core/dto/find-one-param";
import { CreateTagDto } from "./dto/create-tag.dto";
import { TagsQueryParams } from "./dto/tags-query-params.dto";
import { TagsService } from "./tags.service";

@Controller("tags")
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.create(createTagDto);
  }

  @Get()
  findAll(@UserProfile("id") userId: string, @Query() params: TagsQueryParams) {
    return this.tagsService.findAll({
      ...params,
      ownerId: userId,
    });
  }

  @Get(":id")
  findOne(@Param() param: FindOneParam) {
    return this.tagsService.findOne(param.id);
  }

  // @Patch(":id")
  // update(@Param() param: FindOneParam, @Body() updateTagDto: UpdateTagDto) {
  //   return this.tagsService.update(param.id, updateTagDto);
  // }

  // @Delete(":id")
  // remove(@Param() param: FindOneParam) {
  //   return this.tagsService.remove(param.id);
  // }
}
