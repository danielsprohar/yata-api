import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { Board } from '@prisma/client';
import { PageResponse } from '../../core/model/page-response.model';
import { generateId } from '../../core/utils/uuid.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { BoardNotFoundException } from './exceptions/board-not-found.exception';
import { BoardModel } from './models/board.model';

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  private toBoardModel(board: Board): BoardModel {
    return {
      ...board,
      id: board.id.toString(),
      workspaceId: board.workspaceId.toString(),
    };
  }

  async create(dto: CreateBoardDto): Promise<BoardModel> {
    const workspaceId = Buffer.from(dto.workspaceId);

    try {
      const board = await this.prisma.board.create({
        data: {
          id: generateId(),
          name: dto.name,
          description: dto.description,
          workspaceId,
        },
      });

      return this.toBoardModel(board);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new BoardNotFoundException();
      }
      throw new UnprocessableEntityException(error);
    }
  }

  async findAll(
    page: number,
    pageSize: number,
    workspaceId?: string,
  ): Promise<PageResponse<BoardModel>> {
    const [data, count] = await Promise.all([
      this.prisma.board.findMany({
        skip: page * pageSize,
        take: Math.min(pageSize, 50),
        where: {
          workspaceId: workspaceId ? Buffer.from(workspaceId) : undefined,
        },
      }),
      this.prisma.board.count(),
    ]);

    return {
      page,
      pageSize,
      count,
      data: data.map(this.toBoardModel),
    };
  }

  async findOne(id: string): Promise<BoardModel> {
    const board = await this.prisma.board.findUnique({
      where: {
        id: Buffer.from(id),
      },
    });

    if (!board) {
      throw new BoardNotFoundException();
    }

    return this.toBoardModel(board);
  }

  async update(id: string, dto: UpdateBoardDto): Promise<BoardModel> {
    const board = await this.prisma.board.findUnique({
      where: {
        id: Buffer.from(id),
      },
    });

    if (!board) {
      throw new BoardNotFoundException();
    }

    return this.prisma.board
      .update({
        where: {
          id: Buffer.from(id),
        },
        data: {
          name: dto.name,
          description: dto.description,
          workspaceId: dto.workspaceId
            ? Buffer.from(dto.workspaceId)
            : undefined,
        },
      })
      .then((board) => this.toBoardModel(board));
  }

  async remove(id: string): Promise<void> {
    const board = await this.prisma.board.delete({
      where: {
        id: Buffer.from(id),
      },
    });

    if (!board) {
      throw new BoardNotFoundException();
    }
  }
}
