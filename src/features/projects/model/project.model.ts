import { Project } from '@prisma/client';

export interface ProjectModel extends Omit<Project, 'id' | 'workspaceId'> {
  id: string;
  workspaceId: string;
}
