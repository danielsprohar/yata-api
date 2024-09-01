import { NotFoundException } from '@nestjs/common';

export class ColumnNotFoundException extends NotFoundException {
  constructor() {
    super('Column not found');
  }
}
