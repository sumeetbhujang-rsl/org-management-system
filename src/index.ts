import { Organization } from "./organization";
import { Designation } from "./models/designation";
import { CreateEmployeeInput } from "./models/employee.input";
import { OrganizationError } from "./models/errors";

const org = new Organization();

function attempt(label: string, fn: () => void): void {
  try {
    fn();
    console.log(`OK    | ${label}`);
  } catch (e) {
    if (e instanceof OrganizationError) {
      console.log(`FAIL  | ${label} -> [${e.code}] ${e.message}`);
    } else {
      throw e; // not a validation failure, so let it surface
    }
  }
}

function printEmployee(id: string): void {
  const e = org.getById(id);
  console.log(
    `${e.id.padEnd(7)}| ${e.name.padEnd(18)}| ${e.designation.padEnd(9)}| reportsTo=${String(e.reportsTo).padEnd(7)}| reportees=[${e.reportees.join(", ")}]`
  );
}

console.log("\n===== 1. Seed the organization (top-down so reportsTo is always valid) =====");
// ---------------------------------------------------------------------------

const seed: CreateEmployeeInput[] = [
  { id: "ceo-1", name: "Riya Sharma", dateOfBirth: "01/15/1970", designation: Designation.CEO, reportsTo: null },

  { id: "dir-1", name: "Arjun Mehta", dateOfBirth: "03/22/1978", designation: Designation.Director, reportsTo: "ceo-1" },
  { id: "dir-2", name: "Meera Iyer", dateOfBirth: "09/04/1976", designation: Designation.Director, reportsTo: "ceo-1" },

  { id: "mgr-1", name: "Neha Kulkarni", dateOfBirth: "07/09/1985", designation: Designation.Manager, reportsTo: "dir-1" },
  { id: "mgr-2", name: "Vikram Shetty", dateOfBirth: "12/17/1983", designation: Designation.Manager, reportsTo: "dir-1" },
  { id: "mgr-3", name: "Anita Rao", dateOfBirth: "02/28/1982", designation: Designation.Manager, reportsTo: "dir-2" },

  { id: "lead-1", name: "Sameer Rao", dateOfBirth: "11/30/1990", designation: Designation.Lead, reportsTo: "mgr-1" },
  { id: "lead-2", name: "Kavita Desai", dateOfBirth: "08/19/1988", designation: Designation.Lead, reportsTo: "mgr-1" },
  { id: "lead-3", name: "Rohit Menon", dateOfBirth: "04/06/1989", designation: Designation.Lead, reportsTo: "mgr-2" },

  { id: "eng-1", name: "Priya Nair", dateOfBirth: "05/12/1995", designation: Designation.Engineer, reportsTo: "lead-1" },
  { id: "eng-2", name: "Karan Joshi", dateOfBirth: "06/23/1996", designation: Designation.Engineer, reportsTo: "lead-1" },
  { id: "eng-3", name: "Divya Pillai", dateOfBirth: "10/01/1994", designation: Designation.Engineer, reportsTo: "lead-1" },
  { id: "eng-4", name: "Nikhil Bose", dateOfBirth: "01/08/1997", designation: Designation.Engineer, reportsTo: "lead-2" },
  { id: "eng-5", name: "Farhan Qureshi", dateOfBirth: "03/14/1993", designation: Designation.Engineer, reportsTo: "lead-3" },
];

for (const input of seed) {
  const added = org.add(input);
  console.log(`added ${added.designation.padEnd(9)} ${added.id.padEnd(7)} ${added.name}`);
}

console.log("\n===== 2. Retrieve all employees =====");
// ---------------------------------------------------------------------------

console.log(`total employees: ${org.getAll().length}`);
for (const e of org.getAll()) {
  printEmployee(e.id);
}

console.log("\n===== 3. Retrieve a specific employee by id =====");
// ---------------------------------------------------------------------------

