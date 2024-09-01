import { Injectable } from '@nestjs/common';
import { Prisma, TaskStatus } from '@prisma/client';
import { PageResponse } from '../../core/model/page-response.model';
import { generateId } from '../../core/utils/uuid.util';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectNotFoundException } from '../projects/exception/project-not-found.exception';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskQueryParams } from './dto/task-query-params.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskNotFoundException } from './exception/task-not-found.expection';
import { taskModel, TaskModel } from './model/task.model';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTaskDto): Promise<TaskModel> {
    if (dto.parentId) {
      const parentTaskCount = await this.prisma.task.count({
        where: {
          id: Buffer.from(dto.parentId),
        },
      });

      if (parentTaskCount === 0) {
        throw new TaskNotFoundException();
      }
    }
    if (dto.projectId) {
      const projectCount = await this.prisma.project.count({
        where: {
          id: Buffer.from(dto.projectId),
        },
      });

      if (projectCount === 0) {
        throw new ProjectNotFoundException();
      }
    }
    if (dto.columnId) {
      const columnCount = await this.prisma.column.count({
        where: {
          id: Buffer.from(dto.columnId),
        },
      });

      // TODO: Replace this with ColumnNotFoundException
      if (columnCount === 0) {
        throw new TaskNotFoundException();
      }
    }

    const task = await this.prisma.task.create({
      data: {
        id: generateId(),
        name: dto.name,
        description: dto.description,
        status: dto.status,
        dueDate: dto.dueDate,
        priority: dto.priority,
        workspaceId: Buffer.from(dto.workspaceId),
        projectId: dto.projectId ? Buffer.from(dto.projectId) : undefined,
        columnId: dto.columnId ? Buffer.from(dto.columnId) : undefined,
        parentId: dto.parentId ? Buffer.from(dto.parentId) : undefined,
      },
    });

    return taskModel(task);
  }

  async findAll(params: TaskQueryParams): Promise<PageResponse<TaskModel>> {
    const {
      status,
      from,
      to,
      projectId,
      workspaceId,
      columnId,
      dir,
      parentId,
      priority,
    } = params;

    const page = parseInt(params.page, 10) || 0;
    const pageSize = parseInt(params.pageSize, 10) || 50;

    const taskFilter: Prisma.TaskWhereInput = {};
    if (from && to) {
      taskFilter['AND'] = {
        dueDate: {
          gte: from,
          lte: to,
        },
      };
    } else if (from) {
      taskFilter['dueDate'] = {
        gte: from,
      };
    } else if (to) {
      taskFilter['dueDate'] = {
        lte: to,
      };
    }

    if (projectId) {
      taskFilter['projectId'] = Buffer.from(projectId);
    }
    if (workspaceId) {
      taskFilter['project'] = {
        workspaceId: Buffer.from(workspaceId),
      };
    }
    if (columnId) {
      taskFilter['columnId'] = Buffer.from(columnId);
    }
    if (parentId) {
      taskFilter['parentId'] = Buffer.from(parentId);
    }
    if (priority) {
      taskFilter['priority'] = priority;
    }
    if (status) {
      taskFilter['status'] = status;
    }

    const [data, count] = await Promise.all([
      this.prisma.task.findMany({
        skip: page * pageSize,
        take: Math.min(+pageSize, 50),
        where: taskFilter,
        orderBy: {
          createdAt: dir === 'asc' ? 'asc' : 'desc',
        },
      }),
      this.prisma.task.count({
        where: taskFilter,
      }),
    ]);

    return {
      page,
      pageSize,
      count,
      data: data.map((task) => taskModel(task)),
    };
  }

  async findOne(id: string): Promise<TaskModel> {
    const task = await this.prisma.task.findUnique({
      where: {
        id: Buffer.from(id),
      },
      include: {
        subtasks: true,
      },
    });

    if (!task) {
      throw new TaskNotFoundException();
    }

    return {
      ...taskModel(task),
      subTasks: task.subtasks.map((subTask) => taskModel(subTask)),
    };
  }

  async update(id: string, dto: UpdateTaskDto): Promise<TaskModel> {
    const task = await this.prisma.task.findUnique({
      where: {
        id: Buffer.from(id),
      },
    });

    if (!task) {
      throw new TaskNotFoundException();
    }

    return this.prisma.task
      .update({
        where: {
          id: Buffer.from(id),
        },
        data: {
          name: dto.name,
          description: dto.description,
          status: dto.status,
          dueDate: dto.dueDate,
          priority: dto.priority,
          workspaceId: dto.workspaceId
            ? Buffer.from(dto.workspaceId)
            : undefined,
          projectId: dto.projectId ? Buffer.from(dto.projectId) : undefined,
          columnId: dto.columnId ? Buffer.from(dto.columnId) : undefined,
          parentId: dto.parentId ? Buffer.from(dto.parentId) : undefined,
          completedAt:
            dto.status === TaskStatus.COMPLETED ? new Date() : undefined,
        },
      })
      .then((updatedTask) => taskModel(updatedTask));
  }

  async remove(id: string): Promise<void> {
    const task = await this.prisma.task.delete({
      where: {
        id: Buffer.from(id),
      },
    });

    if (!task) {
      throw new TaskNotFoundException();
    }
  }
}
