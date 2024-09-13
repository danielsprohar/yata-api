import { TaskStatus } from "@prisma/client";
import {
  registerDecorator,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";

@ValidatorConstraint({ name: "taskPriorityFilter", async: false })
export class IsTaskStatusFilterConstraint
  implements ValidatorConstraintInterface
{
  private readonly validValues = Object.values(TaskStatus);

  validate(value: any) {
    return this.validValues.includes(value);
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
