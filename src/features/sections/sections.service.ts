import { Injectable } from "@nestjs/common";
import { PageResponse } from "../../core/model/page-response.model";
import {
  bufferToUuid,
  generateId,
  uuidToBuffer,
} from "../../core/utils/uuid.util";
import { PrismaService } from "../../prisma/prisma.service";
import { ProjectNotFoundException } from "../projects/exception/project-not-found.exception";
import { CreateSectionDto } from "./dto/create-section.dto";
import { SectionDto } from "./dto/section.dto";
import { UpdateSectionDto } from "./dto/update-section.dto";
import { SectionNotFoundException } from "./exception/section-not-found-exception";

@Injectable()
export class SectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSectionDto: CreateSectionDto): Promise<SectionDto> {
    const project = await this.prisma.project.findUnique({
      where: {
        id: uuidToBuffer(createSectionDto.projectId),
      },
    });

    if (!project) {
      throw new ProjectNotFoundException();
    }

    const sectionId = generateId();
    const section = await this.prisma.section.create({
      data: {
        id: sectionId,
        name: createSectionDto.name,
        projectId: Buffer.from(createSectionDto.projectId),
      },
    });

    return {
      ...section,
      id: bufferToUuid(section.id),
      projectId: bufferToUuid(section.projectId),
    };
  }

  async delete(id: string): Promise<void> {
    const section = await this.prisma.section.delete({
      where: {
        id: uuidToBuffer(id),
      },
    });

    if (!section) {
      throw new SectionNotFoundException();
    }
  }

  async findById(id: string): Promise<SectionDto> {
    const section = await this.prisma.section.findUnique({
      where: {
        id: uuidToBuffer(id),
      },
    });

    if (!section) {
      throw new SectionNotFoundException();
    }

    return {
      ...section,
      id: bufferToUuid(section.id),
      projectId: bufferToUuid(section.projectId),
    };
  }

  async fetch(
    page: number,
    pageSize: number,
    projectId: string,
  ): Promise<PageResponse<SectionDto>> {
    const sections = await this.prisma.section.findMany({
      where: {
        projectId: uuidToBuffer(projectId),
      },
      skip: page * pageSize,
      take: pageSize,
    });

    const count = await this.prisma.section.count({
      where: {
        projectId: uuidToBuffer(projectId),
      },
    });

    return {
      count,
      page,
      pageSize,
      data: sections.map((section) => ({
        ...section,
        id: bufferToUuid(section.id),
        projectId: bufferToUuid(section.projectId),
      })),
    };
  }

  async update(
    id: string,
    updateSectionDto: UpdateSectionDto,
  ): Promise<SectionDto> {
    const section = await this.prisma.section.update({
      where: {
        id: uuidToBuffer(id),
      },
      data: {
        name: updateSectionDto.name,
      },
    });

    if (!section) {
      throw new SectionNotFoundException();
    }

    return {
      ...section,
      id: bufferToUuid(section.id),
      projectId: bufferToUuid(section.projectId),
    };
  }
}
