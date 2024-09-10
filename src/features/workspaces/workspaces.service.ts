import { Injectable } from "@nestjs/common";
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

  async create(dto: CreateWorkspaceDto): Promise<WorkspaceDto> {
    const id = generatePrimaryKey();
    const workspace = await this.prisma.workspace.create({
      data: {
        id,
        name: dto.name,
        description: dto.description,
        ownerId: uuidToBuffer(dto.ownerId),
      },
    });

    return toWorkspaceDto(workspace);
  }

  async findAll(
    page: number,
    pageSize: number,
    ownerId: string,
  ): Promise<PageResponse<WorkspaceDto>> {
    const [data, count] = await Promise.all([
      this.prisma.workspace.findMany({
        skip: page * pageSize,
        take: pageSize,
        where: {
          ownerId: uuidToBuffer(ownerId),
        },
      }),
      this.prisma.workspace.count(),
    ]);

    return {
      page,
      pageSize,
      count,
      data: data.map((workspace) => toWorkspaceDto(workspace)),
    };
  }

  async findOne(id: string): Promise<WorkspaceDto> {
    const workspace = await this.prisma.workspace.findUnique({
      where: {
        id: uuidToBuffer(id),
      },
    });

    if (!workspace) {
      throw new WorkspaceNotFoundException();
    }

    return toWorkspaceDto(workspace);
  }

  async update(id: string, updateWorkspaceDto: UpdateWorkspaceDto) {
    const workspace = await this.prisma.workspace.findUnique({
      where: {
        id: uuidToBuffer(id),
      },
    });

    if (!workspace) {
      throw new WorkspaceNotFoundException();
    }

    // TODO: Concurrency update check
    return this.prisma.workspace
      .update({
        where: {
          id: uuidToBuffer(id),
        },
        data: {
          name: updateWorkspaceDto.name,
          description: updateWorkspaceDto.description,
          public: updateWorkspaceDto.public,
          version: workspace.version + 1,
        },
      })
      .then((workspace) => toWorkspaceDto(workspace));
  }

  async remove(id: string) {
    const workspace = await this.prisma.workspace.delete({
      where: {
        id: uuidToBuffer(id),
      },
    });

    if (!workspace) {
      throw new WorkspaceNotFoundException();
    }
  }
}
