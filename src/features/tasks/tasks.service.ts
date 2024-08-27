import { Injectable } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PageResponse } from '../../core/model/page-response.model';
import { generateId } from '../../core/utils/uuid.util';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectNotFoundException } from '../projects/exception/project-not-found.exception';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskNotFoundException } from './exception/task-not-found.expection';
import { TaskModel } from './model/task.model';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto): Promise<TaskModel> {
    const projectCount = await this.prisma.project.count({
      where: {
        id: Buffer.from(createTaskDto.projectId),
      },
    });

    if (projectCount === 0) {
      throw new ProjectNotFoundException();
    }

    if (createTaskDto.parentTaskId) {
      const parentTaskCount = await this.prisma.task.count({
        where: {
          id: Buffer.from(createTaskDto.parentTaskId),
        },
      });

      if (parentTaskCount === 0) {
        throw new TaskNotFoundException();
      }
    }

    const task = await this.prisma.task.create({
      data: {
        id: generateId(),
        name: createTaskDto.name,
        description: createTaskDto.description,
        status: createTaskDto.status,
        dueDate: createTaskDto.dueDate,
        priority: createTaskDto.priority,
        projectId: Buffer.from(createTaskDto.projectId),
        parentTaskId: createTaskDto.parentTaskId
          ? Buffer.from(createTaskDto.parentTaskId)
          : undefined,
      },
    });

    return {
      ...task,
      id: task.id.toString(),
      projectId: task.projectId.toString(),
      parentTaskId: task.parentTaskId?.toString(),
    };
  }

  async findAll(
    page: number,
    pageSize: number,
    projectId?: string,
    workspaceId?: string,
    status?: TaskStatus,
    from?: Date,
    to?: Date,
  ): Promise<PageResponse<TaskModel>> {
    const taskFilter = {
      status,
    };
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
    } else if (workspaceId) {
      taskFilter['project'] = {
        workspaceId: Buffer.from(workspaceId),
      };
    }

    const [data, count] = await Promise.all([
      this.prisma.task.findMany({
        skip: page * pageSize,
        take: Math.min(pageSize, 50),
        where: taskFilter,
      }),
      this.prisma.task.count(),
    ]);

    return {
      page,
      pageSize,
      count,
      data: data.map((task) => ({
        ...task,
        id: task.id.toString(),
        projectId: task.projectId.toString(),
        parentTaskId: task.parentTaskId?.toString(),
      })),
    };
  }

  async findOne(id: string): Promise<TaskModel> {
    const task = await this.prisma.task.findUnique({
      where: {
        id: Buffer.from(id),
      },
      include: {
        subTasks: true,
      },
    });

    if (!task) {
      throw new TaskNotFoundException();
    }

    return {
      ...task,
      id: task.id.toString(),
      projectId: task.projectId.toString(),
      parentTaskId: task.parentTaskId?.toString(),
      subTasks: task.subTasks.map((subTask) => ({
        ...subTask,
        id: subTask.id.toString(),
        projectId: subTask.projectId.toString(),
        parentTaskId: subTask.parentTaskId?.toString(),
      })),
    };
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<TaskModel> {
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
          name: updateTaskDto.name,
          description: updateTaskDto.description,
          status: updateTaskDto.status,
          dueDate: updateTaskDto.dueDate,
          priority: updateTaskDto.priority,
          projectId: updateTaskDto.projectId
            ? Buffer.from(updateTaskDto.projectId)
            : undefined,
          parentTaskId: updateTaskDto.parentTaskId
            ? Buffer.from(updateTaskDto.parentTaskId)
            : undefined,
          completedAt:
            updateTaskDto.status === TaskStatus.COMPLETED
              ? new Date()
              : undefined,
        },
      })
      .then((updatedTask) => ({
        ...updatedTask,
        id: updatedTask.id.toString(),
        projectId: updatedTask.projectId.toString(),
        parentTaskId: updatedTask.parentTaskId?.toString(),
      }));
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
