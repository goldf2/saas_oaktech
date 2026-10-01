// Public project sources verified against their repositories. These are links,
// not seeded products or promises that packages have been published locally.
import { isSoftwareDownload } from './download-visibility.ts';
import type { ProductRelease } from './types.ts';

export const PRODUCT_GITHUB_URLS: Readonly<Record<string, string>> = {
  'open-play': 'https://github.com/goldf2/open-play-releases/releases',
  'gitfinder-2': 'https://github.com/goldf2/GitFinder/releases',
  'video-prompt-workbench': 'https://github.com/goldf2/video-prompt-workbench-releases/releases',
  'x-tweet-extractor': 'https://github.com/goldf2/x-tweet-extractor',
};

export function normalizeProductGithubUrl(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.length > 2048) throw new Error('PRODUCT_GITHUB_URL_INVALID');
  const raw = value.trim();
  if (!raw) return '';
  try {
    if (/[\\\u0000-\u0020]/.test(raw)) throw new Error();
    const url = new URL(raw);
    const parts = url.pathname.replace(/\/$/, '').split('/').slice(1);
    if (url.origin !== 'https://github.com' || url.username || url.password || url.search || url.hash
      || parts.length < 2 || !parts.slice(0, 2).every(p => /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(p))
      || parts.length > 2 && !(parts[2] === 'releases' && (parts.length === 3
        || parts.length === 4 && parts[3] === 'latest'
        || parts.length === 5 && parts[3] === 'tag' && /^[a-zA-Z0-9][a-zA-Z0-9_.%+-]*$/.test(parts[4])))) throw new Error();
    return `https://github.com/${parts.join('/')}`;
  } catch { throw new Error('PRODUCT_GITHUB_URL_INVALID'); }
}

export function productGithubUrl(slug: string, configured?: string): string {
  // An explicitly empty value removes the default. Invalid persisted data never
  // becomes an external anchor; old clients that omit the field keep it intact.
  try { return normalizeProductGithubUrl(configured) ?? PRODUCT_GITHUB_URLS[slug] ?? ''; }
  catch { return ''; }
}

export function selectDownloadRelease(releases: ProductRelease[]): ProductRelease | undefined {
  const available = releases.filter(r => r.status === 'published' && r.artifacts.some(isSoftwareDownload));
  return available.find(r => r.isCurrent) ?? available.sort((a, b) =>
    (Date.parse(b.publishedAt ?? '') || 0) - (Date.parse(a.publishedAt ?? '') || 0))[0];
}
