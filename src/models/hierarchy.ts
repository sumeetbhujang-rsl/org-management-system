import { Designation } from "./designation";

export const REPORTS_TO: Record<Designation, Designation | null> = {
  [Designation.Engineer]: Designation.Lead,
  [Designation.Lead]: Designation.Manager,
  [Designation.Manager]: Designation.Director,
  [Designation.Director]: Designation.CEO,
  [Designation.CEO]: null,
};
