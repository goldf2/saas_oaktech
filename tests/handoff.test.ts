import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { checkRepository, loadBook, projectRoot, renderProgress, validateBook } from "../scripts/check-handoff.mjs";

const fresh = () => structuredClone(loadBook());

test("handoff ledger, standard snapshot, links and generated progress are consistent", () => {
  assert.deepEqual(checkRepository().errors, []);
  const book = loadBook();
  assert.equal(readFileSync(path.join(projectRoot, "docs/00-handoff/PROGRESS.md"), "utf8"), renderProgress(book));
});

test("handoff rejects duplicate and unknown task dependencies", () => {
  const duplicate = fresh();
  duplicate.tasks.push(structuredClone(duplicate.tasks[0]));
  assert.match(validateBook(duplicate).join("\n"), /Duplicate task/);
  const missing = fresh();
  missing.tasks[0].depends_on = ["MISSING-99"];
  assert.match(validateBook(missing).join("\n"), /unknown dependency/);
});

test("handoff rejects dependency cycles and active tasks without owners", () => {
  const cycle = fresh();
  cycle.tasks[0].depends_on = ["ADM-01"];
  assert.match(validateBook(cycle).join("\n"), /Dependency cycle/);
  const unowned = fresh();
  unowned.tasks[0].status = "in_progress";
  unowned.tasks[0].owner = null;
  assert.match(validateBook(unowned).join("\n"), /requires an owner/);
});

test("handoff cannot mark work complete without deliverable and verification evidence", () => {
  const book = fresh();
  const task = book.tasks.find((item: { id: string }) => item.id === "ADM-01")!;
  task.status = "done";
  task.owner = "isolated-test";
  task.completed_at = "2026-09-16T00:00:00Z";
  task.evidence = [];
  const errors = validateBook(book).join("\n");
  assert.match(errors, /requires verification evidence/);
  assert.match(errors, /missing deliverable evidence/);
});

test("handoff cannot claim real production completion from an unfinished admin plan", () => {
  const book = fresh();
  book.production_admin_bootstrap = "verified";
  const final = book.tasks.find((item: { id: string }) => item.id === "ADM-14")!;
  final.status = "todo";
  assert.match(validateBook(book).join("\n"), /before ADM-14/);
});

test("handoff rejects missing evidence, escaping paths and standard drift", () => {
  const book = fresh();
  book.tasks[0].evidence.push({ path: "docs/not-a-real-verification.json", kind: "verification", result: "passed" });
  book.tasks[0].evidence.push({ path: "../outside-repository.json", kind: "observation", result: "partial" });
  book.standard.sha256 = "0".repeat(64);
  const errors = validateBook(book).join("\n");
  assert.match(errors, /missing evidence/);
  assert.match(errors, /Path escapes repository/);
  assert.match(errors, /snapshot has drifted/);
});

test("handoff requires an actionable blocker and excludes documents from admin-task totals", () => {
  const book = fresh();
  book.tasks[0].status = "blocked";
  book.tasks[0].blockers = [];
  assert.match(validateBook(book).join("\n"), /blocker and resolution action required/);
  const current = loadBook();
  const rendered = renderProgress(current);
  const admin = current.tasks.filter((item: { id: string }) => item.id.startsWith("ADM-"));
  const done = admin.filter((item: { status: string }) => item.status === "done");
  assert.match(rendered, new RegExp(`权限主线任务完成：${done.length}/${admin.length}`));
  assert.match(rendered, /PLAN-01文档不计入/);
});
