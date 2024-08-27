import { Task } from '@prisma/client';

export interface TaskModel
  extends Omit<Task, 'id' | 'projectId' | 'parentTaskId' | 'workspaceId'> {
  id: string;
  projectId: string;
  parentTaskId: string;
  workspaceId: string;
  subTasks?: TaskModel[];
}
