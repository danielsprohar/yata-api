import { NotFoundException } from '@nestjs/common';

export class KanbanColumnNotFoundException extends NotFoundException {
  constructor() {
    super('Kanban column not found');
  }
}
