import { Injectable } from '@nestjs/common';
import { Prisma, Project } from '@prisma/client';
import { QueryParams } from '../dto/query-params.dto';
import { PageResponse } from '../core/models/page-response.model';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(args: Prisma.ProjectCreateArgs): Promise<Project> {
    return await this.prisma.project.create(args);
  }

  async findAll(params: {
    skip: number;
    take: number;
    cursor?: Prisma.ProjectWhereUniqueInput;
    where: Prisma.ProjectWhereInput;
    orderBy?: Prisma.ProjectOrderByWithRelationInput;
  }): Promise<PageResponse<Project>> {
    if (!params.orderBy) {
      params.orderBy = {
        name: Prisma.SortOrder.asc,
      };
    }

    const count = await this.prisma.project.count({
      where: params.where,
    });

    params.skip = params.skip;
    params.take = Math.min(params.take, QueryParams.MAX_TAKE);
    const data = await this.prisma.project.findMany({
      ...params,
    });

    return {
      page: params.skip,
      pageSize: params.take,
      count,
      data,
    };
  }

  async findOne(args: Prisma.ProjectFindFirstArgs): Promise<Project> {
    return this.prisma.project.findFirst(args);
  }

  async update(
    id: number,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    return this.prisma.project.update({
      where: {
        id,
      },
      include: {
        sections: true,
      },
      data: updateProjectDto,
    });
  }

  async remove(id: number): Promise<Project> {
    return this.prisma.project.delete({
      where: { id },
    });
  }

  async exists(args: Prisma.ProjectCountArgs): Promise<boolean> {
    const count = await this.prisma.project.count(args);
    return count > 0;
  }
}
