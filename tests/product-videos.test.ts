import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeProductVideos, parseVideoSource, videoSourceInfo, productVideoTitle } from '../lib/store/product-videos.ts';

const youtubeId = 'M7lc1UVf-VE';
const biliId = 'BV1B7411m7LV';
const video = () => ({ id: 'intro', title: '产品介绍', poster_url: '', sources: [{ id: 'youtube', label: '', url: `https://youtu.be/${youtubeId}` }] });

test('YouTube watch/share/shorts/live/embed links normalize to the fixed official player', () => {
  for (const url of [
    `https://www.youtube.com/watch?v=${youtubeId}&list=ignored&autoplay=1`,
    `https://youtu.be/${youtubeId}?si=tracking`,
    `https://m.youtube.com/shorts/${youtubeId}`,
    `https://youtube.com/live/${youtubeId}`,
    `https://www.youtube-nocookie.com/embed/${youtubeId}`,
  ]) {
    const source = parseVideoSource(url);
    assert.equal(source.provider, 'youtube');
    assert.equal(source.watchUrl, `https://www.youtube.com/watch?v=${youtubeId}`);
    const player = new URL(source.embedUrl!);
    assert.equal(player.hostname, 'www.youtube-nocookie.com');
    assert.equal(player.pathname, `/embed/${youtubeId}`);
    assert.equal(player.searchParams.get('autoplay'), '0');
    assert.equal(player.searchParams.has('list'), false);
  }
});

test('YouTube time offsets are bounded and retained without copying arbitrary parameters', () => {
  const source = parseVideoSource(`https://youtu.be/${youtubeId}?t=1h2m3s&origin=https://untrusted.example`);
  assert.equal(new URL(source.embedUrl!).searchParams.get('start'), '3723');
  assert.equal(new URL(source.embedUrl!).searchParams.has('origin'), false);
  assert.throws(() => parseVideoSource(`https://youtu.be/${youtubeId}?t=99999999999`), /INVALID/);
  assert.throws(() => parseVideoSource(`https://youtube.com/watch?v=${youtubeId}&v=other`), /INVALID/);
});

test('Bilibili BV, av and official embedded links normalize and preserve the selected part', () => {
  for (const url of [`https://www.bilibili.com/video/${biliId}/?p=2`, `https://player.bilibili.com/player.html?bvid=${biliId}&p=2&autoplay=1`]) {
    const source = parseVideoSource(url);
    const player = new URL(source.embedUrl!);
    assert.equal(source.provider, 'bilibili');
    assert.equal(player.origin, 'https://player.bilibili.com');
    assert.equal(player.searchParams.get('bvid'), biliId);
    assert.equal(player.searchParams.get('p'), '2');
    assert.equal(player.searchParams.get('autoplay'), '0');
  }
  assert.equal(new URL(parseVideoSource('https://bilibili.com/video/av170001?t=12').embedUrl!).searchParams.get('aid'), '170001');
  assert.throws(() => parseVideoSource(`https://bilibili.com/video/${biliId}?p=0`), /INVALID/);
});

test('unknown providers, short links and lookalike domains never become iframe addresses', () => {
  for (const url of ['https://vimeo.com/1234', 'https://b23.tv/AbCdE', 'https://www.youtube.com.attacker.example/watch?v=123', 'https://player.bilibili.com.attacker.example/player.html']) {
    assert.equal(parseVideoSource(url).provider, 'external');
    assert.equal(parseVideoSource(url).embedUrl, null);
  }
});

test('unsafe schemes, HTML, credentials, local hosts and nonstandard ports are rejected', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,bad', '<iframe src="https://youtube.com"></iframe>', '//youtube.com/watch', 'http://youtube.com/watch', 'https://user:secret@youtube.com/watch', 'https://127.0.0.1/video', 'https://2130706433/video', 'https://[::1]/', 'https://host.local/video', 'https://localhost/video', 'https://youtube.com:444/watch', 'https://youtube.com\\@attacker.example/']) {
    assert.throws(() => parseVideoSource(url), Error, url);
    assert.equal(videoSourceInfo(url), null);
  }
});

