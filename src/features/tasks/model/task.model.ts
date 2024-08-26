import { Task } from '@prisma/client';

export interface TaskModel
  extends Omit<Task, 'id' | 'projectId' | 'parentTaskId'> {
  id: string;
  projectId: string;
  parentTaskId: string;
  subTasks?: TaskModel[];
}
