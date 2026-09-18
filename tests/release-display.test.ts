import assert from "node:assert/strict";
import test from "node:test";
import type { AdminProductReleaseRow } from "../lib/store/types.ts";
import { requiredReleaseFiles } from "../lib/store/release-workflow.ts";
import { releaseDisplayRows } from "../lib/store/release-display.ts";
function fixture(): AdminProductReleaseRow {
  return { id:"r", product_slug:"open-play",version:"0.6.6.13",channel:"stable",status:"draft",is_current:false,published_at:null,title_en:"Test",title_zh:"测试",notes_en:"Test",notes_zh:"测试",release_artifacts:[] };
}
function complete() {
 const release=fixture();release.release_artifacts=requiredReleaseFiles(release.product_slug,release.version).map((file,index)=>({id:String(index),release_id:release.id,platform:file.platform,architecture:file.architecture,package_kind:file.packageKind,file_name:file.name,storage_path:"test/"+file.name,public_path:"/releases/test/"+file.name,size_bytes:100,sha512:"a".repeat(128),content_type:"application/octet-stream"}));return release;
}
test("one missing row for each native requirement before upload",()=>{ const rows=releaseDisplayRows(fixture());assert.equal(rows.length,4);assert.ok(rows.every(r=>!r.artifact)); });
test("each received native artifact replaces a requirement instead of duplicating its card",()=>{ const rows=releaseDisplayRows(complete());assert.equal(rows.length,4);assert.equal(new Set(rows.map(r=>r.artifact?.id)).size,4);assert.ok(rows.every(r=>r.artifact)); });
test("incorrect platform metadata remains visible and cannot silently fulfil a requirement",()=>{const release=complete();release.release_artifacts[0].architecture="wrong";const rows=releaseDisplayRows(release);assert.equal(rows.length,5);assert.equal(rows.filter(r=>!r.artifact).length,1);assert.ok(rows.some(r=>r.architecture==="wrong"&&r.artifact));});
test("unmatched and duplicate-named server records are not hidden by the compact display",()=>{const release=complete();release.release_artifacts.push({...release.release_artifacts[0],id:"other"});const rows=releaseDisplayRows(release);assert.equal(rows.length,5);assert.equal(rows.filter(r=>r.artifact).length,5);assert.equal(new Set(rows.map(r=>r.key)).size,5);});
test("generic product list keeps all records without open-play placeholders",()=>{const release=complete();release.product_slug="another-tool";const rows=releaseDisplayRows(release);assert.equal(rows.length,4);assert.ok(rows.every(r=>r.artifact));});
test("rendering rows does not mutate server objects or grant publication",()=>{const release=complete(),before=JSON.stringify(release);releaseDisplayRows(release);assert.equal(JSON.stringify(release),before);assert.equal(release.status,"draft");});
