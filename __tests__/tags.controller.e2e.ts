import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  INestApplication,
  Injectable,
  NestInterceptor,
  ValidationPipe,
} from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { Test, TestingModule } from "@nestjs/testing";
import {
  PrismaClient,
  Project,
  Tag,
  Task,
  TaskStatus,
  Workspace,
} from "@prisma/client";
import { MySqlContainer, StartedMySqlContainer } from "@testcontainers/mysql";
import { execSync } from "child_process";
import { Observable } from "rxjs";
import * as request from "supertest";
import { v4 as uuid } from "uuid";
import { NoAuthAppTestModule } from "../src/app.module";
import { JwtAuthGuard } from "../src/auth/guards/jwt-auth.guard";
import { PageResponse } from "../src/core/model/page-response.model";
import {
  bufferToUuid,
  generatePrimaryKey,
  uuidToBuffer,
} from "../src/core/utils/uuid.util";
import { CreateTagDto } from "../src/features/tags/dto/create-tag.dto";
import { TagDto } from "../src/features/tags/dto/tag.dto";
import { UpdateTagDto } from "../src/features/tags/dto/update-tag.dto";
import { AddTagsDto } from "../src/features/tasks/dto/add-tags.dto";
import { ConnectTagsDto } from "../src/features/tasks/dto/connect-tags.dto";
import { TaskPriority } from "../src/features/tasks/enums/task-priority.enum";
import { PrismaService } from "../src/prisma/prisma.service";

class MockAuthGuard {
  validate() {
    return true;
  }
}

const ownerId = uuid();
const ownerIdBuffer = uuidToBuffer(ownerId);

@Injectable()
export class AddUserInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    request.user = {
      id: ownerId,
      username: "testuser",
    };

    return next.handle();
  }
}

