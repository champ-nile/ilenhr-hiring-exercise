import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AppError, openStore } from "./store";

const input = { leaveType: "Annual leave", startDate: null, endDate: null, note: "A break" };
const fails = (status: number) => (error: unknown) => error instanceof AppError && error.status === status;

test("seeding is repeatable and preserves employee drafts", () => {
  const s = openStore(":memory:");
  try {
    s.seedIfEmpty(); const d = s.create("aydan", input); s.seedIfEmpty();
    assert.equal(s.employees().length, 5); assert.equal(s.drafts("aydan").length, 2);
    assert.equal(s.draft("aydan", d.id).note, "A break");
    assert.equal(s.employee("aydan")?.managerId, "leyla");
    assert.equal(s.employee("nigar")?.managerId, "kamran");
  } finally { s.close(); }
});

test("draft ownership is enforced for reads and writes, including managers", () => {
  const s = openStore(":memory:");
  try {
    s.seedIfEmpty(); const d = s.create("aydan", { ...input, employeeId: "murad" });
    assert.equal(d.employeeId, "aydan");
    for (const id of ["murad", "leyla", "nigar"]) {
      assert.throws(() => s.draft(id, d.id), fails(404));
      assert.throws(() => s.update(id, d.id, { ...input, note: "Changed" }), fails(404));
      assert.ok(!s.drafts(id).some(row => row.id === d.id));
    }
    assert.throws(() => s.create("unknown", input), fails(401));
    assert.equal(s.draft("aydan", d.id).note, "A break");
  } finally { s.close(); }
});

test("drafts allow missing dates, validate shape, and update existing records", () => {
  const s = openStore(":memory:");
  try {
    s.seedIfEmpty(); const d = s.create("aydan", input);
    assert.equal(d.startDate, null);
    for (const bad of [null, [], { ...input, note: 3 }, { ...input, note: "x".repeat(2001) }, { ...input, leaveType: "Other" }, { ...input, startDate: "2027-02-30" }, { ...input, startDate: "yesterday" }]) {
      assert.throws(() => s.create("aydan", bad), fails(400));
    }
    const next = s.update("aydan", d.id, { ...input, startDate: "2028-02-29", endDate: "2028-03-02", note: " Updated " });
    assert.equal(next.id, d.id); assert.equal(next.note, "Updated"); assert.equal(next.startDate, "2028-02-29");
    assert.equal(next.createdAt, d.createdAt);
  } finally { s.close(); }
});

test("saved drafts survive reopening the database and reseeding", () => {
  const dir = mkdtempSync(join(tmpdir(), "ilenhr-test-"));
  const file = join(dir, "test.sqlite");
  try {
    const first = openStore(file); first.seedIfEmpty(); const d = first.create("aydan", { ...input, note: "Persist me" }); first.close();
    const second = openStore(file);
    try { second.seedIfEmpty(); assert.equal(second.draft("aydan", d.id).note, "Persist me"); }
    finally { second.close(); }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