test('unrecognized paths and malformed IDs on supported platforms are rejected, not embedded', () => {
  for (const url of ['https://www.youtube.com/playlist?list=abc', 'https://www.youtube.com/@channel', 'https://youtu.be/invalid', 'https://www.bilibili.com/video/not-a-video', 'https://player.bilibili.com/player.html?bvid=bad', 'https://www.bilibili.com/video/BV1B7411m7LV/extra']) {
    assert.throws(() => parseVideoSource(url));
  }
});

test('optional videos keep legacy products valid and reconstruct only supported fields', () => {
  assert.deepEqual(normalizeProductVideos(undefined, true), []);
  const value = { ...video(), iframe: '<script>bad</script>', sources: [{ ...video().sources[0], embedUrl: 'https://attacker.example/' }] };
  const normalized = normalizeProductVideos([value], true)[0];
  assert.equal('iframe' in normalized, false);
  assert.equal('embedUrl' in normalized.sources[0], false);
  assert.equal(normalized.sources[0].url, `https://www.youtube.com/watch?v=${youtubeId}`);
});

test('incomplete video input can be saved as draft but is not publishable', () => {
  const draft = { ...video(), title: '', sources: [{ id: 's', label: '', url: '' }] };
  assert.equal(normalizeProductVideos([draft]).length, 1);
  assert.throws(() => normalizeProductVideos([draft], true), /INCOMPLETE/);
  assert.throws(() => normalizeProductVideos([{ ...video(), sources: [] }], true), /INCOMPLETE/);
});

test('video/source limits, duplicate IDs and duplicate canonical URLs are rejected', () => {
  assert.throws(() => normalizeProductVideos(Array.from({ length: 7 }, (_, i) => ({ ...video(), id: `v${i}` }))), /LIMIT/);
  assert.throws(() => normalizeProductVideos([{ ...video(), sources: Array.from({ length: 5 }, (_, i) => ({ id: `s${i}`, label: '', url: '' })) }]), /SOURCE_LIMIT/);
  assert.throws(() => normalizeProductVideos([video(), video()]), /INVALID/);
  assert.throws(() => normalizeProductVideos([{ ...video(), sources: [video().sources[0], { id: 'different-id', label: '', url: `https://youtube.com/watch?v=${youtubeId}` }] }]), /DUPLICATE_SOURCE/);
});

test('video posters accept managed image paths but reject executable and credential URLs', () => {
  assert.equal(normalizeProductVideos([{ ...video(), poster_url: '/media/products/demo/test.webp' }], true)[0].poster_url, '/media/products/demo/test.webp');
  for (const poster of ['javascript:alert(1)', '//attacker.example/x', '/\\attacker.example/image.png', 'https://user:pass@cdn.example/x.png']) {
    assert.throws(() => normalizeProductVideos([{ ...video(), poster_url: poster }], true));
  }
});

test('a valid source publishes without an editorial title or poster', () => {
  const linkOnly = { ...video(), title: '', poster_url: '' };
  const before = JSON.stringify(linkOnly);
  const result = normalizeProductVideos([linkOnly], true)[0];
  assert.equal(result.title, '');
  assert.equal(result.sources.length, 1);
  assert.equal(JSON.stringify(linkOnly), before);
});


test('omitted, null and whitespace-only display titles do not block publication', () => {
  for (const title of [undefined, null, '  \t  ', '']) {
    const item = { ...video(), title };
    const before = JSON.stringify(item);
    const normalized = normalizeProductVideos([item], true)[0];
    assert.equal(normalized.title, '');
    assert.equal(productVideoTitle(normalized, 'zh'), '视频介绍');
    assert.equal(productVideoTitle(normalized, 'en'), 'Video introduction');
    assert.equal(JSON.stringify(item), before);
  }
  assert.equal(productVideoTitle({}), '视频介绍');
  assert.equal(productVideoTitle({title: '  自定义名称  '}, 'en'), '自定义名称');
});

test('optional title does not bypass source validation or accept malformed titles', () => {
  for (const title of [12, {}, 'x'.repeat(161)]) {
    assert.throws(() => normalizeProductVideos([{ ...video(), title }], true), /PRODUCT_VIDEO_INVALID/);
  }
  for (const url of ['', 'javascript:alert(1)', 'https://127.0.0.1/video']) {
    assert.throws(() => normalizeProductVideos([{ ...video(), title: '', sources: [{id:'source',label:'',url}] }], true));
  }
});
