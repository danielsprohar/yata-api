import { Injectable } from "@nestjs/common";
import { PageResponse } from "../../core/model/page-response.model";
import {
  bufferToUuid,
  generatePrimaryKey,
  uuidToBuffer,
} from "../../core/utils/uuid.util";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateWorkspaceDto } from "./dto/create-workspace.dto";
import { UpdateWorkspaceDto } from "./dto/update-workspace.dto";
import { WorkspaceDto } from "./dto/workspace.dto";
import { WorkspaceNotFoundException } from "./exception/workspace-not-found.exception";

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createWorkspaceDto: CreateWorkspaceDto): Promise<WorkspaceDto> {
    const id = generatePrimaryKey();
    const workspace = await this.prisma.workspace.create({
      data: {
        id,
        name: createWorkspaceDto.name,
        description: createWorkspaceDto.description,
        ownerId: createWorkspaceDto.ownerId,
      },
    });

    // Convert the id to a string before returning it
    return { ...workspace, id: bufferToUuid(workspace.id) };
  }

  async findAll(
    page: number,
    pageSize: number,
  ): Promise<PageResponse<WorkspaceDto>> {
    // TODO: Filter by user.id
    const [data, count] = await Promise.all([
      this.prisma.workspace.findMany({
        skip: page * pageSize,
        take: pageSize,
      }),
      this.prisma.workspace.count(),
    ]);

    return {
      page,
      pageSize,
      count,
      data: data.map((workspace) => ({
        ...workspace,
        id: bufferToUuid(workspace.id),
      })),
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

    return { ...workspace, id: bufferToUuid(workspace.id) };
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

    return this.prisma.workspace
      .update({
        where: {
          id: uuidToBuffer(id),
        },
        data: {
          name: updateWorkspaceDto.name,
          description: updateWorkspaceDto.description,
          public: updateWorkspaceDto.public,
        },
      })
      .then((workspace) => ({ ...workspace, id: bufferToUuid(workspace.id) }));
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
