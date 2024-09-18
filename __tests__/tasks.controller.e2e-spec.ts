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
import { Project, Tag, Workspace } from "@prisma/client";
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

  beforeEach(async () => {
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

    app = moduleFixture.createNestApplication();
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
        id: project.id,
      },
    });
    await prisma.workspace.deleteMany({
      where: {
        id: workspace.id,
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST Create task", () => {
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
  });

  // describe("POST Create task", () => {
  //   describe("Validation", () => {
  //     it("should throw BadRequestException when given an invalid priority value", async () => {
  //       const req = request(app.getHttpServer())
  //         .post(`/projects/${project.id}/tasks`)
  //         .send({
  //           name: "Task",
  //           projectId: project.id,
  //           priority: "Invalid Priority Value",
  //         });

  //       const res = await attachAccessToken(req, accessToken);

  //       expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
  //     });

  //     it("should throw BadRequestException when given an invalid date (only ISO dates are value)", async () => {
  //       const createTaskDto: CreateTaskDto = {
  //         title: "Task",
  //         projectId: project.id,
  //         dueDate: "10-10-2010",
  //       };

  //       const req = request(app.getHttpServer())
  //         .post(`/tasks`)
  //         .send(createTaskDto);

  //       const res = await attachAccessToken(req, accessToken);

  //       expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
  //     });

  //     it("should throw BadRequestException when given the Title is too long", async () => {
  //       const createTaskDto: CreateTaskDto = {
  //         title: " ".repeat(TaskAttributes.Title.MAX_LENGTH + 1),
  //         projectId: project.id,
  //       };

  //       const req = request(app.getHttpServer())
  //         .post(`/tasks`)
  //         .send(createTaskDto);

  //       const res = await attachAccessToken(req, accessToken);

  //       expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
  //     });

  //     it("should throw BadRequestException when given the Content is too long", async () => {
  //       const createTaskDto: CreateTaskDto = {
  //         title: "Task",
  //         projectId: project.id,
  //         content: " ".repeat(TaskAttributes.Content.MAX_LENGTH + 1),
  //       };
  //       const req = request(app.getHttpServer())
  //         .post(`/tasks`)
  //         .send(createTaskDto);

  //       const res = await attachAccessToken(req, accessToken);

  //       expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
  //     });
  //   });

  //   it("should throw BadRequestException when the project does not exist", async () => {
  //     const createTaskDto: CreateTaskDto = {
  //       title: "Task",
  //       projectId: 0,
  //     };

  //     const req = request(app.getHttpServer())
  //       .post(`/tasks`)
  //       .send(createTaskDto);

  //     const res = await attachAccessToken(req, accessToken);

  //     expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
  //   });

  //   it("should create a new Task", async () => {
  //     const createTaskDto: CreateTaskDto = {
  //       title: "Task",
  //       projectId: project.id,
  //     };

  //     const req = request(app.getHttpServer())
  //       .post(`/tasks`)
  //       .send(createTaskDto);

  //     const res = await attachAccessToken(req, accessToken);

  //     expect(res.status).toEqual(HttpStatus.CREATED);
  //   });

  //   describe("Subtask", () => {
  //     let parentTask: Task;

  //     beforeEach(async () => {
  //       parentTask = await prisma.task.create({
  //         data: {
  //           title: "Task",
  //           projectId: project.id,
  //           userId: user.id,
  //         },
  //       });
  //     });

  //     it("should create a new Subtask", async () => {
  //       const createSubtaskDto: CreateTaskDto = {
  //         title: "Task",
  //         projectId: project.id,
  //         parentId: parentTask.id,
  //       };

  //       const req = request(app.getHttpServer())
  //         .post(`/tasks`)
  //         .send(createSubtaskDto);

  //       const res = await attachAccessToken(req, accessToken);

  //       expect(res.status).toEqual(HttpStatus.CREATED);
  //     });
  //   });
  // });

  // describe("GET Get task by id", () => {
  //   let taskId: number;

  //   beforeEach(async () => {
  //     const createTaskDto: CreateTaskDto = {
  //       title: "Mock Task",
  //       projectId: project.id,
  //     };

  //     const req = request(app.getHttpServer())
  //       .post(`/tasks`)
  //       .send(createTaskDto);

  //     const res = await attachAccessToken(req, accessToken);

  //     taskId = parseInt(res.body.id);
  //   });

  //   it("should throw NotFoundException when a task does not exist", async () => {
  //     const taskId = 0;
  //     const req = request(app.getHttpServer()).get(`/tasks/${taskId}`);

  //     const res = await attachAccessToken(req, accessToken);

  //     expect(res.status).toEqual(HttpStatus.NOT_FOUND);
  //   });

  //   it("should return a Task", async () => {
  //     const req = request(app.getHttpServer()).get(`/tasks/${taskId}`);

  //     const res = await attachAccessToken(req, accessToken);

  //     expect(res.status).toEqual(HttpStatus.OK);
  //     expect(res.body).toBeDefined();
  //   });
  // });

  // describe("DELETE Delete a task", () => {
  //   let taskId: number;

  //   beforeEach(async () => {
  //     const createTaskDto: CreateTaskDto = {
  //       title: "Mock Task",
  //       projectId: project.id,
  //     };

  //     const req = request(app.getHttpServer())
  //       .post(`/tasks`)
  //       .send(createTaskDto);

  //     const res = await attachAccessToken(req, accessToken);

  //     taskId = parseInt(res.body.id);
  //   });

  //   it("should throw NotFoundException when a task does not exist", async () => {
  //     const taskId = 0;
  //     const req = request(app.getHttpServer()).delete(`/tasks/${taskId}`);

  //     const res = await attachAccessToken(req, accessToken);
  //     expect(res.status).toEqual(HttpStatus.NOT_FOUND);
  //   });

  //   it("should delete a Task", async () => {
  //     const req = request(app.getHttpServer()).delete(`/tasks/${taskId}`);

  //     const res = await attachAccessToken(req, accessToken);
  //     expect(res.status).toEqual(HttpStatus.NO_CONTENT);
  //   });
  // });

  // describe("PATCH Update task", () => {
  //   let taskId: number;

  //   beforeEach(async () => {
  //     const createTaskDto: CreateTaskDto = {
  //       title: "Mock Task",
  //       projectId: project.id,
  //     };

  //     const task = await prisma.task.create({
  //       data: {
  //         title: createTaskDto.title,
  //         projectId: createTaskDto.projectId,
  //         userId: user.id,
  //       },
  //     });

  //     taskId = task.id;
  //   });

  //   it("should throw NotFoundException when a task does not exist", async () => {
  //     const taskId = 0;
  //     const req = request(app.getHttpServer()).patch(`/tasks/${taskId}`);

  //     const res = await attachAccessToken(req, accessToken);
  //     expect(res.status).toEqual(HttpStatus.NOT_FOUND);
  //   });

  //   it("should update a Task", async () => {
  //     const updateTaskDto: UpdateTaskDto = {
  //       title: "Updated via PATCH",
  //       projectId: project.id,
  //     };

  //     const req = request(app.getHttpServer())
  //       .patch(`/tasks/${taskId}`)
  //       .send(updateTaskDto);

  //     const res = await attachAccessToken(req, accessToken);

  //     expect(res.status).toEqual(HttpStatus.OK);
  //   });
  // });

  // describe("POST Duplicate a task", () => {
  //   let task: Task;

  //   beforeEach(async () => {
  //     const createTaskDto: CreateTaskDto = {
  //       title: "Mock Task",
  //       projectId: project.id,
  //     };

  //     task = await prisma.task.create({
  //       data: {
  //         title: createTaskDto.title,
  //         projectId: createTaskDto.projectId,
  //         userId: user.id,
  //       },
  //     });
  //   });

  //   it("should throw BadRequestException when the project does not exist", async () => {
  //     const taskId = 0;
  //     const req = request(app.getHttpServer()).post(
  //       `/tasks/${taskId}/duplicate`,
  //     );

  //     const res = await attachAccessToken(req, accessToken);
  //     expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
  //   });

  //   it("should throw NotFoundException when the task does not exist", async () => {
  //     const req = request(app.getHttpServer()).post(`/tasks/0/duplicate`);

  //     const res = await attachAccessToken(req, accessToken);
  //     expect(res.status).toEqual(HttpStatus.NOT_FOUND);
  //   });

  //   it("should duplicate a Task", async () => {
  //     const req = request(app.getHttpServer()).post(
  //       `/tasks/${task.id}/duplicate`,
  //     );

  //     const res = await attachAccessToken(req, accessToken);
  //     const newTask: Task = res.body;

  //     expect(res.status).toEqual(HttpStatus.CREATED);
  //     expect(newTask.title).toEqual(task.title);
  //     expect(newTask.projectId).toEqual(task.projectId);
  //   });
  // });

  // describe("GET /tasks", () => {
  //   beforeEach(async () => {
  //     const date = new Date();
  //     date.setHours(0, 0, 0, 0);

  //     const yesterday = new Date(date);
  //     yesterday.setDate(date.getDate() - 1);

  //     const tomorrow = new Date(date);
  //     tomorrow.setDate(date.getDate() + 1);

  //     await prisma.task.createMany({
  //       data: [
  //         {
  //           title: "Task 1",
  //           projectId: project.id,
  //           userId: user.id,
  //           dueDate: yesterday.toISOString(),
  //           priority: Priority.HIGH,
  //         },
  //         {
  //           title: "Task 2",
  //           projectId: project.id,
  //           userId: user.id,
  //           dueDate: date.toISOString(),
  //           priority: Priority.MEDIUM,
  //         },
  //         {
  //           title: "Task 3",
  //           projectId: project.id,
  //           userId: user.id,
  //           dueDate: tomorrow,
  //           priority: Priority.LOW,
  //         },
  //         {
  //           title: "Task 4",
  //           projectId: project.id,
  //           userId: user.id,
  //           dueDate: tomorrow,
  //           priority: Priority.NONE,
  //         },
  //       ],
  //     });
  //   });

  //   it("should throw BadRequestException when the priority is invalid", async () => {
  //     const req = request(app.getHttpServer()).get(`/tasks?priority=-69420`);

  //     const res = await attachAccessToken(req, accessToken);

  //     expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
  //   });

  //   it("should return a paginated list of HIGH priority tasks", async () => {
  //     const req = request(app.getHttpServer()).get(
  //       `/tasks?priority=${Priority.HIGH}`,
  //     );

  //     const res = await attachAccessToken(req, accessToken);

  //     expect(res.status).toEqual(HttpStatus.OK);
  //     expect(res.body).toBeDefined();
  //     expect(res.body.data.length).toEqual(1);
  //     expect(res.body.data[0].priority).toEqual(Priority.HIGH);
  //   });

  //   it("should return a paginated list of MEDIUM priority tasks", async () => {
  //     const req = request(app.getHttpServer()).get(
  //       `/tasks?priority=${Priority.MEDIUM}`,
  //     );

  //     const res = await attachAccessToken(req, accessToken);

  //     expect(res.status).toEqual(HttpStatus.OK);
  //     expect(res.body).toBeDefined();
  //     expect(res.body.data.length).toEqual(1);
  //     expect(res.body.data[0].priority).toEqual(Priority.MEDIUM);
  //   });

  //   it("should return a paginated list of LOW priority tasks", async () => {
  //     const req = request(app.getHttpServer()).get(
  //       `/tasks?priority=${Priority.LOW}`,
  //     );

  //     const res = await attachAccessToken(req, accessToken);

  //     expect(res.status).toEqual(HttpStatus.OK);
  //     expect(res.body).toBeDefined();
  //     expect(res.body.data.length).toEqual(1);
  //     expect(res.body.data[0].priority).toEqual(Priority.LOW);
  //   });

  //   it("should return a paginated list of tasks", async () => {
  //     const req = request(app.getHttpServer()).get(`/tasks`);
  //     const res = await attachAccessToken(req, accessToken);

  //     expect(res.status).toEqual(HttpStatus.OK);
  //     expect(res.body).toBeDefined();
  //     expect(res.body.data.length).toEqual(4);
  //   });

  //   it("should return a paginated list of tasks sorted by due date", async () => {
  //     const req = request(app.getHttpServer()).get(
  //       `/tasks?orderBy=dueDate&dir=asc`,
  //     );
  //     const res = await attachAccessToken(req, accessToken);

  //     expect(res.status).toEqual(HttpStatus.OK);
  //     expect(res.body).toBeDefined();
  //     expect(res.body.data.length).toEqual(4);

  //     const taskDueDates: Date[] = res.body.data.map((task: Task) => {
  //       return new Date(task.dueDate);
  //     });

  //     expect(taskDueDates[0].getTime()).toBeLessThanOrEqual(
  //       taskDueDates[1].getTime(),
  //     );
  //     expect(taskDueDates[1].getTime()).toBeLessThanOrEqual(
  //       taskDueDates[2].getTime(),
  //     );
  //     expect(taskDueDates[2].getTime()).toBeLessThanOrEqual(
  //       taskDueDates[3].getTime(),
  //     );
  //   });

  //   it("should return a paginated list of tasks sorted by priority", async () => {
  //     const req = request(app.getHttpServer()).get(
  //       `/tasks?orderBy=priority&dir=desc`,
  //     );
  //     const res = await attachAccessToken(req, accessToken);

  //     expect(res.status).toEqual(HttpStatus.OK);
  //     expect(res.body).toBeDefined();
  //     expect(res.body.data.length).toEqual(4);
  //     expect(res.body.data[0].priority).toEqual(Priority.HIGH);
  //     expect(res.body.data[1].priority).toEqual(Priority.MEDIUM);
  //     expect(res.body.data[2].priority).toEqual(Priority.LOW);
  //     expect(res.body.data[3].priority).toEqual(Priority.NONE);
  //   });

  //   it("should return a paginated list of tasks sorted by title", async () => {
  //     const req = request(app.getHttpServer()).get(`/tasks?orderBy=title`);
  //     const res = await attachAccessToken(req, accessToken);

  //     expect(res.status).toEqual(HttpStatus.OK);
  //     expect(res.body).toBeDefined();
  //     expect(res.body.data.length).toEqual(4);
  //     expect(res.body.data[0].title).toEqual("Task 1");
  //     expect(res.body.data[1].title).toEqual("Task 2");
  //     expect(res.body.data[2].title).toEqual("Task 3");
  //     expect(res.body.data[3].title).toEqual("Task 4");
  //   });

  //   it("should return a paginated list of tasks sorted by title in descending order", async () => {
  //     const req = request(app.getHttpServer()).get(
  //       `/tasks?orderBy=title&dir=desc`,
  //     );
  //     const res = await attachAccessToken(req, accessToken);

  //     expect(res.status).toEqual(HttpStatus.OK);
  //     expect(res.body).toBeDefined();
  //     expect(res.body.data.length).toEqual(4);
  //     expect(res.body.data[0].title).toEqual("Task 4");
  //     expect(res.body.data[1].title).toEqual("Task 3");
  //     expect(res.body.data[2].title).toEqual("Task 2");
  //     expect(res.body.data[3].title).toEqual("Task 1");
  //   });

  //   it("should return a paginated list of today's tasks", async () => {
  //     const start = new Date();
  //     start.setHours(0, 0, 0, 0);

  //     const end = new Date(start);
  //     end.setHours(23, 59, 59, 999);

  //     const req = request(app.getHttpServer()).get(
  //       `/tasks?startDate=${start.toISOString()}&endDate=${end.toISOString()}`,
  //     );

  //     const res = await attachAccessToken(req, accessToken);

  //     expect(res.status).toEqual(HttpStatus.OK);
  //     expect(res.body).toBeDefined();
  //     expect(res.body.data.length).toEqual(1);
  //   });

  //   it("should return a paginated list of tasks with a due date in the future", async () => {
  //     const today = new Date();
  //     today.setHours(0, 0, 0, 0);

  //     const tomorrow = new Date(today);
  //     tomorrow.setDate(tomorrow.getDate() + 1);

  //     const req = request(app.getHttpServer()).get(
  //       `/tasks?startDate=${tomorrow.toISOString()}`,
  //     );

  //     const res = await attachAccessToken(req, accessToken);

  //     expect(res.status).toEqual(HttpStatus.OK);
  //     expect(res.body).toBeDefined();
  //     expect(res.body.data.length).toEqual(2);
  //   });

  //   it("should return a paginated list of tasks with a due date in the past", async () => {
  //     const today = new Date();
  //     today.setHours(0, 0, 0, 0);

  //     const yesterday = new Date(today);
  //     yesterday.setDate(yesterday.getDate() - 1);

  //     const req = request(app.getHttpServer()).get(
  //       `/tasks?endDate=${yesterday.toISOString()}`,
  //     );

  //     const res = await attachAccessToken(req, accessToken);

  //     expect(res.status).toEqual(HttpStatus.OK);
  //     expect(res.body).toBeDefined();
  //     expect(res.body.data.length).toEqual(1);
  //   });

  //   it("should return a paginated list of tasks with a due date in the past and a priority of HIGH", async () => {
  //     const today = new Date();
  //     today.setHours(0, 0, 0, 0);

  //     const yesterday = new Date(today);
  //     yesterday.setDate(yesterday.getDate() - 1);

  //     const req = request(app.getHttpServer()).get(
  //       `/tasks?endDate=${yesterday.toISOString()}&priority=${Priority.HIGH}`,
  //     );

  //     const res = await attachAccessToken(req, accessToken);

  //     expect(res.status).toEqual(HttpStatus.OK);
  //     expect(res.body).toBeDefined();
  //     expect(res.body.data.length).toEqual(1);
  //     expect(res.body.data[0].priority).toEqual(Priority.HIGH);
  //   });

  //   it("should return a paginated list of tasks with a due date in the past and a priority of MEDIUM", async () => {
  //     const today = new Date();
  //     today.setHours(0, 0, 0, 0);

  //     const yesterday = new Date(today);
  //     yesterday.setDate(yesterday.getDate() - 1);

  //     const req = request(app.getHttpServer()).get(
  //       `/tasks?endDate=${yesterday.toISOString()}&priority=${Priority.MEDIUM}`,
  //     );

  //     const res = await attachAccessToken(req, accessToken);

  //     expect(res.status).toEqual(HttpStatus.OK);
  //     expect(res.body).toBeDefined();
  //     expect(res.body.data.length).toEqual(0);
  //   });

  //   it('should return a paginated list of today\'s tasks using "gte" and "lte"', async () => {
  //     const lowerBound = new Date();
  //     lowerBound.setHours(0, 0, 0, 0);

  //     const upperBound = new Date(lowerBound);
  //     upperBound.setHours(23, 59, 59, 999);

  //     const req = request(app.getHttpServer()).get(
  //       `/tasks?gte=${lowerBound.getTime()}&lte=${upperBound.getTime()}`,
  //     );

  //     const res = await attachAccessToken(req, accessToken);

  //     expect(res.status).toEqual(HttpStatus.OK);
  //     expect(res.body).toBeDefined();
  //     expect(res.body.data.length).toEqual(1);
  //   });
  // });
});
