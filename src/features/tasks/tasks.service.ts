import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { Prisma, TaskStatus } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { PrismaErrorCodes } from "../../core/errors/prisma-error-codes";
import { PageResponse } from "../../core/model/page-response.model";
import {
  bufferToUuid,
  generatePrimaryKey,
  uuidToBuffer,
} from "../../core/utils/uuid.util";
import { PrismaService } from "../../prisma/prisma.service";
import { ProjectNotFoundException } from "../projects/exception/project-not-found.exception";
import { TagDto, toTagDto, toTagsArrayDto } from "../tags/dto/tag.dto";
import { CreateTaskDto } from "./dto/create-task.dto";
import { TaskQueryParams } from "./dto/task-query-params.dto";
import { TaskDto, toTaskDto } from "./dto/task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { TaskPriority } from "./enums/task-priority.enum";
import { TaskNotFoundException } from "./exception/task-not-found.expection";

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  // =============================================================
  // Tags
  // =============================================================

  /**
   * Add a tag to a task
   * @param dto
   * @returns
   */
  async addTags(
    taskId: string,
    ownerId: string,
    tagNames: string[],
  ): Promise<TagDto[]> {
    const tagId = generatePrimaryKey();
    const taskIdBuffer = uuidToBuffer(taskId);
    const ownerIdBuffer = uuidToBuffer(ownerId);

    try {
      await this.prisma.task.update({
        data: {
          tags: {
            create: tagNames.map((name) => ({
              id: tagId,
              name: name,
              ownerId: ownerIdBuffer,
            })),
          },
        },
        where: {
          id: taskIdBuffer,
        },
        select: {
          allDay: true,
        },
      });

      const tags = await this.prisma.tag.findMany({
        where: {
          tasks: {
            every: {
              id: taskIdBuffer,
            },
          },
        },
        skip: 0,
        take: 100,
      });

      return tags.map((tag) => toTagDto(tag));
    } catch (e) {
      console.error(e);
      throw new UnprocessableEntityException("Could not add the tag");
    }
  }

  /**
   * Add an existing tag to a task
   * @param taskId
   * @param tagIds
   * @param ownerId
   * @returns
   */
  async connectTags(taskId: string, tagIds: string[]): Promise<TagDto[]> {
    const taskIdBuffer = uuidToBuffer(taskId);

    try {
      await this.prisma.task.update({
        data: {
          tags: {
            connect: tagIds.map((tagId) => ({
              id: uuidToBuffer(tagId),
            })),
          },
        },
        where: {
          id: taskIdBuffer,
        },
        select: {
          allDay: true,
        },
      });

      const tags = await this.prisma.tag.findMany({
        where: {
          tasks: {
            every: {
              id: taskIdBuffer,
            },
          },
        },
        skip: 0,
        take: 100,
      });

      return tags.map((tag) => toTagDto(tag));
    } catch (e) {
      console.error(e);
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === PrismaErrorCodes.RECORD_NOT_FOUND) {
          throw new TaskNotFoundException();
        }
      }
      throw new UnprocessableEntityException("Could not connect the tag");
    }
  }

  async commitTags(
    taskId: string,
    ownerId: string,
    newTagNames: string[],
    tagIds: string[],
  ): Promise<TagDto[]> {
    const taskIdBuffer = uuidToBuffer(taskId);
    const ownerIdBuffer = uuidToBuffer(ownerId);

    try {
      await this.prisma.task.update({
        data: {
          tags: {
            connect: tagIds.map((tagId) => ({
              id: uuidToBuffer(tagId),
            })),
            create: newTagNames.map((name) => ({
              id: generatePrimaryKey(),
              name: name,
              ownerId: ownerIdBuffer,
            })),
          },
        },
        where: {
          id: taskIdBuffer,
        },
        select: {
          allDay: true,
        },
      });

      const tags = await this.prisma.tag.findMany({
        where: {
          tasks: {
            every: {
              id: taskIdBuffer,
            },
          },
        },
        skip: 0,
        take: 100,
      });

      return tags.map((tag) => toTagDto(tag));
    } catch (e) {
      console.error(e);
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === PrismaErrorCodes.RECORD_NOT_FOUND) {
          throw new TaskNotFoundException();
        }
      }
      throw new UnprocessableEntityException("Could not connect the tag");
    }
  }

  /**
   * Remove a tag from a task
   * @param taskId
   * @param tagId
   * @param ownerId
   * @returns
   */
  async removeTag(taskId: string, tagId: string): Promise<void> {
    const taskIdBuffer = uuidToBuffer(taskId);
    const tagIdBuffer = uuidToBuffer(tagId);

    try {
      await this.prisma.task.update({
        data: {
          tags: {
            disconnect: {
              id: tagIdBuffer,
            },
          },
        },
        where: {
          id: taskIdBuffer,
        },
        select: {
          allDay: true,
        },
      });
    } catch (e) {
      console.error(e);
      if (e instanceof PrismaClientKnownRequestError) {
        if (
          e.code === PrismaErrorCodes.RECORD_NOT_FOUND ||
          e.code === PrismaErrorCodes.RECORD_REQUIRED_BUT_NOT_FOUND
        ) {
          throw new TaskNotFoundException();
        }
      }
      throw new UnprocessableEntityException("Could not remove the tag");
    }
  }

  // =============================================================
  // Tasks
  // =============================================================

  async create(dto: CreateTaskDto, ownerId: string): Promise<TaskDto> {
    if (dto.tags && dto.tags.length > 0) {
      return this.createTaskWithTags(ownerId, dto);
    }

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

  async createTaskWithTags(ownerId: string, dto: CreateTaskDto) {
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

    const tags: string[] = dto.tags || [];

    try {
      const task = await this.prisma.task.create({
        include: {
          tags: true,
        },
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
          tags: {
            create: tags.map((tag) => ({
              name: tag,
              ownerId: ownerIdBuffer,
              id: generatePrimaryKey(),
            })),
          },
        },
      });

      return {
        ...toTaskDto(task),
        tags: task.tags.map((tag) => toTagDto(tag)),
      };
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

  async findMany(
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
      lt,
      gt,
      projectId,
      workspaceId,
      dir,
      parentId,
    } = params;

    const filters: Prisma.TaskWhereInput[] = [
      {
        ownerId: uuidToBuffer(ownerId),
        parentId: null, // Do not flatten the subtasks
      },
    ];

    if (from && to) {
      filters.push({
        dueDate: {
          gte: new Date(from),
          lte: new Date(to),
        },
      });
    } else if (gt && lt) {
      filters.push({
        dueDate: {
          gt: new Date(gt),
          lt: new Date(lt),
        },
      });
    } else if (gt) {
      filters.push({
        dueDate: {
          gt: new Date(gt),
        },
      });
    } else if (lt) {
      filters.push({
        dueDate: {
          lt: new Date(lt),
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
        include: {
          subtasks: true,
          tags: true,
        },
      }),
      this.prisma.task.count({
        where: whereClause,
      }),
    ]);

    const tasks: TaskDto[] = data.map((task) => ({
      ...toTaskDto(task),
      tags: task.tags ? toTagsArrayDto(task.tags) : [],
      subtasks: task.subtasks
        ? task.subtasks.map((subtask) => ({
            ...toTaskDto(subtask),
            id: bufferToUuid(subtask.id),
          }))
        : [],
    }));

    return {
      page,
      pageSize,
      count,
      data: tasks,
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
        tags: true,
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
      const updatedTaskData: Prisma.TaskUncheckedUpdateInput = {
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
      };

      return this.prisma.task
        .update({
          where: {
            id: uuidToBuffer(id),
          },
          data: updatedTaskData,
        })
        .then((updatedTask) => toTaskDto(updatedTask));
    } catch (e) {
      // TODO: Concurrency update check
      console.error(e);
      throw new UnprocessableEntityException("Could not update the task");
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    let result: Prisma.BatchPayload;

    try {
      result = await this.prisma.task.deleteMany({
        where: {
          id: uuidToBuffer(id),
          ownerId: uuidToBuffer(userId),
        },
      });
    } catch (e) {
      console.error(e);
      throw new UnprocessableEntityException("Could not delete the task");
    }

    if (result.count === 0) {
      throw new TaskNotFoundException();
    }
  }
}
