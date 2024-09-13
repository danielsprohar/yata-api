export enum TaskStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export namespace TaskStatusUtils {
  export function fromString(value: string): TaskStatus {
    switch (value) {
      case TaskStatus.NOT_STARTED:
        return TaskStatus.NOT_STARTED;
      case TaskStatus.IN_PROGRESS:
        return TaskStatus.IN_PROGRESS;
      case TaskStatus.COMPLETED:
        return TaskStatus.COMPLETED;
      default:
        throw new Error(`Invalid value ${value}`);
    }
  }

  export function parse(value: string | null): TaskStatus[] {
    if (value === null) {
      return [];
    }

    return value.split(",").map((v) => fromString(v));
  }
}
