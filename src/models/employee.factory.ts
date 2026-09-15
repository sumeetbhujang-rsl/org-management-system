import { Employee } from "./employee";
import { Engineer, Lead, Manager, Director, CEO } from "./roles";
import { Designation } from "./designation";
import { CreateEmployeeInput } from "./employee.input";

export function createEmployee(input: CreateEmployeeInput): Employee {
  const { id, name, dateOfBirth, designation, reportsTo } = input;

  switch (designation) {
    case Designation.Engineer:
      return new Engineer(id, name, dateOfBirth, reportsTo);
    case Designation.Lead:
      return new Lead(id, name, dateOfBirth, reportsTo);
    case Designation.Manager:
      return new Manager(id, name, dateOfBirth, reportsTo);
    case Designation.Director:
      return new Director(id, name, dateOfBirth, reportsTo);
    case Designation.CEO:
      return new CEO(id, name, dateOfBirth);
    default:
      const _exhaustive: never = designation;
      throw new Error(`Unhandled designation: ${_exhaustive}`);
  }
}