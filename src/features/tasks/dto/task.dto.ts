import { Task } from "@prisma/client";
import { bufferToUuid } from "../../../core/utils/uuid.util";
import { TagDto } from "./tag.dto";

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
    ...task,
    id: bufferToUuid(task.id),
    ownerId: bufferToUuid(task.ownerId),
    workspaceId: bufferToUuid(task.workspaceId),
    projectId: bufferToUuid(task.projectId),
    sectionId: task.sectionId ? bufferToUuid(task.sectionId) : undefined,
    parentId: task.parentId ? bufferToUuid(task.parentId) : undefined,
  };
}
