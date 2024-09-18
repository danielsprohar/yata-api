import { Project } from "@prisma/client";
import { bufferToUuid } from "../../../core/utils/uuid.util";

export interface ProjectDto
  extends Omit<Project, "id" | "workspaceId" | "ownerId"> {
  id: string;
  workspaceId: string;
  ownerId: string;
}

export function toProjectDto(project: Project): ProjectDto {
  return {
    ...project,
    id: bufferToUuid(project.id),
    workspaceId: bufferToUuid(project.workspaceId),
    ownerId: bufferToUuid(project.ownerId),
  };
}
