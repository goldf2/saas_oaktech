import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeProductGithubUrl, productGithubUrl, selectDownloadRelease } from '../lib/store/product-links.ts';
import type { ProductRelease } from '../lib/store/types.ts';

test('GitHub product links accept only HTTPS repositories and release pages', () => {
  for (const suffix of ['', '/releases', '/releases/latest', '/releases/tag/v1.0.0']) {
    const url = `https://github.com/owner/repo${suffix}`;
    assert.equal(normalizeProductGithubUrl(` ${url}/ `), url);
  }
  assert.equal(normalizeProductGithubUrl(undefined), undefined);
  assert.equal(normalizeProductGithubUrl(''), '');
  for (const bad of [null, 42, 'javascript:alert(1)', '//github.com/a/b', 'http://github.com/a/b',
    'https://github.com.evil.test/a/b', 'https://github.com@evil.test/a/b', 'https://user:secret@github.com/a/b',
    'https://github.com:444/a/b', 'https://github.com/a', 'https://github.com/a/b/blob/main',
    'https://github.com/a/b?token=private', 'https://github.com/a/b#fragment', 'https://github.com/a/b\\evil',
    'https://github.com/a/\nb', 'https://github.com/a/b/releases/tag/', 'x'.repeat(2049)]) {
    assert.throws(() => normalizeProductGithubUrl(bad), /PRODUCT_GITHUB_URL_INVALID/);
  }
});

test('verified defaults are scoped to known products, overrideable and removable', () => {
  assert.equal(productGithubUrl('open-play'), 'https://github.com/goldf2/open-play-releases/releases');
  assert.equal(productGithubUrl('unconfigured-product'), '');
  assert.equal(productGithubUrl('open-play', ''), '');
  assert.equal(productGithubUrl('open-play', 'javascript:alert(1)'), '');
  assert.equal(productGithubUrl('open-play', 'https://github.com/example/other'), 'https://github.com/example/other');
});

const release = (id: string, status: ProductRelease['status'], current: boolean, binary: boolean, date: string): ProductRelease => ({
  id, productSlug: 'tool', version: id, channel: 'stable', status, isCurrent: current, publishedAt: date, title: id, notes: '',
  artifacts: [{id: id+'-file',releaseId:id,platform:'macOS',architecture:'arm64',packageKind:binary?'zip':'manifest',
    fileName:binary?'tool.zip':'updates.json',storagePath:'',publicPath:'/releases/tool.zip',sizeBytes:16,sha512:'',contentType:'application/zip'}],
});

test('current metadata-only release cannot hide an older public installer', () => {
  const old=release('1.0','published',false,true,'2026-01-01');
  const metadata=release('2.0','published',true,false,'2026-02-01');
  const draft=release('3.0','draft',true,true,'2026-03-01');
  assert.equal(selectDownloadRelease([draft,metadata,old]),old);
  assert.equal(selectDownloadRelease([draft,metadata]),undefined);
});

test('current public installer wins and missing current uses newest public package without mutation', () => {
  const older=release('1.0','published',true,true,'2026-01-01');
  const newer=release('2.0','published',false,true,'2026-02-01');
  assert.equal(selectDownloadRelease([newer,older]),older);
  older.isCurrent=false;
  const input=[older,newer];
  assert.equal(selectDownloadRelease(input),newer);
  assert.deepEqual(input,[older,newer]);
});
