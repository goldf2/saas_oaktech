import test from 'node:test';
import assert from 'node:assert/strict';
import { isPublicAddress, remoteUrl, githubSource, downloadRemote } from '../lib/store/remote-download.ts';
test('remote imports reject loopback, private, metadata and reserved addresses', () => {
  for (const value of ['127.0.0.1','10.0.0.1','172.16.0.1','192.168.1.1','169.254.169.254','100.64.0.1','0.0.0.0','224.0.0.1','::1','::ffff:127.0.0.1']) assert.equal(isPublicAddress(value), false, value);
  assert.equal(isPublicAddress('140.82.112.3'), true);
});
test('remote import requires HTTPS without embedded credentials or alternate ports', () => {
  for (const value of ['http://github.com/a.zip','https://user:pass@github.com/a.zip','https://github.com:8443/a.zip','https://127.1/a.zip']) assert.throws(() => remoteUrl(value));
  assert.equal(remoteUrl('https://example.com/a.zip?signature=test').search, '?signature=test');
});
test('GitHub source accepts repositories and tagged release URLs but never another host', () => {
  assert.deepEqual(githubSource('cli/cli'), { repo: 'cli/cli', tag: '' });
  assert.deepEqual(githubSource('https://github.com/cli/cli/releases/tag/v1.2.3'), { repo: 'cli/cli', tag: 'v1.2.3' });
  for (const value of ['https://evil.example/cli/cli','https://github.com@evil.example/cli/cli','https://github.com/cli/cli/blob/main/file']) assert.throws(() => githubSource(value));
});
test('DNS names resolving to loopback are rejected before connection', async () => {
  await assert.rejects(downloadRemote('https://localhost/test'), /PUBLIC_HOST_REQUIRED/);
});
