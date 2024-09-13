import {
  registerDecorator,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { TaskPriority } from "../enums/task-priority.enum";

@ValidatorConstraint({ name: "taskPriorityFilter", async: false })
export class IsTaskPriorityFilterContraint
  implements ValidatorConstraintInterface
{
  private readonly validValues = Object.values(TaskPriority);

  validate(value: any) {
    return this.validValues.includes(value);
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
