import 'server-only';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { getReleaseStorageRoot } from './storage';
import { mutateStoreCatalog, readStoreCatalog, type StoreCatalog } from './file-catalog';
import { isStoreSlug } from './policy';
import type { ProductMedia, AdminStoreProductRow } from './types';

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_PRODUCT_IMAGES = 64;
const IMAGE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/;
export function productImageUrls(product: AdminStoreProductRow) {
  return [product.icon_url, product.hero_image_url, ...(product.gallery_urls ?? []), ...(product.videos ?? []).map(video => video.poster_url)].filter(Boolean);
}
export function isPublicProductImage(catalog: StoreCatalog, url: string) {
  return catalog.products.some(p => p.visibility === 'published' && productImageUrls(p).includes(url));
}
export function validateProductImageReferences(catalog: StoreCatalog, product: AdminStoreProductRow) {
  for (const url of productImageUrls(product)) {
    if (url.startsWith('/media/products/') && !(catalog.productMedia ?? []).some(m => m.productSlug === product.slug && m.url === url)) {
      throw new Error('PRODUCT_IMAGE_SCOPE');
    }
  }
}
export function productImageFile(productSlug: string, file: string) {
  if (!isStoreSlug(productSlug) || !IMAGE_ID.test(file)) throw new Error('PRODUCT_IMAGE_PATH');
  return path.join(getReleaseStorageRoot(), '.product-media', productSlug, file);
}
export async function readLimitedImage(request: Request) {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_IMAGE_BYTES) throw new Error('PRODUCT_IMAGE_TOO_LARGE');
  if (!request.body) throw new Error('PRODUCT_IMAGE_EMPTY');
  const reader = request.body.getReader(), chunks: Uint8Array[] = [];
  let count = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      count += value.byteLength;
      if (count > MAX_IMAGE_BYTES) { await reader.cancel(); throw new Error('PRODUCT_IMAGE_TOO_LARGE'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}
export async function storeProductImage(productSlug: string, input: Buffer): Promise<ProductMedia> {
  if (input.length > MAX_IMAGE_BYTES) throw new Error('PRODUCT_IMAGE_TOO_LARGE');
  if (!input.length) throw new Error('PRODUCT_IMAGE_EMPTY');
  const png = input.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpeg = input[0] === 255 && input[1] === 216 && input[2] === 255;
  const webp = input.subarray(0,4).toString() === 'RIFF' && input.subarray(8,12).toString() === 'WEBP';
  if (!png && !jpeg && !webp) throw new Error('PRODUCT_IMAGE_TYPE');
  const { catalog } = await readStoreCatalog();
  if (!catalog.products.some(p => p.slug === productSlug)) throw new Error('STORE_PRODUCT_NOT_FOUND');
  if ((catalog.productMedia ?? []).filter(m => m.productSlug === productSlug).length >= MAX_PRODUCT_IMAGES) throw new Error('PRODUCT_IMAGE_LIMIT');
  let bytes: Buffer, width: number, height: number;
  try {
    const image = sharp(input, { limitInputPixels: 24_000_000, failOn: 'warning', animated: false });
    const meta = await image.metadata();
    if (!['png','jpeg','webp'].includes(meta.format ?? '') || (meta.pages ?? 1) > 1 || !meta.width || !meta.height || Math.min(meta.width,meta.height) < 16) throw new Error('invalid');
    const output = await image.rotate().resize({width:2560,height:2560,fit:'inside',withoutEnlargement:true}).webp({quality:88}).toBuffer({resolveWithObject:true});
    bytes = output.data; width = output.info.width; height = output.info.height;
  } catch { throw new Error('PRODUCT_IMAGE_INVALID'); }
  if (bytes.length > MAX_IMAGE_BYTES) throw new Error('PRODUCT_IMAGE_TOO_LARGE');
  const id = randomUUID(), file = `${id}.webp`, destination = productImageFile(productSlug,file);
  const item: ProductMedia = {id,productSlug,url:`/media/products/${productSlug}/${file}`,sizeBytes:bytes.length,width,height,createdAt:new Date().toISOString()};
  await mkdir(path.dirname(destination), {recursive:true});
  await writeFile(destination, bytes, {flag:'wx',mode:0o640});
  try {
    await mutateStoreCatalog(next => {
      if (!next.products.some(p => p.slug === productSlug)) throw new Error('STORE_PRODUCT_NOT_FOUND');
      next.productMedia ??= [];
      if (next.productMedia.filter(m => m.productSlug === productSlug).length >= MAX_PRODUCT_IMAGES) throw new Error('PRODUCT_IMAGE_LIMIT');
      next.productMedia.push(item);
    });
  } catch (error) { await unlink(destination).catch(()=>{}); throw error; }
  return item;
}
export async function verifyProductImages(catalog: StoreCatalog, product: AdminStoreProductRow) {
  validateProductImageReferences(catalog,product);
  for (const url of productImageUrls(product)) {
    if (!url.startsWith('/media/products/')) continue;
    const name = url.split('/').at(-1)!;
    const details = await stat(productImageFile(product.slug,name));
    const item = catalog.productMedia!.find(m=>m.url===url)!;
    if (!details.isFile() || details.size !== item.sizeBytes) throw new Error('PRODUCT_IMAGE_MISSING');
  }
}
export async function loadProductImage(productSlug: string, file: string) {
  return readFile(productImageFile(productSlug,file));
}
