import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerGuard } from '@nestjs/throttler/dist/throttler.guard';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ProjectsModule } from './features/projects/projects.module';
import { SectionsModule } from './features/sections/sections.module';
import { TasksModule } from './features/tasks/tasks.module';
import { WorkspacesModule } from './features/workspaces/workspaces.module';
import { PrismaModule } from './prisma/prisma.module';

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
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
