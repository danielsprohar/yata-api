export class ProjectNotFoundException extends Error {
  constructor() {
    super('Project not found');
  }
}
