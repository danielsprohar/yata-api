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
import {
  bufferToUuid,
  generatePrimaryKey,
  uuidToBuffer,
} from "../src/core/utils/uuid.util";
import { TagDto } from "../src/features/tasks/dto/tag.dto";
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

describe("TagsController", () => {
  let app: INestApplication;
  let dbContainer: StartedMySqlContainer;
  let prismaClient: PrismaClient;
  let prisma: PrismaService;

  let workspace: Workspace;
  let project: Project;
  let task: Task;
  let tag: Tag;

  beforeAll(async () => {
    dbContainer = await new MySqlContainer("mysql:9")
      .withDatabase("yata")
      .withUser("root")
      .withRootPassword("password")
      .start();

    process.env.DATABASE_URL = dbContainer.getConnectionUri();
    prismaClient = new PrismaClient({
      datasources: {
        db: {
          url: dbContainer.getConnectionUri(),
        },
      },
    });

    // Run Prisma migrations
    execSync("npx prisma migrate deploy", {
      env: {
        DATABASE_URL: dbContainer.getConnectionUri(),
      },
    });

    return await prismaClient.$connect();
  });

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

    task = await prisma.task.create({
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
          connect: {
            id: tag.id,
          },
        },
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

    await prisma.$disconnect();
  });

  afterAll(async () => {
    await app.close();
    await prismaClient.$disconnect();
    await dbContainer.stop();
  });

  describe("GET /tags/:tagId", () => {
    it("should fetch a tag by ID", async () => {
      const tagId = bufferToUuid(tag.id);

      const res = await request(app.getHttpServer()).get(`/tags/${tagId}`);

      expect(res.status).toEqual(HttpStatus.OK);

      const tagDto = res.body as TagDto;

      expect(tagDto.name).toEqual(tag.name);
    });
  });
});
