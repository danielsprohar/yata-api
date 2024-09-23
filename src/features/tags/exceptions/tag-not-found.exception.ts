import { NotFoundException } from "@nestjs/common";

export class TagNotFoundException extends NotFoundException {
  constructor() {
    super("Tag not found");
  }
}