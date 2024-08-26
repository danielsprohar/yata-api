interface WorkspaceModel {
  id: string;
  name: string;
  description: string | null;
  public: boolean;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
