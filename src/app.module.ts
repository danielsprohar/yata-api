import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerGuard } from '@nestjs/throttler/dist/throttler.guard';
import { ProjectsModule } from './features/projects/projects.module';
import { TasksModule } from './features/tasks/tasks.module';
import { WorkspacesModule } from './features/workspaces/workspaces.module';
import { PrismaModule } from './prisma/prisma.module';
import { KanbanModule } from './features/kanban/kanban.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ThrottlerModule.forRoot({
      ttl: 10,
      limit: 10,
    }),
    PrismaModule,
    ProjectsModule,
    TasksModule,
    WorkspacesModule,
    KanbanModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
