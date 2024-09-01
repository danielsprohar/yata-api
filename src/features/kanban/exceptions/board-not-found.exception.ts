import { NotFoundException } from '@nestjs/common';

export class BoardNotFoundException extends NotFoundException {
  constructor() {
    super('Board not found');
  }
}
