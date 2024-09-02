import { Injectable } from '@nestjs/common';
import { PageResponse } from '../../core/model/page-response.model';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectNotFoundException } from '../projects/exception/project-not-found.exception';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { BoardNotFoundException } from './exceptions/Board-not-found.exception';
import { BoardModel } from './models/Board.model';

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBoardDto): Promise<BoardModel> {
    const projectCount = await this.prisma.workspace.count({
      where: {
        id: Buffer.from(dto.workspaceId),
      },
    });

    if (projectCount === 0) {
      throw new ProjectNotFoundException();
    }

    const Board = await this.prisma.board.create({
      data: {
        name: dto.name,
        description: dto.description,
        workspaceId: Buffer.from(dto.workspaceId),
      },
    });

    return {
      ...Board,
      id: Board.id.toString(),
      workspaceId: Board.workspaceId.toString(),
    };
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
      data: data.map((board) => ({
        ...board,
        id: board.id.toString(),
        workspaceId: board.workspaceId.toString(),
      })),
    };
  }

  async findOne(id: string): Promise<BoardModel> {
    const Board = await this.prisma.board.findUnique({
      where: {
        id: Buffer.from(id),
      },
    });

    if (!Board) {
      throw new BoardNotFoundException();
    }

    return {
      ...Board,
      id: Board.id.toString(),
      workspaceId: Board.workspaceId.toString(),
    };
  }

  async update(id: string, dto: UpdateBoardDto): Promise<BoardModel> {
    const Board = await this.prisma.board.findUnique({
      where: {
        id: Buffer.from(id),
      },
    });

    if (!Board) {
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
      .then((board) => ({
        ...board,
        id: board.id.toString(),
        workspaceId: board.workspaceId.toString(),
      }));
  }

  async remove(id: string): Promise<void> {
    const Board = await this.prisma.board.delete({
      where: {
        id: Buffer.from(id),
      },
    });

    if (!Board) {
      throw new BoardNotFoundException();
    }
  }
}
