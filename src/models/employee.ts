import { Designation } from "./designation";

export abstract class Employee {
  abstract readonly designation: Designation;
  reportees: string[] = [];

  constructor(
    public readonly id: string,
    public name: string,
    public dateOfBirth: string,
    public reportsTo: string | null
  ) {}
}