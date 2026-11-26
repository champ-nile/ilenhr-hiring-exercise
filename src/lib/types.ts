export const leaveTypes = ["Annual leave", "Sick leave", "Personal leave"] as const;
export type LeaveType = (typeof leaveTypes)[number];
export type Employee = {
  id: string; name: string; email: string; title: string;
  department: string; managerId: string | null;
};
// Only drafts exist in the starter. Candidates design the request lifecycle.
export type Draft = {
  id: string; employeeId: string; leaveType: LeaveType;
  startDate: string | null; endDate: string | null; note: string;
  createdAt: string; updatedAt: string;
};
export type DraftInput = Pick<Draft, "leaveType" | "startDate" | "endDate" | "note">;
export type Workspace = { actor: Employee; employees: Employee[]; drafts: Draft[] };
