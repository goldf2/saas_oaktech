import type { AdminStoreProductRow, Locale } from './types';

const fields = [
  ['name_zh', '中文名称', 'Chinese name'], ['name_en', '英文名称', 'English name'],
  ['tagline_zh', '中文简介', 'Chinese tagline'], ['tagline_en', '英文简介', 'English tagline'],
  ['description_zh', '中文详细说明', 'Chinese description'], ['description_en', '英文详细说明', 'English description'],
  ['icon_url', '图标', 'Icon'], ['hero_image_url', '封面', 'Cover'], ['gallery_urls', '产品截图', 'Screenshots'],
  ['videos', '视频介绍', 'Videos'], ['category_slug', '商品类别', 'Category'], ['status', '展示标签', 'Display label'],
  ['supported_platforms', '支持平台', 'Platforms'], ['featured', '首页推荐', 'Featured'],
] as const;

// Presentation only: does not save, publish, compare releases or modify live data.
export function productPublicationSummary(draft: AdminStoreProductRow, live: AdminStoreProductRow | null, locale: Locale = 'zh') {
  const comparable = (row: AdminStoreProductRow, field: typeof fields[number][0]) => {
    if (field === 'videos' || field === 'gallery_urls') return row[field] ?? [];
    return row[field];
  };
  return {
    changedFields: fields.filter(([field]) => !live || JSON.stringify(comparable(draft, field)) !== JSON.stringify(comparable(live, field)))
      .map(([field, zh, en]) => ({ field, label: locale === 'zh' ? zh : en })),
    liveVideoCount: live?.videos?.length ?? 0,
    nextVideoCount: draft.videos?.length ?? 0,
    independentEnglishUnchanged: Boolean(live && draft.description_zh !== live.description_zh
      && draft.description_en.trim() && draft.description_en === live.description_en),
    publicLinks: { zh: `/zh/products/${encodeURIComponent(draft.slug)}`, en: `/en/products/${encodeURIComponent(draft.slug)}` },
  };
}
