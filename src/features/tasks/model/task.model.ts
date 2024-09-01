import { Task } from '@prisma/client';

export interface TaskModel
  extends Omit<Task, 'id' | 'projectId' | 'parentId' | 'workspaceId'> {
  id: string;
  projectId: string;
  parentId: string;
  workspaceId: string;
  subTasks?: TaskModel[];
}
