# Organization Management System

A TypeScript program that models an organization of employees (Engineer, Lead, Manager,
Director and CEO) and supports CRUD operations on them along with the validation rules
that keep the reporting hierarchy consistent.

There is no UI. `src/index.ts` seeds an organization of 14 employees with mock data and
runs through every operation, printing the result of each one to the console.

## Setup

Requires Node.js 18 or newer.

```bash
npm install
```

## Execution

Run directly from the TypeScript sources:

```bash
npm run dev
```

Or compile to JavaScript first and run the output:

```bash
npm run build
npm start
```

`npm run build` writes the generated JavaScript into `dist/`, as configured by `outDir`
in `tsconfig.json`.

## Project structure

```
src/
  index.ts                  driver script, exercises every operation with mock data
  organization.ts           the Organization class: CRUD operations and validation
  models/
    designation.ts          Designation enum
    employee.ts             abstract Employee base class with the shared fields
    roles.ts                the five classes that extend Employee
    hierarchy.ts            REPORTS_TO, the map of which role reports to which
    employee.factory.ts     builds the right subclass for a given designation
    employee.input.ts       input types for add() and update()
    errors.ts               ErrorCode enum and the OrganizationError class
tsconfig.json               compiler options
```

## Design approach

`Employee` is an abstract class holding the fields every employee has: `id`, `name`,
`dateOfBirth`, `reportsTo` and `reportees`. It declares `designation` as an abstract
readonly field, so each of the five subclasses in `roles.ts` has to pin it to its own
enum member. Since the base class is abstract it cannot be instantiated on its own,
which means there is no way to end up with an employee that has no designation. `CEO`
also overrides the constructor to force `reportsTo` to `null`.

The reporting rules live in one place. `hierarchy.ts` holds a single
`Record<Designation, Designation | null>` mapping each role to the role above it, and
all hierarchy validation reads from that map. Adding a new designation means adding one
entry there instead of editing a chain of if statements. It also means an Engineer can
never pick up reportees, because Engineer is never a value in the map, so nothing is
allowed to report to one.

`createEmployee` in `employee.factory.ts` is the only place that maps a `Designation` to
a concrete class. Its switch ends in a default branch that assigns the value to a
`never` variable, so adding a designation to the enum without a matching case fails at
compile time rather than at runtime.

Validation failures throw an `OrganizationError` carrying an `ErrorCode` alongside the
message, so a caller can narrow with `instanceof` and then switch on the code. That is
what the `attempt` helper in `index.ts` does to tell a rejected operation apart from a
genuine bug.

`reportees` is maintained by `Organization` itself and cannot be passed in, because
`CreateEmployeeInput` is `Omit<Employee, "reportees">`. Whenever an employee is added,
moved or deleted, the manager's list is updated in the same operation, so the two
directions of a reporting relationship cannot disagree.

## Validation rules

- Employee ids must be unique (`DUPLICATE_ID`)
- `id`, `name` and `dateOfBirth` cannot be empty (`MISSING_REQUIRED_FIELD`)
- `dateOfBirth` must be in `mm/dd/yyyy` format (`INVALID_DATE_FORMAT`)
- `reportsTo` must point at an employee that exists (`INVALID_REFERENCE`)
- `reportsTo` must point at the correct role for the designation (`INVALID_HIERARCHY`)
- The CEO must report to nobody (`INVALID_HIERARCHY`)
- Only one CEO may exist (`CEO_ALREADY_EXISTS`)
- Updating or deleting an unknown id is rejected (`EMPLOYEE_NOT_FOUND`)
- Deleting an employee who still has reportees is rejected (`HAS_REPORTEES`)

## Assumptions

Ids are supplied by the caller rather than generated, since rejecting duplicate ids only
means something if the caller chooses the id.

Deletion is rejected while reportees remain, rather than reassigning them. The
requirements allow either. Rejecting is safer, as moving a whole team to a new manager
should be an explicit decision, done by re-pointing each reportee with `update()` first.

`designation` cannot be changed through `update()`. Changing someone's role would
invalidate both their own `reportsTo` and the `reportsTo` of everyone under them, so
only `name`, `dateOfBirth` and `reportsTo` are updatable.

`dateOfBirth` is stored as an `mm/dd/yyyy` string. The format is checked with a regular
expression that limits the month to 01-12 and the day to 01-31, but it does not check
the day against the specific month, so `02/31/1990` passes.

Data is held in memory only, in a `Map` inside `Organization`, for the lifetime of the
process. There is no persistence.

Employees have to be added top-down, because `reportsTo` must reference an employee who
already exists. The seed data in `index.ts` starts from the CEO for that reason.
