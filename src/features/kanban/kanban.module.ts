import { Module } from '@nestjs/common';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { ColumnsController } from './columns.controller';
import { ColumnsService } from './columns.service';

@Module({
  controllers: [BoardsController, ColumnsController],
  providers: [BoardsService, ColumnsService],
})
export class KanbanModule {}
