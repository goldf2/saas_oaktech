import assert from 'node:assert/strict';
import test from 'node:test';
import { platformKey, platformLabel, togglePlatform, hasPlatform, matchesPlatform, categoryLabel, PLATFORM_PRESETS, PRODUCT_CATEGORY_PRESETS } from '../lib/store/presentation.ts';

test('platform presets include operating systems, web and browser extension without using product categories', () => {
  for (const value of ['Windows','macOS','Linux','Android','iOS','Browser Extension','Web']) assert.ok(PLATFORM_PRESETS.some(p => p.value === value));
  assert.ok(PRODUCT_CATEGORY_PRESETS.some(p => p.value === 'modeling-software'));
  assert.ok(!PRODUCT_CATEGORY_PRESETS.some(p => String(p.value) === 'desktop-apps'));
});
test('platform selection preserves legacy values and only changes the chosen target', () => {
  const old = ['macOS','Windows','Custom Runtime']; const snapshot = JSON.stringify(old);
  const next = togglePlatform(old, 'Android', true);
  assert.deepEqual(next, [...old,'Android']); assert.equal(JSON.stringify(old), snapshot);
  assert.deepEqual(togglePlatform(next,'Windows',false), ['macOS','Custom Runtime','Android']);
  assert.deepEqual(togglePlatform(old,'mac',true), old);
});
test('alias recognition does not silently rewrite or duplicate stored declarations', () => {
  assert.equal(hasPlatform(['win','mac','安卓'],'Windows'),true);
  assert.deepEqual(togglePlatform(['win','mac'],'Windows',true), ['win','mac']);
  assert.deepEqual(togglePlatform(['win','Windows','mac'],'Windows',false), ['mac']);
  assert.equal(platformLabel('Browser Extension','zh'),'浏览器插件');
  assert.equal(platformLabel('Web','en'),'Web');
});
test('prototype-like and unknown platform strings remain harmless literal strings', () => {
  for (const value of ['__proto__','constructor','toString','Custom OS']) assert.equal(platformKey(value),value);
});
test('platform filters recognize existing Chrome entries, without inventing OS support', () => {
  assert.equal(matchesPlatform(['Chrome'],'Browser Extension'),true);
  assert.equal(matchesPlatform(['macOS'],'Android'),false);
  assert.equal(matchesPlatform(['Browser Extension'],'Chrome'),false);
  assert.equal(matchesPlatform(['mac'],'macOS'),true);
  assert.equal(matchesPlatform([], 'all'),true);
});
test('public category names are localized while unknown persisted categories remain visible', () => {
  assert.equal(categoryLabel('ai-tools','zh'),'AI工具');
  assert.equal(categoryLabel('modeling-software','en'),'3D modeling');
  assert.equal(categoryLabel('browser-extensions','zh'),'浏览器扩展');
  assert.equal(categoryLabel('custom-tools','zh'),'custom tools');
});
