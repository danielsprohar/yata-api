import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { Column } from '@prisma/client';
import { PageResponse } from '../../core/model/page-response.model';
import { generateId } from '../../core/utils/uuid.util';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectNotFoundException } from '../projects/exception/project-not-found.exception';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { ColumnNotFoundException } from './exceptions/column-not-found.exception';
import { ColumnModel } from './models/column.model';

@Injectable()
export class ColumnsService {
  constructor(private readonly prisma: PrismaService) {}

  private toColumnModel(column: Column): ColumnModel {
    return {
      ...column,
      id: column.id.toString(),
      boardId: column.boardId.toString(),
    };
  }

  async create(dto: CreateColumnDto): Promise<ColumnModel> {
    const boardId = Buffer.from(dto.boardId);
    try {
      const column = await this.prisma.column.create({
        data: {
          id: generateId(),
          name: dto.name,
          description: dto.description,
          position: dto.position,
          boardId,
        },
      });

      return this.toColumnModel(column);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new ProjectNotFoundException();
      }
      throw new UnprocessableEntityException(error);
    }
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
      this.prisma.column.count(),
    ]);

    return {
      page,
      pageSize,
      count,
      data: data.map(this.toColumnModel),
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

    return this.toColumnModel(column);
  }

  async update(id: string, dto: UpdateColumnDto): Promise<ColumnModel> {
    try {
      const column = await this.prisma.column.update({
        where: {
          id: Buffer.from(id),
        },
        data: {
          name: dto.name,
          description: dto.description,
          position: dto.position,
          boardId: dto.boardId ? Buffer.from(dto.boardId) : undefined,
        },
      });

      return this.toColumnModel(column);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new ColumnNotFoundException();
      }
      throw new UnprocessableEntityException(error);
    }
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
