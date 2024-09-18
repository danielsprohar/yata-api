import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { Prisma, TaskStatus } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { PageResponse } from "../../core/model/page-response.model";
import { generatePrimaryKey, uuidToBuffer } from "../../core/utils/uuid.util";
import { PrismaService } from "../../prisma/prisma.service";
import { ProjectNotFoundException } from "../projects/exception/project-not-found.exception";
import { CreateTaskDto } from "./dto/create-task.dto";
import { TaskQueryParams } from "./dto/task-query-params.dto";
import { TaskDto, toTaskDto } from "./dto/task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { TaskPriority } from "./enums/task-priority.enum";
import { TaskNotFoundException } from "./exception/task-not-found.expection";

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTaskDto, ownerId: string): Promise<TaskDto> {
    const ownerIdBuffer = uuidToBuffer(ownerId);

    if (dto.parentId) {
      const parentTaskCount = await this.prisma.task.count({
        where: {
          id: uuidToBuffer(dto.parentId),
          ownerId: ownerIdBuffer,
        },
      });

      if (parentTaskCount === 0) {
        throw new TaskNotFoundException();
      }
    }

    try {
      const task = await this.prisma.task.create({
        data: {
          id: generatePrimaryKey(),
          title: dto.title,
          description: dto.description,
          status: dto.status,
          dueDate: dto.dueDate,
          priority: dto.priority,
          workspaceId: uuidToBuffer(dto.workspaceId),
          ownerId: ownerIdBuffer,
          projectId: uuidToBuffer(dto.projectId),
          sectionId: dto.sectionId ? uuidToBuffer(dto.sectionId) : undefined,
          parentId: dto.parentId ? uuidToBuffer(dto.parentId) : undefined,
        },
      });

      return toTaskDto(task);
    } catch (e) {
      console.error(e);
      // @see https://www.prisma.io/docs/orm/reference/error-reference#p2003
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === "P2003") {
          throw new ProjectNotFoundException();
        }
      }

      throw new UnprocessableEntityException("Could not create the task");
    }
  }

  async fetch(
    params: TaskQueryParams,
    ownerId: string,
  ): Promise<PageResponse<TaskDto>> {
    const page = Math.max(+params.page || 0, 0);
    const pageSize = Math.min(+params.pageSize || 10, 50);
    const {
      status,
      priority,
      from,
      to,
      projectId,
      workspaceId,
      dir,
      parentId,
    } = params;

    const filters: Prisma.TaskWhereInput[] = [
      {
        ownerId: uuidToBuffer(ownerId),
      },
    ];

    if (from && to) {
      filters.push({
        dueDate: {
          gte: new Date(from),
          lte: new Date(to),
        },
      });
    } else if (from) {
      filters.push({
        dueDate: {
          gte: from,
        },
      });
    } else if (to) {
      filters.push({
        dueDate: {
          lte: to,
        },
      });
    }

    if (projectId) {
      filters.push({
        projectId: uuidToBuffer(projectId),
      });
    }
    if (workspaceId) {
      filters.push({
        workspaceId: uuidToBuffer(workspaceId),
      });
    }
    if (parentId) {
      filters.push({
        parentId: uuidToBuffer(parentId),
      });
    }
    if (priority) {
      filters.push({
        priority: {
          in: priority.split(",") as TaskPriority[],
        },
      });
    }
    if (status) {
      filters.push({
        status: {
          in: status.split(",") as TaskStatus[],
        },
      });
    }

    const whereClause = {
      AND: filters,
    };
    const [data, count] = await Promise.all([
      this.prisma.task.findMany({
        skip: page * pageSize,
        take: pageSize,
        where: whereClause,
        orderBy: {
          createdAt: dir === "asc" ? "asc" : "desc",
        },
      }),
      this.prisma.task.count({
        where: whereClause,
      }),
    ]);

    return {
      page,
      pageSize,
      count,
      data: data.map((task) => toTaskDto(task)),
    };
  }

  async findOne(id: string, ownerId: string): Promise<TaskDto> {
    const task = await this.prisma.task.findFirst({
      where: {
        id: uuidToBuffer(id),
        ownerId: uuidToBuffer(ownerId),
      },
      include: {
        subtasks: true,
      },
    });

    if (!task) {
      throw new TaskNotFoundException();
    }

    return toTaskDto(task);
  }

  async update(
    id: string,
    ownerId: string,
    dto: UpdateTaskDto,
  ): Promise<TaskDto> {
    const task = await this.prisma.task.findFirst({
      where: {
        id: uuidToBuffer(id),
        ownerId: uuidToBuffer(ownerId),
      },
    });

    if (!task) {
      throw new TaskNotFoundException();
    }

    try {
      return this.prisma.task
        .update({
          where: {
            id: uuidToBuffer(id),
          },
          data: {
            version: task.version + 1,
            title: dto.title,
            description: dto.description,
            status: dto.status,
            dueDate: dto.dueDate,
            priority: dto.priority,
            workspaceId: dto.workspaceId
              ? uuidToBuffer(dto.workspaceId)
              : undefined,
            projectId: dto.projectId ? uuidToBuffer(dto.projectId) : undefined,
            parentId: dto.parentId ? uuidToBuffer(dto.parentId) : undefined,
            sectionId: dto.sectionId ? uuidToBuffer(dto.sectionId) : undefined,
            startedAt:
              dto.status === TaskStatus.IN_PROGRESS ? new Date() : undefined,
            completedAt:
              dto.status === TaskStatus.COMPLETED ? new Date() : undefined,
          },
        })
        .then((updatedTask) => toTaskDto(updatedTask));
    } catch (e) {
      // TODO: Concurrency update check
      console.error(e);
      throw new UnprocessableEntityException("Could not update the task");
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    const task = await this.prisma.task.delete({
      where: {
        id: uuidToBuffer(id),
        ownerId: uuidToBuffer(userId),
      },
    });

    if (!task) {
      throw new TaskNotFoundException();
    }
  }
}
