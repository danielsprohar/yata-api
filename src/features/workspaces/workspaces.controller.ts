import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UnprocessableEntityException,
} from "@nestjs/common";
import { FindOneParam } from "../../core/dto/find-one-param";
import { CreateWorkspaceDto } from "./dto/create-workspace.dto";
import { UpdateWorkspaceDto } from "./dto/update-workspace.dto";
import { WorkspaceNotFoundException } from "./exception/workspace-not-found.exception";
import { WorkspacesService } from "./workspaces.service";

@Controller("workspaces")
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  create(@Body() createWorkspaceDto: CreateWorkspaceDto) {
    return this.workspacesService.create(createWorkspaceDto);
  }

  @Get()
  async findAll(@Query("page") page: string, @Query("pageSize") pageSize: string) {
    if (page && Number.isNaN(Number.parseInt(page))) {
      throw new BadRequestException("Invalid page value");
    }
    if (pageSize && Number.isNaN(Number.parseInt(pageSize))) {
      throw new BadRequestException("Invalid pageSize value");
    }

    const response = await this.workspacesService.findAll(
      page ? Math.max(0, parseInt(page, 10)) : 0,
      pageSize ? Math.max(1, parseInt(pageSize, 10)) : 10,
    );

    console.log(response.data);
    return response
  }

  @Get(":id")
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

  @Patch(":id")
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

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
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
