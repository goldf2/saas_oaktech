import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { mutateStoreCatalog, readStoreCatalog } from './file-catalog';
import { isReleaseVersion, isStoreSlug } from './policy';
import type { AdminProductReleaseRow } from './types';

export const slugSchema = z.string().refine(isStoreSlug, 'INVALID_SLUG');
const short = z.string().max(2048);
const long = z.string().max(30000);
const video = z.object({ id: short, title: short, poster_url: short, sources: z.array(z.object({ id: short, label: short, url: short }).strict()).max(4) }).strict();
export const productFields = z.object({
  category_slug: slugSchema, status: z.enum(['beta','released','coming-soon']),
  name_zh: short, name_en: short, tagline_zh: short, tagline_en: short,
  description_zh: long, description_en: long, icon_url: short, hero_image_url: short,
  gallery_urls: z.array(short).max(8), videos: z.array(video).max(6),
  supported_platforms: z.array(z.string().max(80)).max(20), featured: z.boolean(),
}).strict();
export const releaseFields = z.object({ title_zh: short.trim().min(1), title_en: short.trim().min(1), notes_zh: long.trim().min(1), notes_en: long.trim().min(1) }).strict();
export const releaseIdentity = z.object({ product_slug: slugSchema, version: z.string().refine(isReleaseVersion), channel: slugSchema }).strict();
export const releaseEditToken = (r: AdminProductReleaseRow) => createHash('sha256').update(JSON.stringify(r)).digest('hex');
export function publicRelease(r: AdminProductReleaseRow) {
  return { ...r, release_artifacts: r.release_artifacts.map(({ storage_path: _private, ...a }) => a), editToken: releaseEditToken(r) };
}
export async function findRelease(id: string) {
  const r = (await readStoreCatalog()).catalog.releases.find(r => r.id === id);
  if (!r) throw new Error('DRAFT_RELEASE_NOT_FOUND');
  return r;
}
export async function createReleaseDraft(input: z.infer<typeof releaseIdentity> & z.infer<typeof releaseFields>) {
  return mutateStoreCatalog(catalog => {
    if (!catalog.products.some(p => p.slug === input.product_slug)) throw new Error('STORE_PRODUCT_NOT_FOUND');
    const existing = catalog.releases.find(r => r.product_slug === input.product_slug && r.version === input.version && r.channel === input.channel);
    if (existing) throw new Error('PRODUCT_RELEASE_ALREADY_EXISTS');
    const release: AdminProductReleaseRow = { ...input, id: randomUUID(), status:'draft', is_current:false, published_at:null, release_artifacts:[] };
    catalog.releases.push(release);
    return publicRelease(release);
  });
}
export async function updateReleaseDraft(id: string, expected: string, patch: z.infer<ReturnType<typeof releaseFields.partial>>) {
  return mutateStoreCatalog(catalog => {
    const r = catalog.releases.find(r => r.id === id);
    if (!r) throw new Error('DRAFT_RELEASE_NOT_FOUND');
    if (r.status !== 'draft') throw new Error('PUBLISHED_RELEASE_IS_IMMUTABLE');
    if (releaseEditToken(r) !== expected) throw new Error('RELEASE_EDIT_CONFLICT');
    Object.assign(r, patch);
    return publicRelease(r);
  });
}
