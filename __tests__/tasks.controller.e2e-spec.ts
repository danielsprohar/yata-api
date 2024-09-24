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
import { Project, Tag, Task, TaskStatus, Workspace } from "@prisma/client";
import { Observable } from "rxjs";
import * as request from "supertest";
import { v4 as uuid } from "uuid";
import { NoAuthAppTestModule } from "../src/app.module";
import { JwtAuthGuard } from "../src/auth/guards/jwt-auth.guard";
import {
  bufferToUuid,
  generatePrimaryKey,
  uuidToBuffer,
} from "../src/core/utils/uuid.util";
import { CreateTaskDto } from "../src/features/tasks/dto/create-task.dto";
import { UpdateTaskDto } from "../src/features/tasks/dto/update-task.dto";
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

describe("TasksController", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let workspace: Workspace;
  let project: Project;
  let tag: Tag;

  beforeAll(async () => {
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

    await app.init();
  });

  beforeEach(async () => {
    prisma = app.get(PrismaService);

    workspace = await prisma.workspace.create({
      data: {
        name: "YATA",
        id: uuidToBuffer(uuid()),
        ownerId: ownerIdBuffer,
      },
    });

    project = await prisma.project.create({
      data: {
        id: generatePrimaryKey(),
        name: "ng_spa",
        workspaceId: workspace.id,
        ownerId: ownerIdBuffer,
      },
    });

    tag = await prisma.tag.create({
      data: {
        id: generatePrimaryKey(),
        name: "tag1",
        ownerId: ownerIdBuffer,
      },
    });
  });

  afterEach(async () => {
    await prisma.tag.deleteMany({
      where: {
        ownerId: ownerIdBuffer,
      },
    });
    await prisma.task.deleteMany({
      where: {
        ownerId: ownerIdBuffer,
      },
    });
    await prisma.project.deleteMany({
      where: {
        ownerId: ownerIdBuffer,
      },
    });
    await prisma.workspace.deleteMany({
      where: {
        ownerId: ownerIdBuffer,
      },
    });

  });
  
  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe("PATCH /tasks/:taskId -> Update task", () => {
    let task: Task;

    beforeEach(async () => {
      task = await prisma.task.create({
        data: {
          id: generatePrimaryKey(),
          title: "Task",
          workspaceId: workspace.id,
          projectId: project.id,
          ownerId: ownerIdBuffer,
        },
      });
    });

    it("should update a task", async () => {
      const dto: UpdateTaskDto = {
        title: "Updated Task",
      };

      const res = await request(app.getHttpServer())
        .patch("/tasks/" + bufferToUuid(task.id))
        .send(dto);

      expect(res.status).toEqual(HttpStatus.OK);
      expect(res.body.title).toEqual(dto.title);
    });
  });

  describe("DELETE /tasks/:taskId -> Delete task", () => {
    let task: Task;

    beforeEach(async () => {
      task = await prisma.task.create({
        data: {
          id: generatePrimaryKey(),
          title: "Task",
          workspaceId: workspace.id,
          projectId: project.id,
          ownerId: ownerIdBuffer,
        },
      });
    });

    it("should delete a task", async () => {
      const res = await request(app.getHttpServer()).delete(
        "/tasks/" + bufferToUuid(task.id),
      );

      expect(res.status).toEqual(HttpStatus.OK);
    });

    it("should return a 404 when the task does not exist", async () => {
      const res = await request(app.getHttpServer()).delete("/tasks/" + uuid());

      expect(res.status).toEqual(HttpStatus.NOT_FOUND);
    });
  });

  describe("GET /tasks/:taskId -> Find by ID", () => {
    let task: Task;

    beforeEach(async () => {
      task = await prisma.task.create({
        data: {
          id: generatePrimaryKey(),
          title: "Task",
          workspaceId: workspace.id,
          projectId: project.id,
          ownerId: ownerIdBuffer,
        },
      });
    });

    it("should return a task", async () => {
      const res = await request(app.getHttpServer()).get(
        "/tasks/" + bufferToUuid(task.id),
      );

      expect(res.status).toEqual(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body.title).toEqual(task.title);
    });

    it("should return a 404 when the task does not exist", async () => {
      const res = await request(app.getHttpServer()).get("/tasks/" + uuid());

      expect(res.status).toEqual(HttpStatus.NOT_FOUND);
    });
  });

  describe("GET /tasks -> Fetch/filter tasks", () => {
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    let tasks: Task[];

    beforeEach(async () => {
      await prisma.task.createMany({
        data: [
          {
            id: generatePrimaryKey(),
            title: "Task 1",
            workspaceId: workspace.id,
            projectId: project.id,
            ownerId: ownerIdBuffer,
            priority: TaskPriority.HIGH,
            dueDate: new Date(new Date(today).setDate(1)),
          },
          {
            id: generatePrimaryKey(),
            title: "Task 2",
            workspaceId: workspace.id,
            projectId: project.id,
            ownerId: ownerIdBuffer,
            priority: TaskPriority.MEDIUM,
            dueDate: new Date(new Date(today).setDate(15)),
          },
          {
            id: generatePrimaryKey(),
            title: "Task 3",
            workspaceId: workspace.id,
            projectId: project.id,
            ownerId: ownerIdBuffer,
            priority: TaskPriority.LOW,
            status: TaskStatus.COMPLETED,
            dueDate: new Date(new Date(today).setDate(28)),
          },
          {
            id: generatePrimaryKey(),
            title: "Task 4",
            workspaceId: workspace.id,
            projectId: project.id,
            ownerId: ownerIdBuffer,
            priority: TaskPriority.HIGH,
            status: TaskStatus.IN_PROGRESS,
          },
        ],
      });

      tasks = await prisma.task.findMany({
        where: {
          ownerId: ownerIdBuffer,
        },
      });
    });

    describe("Filter by Priority", () => {
      it("should return tasks filtered by HIGH priority", async () => {
        const expectedCount = tasks.filter(
          (task) => task.priority === TaskPriority.HIGH,
        ).length;

        const res = await request(app.getHttpServer()).get(
          "/tasks?priority=HIGH",
        );

        expect(res.status).toEqual(HttpStatus.OK);
        expect(res.body.count).toEqual(expectedCount);
      });

      it("should return tasks filtered by MEDIUM priority", async () => {
        const expectedCount = tasks.filter(
          (task) => task.priority === TaskPriority.MEDIUM,
        ).length;

        const res = await request(app.getHttpServer()).get(
          "/tasks?priority=MEDIUM",
        );

        expect(res.status).toEqual(HttpStatus.OK);
        expect(res.body.count).toEqual(expectedCount);
      });

      it("should return tasks filtered by LOW priority", async () => {
        const expectedCount = tasks.filter(
          (task) => task.priority === TaskPriority.LOW,
        ).length;

        const res = await request(app.getHttpServer()).get(
          "/tasks?priority=LOW",
        );

        expect(res.status).toEqual(HttpStatus.OK);
        expect(res.body.count).toEqual(expectedCount);
      });

      it("should return tasks filtered by NONE priority", async () => {
        const expectedCount = tasks.filter(
          (task) => task.priority === TaskPriority.NONE,
        ).length;

        const res = await request(app.getHttpServer()).get(
          "/tasks?priority=NONE",
        );

        expect(res.status).toEqual(HttpStatus.OK);
        expect(res.body.count).toEqual(expectedCount);
      });

      it("should return tasks filtered by NONE,HIGH priority", async () => {
        const expectedCount = tasks.filter(
          (task) =>
            task.priority === TaskPriority.NONE ||
            task.priority === TaskPriority.HIGH,
        ).length;

        const res = await request(app.getHttpServer()).get(
          "/tasks?priority=NONE,HIGH",
        );

        expect(res.status).toEqual(HttpStatus.OK);
        expect(res.body.count).toEqual(expectedCount);
      });
    });

    describe("Filter by Status", () => {
      it("should return tasks filtered by COMPLETED status", async () => {
        const expectedCount = tasks.filter(
          (task) => task.status === TaskStatus.COMPLETED,
        ).length;

        const res = await request(app.getHttpServer()).get(
          "/tasks?status=COMPLETED",
        );

        expect(res.status).toEqual(HttpStatus.OK);
        expect(res.body.count).toEqual(expectedCount);
      });

      it("should return tasks filtered by IN_PROGRESS status", async () => {
        const expectedCount = tasks.filter(
          (task) => task.status === TaskStatus.IN_PROGRESS,
        ).length;

        const res = await request(app.getHttpServer()).get(
          "/tasks?status=IN_PROGRESS",
        );

        expect(res.status).toEqual(HttpStatus.OK);
        expect(res.body.count).toEqual(expectedCount);
      });

      it("should return tasks filtered by NOT_STARTED status", async () => {
        const expectedCount = tasks.filter(
          (task) => task.status === TaskStatus.NOT_STARTED,
        ).length;

        const res = await request(app.getHttpServer()).get(
          "/tasks?status=NOT_STARTED",
        );

        expect(res.status).toEqual(HttpStatus.OK);
        expect(res.body.count).toEqual(expectedCount);
      });

      it("should return tasks filtered by NOT_STARTED,IN_PROGRESS status", async () => {
        const expectedCount = tasks.filter(
          (task) =>
            task.status === TaskStatus.NOT_STARTED ||
            task.status === TaskStatus.IN_PROGRESS,
        ).length;

        const res = await request(app.getHttpServer()).get(
          "/tasks?status=NOT_STARTED,IN_PROGRESS",
        );

        expect(res.status).toEqual(HttpStatus.OK);
        expect(res.body.count).toEqual(expectedCount);
      });
    });

    describe("Filter by Due Date", () => {
      it("should return tasks due today", async () => {
        const expectedCount = tasks.filter(
          (task) =>
            task.dueDate &&
            task.dueDate.getFullYear() === today.getFullYear() &&
            task.dueDate.getMonth() === today.getMonth() &&
            task.dueDate.getDate() === today.getDate(),
        ).length;

        const from = new Date(today).toISOString();
        const to = new Date(
          new Date(today).setDate(today.getDate() + 1),
        ).toISOString();

        const res = await request(app.getHttpServer()).get(
          `/tasks?from=${from}&to=${to}`,
        );

        expect(res.status).toEqual(HttpStatus.OK);
        expect(res.body.count).toEqual(expectedCount);
      });

      it("should return tasks due before today", async () => {
        const expectedCount = tasks.filter(
          (task) => task.dueDate && task.dueDate.getTime() < today.getTime(),
        ).length;

        const res = await request(app.getHttpServer()).get(
          `/tasks?lt=${today.toISOString()}`,
        );

        expect(res.status).toEqual(HttpStatus.OK);
        expect(res.body.count).toEqual(expectedCount);
      });

      it("should return tasks due after today", async () => {
        const expectedCount = tasks.filter(
          (task) => task.dueDate && task.dueDate.getTime() > today.getTime(),
        ).length;

        const res = await request(app.getHttpServer()).get(
          `/tasks?gt=${today.toISOString()}`,
        );

        expect(res.status).toEqual(HttpStatus.OK);
        expect(res.body.count).toEqual(expectedCount);
      });
    });
  });

  describe("POST /tasks -> Create task", () => {
    it("should create a task with tags", async () => {
      const tagNames = [tag.name, "tag"];
      const dto: CreateTaskDto = {
        projectId: bufferToUuid(project.id),
        workspaceId: bufferToUuid(workspace.id),
        ownerId: bufferToUuid(ownerIdBuffer),
        title: "Task",
        tags: tagNames,
      };

      const res = await request(app.getHttpServer()).post(`/tasks`).send(dto);

      expect(res.status).toEqual(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body.title).toEqual(dto.title);

      const actualTagNames = res.body.tags.map((t: Tag) => t.name);
      expect(actualTagNames.length).toEqual(tagNames.length);

      for (const tag of tagNames) {
        expect(actualTagNames).toContain(tag);
      }
    });

    describe("Validation", () => {
      describe("workspaceId", () => {
        it('should throw BadRequestException when "workspaceId" is not a valid UUID', async () => {
          const dto: CreateTaskDto = {
            workspaceId: "Invalid UUID",
            projectId: bufferToUuid(project.id),
            ownerId: bufferToUuid(ownerIdBuffer),
            title: "Task",
          };

          const res = await request(app.getHttpServer())
            .post(`/tasks`)
            .send(dto);

          expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
        });

        it('should throw NotFoundException when "workspaceId" does not exist', async () => {
          const dto: CreateTaskDto = {
            workspaceId: uuid(),
            projectId: bufferToUuid(project.id),
            ownerId: bufferToUuid(ownerIdBuffer),
            title: "Task",
          };

          const res = await request(app.getHttpServer())
            .post(`/tasks`)
            .send(dto);

          expect(res.status).toEqual(HttpStatus.NOT_FOUND);
        });
      });

      describe("projectId", () => {
        it('should throw BadRequestException when "projectId" is not a valid UUID', async () => {
          const dto: CreateTaskDto = {
            workspaceId: bufferToUuid(workspace.id),
            projectId: "Invalid UUID",
            ownerId: bufferToUuid(ownerIdBuffer),
            title: "Task",
          };

          const res = await request(app.getHttpServer())
            .post(`/tasks`)
            .send(dto);

          expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
        });

        it('should throw NotFoundException when "projectId" does not exist', async () => {
          const dto: CreateTaskDto = {
            workspaceId: bufferToUuid(workspace.id),
            projectId: uuid(),
            ownerId: bufferToUuid(ownerIdBuffer),
            title: "Task",
          };

          const res = await request(app.getHttpServer())
            .post(`/tasks`)
            .send(dto);

          expect(res.status).toEqual(HttpStatus.NOT_FOUND);
        });
      });

      describe("ownerId", () => {
        it('should throw BadRequestException when "ownerId" is not a valid UUID', async () => {
          const dto: CreateTaskDto = {
            workspaceId: bufferToUuid(workspace.id),
            projectId: bufferToUuid(project.id),
            ownerId: "Invalid UUID",
            title: "Task",
          };

          const res = await request(app.getHttpServer())
            .post(`/tasks`)
            .send(dto);

          expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
        });
      });

      describe("parentId", () => {
        it('should throw BadRequestException when "parentId" is not a valid UUID', async () => {
          const dto: CreateTaskDto = {
            workspaceId: bufferToUuid(workspace.id),
            projectId: bufferToUuid(project.id),
            ownerId: bufferToUuid(ownerIdBuffer),
            title: "Task",
            parentId: "Invalid UUID",
          };

          const res = await request(app.getHttpServer())
            .post(`/tasks`)
            .send(dto);

          expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
        });

        it('should throw NotFoundException when "parentId" does not exist', async () => {
          const dto: CreateTaskDto = {
            workspaceId: bufferToUuid(workspace.id),
            projectId: bufferToUuid(project.id),
            ownerId: bufferToUuid(ownerIdBuffer),
            title: "Task",
            parentId: uuid(),
          };

          const res = await request(app.getHttpServer())
            .post(`/tasks`)
            .send(dto);

          expect(res.status).toEqual(HttpStatus.NOT_FOUND);
        });
      });

      describe("sectionId", () => {
        it('should throw BadRequestException when "sectionId" is not a valid UUID', async () => {
          const dto: CreateTaskDto = {
            workspaceId: bufferToUuid(workspace.id),
            projectId: bufferToUuid(project.id),
            ownerId: bufferToUuid(ownerIdBuffer),
            title: "Task",
            sectionId: "Invalid UUID",
          };

          const res = await request(app.getHttpServer())
            .post(`/tasks`)
            .send(dto);

          expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
        });

        it('should throw NotFoundException when "sectionId" does not exist', async () => {
          const dto: CreateTaskDto = {
            workspaceId: bufferToUuid(workspace.id),
            projectId: bufferToUuid(project.id),
            ownerId: bufferToUuid(ownerIdBuffer),
            title: "Task",
            sectionId: uuid(),
          };

          const res = await request(app.getHttpServer())
            .post(`/tasks`)
            .send(dto);

          expect(res.status).toEqual(HttpStatus.NOT_FOUND);
        });
      });

      describe("title", () => {
        it('should throw BadRequestException when "title" is not a string', async () => {
          const res = await request(app.getHttpServer())
            .post(`/tasks`)
            .send({
              workspaceId: bufferToUuid(workspace.id),
              projectId: bufferToUuid(project.id),
              ownerId: bufferToUuid(ownerIdBuffer),
              title: 123,
            });

          expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
        });

        it('should throw BadRequestException when "title" is too long', async () => {
          const dto: CreateTaskDto = {
            workspaceId: bufferToUuid(workspace.id),
            projectId: bufferToUuid(project.id),
            ownerId: bufferToUuid(ownerIdBuffer),
            title: " ".repeat(256),
          };

          const res = await request(app.getHttpServer())
            .post(`/tasks`)
            .send(dto);

          expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
        });
      });

      describe("description", () => {
        it('should throw BadRequestException when "description" is not a string', async () => {
          const res = await request(app.getHttpServer())
            .post(`/tasks`)
            .send({
              workspaceId: bufferToUuid(workspace.id),
              projectId: bufferToUuid(project.id),
              ownerId: bufferToUuid(ownerIdBuffer),
              title: "Task",
              description: 123,
            });

          expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
        });

        it('should throw BadRequestException when "description" is too long', async () => {
          const dto: CreateTaskDto = {
            workspaceId: bufferToUuid(workspace.id),
            projectId: bufferToUuid(project.id),
            ownerId: bufferToUuid(ownerIdBuffer),
            title: "Task",
            description: " ".repeat(256),
          };

          const res = await request(app.getHttpServer())
            .post(`/tasks`)
            .send(dto);

          expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
        });
      });

      describe("status", () => {
        it('should throw BadRequestException when "status" is not a valid TaskStatus', async () => {
          const res = await request(app.getHttpServer())
            .post(`/tasks`)
            .send({
              workspaceId: bufferToUuid(workspace.id),
              projectId: bufferToUuid(project.id),
              ownerId: bufferToUuid(ownerIdBuffer),
              title: "Task",
              status: "Invalid Status",
            });

          expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
        });
      });

      describe("dueDate", () => {
        it('should throw BadRequestException when "dueDate" is not a valid ISO8601 date', async () => {
          const res = await request(app.getHttpServer())
            .post(`/tasks`)
            .send({
              workspaceId: bufferToUuid(workspace.id),
              projectId: bufferToUuid(project.id),
              ownerId: bufferToUuid(ownerIdBuffer),
              title: "Task",
              dueDate: "Invalid Date",
            });

          expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
        });
      });

      describe("priority", () => {
        it('should throw BadRequestException when "priority" is not a valid Priority', async () => {
          const res = await request(app.getHttpServer())
            .post(`/tasks`)
            .send({
              workspaceId: bufferToUuid(workspace.id),
              projectId: bufferToUuid(project.id),
              ownerId: bufferToUuid(ownerIdBuffer),
              title: "Task",
              priority: "Invalid Priority",
            });

          expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
        });
      });

      describe("tags", () => {
        it('should throw BadRequestException when "tags" is not an array of strings', async () => {
          const res = await request(app.getHttpServer())
            .post(`/tasks`)
            .send({
              workspaceId: bufferToUuid(workspace.id),
              projectId: bufferToUuid(project.id),
              ownerId: bufferToUuid(ownerIdBuffer),
              title: "Task",
              tags: [123],
            });

          expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
        });

        it('should throw BadRequestException when a "tag" is too long', async () => {
          const res = await request(app.getHttpServer())
            .post(`/tasks`)
            .send({
              workspaceId: bufferToUuid(workspace.id),
              projectId: bufferToUuid(project.id),
              ownerId: bufferToUuid(ownerIdBuffer),
              title: "Task",
              tags: ["a".repeat(17), "tag2"],
            });

          expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
        });

        it('should throw NotFoundException when a "tag" is not a string', async () => {
          const res = await request(app.getHttpServer())
            .post(`/tasks`)
            .send({
              workspaceId: bufferToUuid(workspace.id),
              projectId: bufferToUuid(project.id),
              ownerId: bufferToUuid(ownerIdBuffer),
              title: "Task",
              tags: ["tag1", 123],
            });

          expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
        });
      });

      describe("rrule", () => {
        it('should throw BadRequestException when "rrule" is not a string', async () => {
          const res = await request(app.getHttpServer())
            .post(`/tasks`)
            .send({
              workspaceId: bufferToUuid(workspace.id),
              projectId: bufferToUuid(project.id),
              ownerId: bufferToUuid(ownerIdBuffer),
              title: "Task",
              rrule: 123,
            });

          expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
        });
      });
    });
  });
});
