import { Column } from '@prisma/client';

export interface ColumnModel extends Omit<Column, 'id' | 'board' | 'boardId'> {
  id: string;
  boardId: string;
}
