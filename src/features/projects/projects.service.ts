import { Injectable } from "@nestjs/common";
import { PageResponse } from "../../core/model/page-response.model";
import {
  bufferToUuid,
  generatePrimaryKey,
  uuidToBuffer,
} from "../../core/utils/uuid.util";
import { PrismaService } from "../../prisma/prisma.service";
import { WorkspaceNotFoundException } from "../workspaces/exception/workspace-not-found.exception";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { ProjectNotFoundException } from "./exception/project-not-found.exception";
import { ProjectModel } from "./model/project.model";

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto): Promise<ProjectModel> {
    const workspaceCount = await this.prisma.workspace.count({
      where: {
        id: uuidToBuffer(createProjectDto.workspaceId),
      },
    });

    if (workspaceCount === 0) {
      throw new WorkspaceNotFoundException();
    }

    const project = await this.prisma.project.create({
      data: {
        id: generatePrimaryKey(),
        name: createProjectDto.name,
        description: createProjectDto.description,
        status: createProjectDto.status ?? "NOT_STARTED",
        workspaceId: uuidToBuffer(createProjectDto.workspaceId),
      },
    });
    return {
      ...project,
      id: bufferToUuid(project.id),
      workspaceId: bufferToUuid(project.workspaceId),
    };
  }

  async findAll(
    page: number,
    pageSize: number,
    workspaceId: string,
  ): Promise<PageResponse<ProjectModel>> {
    const [data, count] = await Promise.all([
      this.prisma.project.findMany({
        skip: page * pageSize,
        take: pageSize,
        where: {
          workspaceId: uuidToBuffer(workspaceId),
        },
      }),
      this.prisma.project.count({
        where: {
          workspaceId: uuidToBuffer(workspaceId),
        },
      }),
    ]);

    return {
      page,
      pageSize,
      count,
      data: data.map((project) => ({
        ...project,
        id: bufferToUuid(project.id),
        workspaceId: bufferToUuid(project.workspaceId),
      })),
    };
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: uuidToBuffer(id),
      },
    });

    if (!project) {
      throw new ProjectNotFoundException();
    }

    return {
      ...project,
      id: bufferToUuid(project.id),
      workspaceId: bufferToUuid(project.workspaceId),
    };
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: uuidToBuffer(id),
      },
      select: {
        id: true,
        workspaceId: true,
      },
    });

    if (!project) {
      throw new ProjectNotFoundException();
    }

    return this.prisma.project
      .update({
        where: {
          id: uuidToBuffer(id),
        },
        data: {
          name: updateProjectDto.name,
          description: updateProjectDto.description,
          status: updateProjectDto.status,
        },
      })
      .then((updatedProject) => ({
        ...updatedProject,
        id: bufferToUuid(project.id),
        workspaceId: bufferToUuid(project.workspaceId),
      }));
  }

  async remove(id: string) {
    const project = await this.prisma.project.delete({
      where: {
        id: uuidToBuffer(id),
      },
    });

    if (!project) {
      throw new ProjectNotFoundException();
    }
  }
}
