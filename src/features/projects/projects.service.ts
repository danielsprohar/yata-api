import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { PageResponse } from "../../core/model/page-response.model";
import { generatePrimaryKey, uuidToBuffer } from "../../core/utils/uuid.util";
import { PrismaService } from "../../prisma/prisma.service";
import { WorkspaceNotFoundException } from "../workspaces/exception/workspace-not-found.exception";
import { CreateProjectDto } from "./dto/create-project.dto";
import { ProjectQueryParams } from "./dto/project-query-params.dto";
import { ProjectDto, toProjectDto } from "./dto/project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { ProjectNotFoundException } from "./exception/project-not-found.exception";

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProjectDto, ownerId: string): Promise<ProjectDto> {
    const workspaceCount = await this.prisma.workspace.count({
      where: {
        id: uuidToBuffer(dto.workspaceId),
      },
    });

    if (workspaceCount === 0) {
      throw new WorkspaceNotFoundException();
    }

    try {
      const project = await this.prisma.project.create({
        data: {
          ...dto,
          id: generatePrimaryKey(),
          workspaceId: uuidToBuffer(dto.workspaceId),
          ownerId: uuidToBuffer(ownerId),
        },
      });

      return toProjectDto(project);
    } catch (e) {
      console.error(e);
      throw new UnprocessableEntityException(e);
    }
  }

  async findAll(
    params: ProjectQueryParams,
    ownerId: string,
  ): Promise<PageResponse<ProjectDto>> {
    const page = Math.max(+params.page || 0, 0);
    const pageSize = Math.min(+params.pageSize || 10, 50);
    const workspaceId = params.workspaceId;
    const projectFilters = {
      workspaceId: workspaceId ? uuidToBuffer(workspaceId) : undefined,
      ownerId: uuidToBuffer(ownerId),
    };

    const [data, count] = await Promise.all([
      this.prisma.project.findMany({
        skip: page * pageSize,
        take: pageSize,
        where: projectFilters,
      }),
      this.prisma.project.count({
        where: projectFilters,
      }),
    ]);

    return {
      page,
      pageSize,
      count,
      data: data.map((project) => toProjectDto(project)),
    };
  }

  async findOne(id: string, ownerId: string): Promise<ProjectDto> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: uuidToBuffer(id),
        ownerId: uuidToBuffer(ownerId),
      },
    });

    if (!project) {
      throw new ProjectNotFoundException();
    }

    return toProjectDto(project);
  }

  async update(id: string, ownerId: string, dto: UpdateProjectDto) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: uuidToBuffer(id),
        ownerId: uuidToBuffer(ownerId),
      },
    });

    if (project === null) {
      throw new ProjectNotFoundException();
    }

    try {
      return this.prisma.project
        .update({
          where: {
            id: uuidToBuffer(id),
          },
          data: {
            name: dto.name !== project.name ? dto.name : undefined,
            description:
              dto.description !== project.description
                ? dto.description
                : undefined,
            version: {
              increment: 1,
            },
          },
        })
        .then((updatedProject) => toProjectDto(updatedProject));
    } catch (e) {
      // TODO: Concurrency update check
      console.error(e);
      throw new UnprocessableEntityException(e);
    }
  }

  async remove(id: string, ownerId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: uuidToBuffer(id),
        ownerId: uuidToBuffer(ownerId),
      },
      select: {
        id: true,
      },
    });

    if (!project) {
      throw new ProjectNotFoundException();
    }

    const deleteSections = this.prisma.section.deleteMany({
      where: {
        projectId: project.id,
      },
    });

    const deleteTasks = this.prisma.task.deleteMany({
      where: {
        projectId: project.id,
      },
    });

    const deleteProject = this.prisma.project.delete({
      where: {
        id: project.id,
      },
    });

    try {
      const [deleteTasksResult, deleteSectionsResult, _] =
        await this.prisma.$transaction([
          deleteTasks,
          deleteSections,
          deleteProject,
        ]);
      console.log(`Deleted ${deleteTasksResult.count} tasks`);
      console.log(`Deleted ${deleteSectionsResult.count} sections`);
      console.log(`Deleted project ${id}; owner ${ownerId}`);
    } catch (e) {
      console.error(e);
      throw new UnprocessableEntityException(e);
    }
  }
}
