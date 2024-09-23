import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PageResponse } from "../../core/model/page-response.model";
import {
  bufferToUuid,
  generatePrimaryKey,
  uuidToBuffer,
} from "../../core/utils/uuid.util";
import { PrismaService } from "../../prisma/prisma.service";
import { TagDto } from "../tasks/dto/tag.dto";
import { CreateTagDto } from "./dto/create-tag.dto";
import { TagsQueryParams } from "./dto/tags-query-params.dto";
import { UpdateTagDto } from "./dto/update-tag.dto";
import { TagNotFoundException } from "./exceptions/tag-not-found.exception";

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTagDto) {
    try {
      const tag = await this.prisma.tag.create({
        data: {
          id: generatePrimaryKey(),
          name: dto.name,
          ownerId: uuidToBuffer(dto.ownerId),
          tasks: {
            connect: {
              id: uuidToBuffer(dto.taskId),
            },
          },
        },
      });

      return tag;
    } catch (e) {
      console.error(e);
      throw new UnprocessableEntityException(e);
    }
  }

  async findAll(params: TagsQueryParams) {
    const { ownerId, taskId } = params;
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

  async findOne(id: string) {
    try {
      return await this.prisma.tag.findUniqueOrThrow({
        where: {
          id: uuidToBuffer(id),
        },
      });
    } catch {
      return new TagNotFoundException();
    }
  }

  update(id: number, updateTagDto: UpdateTagDto) {
    return `This action updates a #${id} tag`;
  }

  remove(id: number) {
    return `This action removes a #${id} tag`;
  }
}
