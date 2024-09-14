import {
  registerDecorator,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { TaskPriority, TaskPriorityUtils } from "../enums/task-priority.enum";

@ValidatorConstraint({ name: "taskPriorityFilter", async: false })
export class IsTaskPriorityFilterContraint
  implements ValidatorConstraintInterface
{
  private readonly validValues = Object.values(TaskPriority);

  validate(value: any) {
    if (typeof value !== "string") {
      return false;
    }

    const tokens = value.split(",");
    try {
      for (const token of tokens) {
        if (!this.validValues.includes(TaskPriorityUtils.fromString(token))) {
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
      `Priority must be one of the following values: ` +
      this.validValues.join(", ")
    );
  }
}

export function IsTaskPriorityFilter() {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: {},
      constraints: [],
      validator: IsTaskPriorityFilterContraint,
    });
  };
}
