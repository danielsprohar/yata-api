import { Tag } from "@prisma/client";
import { bufferToUuid } from "../../../core/utils/uuid.util";

export class TagDto {
  id: string;
  name: string;
  version: number;
  createdAt: Date;
  updatedAt?: Date;
  ownerId: string;
}

export const toTagDto = (tag: Tag): TagDto => ({
  id: bufferToUuid(tag.id),
  name: tag.name,
  version: tag.version,
  createdAt: tag.createdAt,
  updatedAt: tag.updatedAt,
  ownerId: bufferToUuid(tag.ownerId),
});

export const toTagsArrayDto = (tags: Tag[]): TagDto[] => {
  const tagDtos: TagDto[] = [];

  for (const tag of tags) {
    tagDtos.push({
      id: bufferToUuid(tag.id),
      name: tag.name,
      version: tag.version,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
      ownerId: bufferToUuid(tag.ownerId),
    });
  }

  return tagDtos;
};
