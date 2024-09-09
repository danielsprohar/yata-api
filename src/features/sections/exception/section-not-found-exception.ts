import { NotFoundException } from '@nestjs/common';

export class SectionNotFoundException extends NotFoundException {
  constructor() {
    super('Section not found');
  }
}
