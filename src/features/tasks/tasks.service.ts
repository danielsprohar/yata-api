import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { Prisma, TaskStatus } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { PageResponse } from "../../core/model/page-response.model";
import { generatePrimaryKey, uuidToBuffer } from "../../core/utils/uuid.util";
import { PrismaService } from "../../prisma/prisma.service";
import { ProjectNotFoundException } from "../projects/exception/project-not-found.exception";
import { CreateTaskDto } from "./dto/create-task.dto";
import { TaskQueryParams } from "./dto/task-query-params.dto";
import { TaskDto, toTaskDto } from "./dto/task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { TaskNotFoundException } from "./exception/task-not-found.expection";

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTaskDto): Promise<TaskDto> {
    if (dto.parentId) {
      const parentTaskCount = await this.prisma.task.count({
        where: {
          id: uuidToBuffer(dto.parentId),
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
          name: dto.name,
          description: dto.description,
          status: dto.status,
          dueDate: dto.dueDate,
          priority: dto.priority,
          workspaceId: uuidToBuffer(dto.workspaceId),
          projectId: uuidToBuffer(dto.projectId),
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

  async findAll(
    page: number,
    pageSize: number,
    params: TaskQueryParams,
  ): Promise<PageResponse<TaskDto>> {
    console.log("params", params);
    const {
      status,
      from,
      to,
      projectId,
      workspaceId,
      dir,
      parentId,
      priority,
    } = params;

    const filters: Prisma.TaskWhereInput[] = [];
    console.log("from", from);
    console.log("to", to);

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
        priority: priority,
      });
    }
    if (status) {
      filters.push({
        status: status,
      });
    }

    const [data, count] = await Promise.all([
      this.prisma.task.findMany({
        skip: page * pageSize,
        take: Math.min(+pageSize, 50),
        where: {
          AND: filters,
        },
        orderBy: {
          createdAt: dir === "asc" ? "asc" : "desc",
        },
      }),
      this.prisma.task.count({
        where: {
          AND: filters,
        },
      }),
    ]);

    return {
      page,
      pageSize,
      count,
      data: data.map((task) => toTaskDto(task)),
    };
  }

  async findOne(id: string): Promise<TaskDto> {
    const task = await this.prisma.task.findUnique({
      where: {
        id: uuidToBuffer(id),
      },
      include: {
        subtasks: true,
      },
    });

    if (!task) {
      throw new TaskNotFoundException();
    }

    return {
      ...toTaskDto(task),
      subTasks: task.subtasks.map((subTask) => toTaskDto(subTask)),
    };
  }

  async update(id: string, dto: UpdateTaskDto): Promise<TaskDto> {
    const task = await this.prisma.task.findUnique({
      where: {
        id: uuidToBuffer(id),
      },
    });

    if (!task) {
      throw new TaskNotFoundException();
    }

    return this.prisma.task
      .update({
        where: {
          id: uuidToBuffer(id),
        },
        data: {
          name: dto.name,
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
  }

  async remove(id: string): Promise<void> {
    const task = await this.prisma.task.delete({
      where: {
        id: uuidToBuffer(id),
      },
    });

    if (!task) {
      throw new TaskNotFoundException();
    }
  }
}
