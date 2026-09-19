import "./helpers/store-test-loader.mjs";
import assert from "node:assert/strict";
import test, { before } from "node:test";
import { generateKeyPairSync, sign, createHash } from "node:crypto";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { verifyUnifiedRelease } from "../lib/store/unified-update-signatures.ts";
let resolveUnifiedUpdate: typeof import("../lib/store/downloads.ts").resolveUnifiedUpdate;
let mutateStoreCatalog: typeof import("../lib/store/file-catalog.ts").mutateStoreCatalog;
before(async () => { ({ resolveUnifiedUpdate } = await import("../lib/store/downloads.ts")); ({ mutateStoreCatalog } = await import("../lib/store/file-catalog.ts")); });
import type { AdminProductReleaseRow } from "../lib/store/types.ts";
function fixture() {
 const pair=generateKeyPairSync("ed25519"), publicKey=(pair.publicKey.export({format:"der",type:"spki"}) as Buffer).subarray(-32).toString("base64");
 const pkg=Buffer.from("package"), bytes=Buffer.from(JSON.stringify({appId:"test.app",manifestRevision:1,issuedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+3600000).toISOString(),releases:[{channel:"stable",version:"1.0.0",build:1,platforms:{"macos-arm64":{file:"app.zip",size:pkg.length,sha256:createHash("sha256").update(pkg).digest("hex"),sources:[{id:"a",enabled:true,url:"https://example.com/app.zip"}]}}}]}));
 const envelope=Buffer.from(JSON.stringify({schema:1,keyId:"root",payload:bytes.toString("base64"),signature:sign(null,bytes,pair.privateKey).toString("base64")}));
 const release={id:"test",product_slug:"test-app",channel:"stable",version:"1.0.0",release_artifacts:[{id:"feed",release_id:"test",file_name:"updates.json",size_bytes:envelope.length},{id:"pkg",release_id:"test",file_name:"app.zip",size_bytes:pkg.length}]} as AdminProductReleaseRow;
 return {release, envelope, pkg, registry:{"test-app":{appId:"test.app",keyId:"root",publicKey,channel:"stable"}}};
}
test("unified publication verifies publisher identity and package bytes",async()=>{
 const f=fixture(),read=async()=>f.envelope,digest=async()=>createHash("sha256").update(f.pkg).digest("hex");
 await verifyUnifiedRelease(f.release,read,digest,f.registry);
 await assert.rejects(verifyUnifiedRelease(f.release,read,async()=>"0".repeat(64),f.registry),/UNIFIED_UPDATE_INVALID/);
 f.release.version="1.0.1";await assert.rejects(verifyUnifiedRelease(f.release,read,digest,f.registry),/UNIFIED_UPDATE_INVALID/);
});
test("draft and wrong-path unified manifests are never publicly resolved",async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),"unified-routes-")),original=process.env.RELEASE_STORAGE_ROOT;process.env.RELEASE_STORAGE_ROOT=root;
 try {
  const f=fixture();f.release.product_slug="open-play";f.release.status="draft";f.release.is_current=true;
  const artifact=f.release.release_artifacts[0];artifact.storage_path="open-play/stable/1.0.0/updates.json";artifact.public_path="/releases/"+artifact.storage_path;artifact.content_type="application/json";
  await mkdir(path.dirname(path.join(root,artifact.storage_path)),{recursive:true});await writeFile(path.join(root,artifact.storage_path),f.envelope);
  await mutateStoreCatalog(c=>{c.releases=[f.release];});assert.equal(await resolveUnifiedUpdate("open-play"),null);
  await mutateStoreCatalog(c=>{c.releases[0].status="published";});assert.equal((await resolveUnifiedUpdate("open-play"))?.immutable,false);
  await mutateStoreCatalog(c=>{c.releases[0].release_artifacts[0].storage_path="foreign/updates.json";});assert.equal(await resolveUnifiedUpdate("open-play"),null);
 } finally {await rm(root,{recursive:true,force:true});if(original===undefined)delete process.env.RELEASE_STORAGE_ROOT;else process.env.RELEASE_STORAGE_ROOT=original;}
});