const lead1 = org.getById("lead-1");
console.log(`${lead1.id} is ${lead1.name}, a ${lead1.designation} with ${lead1.reportees.length} reportees:`, lead1.reportees);

console.log("\n===== 4. Update an employee's name and date of birth =====");
// ---------------------------------------------------------------------------

const renamed = org.update("eng-1", { name: "Priya Nair-Kapoor" });
console.log("renamed eng-1 to:", renamed.name);

const rescheduled = org.update("eng-1", { dateOfBirth: "05/12/1996" });
console.log("updated eng-1 date of birth to:", rescheduled.dateOfBirth);

console.log("\n===== 5. Move an engineer to a different lead =====");
// ---------------------------------------------------------------------------

console.log("before the move:");
printEmployee("lead-1");
printEmployee("lead-3");

const moved = org.update("eng-1", { reportsTo: "lead-3" });
console.log(`moved eng-1 to ${moved.reportsTo}`);

console.log("after the move:");
printEmployee("lead-1");
printEmployee("lead-3");

console.log("\n===== 6. Validation & edge cases (these are expected to FAIL) =====");
// ---------------------------------------------------------------------------

attempt("Add an employee with an id that is already taken", () =>
  org.add({
    id: "eng-1",
    name: "Duplicate Id",
    dateOfBirth: "04/04/1993",
    designation: Designation.Engineer,
    reportsTo: "lead-1",
  })
);

attempt("Add a second CEO", () =>
  org.add({
    id: "ceo-2",
    name: "Fake CEO",
    dateOfBirth: "01/01/1980",
    designation: Designation.CEO,
    reportsTo: null,
  })
);

attempt("Add employee with a bad date format", () =>
  org.add({
    id: "eng-6",
    name: "Bad Date",
    dateOfBirth: "1995-05-12", // wrong format
    designation: Designation.Engineer,
    reportsTo: "lead-1",
  })
);

attempt("Add engineer reporting to a Manager (wrong level)", () =>
  org.add({
    id: "eng-7",
    name: "Wrong Hierarchy",
    dateOfBirth: "02/02/1992",
    designation: Designation.Engineer,
    reportsTo: "mgr-1", // should be a Lead, not a Manager
  })
);

attempt("Add employee with an empty name", () =>
  org.add({
    id: "eng-8",
    name: "   ",
    dateOfBirth: "02/02/1992",
    designation: Designation.Engineer,
    reportsTo: "lead-1",
  })
);

attempt("Add employee whose manager id does not exist", () =>
  org.add({
    id: "eng-9",
    name: "Dangling Ref",
    dateOfBirth: "02/02/1992",
    designation: Designation.Engineer,
    reportsTo: "emp-999",
  })
);

attempt("Update a non-existent employee", () =>
  org.update("emp-999", { name: "Nobody" })
);

attempt("Move an engineer under a Director (wrong level)", () =>
  org.update("eng-3", { reportsTo: "dir-1" })
);

attempt("Delete a manager who still has reportees", () => org.delete("mgr-1"));

attempt("Delete an employee who does not exist", () => org.delete("emp-999"));

console.log("\n===== 7. A CEO must report to no one (checked on a fresh organization) =====");
// ---------------------------------------------------------------------------

// a fresh organization, otherwise the "only one CEO" rule fires first
const newOrg = new Organization();

attempt("Add a CEO who reports to someone", () =>
  newOrg.add({
    id: "ceo-1",
    name: "Reporting CEO",
    dateOfBirth: "01/01/1975",
    designation: Designation.CEO,
    reportsTo: "dir-1",
  })
);

console.log("\n===== 8. Delete an employee who has no reportees =====");
// ---------------------------------------------------------------------------

console.log("before the delete:");
printEmployee("lead-1");

org.delete("eng-2");
console.log("deleted eng-2");

console.log("after the delete:");
printEmployee("lead-1");
console.log(`total employees: ${org.getAll().length}`);

console.log("\n===== Demo complete =====");