describe("Tags", () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let prismaClient: PrismaClient;
  let mysqlContainer: StartedMySqlContainer;

  let workspace: Workspace;
  let project: Project;
  let task: Task;
  let tag: Tag;

  beforeAll(async () => {
    mysqlContainer = await new MySqlContainer("mysql:9")
      .withDatabase("yata")
      .withUser("root")
      .withRootPassword("password")
      .start();

    // Set DATABASE_URL environment variable for Prisma
    process.env.DATABASE_URL = mysqlContainer.getConnectionUri();

    // Run Prisma migrations
    execSync("npx prisma migrate deploy", {
      env: {
        DATABASE_URL: mysqlContainer.getConnectionUri(),
      },
    });

    prismaClient = new PrismaClient({
      datasources: {
        db: {
          url: mysqlContainer.getConnectionUri(),
        },
      },
    });

    await prismaClient.$connect();
    jest.setTimeout(30_000);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [NoAuthAppTestModule],
      providers: [
        {
          provide: APP_INTERCEPTOR,
          useClass: AddUserInterceptor,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockAuthGuard)
      .overrideProvider(PrismaService)
      .useValue(prismaClient)
      .compile();

    app = moduleFixture.createNestApplication({
      logger: ["log"],
      forceCloseConnections: true,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // strip props that are not defined in the DTO class
        transform: true,
      }),
    );

    return await app.init();
  }, 30_000);

  beforeEach(async () => {
    prismaService = app.get(PrismaService);
    workspace = await prismaService.workspace.create({
      data: {
        name: "YATA",
        id: uuidToBuffer(uuid()),
        ownerId: ownerIdBuffer,
      },
    });

    project = await prismaService.project.create({
      data: {
        id: generatePrimaryKey(),
        name: "ng_spa",
        workspaceId: workspace.id,
        ownerId: ownerIdBuffer,
      },
    });

    const tagIdBuffer = generatePrimaryKey();
    task = await prismaService.task.create({
      include: {
        tags: true,
      },
      data: {
        id: generatePrimaryKey(),
        title: "Test task",
        priority: TaskPriority.HIGH,
        status: TaskStatus.IN_PROGRESS,
        allDay: true,
        ownerId: ownerIdBuffer,
        projectId: project.id,
        workspaceId: workspace.id,
        tags: {
          create: {
            id: tagIdBuffer,
            ownerId: ownerIdBuffer,
            name: "tag1",
          },
        },
      },
    });

    tag = await prismaService.tag.findUniqueOrThrow({
      where: {
        id: tagIdBuffer,
      },
    });
  });

  afterEach(async () => {
    await prismaService.tag.deleteMany({
      where: {
        ownerId: ownerIdBuffer,
      },
    });
    await prismaService.task.deleteMany({
      where: {
        ownerId: ownerIdBuffer,
      },
    });
    await prismaService.project.deleteMany({
      where: {
        ownerId: ownerIdBuffer,
      },
    });
    await prismaService.workspace.deleteMany({
      where: {
        ownerId: ownerIdBuffer,
      },
    });
  });

  afterAll(async () => {
    await prismaClient.$disconnect();
    await prismaService.$disconnect();
    await mysqlContainer.stop();
    await app.close();
  });

  describe("POST /tasks/:id/tags", () => {
    it("should add a list of new tags", async () => {
      const dto: AddTagsDto = {
        tags: ["tag2", "tag3"],
      };

      const res = await request(app.getHttpServer())
        .post(`/tasks/${bufferToUuid(task.id)}/tags`)
        .send(dto);

      expect(res.status).toEqual(HttpStatus.OK);

      const updatedTask = await prismaClient.task.findUniqueOrThrow({
        where: {
          id: task.id,
        },
        include: {
          tags: true,
        },
      });

      const newTags = updatedTask.tags.filter((t) => dto.tags.includes(t.name));
      expect(newTags.length).toEqual(2);
    });
  });

  describe("PATCH /tasks/:id/tags", () => {
    let tagToConnect: Tag;

    beforeEach(async () => {
      tagToConnect = await prismaService.tag.create({
        data: {
          id: generatePrimaryKey(),
          name: "temp tag",
          ownerId: ownerIdBuffer,
        },
      });
    });

    it("should connect a list of existing tags", async () => {
      const dto: ConnectTagsDto = {
        tagIds: [bufferToUuid(tagToConnect.id)],
      };

      const res = await request(app.getHttpServer())
        .patch(`/tasks/${bufferToUuid(task.id)}/tags`)
        .send(dto);

      expect(res.status).toEqual(HttpStatus.OK);

      const updatedTask = await prismaClient.task.findUniqueOrThrow({
        where: {
          id: task.id,
        },
        include: {
          tags: true,
        },
      });

      const updatedTag = updatedTask.tags.find(
        (t) => t.name === tagToConnect.name,
      );
      expect(updatedTag).toBeDefined();
    });
  });

  describe("PATCH /tasks/:id/tags/:tagId/remove", () => {
    let tagToRemove: Tag;

    beforeEach(async () => {
      tagToRemove = await prismaService.tag.create({
        data: {
          id: generatePrimaryKey(),
          name: "temp tag",
          ownerId: ownerIdBuffer,
        },
      });
    });

    it("should remove a tag from a task", async () => {
      const res = await request(app.getHttpServer()).patch(
        `/tasks/${bufferToUuid(task.id)}/tags/${bufferToUuid(
          tagToRemove.id,
        )}/remove`,
      );

      expect(res.status).toEqual(HttpStatus.OK);

      const updatedTask = await prismaClient.task.findUniqueOrThrow({
        where: {
          id: task.id,
        },
        include: {
          tags: true,
        },
      });

      const updatedTag = updatedTask.tags.find(
        (t) => t.name === tagToRemove.name,
      );
      expect(updatedTag).not.toBeDefined();
    });
  });

  describe("GET /tags/:tagId", () => {
    it("should fetch a tag by ID", async () => {
      const res = await request(app.getHttpServer()).get(
        "/tags/" + bufferToUuid(tag.id),
      );

      expect(res.status).toEqual(HttpStatus.OK);
    });

    it("should return 404", async () => {
      const res = await request(app.getHttpServer()).get("/tags/" + uuid());
      expect(res.status).toEqual(HttpStatus.NOT_FOUND);
    });

    describe("Validation", () => {
      it("should return 400 when the tagId is not a valid UUID", async () => {
        const res = await request(app.getHttpServer()).get("/tags/1");
        expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
      });
    });
  });

  describe("DELETE /tags/:tagId", () => {
    let tagToDelete: Tag;

    beforeEach(async () => {
      tagToDelete = await prismaService.tag.create({
        data: {
          id: generatePrimaryKey(),
          name: "tag2",
          ownerId: ownerIdBuffer,
        },
      });
    });

    it("should delete a tag by ID", async () => {
      const res = await request(app.getHttpServer()).delete(
        "/tags/" + bufferToUuid(tagToDelete.id),
      );

      expect(res.status).toEqual(HttpStatus.OK);
    });

    it("should return 404", async () => {
      const res = await request(app.getHttpServer()).delete("/tags/" + uuid());
      expect(res.status).toEqual(HttpStatus.NOT_FOUND);
    });

    describe("Validation", () => {
      it("should return 400 when the tagId is not a valid UUID", async () => {
        const res = await request(app.getHttpServer()).delete("/tags/1");
        expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
      });
    });
  });

  describe("PATCH /tags/:tagId", () => {
    it("should update a tag by ID", async () => {
      const dto: UpdateTagDto = {
        name: "updated tag",
      };
      const res = await request(app.getHttpServer())
        .patch("/tags/" + bufferToUuid(tag.id))
        .send(dto);

      expect(res.status).toEqual(HttpStatus.OK);
    });

    it("should return 404", async () => {
      const dto: UpdateTagDto = {
        name: "updated tag",
      };

      const res = await request(app.getHttpServer())
        .patch("/tags/" + uuid())
        .send(dto);

      expect(res.status).toEqual(HttpStatus.NOT_FOUND);
    });

    describe("Validation", () => {
      const dto: UpdateTagDto = {
        name: "updated tag",
      };
      it("should return 400 when the tagId is not a valid UUID", async () => {
        const res = await request(app.getHttpServer())
          .patch("/tags/1")
          .send(dto);

        expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
      });

      it("should return 400 when the name is not a string", async () => {
        const res = await request(app.getHttpServer())
          .patch("/tags/" + bufferToUuid(tag.id))
          .send({
            name: 1,
          });

        expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
      });

      it("should return 400 when the name is too long", async () => {
        const dto: UpdateTagDto = {
          name: "1".repeat(17),
        };
        const res = await request(app.getHttpServer())
          .patch("/tags/" + bufferToUuid(tag.id))
          .send(dto);

        expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
      });
    });
  });

  describe("POST /tags", () => {
    it("should create a tag", async () => {
      const dto: CreateTagDto = {
        name: "new tag",
        taskId: bufferToUuid(task.id),
      };

      const res = await request(app.getHttpServer()).post("/tags").send(dto);

      expect(res.status).toEqual(HttpStatus.OK);

      const updatedTask = await prismaClient.task.findUniqueOrThrow({
        where: {
          id: task.id,
        },
        include: {
          tags: true,
        },
      });

      const updatedTag = updatedTask.tags.find((t) => t.name === dto.name);
      expect(updatedTag).toBeDefined();
    });

    describe("Validation", () => {
      it("should return 400 when the name is not a string", async () => {
        const res = await request(app.getHttpServer())
          .post("/tags")
          .send({
            name: 1,
            taskId: bufferToUuid(task.id),
          });

        expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
      });

      it("should return 400 when the name is too long", async () => {
        const dto: CreateTagDto = {
          name: "1".repeat(17),
          taskId: bufferToUuid(task.id),
        };

        const res = await request(app.getHttpServer()).post("/tags").send(dto);

        expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
      });
    });
  });

  describe("GET /tags", () => {
    it("should fetch all tags", async () => {
      const res = await request(app.getHttpServer()).get("/tags");

      expect(res.status).toEqual(HttpStatus.OK);
      const response = res.body as PageResponse<TagDto>;

      expect(response.data.length).toEqual(1);
    });

    it("should fetch all tags by taskId", async () => {
      const res = await request(app.getHttpServer()).get(
        "/tags?taskId=" + bufferToUuid(task.id),
      );

      expect(res.status).toEqual(HttpStatus.OK);
      const response = res.body as PageResponse<TagDto>;

      expect(response.data.length).toEqual(1);
    });

    it("should fetch all tags by query", async () => {
      const res = await request(app.getHttpServer()).get("/tags?q=ta");

      expect(res.status).toEqual(HttpStatus.OK);
      const response = res.body as PageResponse<TagDto>;

      expect(response.data.length).toEqual(1);
    });

    describe("Validation", () => {
      it("should return 400 when the taskId is not a valid UUID", async () => {
        const res = await request(app.getHttpServer()).get("/tags?taskId=1");
        expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
      });

      it("should return 400 when the q is too long", async () => {
        const res = await request(app.getHttpServer()).get(
          "/tags?q=1".repeat(17),
        );
        expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
      });
    });
  });
});
