import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { PageQueryParams } from "../../core/dto/page-query-params.dto";
import { PageResponse } from "../../core/model/page-response.model";
import { generatePrimaryKey, uuidToBuffer } from "../../core/utils/uuid.util";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateWorkspaceDto } from "./dto/create-workspace.dto";
import { UpdateWorkspaceDto } from "./dto/update-workspace.dto";
import { toWorkspaceDto, WorkspaceDto } from "./dto/workspace.dto";
import { WorkspaceNotFoundException } from "./exception/workspace-not-found.exception";

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateWorkspaceDto,
    ownerId: string,
  ): Promise<WorkspaceDto> {
    try {
      const workspace = await this.prisma.workspace.create({
        data: {
          id: generatePrimaryKey(),
          name: dto.name,
          description: dto.description,
          ownerId: uuidToBuffer(ownerId),
        },
      });

      return toWorkspaceDto(workspace);
    } catch (e) {
      console.error(e);
      throw new UnprocessableEntityException(e);
    }
  }

  async findAll(
    params: PageQueryParams,
    ownerId: string,
  ): Promise<PageResponse<WorkspaceDto>> {
    const page = Math.max(+params.page || 0, 0);
    const pageSize = Math.min(+params.pageSize || 10, 50);
    const whereClause = {
      ownerId: uuidToBuffer(ownerId),
    };

    const [data, count] = await Promise.all([
      this.prisma.workspace.findMany({
        skip: page * pageSize,
        take: pageSize,
        where: whereClause,
        orderBy: {
          name: "asc",
        },
      }),
      this.prisma.workspace.count({
        where: whereClause,
      }),
    ]);

    return {
      page,
      pageSize,
      count,
      data: data.map((workspace) => toWorkspaceDto(workspace)),
    };
  }

  async findOne(id: string, ownerId: string): Promise<WorkspaceDto> {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: uuidToBuffer(id),
        ownerId: uuidToBuffer(ownerId),
      },
    });

    if (!workspace) {
      console.warn("Workspace not found", id, ownerId);
      throw new WorkspaceNotFoundException();
    }

    return toWorkspaceDto(workspace);
  }

  async update(id: string, ownerId: string, dto: UpdateWorkspaceDto) {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: uuidToBuffer(id),
        ownerId: uuidToBuffer(ownerId),
      },
    });

    if (!workspace) {
      throw new WorkspaceNotFoundException();
    }

    try {
      return this.prisma.workspace
        .update({
          where: {
            id: uuidToBuffer(id),
          },
          data: {
            name: dto.name,
            description: dto.description,
            public: dto.public,
            version: workspace.version + 1,
          },
        })
        .then((workspace) => toWorkspaceDto(workspace));
    } catch (e) {
      // TODO: Concurrency update check
      console.error(e);
      throw new UnprocessableEntityException(e);
    }
  }

  async remove(id: string, ownerId: string) {
    const workspace = await this.prisma.workspace.delete({
      where: {
        id: uuidToBuffer(id),
        ownerId: uuidToBuffer(ownerId),
      },
    });

    if (!workspace) {
      throw new WorkspaceNotFoundException();
    }
  }
}
