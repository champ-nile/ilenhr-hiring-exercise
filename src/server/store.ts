import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { leaveTypes, type Draft, type DraftInput, type Employee } from "../lib/types";

export class AppError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export const demoEmployees: Employee[] = [
  { id: "leyla", name: "Leyla Mammadova", email: "leyla@example.test", title: "Engineering Manager", department: "Engineering", managerId: null },
  { id: "aydan", name: "Aydan Aliyeva", email: "aydan@example.test", title: "Frontend Engineer", department: "Engineering", managerId: "leyla" },
  { id: "murad", name: "Murad Hasanov", email: "murad@example.test", title: "Backend Engineer", department: "Engineering", managerId: "leyla" },
  { id: "kamran", name: "Kamran Safarov", email: "kamran@example.test", title: "Design Manager", department: "Design", managerId: null },
  { id: "nigar", name: "Nigar Abbasova", email: "nigar@example.test", title: "Product Designer", department: "Design", managerId: "kamran" },
];

function optionalDate(value: unknown): string | null {
  if (value === null || value === "" || value === undefined) return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new AppError(400, "Use YYYY-MM-DD for dates.");
  const date = new Date(value + "T00:00:00.000Z");
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new AppError(400, "Enter a real calendar date.");
  return value;
}

export function parseDraft(value: unknown): DraftInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new AppError(400, "Expected a draft object.");
  const input = value as Record<string, unknown>;
  if (!leaveTypes.includes(input.leaveType as never)) throw new AppError(400, "Choose a supported leave type.");
  if (typeof input.note !== "string" || input.note.length > 2000) throw new AppError(400, "Notes must be text, up to 2,000 characters.");
  // Drafts may be incomplete. Submission validation is part of the exercise.
  return { leaveType: input.leaveType as DraftInput["leaveType"], startDate: optionalDate(input.startDate), endDate: optionalDate(input.endDate), note: input.note.trim() };
}

export function openStore(filename: string) {
  if (filename !== ":memory:") mkdirSync(dirname(resolve(filename)), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL, department TEXT NOT NULL,
      managerId TEXT REFERENCES employees(id)
    );
    CREATE TABLE IF NOT EXISTS drafts (
      id TEXT PRIMARY KEY, employeeId TEXT NOT NULL REFERENCES employees(id),
      leaveType TEXT NOT NULL CHECK(leaveType IN ('Annual leave','Sick leave','Personal leave')),
      startDate TEXT, endDate TEXT, note TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS drafts_employee ON drafts(employeeId);
  `);
  const employees = () => db.prepare("SELECT * FROM employees ORDER BY name").all() as Employee[];
  const employee = (id: string) => db.prepare("SELECT * FROM employees WHERE id = ?").get(id) as Employee | undefined;
  const requireEmployee = (id: string) => {
    const found = employee(id);
    if (!found) throw new AppError(401, "Choose a valid demo employee.");
    return found;
  };
  const drafts = (actorId: string) => {
    requireEmployee(actorId);
    return db.prepare("SELECT * FROM drafts WHERE employeeId = ? ORDER BY updatedAt DESC, id").all(actorId) as Draft[];
  };
  const draft = (actorId: string, id: string) => {
    requireEmployee(actorId);
    const found = db.prepare("SELECT * FROM drafts WHERE id = ? AND employeeId = ?").get(id, actorId) as Draft | undefined;
    if (!found) throw new AppError(404, "Draft not found.");
    return found;
  };
  const create = (actorId: string, value: unknown) => {
    requireEmployee(actorId);
    const input = parseDraft(value);
    const id = randomUUID();
    const now = new Date().toISOString();
    db.prepare("INSERT INTO drafts (id,employeeId,leaveType,startDate,endDate,note,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)")
      .run(id, actorId, input.leaveType, input.startDate, input.endDate, input.note, now, now);
    return draft(actorId, id);
  };
  const update = (actorId: string, id: string, value: unknown) => {
    draft(actorId, id);
    const input = parseDraft(value);
    db.prepare("UPDATE drafts SET leaveType=?, startDate=?, endDate=?, note=?, updatedAt=? WHERE id=? AND employeeId=?")
      .run(input.leaveType, input.startDate, input.endDate, input.note, new Date().toISOString(), id, actorId);
    return draft(actorId, id);
  };
  const seedIfEmpty = () => {
    db.exec("BEGIN IMMEDIATE");
    try {
      const count = db.prepare("SELECT COUNT(*) AS count FROM employees").get() as { count: number };
      if (count.count === 0) {
        const insert = db.prepare("INSERT INTO employees (id,name,email,title,department,managerId) VALUES (?,?,?,?,?,?)");
        for (const e of demoEmployees) insert.run(e.id, e.name, e.email, e.title, e.department, e.managerId);
        create("aydan", { leaveType: "Annual leave", startDate: null, endDate: null, note: "Planning a short break — dates to confirm." });
        create("murad", { leaveType: "Personal leave", startDate: null, endDate: null, note: "Family appointment." });
        create("nigar", { leaveType: "Annual leave", startDate: null, endDate: null, note: "Planning a trip." });
      }
      db.exec("COMMIT");
    } catch (error) { db.exec("ROLLBACK"); throw error; }
  };
  return { db, employees, employee, requireEmployee, drafts, draft, create, update, seedIfEmpty, close: () => db.close() };
}

export type Store = ReturnType<typeof openStore>;
const processStore = globalThis as typeof globalThis & { ilenStore?: Store };
export function getStore(): Store {
  if (!processStore.ilenStore) {
    processStore.ilenStore = openStore(process.env.DATABASE_PATH || "./data/ilenhr.sqlite");
    processStore.ilenStore.seedIfEmpty();
  }
  return processStore.ilenStore;
}
