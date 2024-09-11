import { Section } from "@prisma/client";
import { bufferToUuid } from "../../../core/utils/uuid.util";

export interface SectionDto {
  id: string;
  projectId: string;
  ownerId: string;
  name: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export function toSectionDto(section: Section): SectionDto {
  return {
    ...section,
    id: bufferToUuid(section.id),
    projectId: bufferToUuid(section.projectId),
    ownerId: bufferToUuid(section.ownerId),
  };
}
