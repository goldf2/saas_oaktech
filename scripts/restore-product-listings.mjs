// One-time, explicitly requested repair of two product listings, not a release publisher.
// Runs before the production web process starts. Keep this migration ID and payload immutable.
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { lstat, mkdir, open, readFile, rename, unlink } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const MIGRATION_ID = "20260916-restore-open-play-and-chanxu";
const products = JSON.parse(readFileSync(new URL("./migrations/20260916-product-listings.json", import.meta.url), "utf8"));
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

export function planProductRecovery(catalog) {
  if (!catalog || catalog.schemaVersion !== 1 || !Array.isArray(catalog.products) || !Array.isArray(catalog.releases)
    || (catalog.dataMigrations !== undefined && !Array.isArray(catalog.dataMigrations))) {
    throw new Error("STORE_CATALOG_INVALID");
  }
  if (catalog.dataMigrations?.some((entry) => entry.id === MIGRATION_ID)) {
    return { alreadyApplied: true, catalog, changes: [] };
  }
  const next = structuredClone(catalog);
  const changes = [];
  for (const template of products) {
    const matches = next.products.filter((item) => item.slug === template.slug);
    if (matches.length > 1) throw new Error(`DUPLICATE_PRODUCT_SLUG:${template.slug}`);
    const existing = matches[0];
    if (existing) {
      // Preserve custom names, prices, identifiers, assets and all other operator-managed fields.
      if (existing.visibility !== "published") {
        existing.visibility = "published";
        changes.push({ slug: template.slug, operation: "make-visible" });
      }
    } else {
      if (next.products.some((item) => item.id === template.id)) throw new Error(`PRODUCT_ID_CONFLICT:${template.slug}`);
      next.products.push(structuredClone(template));
      changes.push({ slug: template.slug, operation: "insert" });
    }
  }
  // No release rows, current flags, package files or credentials are created or changed.
  return { alreadyApplied: false, catalog: next, changes };
}

async function durableWrite(destination, contents, mode) {
  const handle = await open(destination, "wx", mode);
  try { await handle.writeFile(contents); await handle.sync(); }
  finally { await handle.close(); }
}

export async function restoreProductListings(root, { dryRun = false } = {}) {
  if (!root) return { status: "skipped", reason: "storage-not-configured", migration: MIGRATION_ID };
  if (!path.isAbsolute(root)) throw new Error("RELEASE_STORAGE_ROOT_MUST_BE_ABSOLUTE");
  const catalogPath = path.join(root, "catalog.json");
  const readCatalog = async () => {
    const details = await lstat(catalogPath);
    if (!details.isFile()) throw new Error("STORE_CATALOG_NOT_REGULAR_FILE");
    const raw = await readFile(catalogPath);
    return { raw, details, parsed: JSON.parse(raw.toString("utf8")) };
  };
  let initial;
  try { initial = await readCatalog(); }
  catch (error) {
    if (error.code === "ENOENT") return { status: "skipped", reason: "no-existing-catalog", migration: MIGRATION_ID };
    throw error;
  }
  const initialPlan = planProductRecovery(initial.parsed);
  if (initialPlan.alreadyApplied) return { status: "already-applied", migration: MIGRATION_ID };
  if (dryRun) return { status: "dry-run", migration: MIGRATION_ID, changes: initialPlan.changes };

  const migrationRoot = path.join(root, ".catalog-migrations");
  const backupRoot = path.join(migrationRoot, "backups");
  await mkdir(backupRoot, { recursive: true, mode: 0o750 });
  const lockPath = path.join(migrationRoot, `${MIGRATION_ID}.lock`);
  let lock;
  for (let attempt = 0; attempt < 40; attempt++) {
    try { lock = await open(lockPath, "wx", 0o600); break; }
    catch (error) {
      if (error.code !== "EEXIST") throw error;
      if (planProductRecovery((await readCatalog()).parsed).alreadyApplied) return { status: "already-applied", migration: MIGRATION_ID };
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  if (!lock) throw new Error("CATALOG_MIGRATION_LOCKED");

  let temporary;
  try {
    const { raw, details, parsed } = await readCatalog();
    const plan = planProductRecovery(parsed);
    if (plan.alreadyApplied) return { status: "already-applied", migration: MIGRATION_ID };
    const appliedAt = new Date().toISOString();
    const backupPath = path.join(backupRoot, `${MIGRATION_ID}-${randomUUID()}.json`);
    await durableWrite(backupPath, raw, 0o600);
    const receipt = {
      id: MIGRATION_ID, appliedAt, changes: plan.changes,
      backupPath: path.relative(root, backupPath), beforeSha256: digest(raw),
      productsBefore: parsed.products.length, productsAfter: plan.catalog.products.length,
      releasesBefore: parsed.releases.length, releasesAfter: plan.catalog.releases.length,
      reason: "User requested restoration of both missing product listings on 2026-09-16",
    };
    plan.catalog.updatedAt = appliedAt;
    plan.catalog.dataMigrations = [...(parsed.dataMigrations ?? []), receipt];
    const content = `${JSON.stringify(plan.catalog, null, 2)}\n`;
    temporary = `${catalogPath}.migration-${randomUUID()}`;
    await durableWrite(temporary, content, details.mode & 0o777);
    // Detect edits made by an older instance during the backup/prepare window. This is not a
    // general multi-instance transaction lock; run before accepting traffic with one catalog writer.
    if (!(await readFile(catalogPath)).equals(raw)) throw new Error("CATALOG_CHANGED_DURING_MIGRATION");
    await rename(temporary, catalogPath);
    temporary = undefined;
    // The completion receipt is committed atomically with the records, so later deletions or
    // unpublishing by an administrator will not be undone on the next restart.
    return { status: "applied", migration: MIGRATION_ID, ...receipt };
  } finally {
    if (temporary) await unlink(temporary).catch(() => {});
    await lock.close();
    await unlink(lockPath);
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  restoreProductListings(process.env.RELEASE_STORAGE_ROOT?.trim(), { dryRun: process.argv.includes("--dry-run") })
    .then((result) => console.log(JSON.stringify({ event: "store.product-listings.migration", ...result })))
    .catch((error) => {
      console.error(JSON.stringify({ event: "store.product-listings.migration.failed", migration: MIGRATION_ID, code: error.code ?? "MIGRATION_FAILED", message: error.message }));
      process.exitCode = 1;
    });
}
