// Repository-local progress validation. It never changes product data or grants permissions.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const bookPath = "docs/00-handoff/TASKS.json";
const progressPath = "docs/00-handoff/PROGRESS.md";
const statuses = ["todo", "in_progress", "blocked", "in_review", "done", "deferred"];
const labels = { todo: "待开发", in_progress: "进行中", blocked: "阻塞", in_review: "待验收", done: "完成", deferred: "暂缓" };
const text = (value) => typeof value === "string" && Boolean(value.trim());
const safeCell = (value) => String(value ?? "未认领").replaceAll("|", "\\|").replace(/[\r\n]+/g, " ");

function localPath(root, value) {
  if (!text(value) || path.isAbsolute(value)) throw new Error(`Invalid repository path: ${value}`);
  const resolved = path.resolve(root, value);
  if (!resolved.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error(`Path escapes repository: ${value}`);
  return resolved;
}

export function loadBook(root = projectRoot) {
  return JSON.parse(readFileSync(localPath(root, bookPath), "utf8"));
}

export function validateBook(book, root = projectRoot) {
  const errors = [];
  const check = (condition, message) => { if (!condition) errors.push(message); };
  check(book.schema_version === 1, "Unsupported task schema");
  check(Number.isInteger(book.revision) && book.revision > 0, "Task revision must be a positive integer");
  check(text(book.updated_at) && Number.isFinite(Date.parse(book.updated_at)) && /(?:Z|[+-]\d{2}:\d{2})$/.test(book.updated_at), "Task timestamp requires a timezone");
  check(/^[a-f\d]{40}$/.test(book.source_commit ?? ""), "Baseline source_commit must be a full SHA");
  check(Array.isArray(book.tasks) && book.tasks.length > 0, "Tasks must be a nonempty array");
  if (!Array.isArray(book.tasks)) return errors;
  const byId = new Map();
  for (const task of book.tasks) {
    check(/^[A-Z]+-\d{2}$/.test(task.id ?? ""), `Invalid task id: ${task.id}`);
    check(!byId.has(task.id), `Duplicate task: ${task.id}`);
    byId.set(task.id, task);
    for (const field of ["title", "milestone", "next_action", "implementation", "deployment"]) check(text(task[field]), `${task.id}: missing ${field}`);
    check(["documentation", "feature", "operations", "regression"].includes(task.kind), `${task.id}: invalid kind`);
    check(["P0", "P1", "P2"].includes(task.priority), `${task.id}: invalid priority`);
    check(statuses.includes(task.status), `${task.id}: invalid status`);
    check(Array.isArray(task.depends_on), `${task.id}: dependencies must be an array`);
    check(Array.isArray(task.acceptance) && task.acceptance.length > 0 && task.acceptance.every(text), `${task.id}: acceptance criteria required`);
    check(Array.isArray(task.planned_files) && task.planned_files.length > 0, `${task.id}: planned files required`);
    check(Array.isArray(task.blockers), `${task.id}: blockers must be an array`);
    check(Array.isArray(task.evidence), `${task.id}: evidence must be an array`);
    if (["in_progress", "in_review", "done"].includes(task.status)) check(text(task.owner), `${task.id}: active/completed task requires an owner`);
    if (task.status === "blocked") check(task.blockers?.length > 0 && task.blockers.every(text), `${task.id}: blocker and resolution action required`);
    for (const planned of task.planned_files ?? []) {
      try { localPath(root, planned); } catch (error) { errors.push(error.message); }
      // Planned implementation files need not exist yet; placeholders would misrepresent progress.
    }
    for (const evidence of task.evidence ?? []) {
      check(["observation", "implementation", "verification", "documentation", "production"].includes(evidence.kind), `${task.id}: invalid evidence kind`);
      check(["passed", "partial", "failed"].includes(evidence.result), `${task.id}: invalid evidence result`);
      try { check(existsSync(localPath(root, evidence.path)), `${task.id}: missing evidence ${evidence.path}`); }
      catch (error) { errors.push(error.message); }
    }
    if (task.status === "done") {
      check(text(task.completed_at) && Number.isFinite(Date.parse(task.completed_at)), `${task.id}: completion timestamp required`);
      const passed = (task.evidence ?? []).filter((item) => item.result === "passed");
      check(passed.some((item) => item.kind === "verification"), `${task.id}: completed work requires verification evidence`);
      check(passed.some((item) => item.kind === (task.kind === "documentation" ? "documentation" : "implementation") || (task.kind === "operations" && item.kind === "production")), `${task.id}: missing deliverable evidence`);
      if (["ADM-13", "ADM-14"].includes(task.id)) check(passed.some((item) => item.kind === "production"), `${task.id}: real-environment evidence required, synthetic sessions do not count`);
    }
  }
  for (const task of book.tasks) {
    for (const dependency of task.depends_on ?? []) {
      check(byId.has(dependency), `${task.id}: unknown dependency ${dependency}`);
      if (["in_progress", "in_review", "done"].includes(task.status)) check(byId.get(dependency)?.status === "done", `${task.id}: dependency ${dependency} is not complete`);
    }
  }
  const seen = new Set();
  const active = new Set();
  function visit(id) {
    if (active.has(id)) { errors.push(`Dependency cycle: ${id}`); return; }
    if (seen.has(id) || !byId.has(id)) return;
    active.add(id);
    for (const dep of byId.get(id).depends_on ?? []) visit(dep);
    active.delete(id);
    seen.add(id);
  }
  for (const id of byId.keys()) visit(id);
  check(byId.has(book.current_next_task), "Unknown next task");
  check(byId.get(book.current_next_task)?.status !== "done", "Next task is already done");
  check(["not_implemented", "not_deployed", "deployed_unclaimed", "verified"].includes(book.production_admin_bootstrap), "Invalid production bootstrap state");
  if (book.production_admin_bootstrap === "verified") check(byId.get("ADM-14")?.status === "done", "Cannot claim production bootstrap verified before ADM-14");
  try {
    const actual = createHash("sha256").update(readFileSync(localPath(root, book.standard.path))).digest("hex");
    check(actual === book.standard.sha256, "Adopted standard snapshot has drifted");
  } catch (error) { errors.push(`Standard snapshot: ${error.message}`); }
  return errors;
}

export function renderProgress(book) {
  const admin = book.tasks.filter((task) => task.id.startsWith("ADM-"));
  const complete = admin.filter((task) => task.status === "done").length;
  const lines = [
    "# 开发进度（由TASKS.json生成）", "",
    "> 不要直接编辑本文件。修改TASKS.json后运行 `npm run handoff:render`。", "",
    `账本revision：${book.revision}；更新时间：${book.updated_at}；计划版本：${book.plan_version}。`, "",
    `**权限主线任务完成：${complete}/${admin.length}。这是任务计数，不是代码完成百分比；PLAN-01文档不计入。**`, "",
    `生产超管状态：\`${book.production_admin_bootstrap}\`；唯一下一任务：**${book.current_next_task}**。`, "",
    "| 任务 | 阶段/类型 | 优先级 | 状态 | 负责人 | 依赖 |", "| --- | --- | --- | --- | --- | --- |",
    ...book.tasks.map((task) => `| ${task.id} · ${safeCell(task.title)} | ${task.milestone} / ${task.kind} | ${task.priority} | ${labels[task.status] ?? task.status} | ${safeCell(task.owner)} | ${task.depends_on.join(", ") || "无"} |`),
    "", "## 任务详情与接续动作", "",
  ];
  for (const task of book.tasks) {
    lines.push(`### ${task.id} · ${task.title}`, "", `状态：${labels[task.status] ?? task.status}；负责人：${task.owner ?? "未认领"}；实施：${task.implementation}；部署：${task.deployment}。`, "", `下一动作：${task.next_action}`, "", "验收条件：", ...task.acceptance.map((item) => `- ${item}`), "", `计划文件（可能尚未创建）：${task.planned_files.map((item) => `\`${item}\``).join("、")}`, "");
    if (task.blockers.length) lines.push("阻塞：", ...task.blockers.map((item) => `- ${item}`), "");
    if (task.evidence.length) lines.push("证据：", ...task.evidence.map((item) => `- ${item.kind} / ${item.result}：\`${item.path}\``), "");
    else lines.push("证据：尚无该任务完成证据。", "");
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

