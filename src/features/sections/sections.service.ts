import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { PageResponse } from "../../core/model/page-response.model";
import { generatePrimaryKey, uuidToBuffer } from "../../core/utils/uuid.util";
import { PrismaService } from "../../prisma/prisma.service";
import { ProjectNotFoundException } from "../projects/exception/project-not-found.exception";
import { CreateSectionDto } from "./dto/create-section.dto";
import { SectionQueryParams } from "./dto/section-query-params.dto";
import { SectionDto, toSectionDto } from "./dto/section.dto";
import { UpdateSectionDto } from "./dto/update-section.dto";
import { SectionNotFoundException } from "./exception/section-not-found-exception";

@Injectable()
export class SectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSectionDto, ownerId: string): Promise<SectionDto> {
    const ownerIdBuffer = uuidToBuffer(ownerId);
    const project = await this.prisma.project.findUnique({
      where: {
        id: uuidToBuffer(dto.projectId),
        ownerId: ownerIdBuffer,
      },
    });

    if (!project) {
      throw new ProjectNotFoundException();
    }

    try {
      const section = await this.prisma.section.create({
        data: {
          id: generatePrimaryKey(),
          name: dto.name,
          position: dto.position,
          projectId: uuidToBuffer(dto.projectId),
          ownerId: ownerIdBuffer,
        },
      });

      return toSectionDto(section);
    } catch (e) {
      console.error(e);
      throw new UnprocessableEntityException(e);
    }
  }

  async delete(id: string, ownerId: string): Promise<void> {
    const section = await this.prisma.section.delete({
      where: {
        id: uuidToBuffer(id),
        ownerId: uuidToBuffer(ownerId),
      },
    });

    if (!section) {
      throw new SectionNotFoundException();
    }
  }

  async findById(id: string, ownerId: string): Promise<SectionDto> {
    const section = await this.prisma.section.findUnique({
      where: {
        id: uuidToBuffer(id),
        ownerId: uuidToBuffer(ownerId),
      },
    });

    if (!section) {
      throw new SectionNotFoundException();
    }

    return toSectionDto(section);
  }

  async fetch(
    params: SectionQueryParams,
    ownerId: string,
  ): Promise<PageResponse<SectionDto>> {
    const page = Math.max(+params.page || 0, 0);
    const pageSize = Math.min(+params.pageSize || 10, 50);
    const projectId = params.projectId;
    const projectIdBuffer = uuidToBuffer(projectId);
    const sectionQueryFilter = {
      projectId: projectIdBuffer,
      ownerId: uuidToBuffer(ownerId),
    };

    const [data, count] = await Promise.all([
      this.prisma.section.findMany({
        skip: page * pageSize,
        take: pageSize,
        where: sectionQueryFilter,
      }),
      this.prisma.section.count({
        where: sectionQueryFilter,
      }),
    ]);

    return {
      count,
      page,
      pageSize,
      data: data.map((section) => toSectionDto(section)),
    };
  }

  async update(
    id: string,
    ownerId: string,
    dto: UpdateSectionDto,
  ): Promise<SectionDto> {
    try {
      const section = await this.prisma.section.update({
        where: {
          id: uuidToBuffer(id),
          ownerId: uuidToBuffer(ownerId),
        },
        data: {
          name: dto.name,
          position: dto.position,
          version: {
            increment: 1,
          },
        },
      });

      if (!section) {
        throw new SectionNotFoundException();
      }

      return toSectionDto(section);
    } catch (e) {
      // TODO: Concurency error handling
      console.error(e);
      throw new UnprocessableEntityException(e);
    }
  }
}
