export interface WorkspaceDto {
  id: string;
  name: string;
  description: string | null;
  public: boolean;
  ownerId: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
