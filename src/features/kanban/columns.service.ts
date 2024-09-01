import { Injectable } from '@nestjs/common';
import { PageResponse } from '../../core/model/page-response.model';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectNotFoundException } from '../projects/exception/project-not-found.exception';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { ColumnNotFoundException } from './exceptions/column-not-found.exception';
import { ColumnModel } from './models/column.model';

@Injectable()
export class ColumnsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateColumnDto): Promise<ColumnModel> {
    const projectCount = await this.prisma.project.count({
      where: {
        id: Buffer.from(dto.boardId),
      },
    });

    if (projectCount === 0) {
      throw new ProjectNotFoundException();
    }

    const column = await this.prisma.column.create({
      data: {
        name: dto.name,
        description: dto.description,
        position: dto.position,
        boardId: Buffer.from(dto.boardId),
      },
    });

    return {
      ...column,
      id: column.id.toString(),
      boardId: column.boardId.toString(),
    };
  }

  async findAll(
    page: number,
    pageSize: number,
    boardId?: string,
  ): Promise<PageResponse<ColumnModel>> {
    const [data, count] = await Promise.all([
      this.prisma.column.findMany({
        skip: page * pageSize,
        take: Math.min(pageSize, 50),
        where: {
          boardId: boardId ? Buffer.from(boardId) : undefined,
        },
      }),
      this.prisma.project.count(),
    ]);

    return {
      page,
      pageSize,
      count,
      data: data.map((column) => ({
        ...column,
        id: column.id.toString(),
        boardId: column.boardId.toString(),
      })),
    };
  }

  async findOne(id: string): Promise<ColumnModel> {
    const column = await this.prisma.column.findUnique({
      where: {
        id: Buffer.from(id),
      },
    });

    if (!column) {
      throw new ColumnNotFoundException();
    }

    return {
      ...column,
      id: column.id.toString(),
      boardId: column.boardId.toString(),
    };
  }

  async update(id: string, dto: UpdateColumnDto): Promise<ColumnModel> {
    const column = await this.prisma.column.findUnique({
      where: {
        id: Buffer.from(id),
      },
    });

    if (!column) {
      throw new ColumnNotFoundException();
    }

    return this.prisma.column
      .update({
        where: {
          id: Buffer.from(id),
        },
        data: {
          name: dto.name,
          description: dto.description,
          position: dto.position,
          boardId: dto.boardId ? Buffer.from(dto.boardId) : undefined,
        },
      })
      .then((updatedColumn) => ({
        ...updatedColumn,
        id: updatedColumn.id.toString(),
        boardId: updatedColumn.boardId.toString(),
      }));
  }

  async remove(id: string): Promise<void> {
    const column = await this.prisma.column.delete({
      where: {
        id: Buffer.from(id),
      },
    });

    if (!column) {
      throw new ColumnNotFoundException();
    }
  }
}
