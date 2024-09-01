import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateBoardDto {
  @IsString()
  @MaxLength(128)
  name: string;

  @IsUUID()
  workspaceId: string;

  @IsOptional()
  @MaxLength(255)
  description?: string;
}
