import assert from "node:assert/strict";
import test from "node:test";
import { isSoftwareDownload } from "../lib/store/download-visibility.ts";
test("updater metadata is never displayed as an installer", () => {
  for (const fileName of ["appcast.xml", "windows.json", "APPCAST-WEBSITE.XML", "windows-website.json", "latest.yml", "latest-mac.yml"])
    assert.equal(isSoftwareDownload({ packageKind: "zip", fileName }), false);
  for (const packageKind of ["manifest", "blockmap"]) assert.equal(isSoftwareDownload({ packageKind, fileName: "metadata.file" }), false);
});
test("normal software downloads remain visible", () => {
  for (const packageKind of ["zip", "nsis", "dmg", "appimage"]) assert.equal(isSoftwareDownload({ packageKind, fileName: "software." + packageKind }), true);
});
