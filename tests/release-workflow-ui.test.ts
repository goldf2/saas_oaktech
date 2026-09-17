import './helpers/store-test-loader.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { artifactSlot, fileSelectionError, formatBytes, productPublicationIssues, releaseReadiness, requiredReleaseFiles, selectReleaseForPublication, suggestUploadSlot, uploadConflict } from '../lib/store/release-workflow.ts';
import { uploadReleaseFile, UploadProblem, UPLOAD_CHUNK_BYTES } from '../lib/store/upload-client.ts';
import type { AdminProductReleaseRow } from '../lib/store/types.ts';
const hash = 'a'.repeat(128);
function release(product = 'generic-tool', version = '1.0.0', id = 'r1', channel = 'stable'): AdminProductReleaseRow {
  return { id, product_slug: product, version, channel, status: 'draft', is_current: false, published_at: null, title_zh: '标题', title_en: '标题', notes_zh: '说明', notes_en: '说明', release_artifacts: [] };
}
function addFile(r: AdminProductReleaseRow, file_name = 'package.zip', platform = 'chrome', architecture = 'universal', package_kind = 'zip') {
  r.release_artifacts.push({ id: file_name, release_id: r.id, file_name, platform, architecture, package_kind, size_bytes: 12, sha512: hash, public_path: `/releases/${file_name}`, storage_path: file_name, content_type: 'application/octet-stream' }); return r;
}
test('open-play has four specific package/manifest requirements and no placeholder published version', () => {
  const files = requiredReleaseFiles('open-play', '0.6.6.13'); assert.equal(files.length, 4);
  assert.equal(files[0].name, 'open-play-0.6.6.13-macos.zip'); assert.equal(files[3].name, 'windows.json');
  assert.deepEqual(requiredReleaseFiles('other', '1.0.0'), []);
});
test('missing files and metadata-only releases cannot be selected as ready', () => {
  const r = release(); assert.equal(releaseReadiness(r).ready, false);
  addFile(r, 'metadata.json', 'chrome', 'universal', 'manifest'); assert.equal(releaseReadiness(r).ready, false);
});
test('generic installable artifact is ready but not claimed cryptographically verified', () => {
  const r = addFile(release()); const state = releaseReadiness(r); assert.equal(state.ready, true); assert.equal(state.installers, 1); assert.equal(state.totalBytes, 12);
  assert.equal(Object.hasOwn(state, 'signatureVerified'), false);
});
test('all four open-play files with expected slot metadata are necessary', () => {
  const r = release('open-play', '0.6.6.13');
  for (const f of requiredReleaseFiles(r.product_slug, r.version)) addFile(r, f.name, f.platform, f.architecture, f.packageKind);
  assert.equal(releaseReadiness(r).ready, true); r.release_artifacts[0].architecture = 'x64'; assert.equal(releaseReadiness(r).ready, false);
});
test('wrong open-play channel/version is detected before publication', () => {
  const r = release('open-play', '1.0.0', 'r1', 'beta'); assert.match(releaseReadiness(r).blockers.join(' '), /stable/);
});
test('missing bilingual values and server hashes fail readiness', () => {
  const r = addFile(release()); r.notes_en = ''; r.release_artifacts[0].sha512 = 'invalid';
  assert.equal(releaseReadiness(r).ready, false); assert.equal(releaseReadiness(r).blockers.length, 2);
});
test('duplicate filenames or platform/architecture/kind slots are rejected', () => {
  const r = addFile(release()); addFile(r, 'different.zip'); assert.equal(releaseReadiness(r).ready, false);
  assert.match(uploadConflict('package.zip', { platform: 'windows', architecture: 'x64', packageKind: 'zip' }, r.release_artifacts)!, /文件名/);
  assert.match(uploadConflict('third.zip', { platform: 'chrome', architecture: 'universal', packageKind: 'zip' }, r.release_artifacts)!, /平台/);
});
test('channel selection replaces only that channel and preserves other channels', () => {
  const rows = [addFile(release('tool', '1.0.0', 'a')), addFile(release('tool', '1.0.1', 'b')), addFile(release('tool', '1.0.2', 'c', 'beta'))];
  assert.deepEqual(selectReleaseForPublication(['a', 'c'], 'b', true, rows), ['c', 'b']);
  assert.deepEqual(selectReleaseForPublication(['a', 'c'], 'a', false, rows), ['c']);
});
test('unready, missing and published releases cannot enter the selection', () => {
  const a = release(); assert.deepEqual(selectReleaseForPublication([], a.id, true, [a]), []);
  addFile(a); a.status = 'published'; assert.deepEqual(selectReleaseForPublication([], a.id, true, [a]), []);
});
test('file inference is editable guidance and does not invent unknown platform/architecture', () => {
  assert.deepEqual(suggestUploadSlot('mystery.zip'), { platform: '', architecture: '', packageKind: 'zip' });
  const mac = suggestUploadSlot('open-play-0.6.6.13-macos.zip', 'open-play', '0.6.6.13'); assert.equal(mac.platform, 'macos'); assert.equal(mac.architecture, 'arm64');
  assert.equal(suggestUploadSlot('appcast.xml', 'open-play', '0.6.6.13').packageKind, 'manifest');
  assert.equal(suggestUploadSlot('tool-linux-x64.AppImage').platform, 'linux');
});
test('invalid filenames, empty and oversize input are rejected, byte labels are bounded', () => {
  for (const [name, size] of [['bad name.zip', 2], ['../evil.zip', 2], ['a.zip', 0], ['a.zip', 4 * 1024 ** 3 + 1]] as const) assert.ok(fileSelectionError(name, size));
  assert.equal(fileSelectionError('appcast.xml', 20), null); assert.equal(formatBytes(1024), '1.0 KiB'); assert.equal(artifactSlot({ platform: ' macos ', architecture: 'arm64', packageKind: 'zip' }), 'macos/arm64/zip');
});
const slot = { platform: 'chrome', architecture: 'universal', packageKind: 'zip' };
const file = (size: number) => new File([new Uint8Array(size)], 'fixture.zip', { type: 'application/zip' });
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
test('chunk upload reports progress only after exact server acknowledgments', async () => {
  const f = file(UPLOAD_CHUNK_BYTES + 10), progress: number[] = [], requests: string[] = [];
  await uploadReleaseFile({ releaseId: 'r1', file: f, slot, uploadId: 'fixture', onAcknowledged: n => progress.push(n), fetcher: async (url, init) => {
    const u = new URL(String(url), 'http://127.0.0.1'); requests.push(u.searchParams.get('offset')!);
    assert.equal(new Headers(init?.headers).get('authorization'), null); assert.equal(u.pathname, '/api/admin/releases/upload');
    return u.searchParams.get('final') === 'true' ? json({ sizeBytes: f.size, sha512: hash }) : json({ receivedBytes: UPLOAD_CHUNK_BYTES });
  } }); assert.deepEqual(progress, [UPLOAD_CHUNK_BYTES, f.size]); assert.deepEqual(requests, ['0', String(UPLOAD_CHUNK_BYTES)]);
});
test('lost final response is uncertain and must not be automatically resent', async () => {
  let calls = 0; await assert.rejects(uploadReleaseFile({ releaseId: 'r1', file: file(20), slot, uploadId: 'x', onAcknowledged: () => assert.fail(), fetcher: async () => { calls++; throw Error('offline'); } }), e => e instanceof UploadProblem && e.mustReconcile);
  assert.equal(calls, 1);
});
test('invalid final hash or size is never presented as success', async () => {
  for (const response of [{ sizeBytes: 20, sha512: 'bad' }, { sizeBytes: 19, sha512: hash }]) await assert.rejects(uploadReleaseFile({ releaseId: 'r1', file: file(20), slot, uploadId: 'x', onAcknowledged: () => assert.fail(), fetcher: async () => json(response) }), e => e instanceof UploadProblem && e.mustReconcile);
});
test('committed audit error requires reconciliation rather than repeated upload', async () => {
  await assert.rejects(uploadReleaseFile({ releaseId: 'r1', file: file(20), slot, uploadId: 'x', onAcknowledged: () => assert.fail(), fetcher: async () => json({ error: 'ARTIFACT_SAVED_AUDIT_FAILED', committed: true }, 500) }), e => e instanceof UploadProblem && e.mustReconcile && e.message.includes('不要重复上传'));
});
test('server error text is not echoed and invalid JSON never marks completion', async () => {
  await assert.rejects(uploadReleaseFile({ releaseId: 'r1', file: file(20), slot, uploadId: 'x', onAcknowledged: () => assert.fail(), fetcher: async () => json({ error: 'SECRET_INTERNAL_DETAIL' }, 400) }), e => e instanceof UploadProblem && !e.message.includes('SECRET'));
  await assert.rejects(uploadReleaseFile({ releaseId: 'r1', file: file(20), slot, uploadId: 'x', onAcknowledged: () => assert.fail(), fetcher: async () => new Response('<html>proxy</html>') }), e => e instanceof UploadProblem && e.mustReconcile);
});
test('unconfirmed intermediate chunk stops before sending another request', async () => {
  let calls = 0; await assert.rejects(uploadReleaseFile({ releaseId: 'r1', file: file(UPLOAD_CHUNK_BYTES + 1), slot, uploadId: 'x', onAcknowledged: () => assert.fail(), fetcher: async () => { calls++; return json({ receivedBytes: 1 }); } }), UploadProblem); assert.equal(calls, 1);
});

test('missing product fields are reported individually before final confirmation', () => {
  const issues = productPublicationIssues({ name_zh: '产品', tagline_zh: '', description_zh: '介绍', icon_url: '', hero_image_url: 'javascript:bad' } as import('../lib/store/types.ts').AdminStoreProductRow);
  assert.equal(issues.length, 3); assert.deepEqual(issues.map(x => x.tab), ['details', 'media', 'media']);
});
