import { Employee } from "./employee";

// reportees is maintained by Organization, so it is not part of the input.
export type CreateEmployeeInput = Omit<Employee, "reportees">;

export type UpdateEmployeeInput = {
  name?: string;
  dateOfBirth?: string;
  reportsTo?: string | null;
};
