import { TaskStatus } from "@prisma/client";
import {
  registerDecorator,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { TaskStatusUtils } from "../enums/task-status.enum";

@ValidatorConstraint({ name: "taskPriorityFilter", async: false })
export class IsTaskStatusFilterConstraint
  implements ValidatorConstraintInterface
{
  private readonly validValues = Object.values(TaskStatus);

  validate(value: any) {
    if (typeof value !== "string") {
      return false;
    }

    const tokens = value.split(",");
    try {
      for (const token of tokens) {
        if (!this.validValues.includes(TaskStatusUtils.fromString(token))) {
          return false;
        }
      }

      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  defaultMessage() {
    return (
      `Status must be one of the following values: ` +
      this.validValues.join(", ")
    );
  }
}

export function IsTaskStatusFilter() {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: {},
      constraints: [],
      validator: IsTaskStatusFilterConstraint,
    });
  };
}
