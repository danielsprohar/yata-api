import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PageResponse } from "../../core/model/page-response.model";
import {
  bufferToUuid,
  generatePrimaryKey,
  uuidToBuffer,
} from "../../core/utils/uuid.util";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateTagDto } from "./dto/create-tag.dto";
import { TagDto, toTagDto } from "./dto/tag.dto";
import { TagsQueryParams } from "./dto/tags-query-params.dto";
import { UpdateTagDto } from "./dto/update-tag.dto";
import { TagNotFoundException } from "./exceptions/tag-not-found.exception";

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateTagDto): Promise<TagDto> {
    try {
      const tag = await this.prisma.tag.create({
        data: {
          id: generatePrimaryKey(),
          name: dto.name,
          ownerId: uuidToBuffer(ownerId),
          tasks: {
            connect: {
              id: uuidToBuffer(dto.taskId),
            },
          },
        },
      });

      return toTagDto(tag);
    } catch (e) {
      console.error(e);
      throw new UnprocessableEntityException(e);
    }
  }

  async findAll(params: TagsQueryParams): Promise<PageResponse<TagDto>> {
    const { ownerId, taskId, q: query } = params;
    const ownerIdBuffer = uuidToBuffer(ownerId);
    const taskIdBuffer = taskId ? uuidToBuffer(taskId) : undefined;
    const page = Math.max(+params.page || 0, 0);
    const pageSize = Math.min(+params.pageSize || 50, 50);

    const tagSearchCriteria: Prisma.TagWhereInput = {
      ownerId: ownerIdBuffer,
      tasks: {
        every: {
          id: taskIdBuffer,
        },
      },
    };

    if (query) {
      tagSearchCriteria.name = {
        contains: query,
      };
    }

    const [data, count] = await Promise.all([
      this.prisma.tag.findMany({
        where: tagSearchCriteria,
        take: pageSize,
        skip: page,
      }),
      this.prisma.tag.count({
        where: tagSearchCriteria,
      }),
    ]);

    const response: PageResponse<TagDto> = {
      count,
      page,
      pageSize,
      data: data.map((tag) => ({
        ...tag,
        ownerId,
        id: bufferToUuid(tag.id),
      })),
    };

    return response;
  }

  async findOne(id: string): Promise<TagDto> {
    try {
      const tag = await this.prisma.tag.findUniqueOrThrow({
        where: {
          id: uuidToBuffer(id),
        },
      });

      return toTagDto(tag);
    } catch (e) {
      console.error(e);
      throw new TagNotFoundException();
    }
  }

  async update(id: string, dto: UpdateTagDto): Promise<TagDto> {
    try {
      const updatedTag = await this.prisma.tag.update({
        where: {
          id: uuidToBuffer(id),
        },
        data: {
          name: dto.name,
        },
      });

      return toTagDto(updatedTag);
    } catch (e) {
      console.error(e);
      throw new TagNotFoundException();
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.tag.delete({
        where: {
          id: uuidToBuffer(id),
        },
      });
    } catch (e) {
      console.error(e);
      throw new TagNotFoundException();
    }
  }
}
