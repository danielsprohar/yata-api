export class TaskNotFoundException extends Error {
  constructor() {
    super('Task not found');
  }
}
