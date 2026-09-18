import 'server-only';
// Internal draft/publication service; HTTP and Server Action adapters enforce
// the existing requireStoreAdmin gate before calling this module.
import { createHash, randomUUID } from 'node:crypto';
import { mutateStoreCatalog, readStoreCatalog, type StoreCatalog } from './file-catalog';
import { isManagedAssetUrl, isStoreSlug } from './policy';
import { normalizeProductVideos } from './product-videos';
import { prepareUpdaterManifests } from './storage';
import { validateProductImageReferences, verifyProductImages } from './product-media';
import type { AdminStoreProductRow } from './types';

const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function editableProduct(catalog: StoreCatalog, slug: string) {
  return catalog.productDrafts?.[slug]?.product ?? catalog.products.find(p=>p.slug===slug);
}
export function productToken(catalog: StoreCatalog, slug: string) {
  return digest([catalog.products.find(p=>p.slug===slug) ?? null,catalog.productDrafts?.[slug] ?? null]);
}
export function publicationToken(catalog: StoreCatalog, slug: string) {
  return digest([productToken(catalog,slug),catalog.releases.filter(r=>r.product_slug===slug)]);
}
export function validateProductInput(product: AdminStoreProductRow, publishing=false) {
  normalizeProductVideos(product.videos, publishing);
  if (!isStoreSlug(product.slug) || !isStoreSlug(product.category_slug)) throw new Error('INVALID_PRODUCT_SLUG');
  if (!['beta','released','coming-soon'].includes(product.status)) throw new Error('INVALID_PRODUCT_STATUS');
  for (const key of ['name_zh','name_en','tagline_zh','tagline_en','description_zh','description_en','icon_url','hero_image_url'] as const) {
    if (typeof product[key] !== 'string' || product[key].length > (key.startsWith('description')?30000:2048)) throw new Error('PRODUCT_FIELD_INVALID');
  }
  if (!Array.isArray(product.supported_platforms) || product.supported_platforms.length>20 || product.supported_platforms.some(v=>typeof v!=='string'||v.length>80)) throw new Error('PRODUCT_FIELD_INVALID');
  if (!Array.isArray(product.gallery_urls ?? []) || (product.gallery_urls?.length ?? 0)>8) throw new Error('PRODUCT_GALLERY_LIMIT');
  if (typeof product.featured !== 'boolean') throw new Error('PRODUCT_FIELD_INVALID');
  for (const url of [product.icon_url,product.hero_image_url,...(product.gallery_urls??[])]) if (typeof url !== 'string' || (url && (!isManagedAssetUrl(url) || url.length>2048))) throw new Error('INVALID_PRODUCT_ASSET_URL');
  if (publishing && [product.name_zh,product.tagline_zh,product.description_zh,product.icon_url,product.hero_image_url].some(v=>!v.trim())) throw new Error('PRODUCT_PUBLICATION_INCOMPLETE');
}
export async function saveProductDraft(input: AdminStoreProductRow, expected: string) {
  validateProductInput(input);
  return mutateStoreCatalog(catalog=>{
    const existing = input.id ? catalog.products.find(p=>p.id===input.id) : undefined;
    if (input.id && (!existing || existing.slug!==input.slug)) throw new Error('PRODUCT_IDENTITY_IMMUTABLE');
    if (!input.id && catalog.products.some(p=>p.slug===input.slug)) throw new Error('STORE_PRODUCT_SLUG_EXISTS');
    if (existing && productToken(catalog,input.slug)!==expected) throw new Error('PRODUCT_EDIT_CONFLICT');
    const value: AdminStoreProductRow = {...existing,...input,id:existing?.id??randomUUID(),visibility:existing?.visibility??'draft',gallery_urls:[...(input.gallery_urls??[])],videos:normalizeProductVideos(input.videos ?? (existing ? editableProduct(catalog,input.slug)?.videos : undefined))};
    validateProductImageReferences(catalog,value);
    if(!existing) catalog.products.push({...value,visibility:'draft'});
    catalog.productDrafts ??= {};
    const revision=(catalog.productDrafts[input.slug]?.revision??0)+1;
    catalog.productDrafts[input.slug]={product:value,revision,updatedAt:new Date().toISOString()};
    return {id:value.id,slug:value.slug,revision};
  });
}
export async function publishProductDraft(slug: string, expected: string, releaseIds: string[]) {
  const {catalog} = await readStoreCatalog();
  if(publicationToken(catalog,slug)!==expected) throw new Error('PRODUCT_PUBLICATION_CONFLICT');
  const input = editableProduct(catalog,slug);
  if(!input) throw new Error('STORE_PRODUCT_NOT_FOUND');
  validateProductInput(input,true);
  if(!Array.isArray(releaseIds)||releaseIds.length>20||new Set(releaseIds).size!==releaseIds.length) throw new Error('PRODUCT_RELEASE_SCOPE');
  const selected=releaseIds.map(id=>{
    const r=catalog.releases.find(r=>r.id===id);
    if(!r||r.product_slug!==slug||r.status!=='draft') throw new Error('PRODUCT_RELEASE_SCOPE');
    return r;
  });
  if(new Set(selected.map(r=>r.channel)).size!==selected.length) throw new Error('PRODUCT_CHANNEL_CONFLICT');
  await verifyProductImages(catalog,input);
  const publishedAt=new Date().toISOString();
  // No public metadata is modified until all selected packages pass their existing validators.
  for(const release of selected) await prepareUpdaterManifests({...release,published_at:publishedAt});
  await mutateStoreCatalog(next=>{
    if(publicationToken(next,slug)!==expected) throw new Error('PRODUCT_PUBLICATION_CONFLICT');
    const index=next.products.findIndex(p=>p.slug===slug);
    if(index<0)throw new Error('STORE_PRODUCT_NOT_FOUND');
    next.products[index]={...input,videos:normalizeProductVideos(input.videos,true),visibility:'published',name_en:input.name_en.trim()||input.name_zh,tagline_en:input.tagline_en.trim()||input.tagline_zh,description_en:input.description_en.trim()||input.description_zh};
    if(next.productDrafts)delete next.productDrafts[slug];
    for(const selectedRelease of selected) {
      for(const r of next.releases) if(r.product_slug===slug&&r.channel===selectedRelease.channel) r.is_current=false;
      const r=next.releases.find(r=>r.id===selectedRelease.id)!;
      r.status='published'; r.is_current=true; r.published_at=publishedAt;
    }
  });
  return {slug,releasesPublished:selected.length};
}
