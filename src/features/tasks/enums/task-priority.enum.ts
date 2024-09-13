export enum TaskPriority {
  NONE = "NONE",
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export namespace TaskPriorityUtils {
  export function fromString(value: string): TaskPriority {
    switch (value) {
      case TaskPriority.NONE:
        return TaskPriority.NONE;
      case TaskPriority.LOW:
        return TaskPriority.LOW;
      case TaskPriority.MEDIUM:
        return TaskPriority.MEDIUM;
      case TaskPriority.HIGH:
        return TaskPriority.HIGH;
      default:
        throw new Error(`Invalid value ${value}`);
    }
  }

  export function parse(value: string | null): TaskPriority[] {
    if (value === null) {
      return [];
    }

    return value.split(",").map((v) => fromString(v));
  }
}
