import { Workspace } from "@prisma/client";
import { bufferToUuid } from "../../../core/utils/uuid.util";

export interface WorkspaceDto {
  id: string;
  name: string;
  description: string | null;
  public: boolean;
  ownerId: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export function toWorkspaceDto(workspace: Workspace): WorkspaceDto {
  return {
    ...workspace,
    id: bufferToUuid(workspace.id),
    ownerId: bufferToUuid(workspace.ownerId),
  };
}
