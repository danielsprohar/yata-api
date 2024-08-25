import { Injectable } from '@nestjs/common';
import { Prisma, Task } from '@prisma/client';
import { QueryParams } from '../dto/query-params.dto';
import { PageResponse } from '../core/models/page-response.model';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  db() {
    return this.prisma;
  }

  async create(args: Prisma.TaskCreateArgs): Promise<Task> {
    return await this.prisma.task.create(args);
  }

  async duplicate(taskId: number) {
    const task = await this.prisma.task.findFirstOrThrow({
      where: { id: taskId },
    });
    const subtasks = await this.prisma.task.findMany({
      where: {
        parentId: taskId,
      },
    });
    const tags = await this.prisma.tag.findMany({
      select: {
        id: true,
      },
      where: {
        tasks: {
          some: {
            id: taskId,
          },
        },
      },
    });

    delete task.id;
    subtasks.forEach((subtask) => delete subtask.id && delete subtask.parentId);

    return await this.prisma.task.create({
      data: {
        ...task,
        subtasks: {
          createMany: {
            data: subtasks,
          },
        },
        tags: {
          connect: tags,
        },
      },
    });
  }

  async findAll(params: {
    skip: number;
    take: number;
    cursor?: Prisma.TaskWhereUniqueInput;
    where?: Prisma.TaskWhereInput;
    orderBy?: Prisma.TaskOrderByWithRelationInput;
    include?: Prisma.TaskInclude;
  }): Promise<PageResponse<Task>> {
    const count = await this.prisma.task.count({
      where: params.where,
    });

    const { skip, take } = params;
    const tasks = await this.prisma.task.findMany({
      where: params.where,
      include: params.include,
      skip,
      take: Math.min(take, QueryParams.MAX_TAKE),
      orderBy: params.orderBy,
    });

    // Remove undefined and null fields
    tasks.forEach((task) => {
      Object.keys(task).forEach((key) => task[key] == null && delete task[key]);
      if (task.subtasks && task.subtasks.length) {
        task.subtasks.forEach((subtask) => {
          Object.keys(subtask).forEach(
            (key) => subtask[key] == null && delete subtask[key],
          );
        });
      }
    });

    return {
      page: params.skip,
      pageSize: params.take,
      count,
      data: tasks,
    };
  }

  async findOne(args: Prisma.TaskFindFirstArgs): Promise<Task> {
    return await this.prisma.task.findFirst(args);
  }

  async update(args: Prisma.TaskUpdateArgs): Promise<Task> {
    return await this.prisma.task.update(args);
  }

  async updateMany(args: Prisma.TaskUpdateManyArgs) {
    return await this.prisma.task.updateMany(args);
  }

  async remove(args: Prisma.TaskDeleteArgs): Promise<Task> {
    return await this.prisma.task.delete(args);
  }

  async exists(args: Prisma.TaskCountArgs) {
    const count = await this.prisma.task.count(args);
    return count > 0;
  }
}
