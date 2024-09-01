import { PartialType } from '@nestjs/swagger';
import { CreateKanbanColumnDto } from './create-kanban-column.dto';

export class UpdateKanbanDto extends PartialType(CreateKanbanColumnDto) {}
