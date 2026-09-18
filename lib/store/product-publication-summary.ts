import type { AdminStoreProductRow } from './types';

const fields = [
  ['name_zh', '中文名称'], ['name_en', '英文名称'],
  ['tagline_zh', '中文简介'], ['tagline_en', '英文简介'],
  ['description_zh', '中文详细说明'], ['description_en', '英文详细说明'],
  ['icon_url', '图标'], ['hero_image_url', '封面'], ['gallery_urls', '产品截图'],
  ['videos', '视频介绍'], ['category_slug', '商品类别'], ['status', '展示标签'],
  ['supported_platforms', '支持平台'], ['featured', '首页推荐'],
] as const;

// Presentation only: does not save, publish, compare releases or modify live data.
export function productPublicationSummary(draft: AdminStoreProductRow, live: AdminStoreProductRow | null) {
  const comparable = (row: AdminStoreProductRow, field: typeof fields[number][0]) => {
    if (field === 'videos' || field === 'gallery_urls') return row[field] ?? [];
    return row[field];
  };
  return {
    changedFields: fields.filter(([field]) => !live || JSON.stringify(comparable(draft, field)) !== JSON.stringify(comparable(live, field)))
      .map(([field, label]) => ({ field, label })),
    liveVideoCount: live?.videos?.length ?? 0,
    nextVideoCount: draft.videos?.length ?? 0,
    independentEnglishUnchanged: Boolean(live && draft.description_zh !== live.description_zh
      && draft.description_en.trim() && draft.description_en === live.description_en),
    publicLinks: { zh: `/zh/products/${encodeURIComponent(draft.slug)}`, en: `/en/products/${encodeURIComponent(draft.slug)}` },
  };
}
