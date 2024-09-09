import { Task } from "@prisma/client";
import { bufferToUuid } from "../../../core/utils/uuid.util";

export interface TaskDto
  extends Omit<Task, "id" | "workspaceId" | "projectId" | "parentId"> {
  id: string;
  workspaceId: string;
  projectId?: string;
  parentId?: string;
  subTasks?: TaskDto[];
}

export function toTaskDto(task: Task): TaskDto {
  return {
    ...task,
    id: bufferToUuid(task.id),
    workspaceId: bufferToUuid(task.workspaceId),
    projectId: bufferToUuid(task.projectId),
    parentId: task.parentId ? bufferToUuid(task.parentId) : undefined,
  };
}
