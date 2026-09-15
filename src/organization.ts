import { Employee } from "./models/employee";
import { CreateEmployeeInput, UpdateEmployeeInput } from "./models/employee.input";
import { createEmployee } from "./models/employee.factory";
import { Designation } from "./models/designation";
import { REPORTS_TO } from "./models/hierarchy";
import { ErrorCode, OrganizationError } from "./models/errors";

export class Organization {
  private employees = new Map<string, Employee>();

  private hasCeo(): boolean {
    return this.getAll().some((e) => e.designation === Designation.CEO);
  }

  private detachFromManager(id: string, managerId: string | null): void {
    if (!managerId) return;
    const manager = this.employees.get(managerId);
    if (manager) {
      manager.reportees = manager.reportees.filter((rid) => rid !== id);
    }
  }

  private attachToManager(id: string, managerId: string | null): void {
    if (!managerId) return;
    this.employees.get(managerId)?.reportees.push(id);
  }

  private requireField(value: string, field: string): void {
    if (!value || value.trim() === "") {
      throw new OrganizationError(
        ErrorCode.MissingRequiredField,
        `Missing required field: "${field}".`
      );
    }
  }

  private validateDateFormat(dateOfBirth: string): void {
    const pattern = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
    if (!pattern.test(dateOfBirth)) {
      throw new OrganizationError(
        ErrorCode.InvalidDateFormat,
        `Invalid date "${dateOfBirth}". Expected format mm/dd/yyyy.`
      );
    }
  }

  private validateUniqueId(id: string): void {
    if (this.employees.has(id)) {
      throw new OrganizationError(
        ErrorCode.DuplicateId,
        `Employee with id "${id}" already exists.`
      );
    }
  }

  private validateSingleCeo(designation: Designation): void {
    if (designation === Designation.CEO && this.hasCeo()) {
      throw new OrganizationError(
        ErrorCode.CeoAlreadyExists,
        "An organization can have only one CEO."
      );
    }
  }

  private validateHierarchy(
    designation: Designation,
    reportsTo: string | null
  ): void {
    const expected = REPORTS_TO[designation];

    // only the CEO has nobody above them
    if (expected === null) {
      if (reportsTo !== null) {
        throw new OrganizationError(
          ErrorCode.InvalidHierarchy,
          "The CEO cannot report to anyone."
        );
      }
      return;
    }

    if (reportsTo === null) {
      throw new OrganizationError(
        ErrorCode.MissingRequiredField,
        `Missing required field: "reportsTo".`
      );
    }

    const manager = this.employees.get(reportsTo);
    if (!manager) {
      throw new OrganizationError(
        ErrorCode.InvalidReference,
        `reportsTo points to an employee that does not exist: "${reportsTo}".`
      );
    }

    if (manager.designation !== expected) {
      throw new OrganizationError(
        ErrorCode.InvalidHierarchy,
        `${designation} must report to ${expected}, but "${reportsTo}" is ${manager.designation}.`
      );
    }
  }

  private validateNewEmployee(input: CreateEmployeeInput): void {
    this.requireField(input.id, "id");
    this.requireField(input.name, "name");
    this.requireField(input.dateOfBirth, "dateOfBirth");
    this.validateUniqueId(input.id);
    this.validateDateFormat(input.dateOfBirth);
    this.validateSingleCeo(input.designation);
    this.validateHierarchy(input.designation, input.reportsTo);
  }

  add(input: CreateEmployeeInput): Employee {
    this.validateNewEmployee(input);

    const employee = createEmployee(input);
    this.employees.set(employee.id, employee);

    this.attachToManager(employee.id, employee.reportsTo);
    return employee;
  }

  getAll(): Employee[] {
    return Array.from(this.employees.values());
  }

  getById(id: string): Employee {
    const employee = this.employees.get(id);
    if (!employee) {
      throw new OrganizationError(
        ErrorCode.EmployeeNotFound,
        `Employee not found: "${id}".`
      );
    }
    return employee;
  }

  update(id: string, changes: UpdateEmployeeInput): Employee {
    const employee = this.getById(id);

    if (changes.name !== undefined) {
      this.requireField(changes.name, "name");
      employee.name = changes.name;
    }

    if (changes.dateOfBirth !== undefined) {
      this.validateDateFormat(changes.dateOfBirth);
      employee.dateOfBirth = changes.dateOfBirth;
    }

    if (changes.reportsTo !== undefined && changes.reportsTo !== employee.reportsTo) {
      this.validateHierarchy(employee.designation, changes.reportsTo);
      this.detachFromManager(id, employee.reportsTo);
      this.attachToManager(id, changes.reportsTo);
      employee.reportsTo = changes.reportsTo;
    }

    return employee;
  }

  delete(id: string): void {
    const employee = this.getById(id);

    if (employee.reportees.length > 0) {
      throw new OrganizationError(
        ErrorCode.HasReportees,
        `Cannot delete "${id}" because they still have reportees.`
      );
    }

    this.detachFromManager(id, employee.reportsTo);
    this.employees.delete(id);
  }
}
