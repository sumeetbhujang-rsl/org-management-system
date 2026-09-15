export enum ErrorCode {
  DuplicateId = "DUPLICATE_ID",
  EmployeeNotFound = "EMPLOYEE_NOT_FOUND",
  InvalidHierarchy = "INVALID_HIERARCHY",
  CeoAlreadyExists = "CEO_ALREADY_EXISTS",
  InvalidDateFormat = "INVALID_DATE_FORMAT",
  MissingRequiredField = "MISSING_REQUIRED_FIELD",
  InvalidReference = "INVALID_REFERENCE",
  HasReportees = "HAS_REPORTEES",
}

export class OrganizationError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string
  ) {
    super(message);
    this.name = "OrganizationError";
  }
}
