import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SectionsController } from './sections.controller';
import { SectionsService } from './sections.service';

@Module({
  controllers: [SectionsController],
  providers: [SectionsService],
  imports: [PrismaModule],
})
export class SectionsModule {}
