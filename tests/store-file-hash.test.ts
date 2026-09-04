import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { hashFile } from "../lib/store/file-hash.ts";

test("large release files hash to completion without stream backpressure", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "oaktech-release-hash-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const content = Buffer.alloc(256 * 1024, 0x5a);
  const filePath = path.join(directory, "artifact.bin");
  await writeFile(filePath, content);

  assert.equal(await hashFile(filePath), createHash("sha512").update(content).digest("hex"));
});
