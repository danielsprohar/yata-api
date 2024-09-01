import { Board } from '@prisma/client';

export interface BoardModel
  extends Omit<Board, 'id' | 'workspace' | 'workspaceId'> {
  id: string;
  workspaceId: string;
}
