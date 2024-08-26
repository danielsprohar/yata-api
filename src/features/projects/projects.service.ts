import { Injectable } from '@nestjs/common';
import { PageResponse } from '../../core/model/page-response.model';
import { generateId } from '../../core/utils/uuid.util';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspaceNotFoundException } from '../workspaces/exception/workspace-not-found.exception';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectNotFoundException } from './exception/project-not-found.exception';
import { ProjectModel } from './model/project.model';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto): Promise<ProjectModel> {
    const workspaceCount = await this.prisma.workspace.count({
      where: {
        id: Buffer.from(createProjectDto.workspaceId),
      },
    });

    if (workspaceCount === 0) {
      throw new WorkspaceNotFoundException();
    }

    const project = await this.prisma.project.create({
      data: {
        id: generateId(),
        name: createProjectDto.name,
        description: createProjectDto.description,
        status: createProjectDto.status ?? 'NOT_STARTED',
        workspaceId: Buffer.from(createProjectDto.workspaceId),
      },
    });
    return {
      ...project,
      id: project.id.toString(),
      workspaceId: project.workspaceId.toString(),
    };
  }

  async findAll(
    page: number,
    pageSize: number,
  ): Promise<PageResponse<ProjectModel>> {
    const [data, count] = await Promise.all([
      this.prisma.project.findMany({
        skip: page * pageSize,
        take: Math.min(pageSize, 50),
      }),
      this.prisma.project.count(),
    ]);

    return {
      page,
      pageSize,
      count,
      data: data.map((project) => ({
        ...project,
        id: project.id.toString(),
        workspaceId: project.workspaceId.toString(),
      })),
    };
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: Buffer.from(id),
      },
    });

    if (!project) {
      throw new ProjectNotFoundException();
    }

    return {
      ...project,
      id: project.id.toString(),
      workspaceId: project.workspaceId.toString(),
    };
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: Buffer.from(id),
      },
    });

    if (!project) {
      throw new ProjectNotFoundException();
    }

    return this.prisma.project
      .update({
        where: {
          id: Buffer.from(id),
        },
        data: {
          name: updateProjectDto.name,
          description: updateProjectDto.description,
          status: updateProjectDto.status,
        },
      })
      .then((updatedProject) => ({
        ...updatedProject,
        id: updatedProject.id.toString(),
        workspaceId: updatedProject.workspaceId.toString(),
      }));
  }

  async remove(id: string) {
    const project = await this.prisma.project.delete({
      where: {
        id: Buffer.from(id),
      },
    });

    if (!project) {
      throw new ProjectNotFoundException();
    }
  }
}
