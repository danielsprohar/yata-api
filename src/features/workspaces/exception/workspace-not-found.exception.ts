export class WorkspaceNotFoundException extends Error {
  constructor() {
    super('Workspace not found');
  }
}
