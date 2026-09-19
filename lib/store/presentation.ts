import type { Locale } from './types';

export const PLATFORM_PRESETS = [
  { value: 'Windows', zh: 'Windows', en: 'Windows' },
  { value: 'macOS', zh: 'macOS', en: 'macOS' },
  { value: 'Linux', zh: 'Linux', en: 'Linux' },
  { value: 'Android', zh: 'Android（安卓）', en: 'Android' },
  { value: 'iOS', zh: 'iOS', en: 'iOS' },
  { value: 'Browser Extension', zh: '浏览器插件', en: 'Browser extension' },
  { value: 'Web', zh: '网页版', en: 'Web' },
] as const;
export const RUNTIME_PRESETS = ['Chrome', 'Edge', 'Firefox', 'Safari', 'TradingView'] as const;
const aliases: Record<string, string> = { win: 'Windows', windows: 'Windows', win32: 'Windows', mac: 'macOS', macos: 'macOS', 'mac os': 'macOS', osx: 'macOS', linux: 'Linux', android: 'Android', '安卓': 'Android', ios: 'iOS', web: 'Web', '网页版': 'Web', 'browser extension': 'Browser Extension', 'browser-extension': 'Browser Extension', 'browser-extensions': 'Browser Extension', '浏览器插件': 'Browser Extension', '浏览器扩展': 'Browser Extension', chrome: 'Chrome', edge: 'Edge', firefox: 'Firefox', safari: 'Safari', tradingview: 'TradingView' };
export function platformKey(value: string) { const key = value.trim().toLowerCase(); return Object.prototype.hasOwnProperty.call(aliases, key) ? aliases[key] : value.trim(); }
export function platformLabel(value: string, locale: Locale = 'zh') { const key = platformKey(value); return PLATFORM_PRESETS.find(p => p.value === key)?.[locale] ?? key; }
export function hasPlatform(values: readonly string[], platform: string) { return values.some(value => platformKey(value) === platformKey(platform)); }
export function togglePlatform(values: readonly string[], platform: string, checked: boolean): string[] {
  const key = platformKey(platform);
  return checked ? hasPlatform(values, key) ? [...values] : [...values, key] : values.filter(value => platformKey(value) !== key);
}
export function matchesPlatform(values: readonly string[], selected: string) {
  if (!selected || selected === 'all') return true;
  return hasPlatform(values, selected) || platformKey(selected) === 'Browser Extension' && values.some(value => ['Chrome', 'Edge', 'Firefox', 'Safari'].includes(platformKey(value)));
}
export const PRODUCT_CATEGORY_PRESETS = [
  { value: 'ai-tools', zh: 'AI工具', en: 'AI tools' },
  { value: 'modeling-software', zh: '建模软件', en: '3D modeling' },
  { value: 'utility-tools', zh: '实用工具', en: 'Utilities' },
  { value: 'productivity-tools', zh: '效率工具', en: 'Productivity' },
  { value: 'developer-tools', zh: '开发工具', en: 'Developer tools' },
  { value: 'design-tools', zh: '设计工具', en: 'Design tools' },
  { value: 'trading-tools', zh: '交易研究工具', en: 'Trading research' },
] as const;
export function categoryLabel(value: string, locale: Locale = 'zh') {
  const preset = PRODUCT_CATEGORY_PRESETS.find(p => p.value === value);
  if (preset) return preset[locale];
  const legacy: Record<string, [string, string]> = { 'desktop-apps': ['桌面应用', 'Desktop apps'], 'browser-extensions': ['浏览器扩展', 'Browser extensions'] };
  return legacy[value]?.[locale === 'zh' ? 0 : 1] ?? value.replaceAll('-', ' ');
}