export function checkDocumentLinks(root = projectRoot) {
  const files = ["README.md", "AGENTS.md", "docs/00-handoff/README.md", "docs/00-handoff/PROJECT_BRIEF.md", "docs/00-handoff/CURRENT_STATE.md", "docs/00-handoff/NEXT_ACTIONS.md", "docs/00-handoff/HANDOFF.md", "docs/00-handoff/RUNBOOK.md", "docs/00-handoff/DEVELOPMENT_PLAN.md", "docs/00-handoff/TEST_MATRIX.md", "docs/standards/README.md"];
  const errors = [];
  for (const name of files) {
    if (!existsSync(localPath(root, name))) { errors.push(`Missing handoff document: ${name}`); continue; }
    const source = readFileSync(localPath(root, name), "utf8");
    if ((source.match(/^```/gm) ?? []).length % 2) errors.push(`Unclosed code fence: ${name}`);
    for (const match of source.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const href = match[1];
      if (/^(?:https?:|mailto:|#)/.test(href)) continue;
      try {
        const file = decodeURIComponent(href.split("#")[0]);
        const relative = path.relative(root, path.resolve(root, path.dirname(name), file));
        if (!existsSync(localPath(root, relative))) errors.push(`Broken local link: ${name} -> ${href}`);
      } catch (error) { errors.push(error.message); }
    }
  }
  return errors;
}

export function checkRepository(root = projectRoot, { write = false } = {}) {
  const book = loadBook(root);
  const errors = validateBook(book, root);
  if (!errors.length) {
    const expected = renderProgress(book);
    const destination = localPath(root, progressPath);
    if (write) writeFileSync(destination, expected);
    else if (!existsSync(destination) || readFileSync(destination, "utf8") !== expected) errors.push("PROGRESS.md is stale; run npm run handoff:render");
    errors.push(...checkDocumentLinks(root));
  }
  return { book, errors };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = process.argv.slice(2);
  if (options.some((option) => !["--write", "--check", "--status"].includes(option))) {
    console.error("Usage: node scripts/check-handoff.mjs [--check|--write|--status]");
    process.exitCode = 2;
  } else {
    try {
      const { book, errors } = checkRepository(projectRoot, { write: options.includes("--write") });
      if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
      else {
        console.log(`Handoff verified: ${book.tasks.length} tasks; next ${book.current_next_task}; production bootstrap ${book.production_admin_bootstrap}.`);
        console.log("This checks documentation structure, local references and recorded evidence, not the truth of a production acceptance claim.");
      }
    } catch (error) { console.error(error.message); process.exitCode = 1; }
  }
}
