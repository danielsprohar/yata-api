import { Project } from '@prisma/client';

export interface ProjectDto extends Omit<Project, 'id' | 'workspaceId'> {
  id: string;
  workspaceId: string;
}
