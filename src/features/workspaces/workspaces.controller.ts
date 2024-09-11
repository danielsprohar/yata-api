import {
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
} from "@nestjs/common";
import { UserProfile } from "../../auth/decorators/user-profile.decorator";
import { FindOneParam } from "../../core/dto/find-one-param";
import { PageQueryParams } from "../../core/dto/page-query-params.dto";
import { CreateWorkspaceDto } from "./dto/create-workspace.dto";
import { UpdateWorkspaceDto } from "./dto/update-workspace.dto";
import { WorkspacesService } from "./workspaces.service";

@Controller("workspaces")
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  create(@UserProfile("id") userId: string, @Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.create(dto, userId);
  }

  @Get()
  findAll(
    @UserProfile("id") userId: string,
    @Query() pageParams: PageQueryParams,
  ) {
    return this.workspacesService.findAll(pageParams, userId);
  }

  @Get(":id")
  async findOne(
    @UserProfile("id") userId: string,
    @Param() params: FindOneParam,
  ) {
    return await this.workspacesService.findOne(params.id, userId);
  }

  @Patch(":id")
  async update(
    @UserProfile("id") userId: string,
    @Param() params: FindOneParam,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    return await this.workspacesService.update(
      params.id,
      userId,
      updateWorkspaceDto,
    );
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @UserProfile("id") userId: string,
    @Param() params: FindOneParam,
  ) {
    await this.workspacesService.remove(params.id, userId);
  }
}
