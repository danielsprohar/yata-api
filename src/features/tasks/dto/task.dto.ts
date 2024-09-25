import { Task } from "@prisma/client";
import { bufferToUuid } from "../../../core/utils/uuid.util";
import { TagDto } from "../../tags/dto/tag.dto";

export interface TaskDto
  extends Omit<
    Task,
    | "id"
    | "workspaceId"
    | "projectId"
    | "parentId"
    | "sectionId"
    | "ownerId"
    | "tags"
    | "subtasks"
  > {
  id: string;
  workspaceId: string;
  ownerId: string;
  projectId?: string;
  parentId?: string;
  sectionId?: string;
  tags?: TagDto[];
  subtasks?: TaskDto[];
}

export function toTaskDto(task: Task): TaskDto {
  return {
    id: bufferToUuid(task.id),
    ownerId: bufferToUuid(task.ownerId),
    workspaceId: bufferToUuid(task.workspaceId),
    projectId: bufferToUuid(task.projectId),
    sectionId: task.sectionId ? bufferToUuid(task.sectionId) : undefined,
    parentId: task.parentId ? bufferToUuid(task.parentId) : undefined,
    allDay: task.allDay,
    completed: task.completed,
    completedAt: task.completedAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    description: task.description,
    dueDate: task.dueDate,
    priority: task.priority,
    rrule: task.rrule,
    startedAt: task.startedAt ? new Date(task.startedAt) : null,
    status: task.status,
    title: task.title,
    version: task.version,
  };
}
