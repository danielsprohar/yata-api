import { Injectable } from '@nestjs/common';
import { PageResponse } from '../../core/model/page-response.model';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectNotFoundException } from '../projects/exception/project-not-found.exception';
import { CreateKanbanColumnDto } from './dto/create-kanban-column.dto';
import { UpdateKanbanDto } from './dto/update-kanban-column.dto';
import { KanbanColumnNotFoundException } from './exceptions/kanban-column-not-found.exception';
import { KanbanColumnModel } from './models/kanban-column.model';

@Injectable()
export class KanbanService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateKanbanColumnDto): Promise<KanbanColumnModel> {
    const projectCount = await this.prisma.project.count({
      where: {
        id: Buffer.from(dto.projectId),
      },
    });

    if (projectCount === 0) {
      throw new ProjectNotFoundException();
    }

    const kanbanColumn = await this.prisma.kanbanColumn.create({
      data: {
        name: dto.name,
        description: dto.description,
        position: dto.position,
        projectId: Buffer.from(dto.projectId),
      },
    });

    return {
      ...kanbanColumn,
      id: kanbanColumn.id.toString(),
      projectId: kanbanColumn.projectId.toString(),
    };
  }

  async findAll(
    page: number,
    pageSize: number,
    projectId?: string,
  ): Promise<PageResponse<KanbanColumnModel>> {
    const [data, count] = await Promise.all([
      this.prisma.kanbanColumn.findMany({
        skip: page * pageSize,
        take: Math.min(pageSize, 50),
        where: {
          projectId: projectId ? Buffer.from(projectId) : undefined,
        },
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
        projectId: project.projectId.toString(),
      })),
    };
  }

  async findOne(id: string): Promise<KanbanColumnModel> {
    const kanbanColumn = await this.prisma.kanbanColumn.findUnique({
      where: {
        id: Buffer.from(id),
      },
    });

    if (!kanbanColumn) {
      throw new KanbanColumnNotFoundException();
    }

    return {
      ...kanbanColumn,
      id: kanbanColumn.id.toString(),
      projectId: kanbanColumn.projectId.toString(),
    };
  }

  async update(id: string, dto: UpdateKanbanDto): Promise<KanbanColumnModel> {
    const kanbanColumn = await this.prisma.kanbanColumn.findUnique({
      where: {
        id: Buffer.from(id),
      },
    });

    if (!kanbanColumn) {
      throw new KanbanColumnNotFoundException();
    }

    return this.prisma.kanbanColumn
      .update({
        where: {
          id: Buffer.from(id),
        },
        data: {
          name: dto.name,
          description: dto.description,
          position: dto.position,
          projectId: dto.projectId ? Buffer.from(dto.projectId) : undefined,
        },
      })
      .then((updatedKanbanColumn) => ({
        ...updatedKanbanColumn,
        id: updatedKanbanColumn.id.toString(),
        projectId: updatedKanbanColumn.projectId.toString(),
      }));
  }

  async remove(id: string): Promise<void> {
    const kanbanColumn = await this.prisma.kanbanColumn.delete({
      where: {
        id: Buffer.from(id),
      },
    });

    if (!kanbanColumn) {
      throw new KanbanColumnNotFoundException();
    }
  }
}
