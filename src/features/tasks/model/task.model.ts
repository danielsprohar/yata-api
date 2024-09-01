import { Task } from '@prisma/client';

export interface TaskModel
  extends Omit<
    Task,
    'id' | 'workspaceId' | 'projectId' | 'columnId' | 'parentId'
  > {
  id: string;
  workspaceId: string;
  projectId?: string;
  columnId?: string;
  parentId?: string;
  subTasks?: TaskModel[];
}

export function taskModel(task: Task): TaskModel {
  return {
    ...task,
    id: task.id.toString(),
    projectId: task.projectId?.toString(),
    parentId: task.parentId?.toString(),
    workspaceId: task.workspaceId.toString(),
    columnId: task.columnId?.toString(),
  };
}
