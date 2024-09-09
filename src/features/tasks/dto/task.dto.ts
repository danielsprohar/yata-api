import { Task } from "@prisma/client";
import { bufferToUuid } from "../../../core/utils/uuid.util";

export interface TaskDto
  extends Omit<
    Task,
    "id" | "workspaceId" | "projectId" | "parentId" | "sectionId"
  > {
  id: string;
  workspaceId: string;
  projectId?: string;
  parentId?: string;
  sectionId?: string;
  subTasks?: TaskDto[];
}

export function toTaskDto(task: Task): TaskDto {
  return {
    ...task,
    id: bufferToUuid(task.id),
    workspaceId: bufferToUuid(task.workspaceId),
    projectId: bufferToUuid(task.projectId),
    sectionId: task.sectionId ? bufferToUuid(task.sectionId) : undefined,
    parentId: task.parentId ? bufferToUuid(task.parentId) : undefined,
  };
}
