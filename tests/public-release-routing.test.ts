import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("identity middleware is scoped away from public updater routes", async () => {
  const proxySource = await readFile(new URL("../proxy.ts", import.meta.url), "utf8");
  assert.match(proxySource, /matcher:\s*\[[^\]]*"\/dashboard\/:path\*"/);
  assert.match(proxySource, /"\/en\/products\/:path\*"/);
  assert.match(proxySource, /"\/zh\/products\/:path\*"/);
  assert.doesNotMatch(proxySource, /"\/releases\/:path\*"/);
  assert.doesNotMatch(proxySource, /\(\?!_next\/static/);
});
