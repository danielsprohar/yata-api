import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { ThrottlerGuard } from "@nestjs/throttler/dist/throttler.guard";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { ProjectsModule } from "./features/projects/projects.module";
import { SectionsModule } from "./features/sections/sections.module";
import { TasksModule } from "./features/tasks/tasks.module";
import { WorkspacesModule } from "./features/workspaces/workspaces.module";
import { PrismaModule } from "./prisma/prisma.module";
import { TagsModule } from './features/tags/tags.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          limit: 69,
          ttl: 60,
        },
      ],
    }),
    AuthModule,
    PrismaModule,
    ProjectsModule,
    SectionsModule,
    TasksModule,
    WorkspacesModule,
    TagsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useExisting: JwtAuthGuard,
    },
    JwtAuthGuard,
  ],
})
export class AppModule {}

@Module({
  imports: [
    ConfigModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          limit: 69,
          ttl: 60,
        },
      ],
    }),
    AuthModule,
    PrismaModule,
    ProjectsModule,
    SectionsModule,
    TasksModule,
    WorkspacesModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class NoAuthAppTestModule {}
