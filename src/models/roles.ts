import { Employee } from "./employee";
import { Designation } from "./designation";

export class Engineer extends Employee {
  readonly designation = Designation.Engineer;
}

export class Lead extends Employee {
  readonly designation = Designation.Lead;
}

export class Manager extends Employee {
  readonly designation = Designation.Manager;
}

export class Director extends Employee {
  readonly designation = Designation.Director;
}

export class CEO extends Employee {
  readonly designation = Designation.CEO;

  constructor(id: string, name: string, dateOfBirth: string) {
    super(id, name, dateOfBirth, null);
  }
}