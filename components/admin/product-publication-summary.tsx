"use client";

import { productPublicationSummary } from '@/lib/store/product-publication-summary';
import { productVideoTitle } from '@/lib/store/product-videos';
import type { AdminStoreProductRow } from '@/lib/store/types';
import { useLocale } from '@/i18n/locale-provider';

export function ProductPublicationSummary({ product, live, dirty }: {
  product: AdminStoreProductRow; live: AdminStoreProductRow | null; dirty: boolean;
}) {
  const { locale } = useLocale();
  const zh = locale === 'zh';
  const summary = productPublicationSummary(product, live, locale);
  const liveDescription = locale === 'zh' ? live?.description_zh : live?.description_en;
  const editedDescription = locale === 'zh' ? product.description_zh : product.description_en || product.description_zh;
  return <section data-testid="product-change-summary" className="min-w-0 space-y-3 py-3 text-sm" data-page-locale={locale}>
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{zh ? '本次更新' : 'Changes in this publication'}</h3><span className="text-xs text-muted-foreground">{dirty ? (zh ? '尚未保存' : 'Unsaved') : (zh ? '已保存的资料' : 'Saved product data')}</span></div>
    <div className="flex flex-wrap gap-1.5">{summary.changedFields.length ? summary.changedFields.map(item => <span key={item.field} className="rounded-md bg-muted px-2 py-1 text-xs">{item.label}</span>) : <span className="text-muted-foreground">{zh ? '资料与当前线上一致。' : 'Product data matches the live version.'}</span>}</div>
    <p data-testid="publication-video-count">{zh ? '视频介绍：线上 ' + summary.liveVideoCount + ' 段 → 本次 ' + summary.nextVideoCount + ' 段' : 'Videos: live ' + summary.liveVideoCount + ' → this publication ' + summary.nextVideoCount}</p>
    {!!product.videos?.length && <p className="break-words text-muted-foreground">{product.videos.map((v, i) => (i + 1) + '. ' + productVideoTitle(v)).join(zh ? '；' : '; ')}</p>}
    <details className="border-y py-2.5" data-testid="publication-copy-comparison"><summary className="cursor-pointer text-sm font-medium">{zh ? '对比新旧文字说明' : 'Compare live and edited descriptions'}</summary>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div><p className="text-xs font-medium text-muted-foreground">{zh ? '当前线上' : 'Live now'}</p><p className="mt-1 whitespace-pre-wrap break-words">{liveDescription?.slice(0, 400) || (zh ? '尚未发布商品介绍' : 'No product introduction has been published')}</p></div>
        <div><p className="text-xs font-medium text-muted-foreground">{zh ? '本次中文说明' + (dirty ? '（尚未保存）' : '') : 'This description' + (dirty ? ' (unsaved)' : '')}</p><p className="mt-1 whitespace-pre-wrap break-words">{editedDescription.slice(0, 400) || (zh ? '尚未填写' : 'Not provided')}</p></div>
      </div>
      {(editedDescription.length > 400 || (liveDescription?.length ?? 0) > 400) && <p className="mt-2 text-xs text-muted-foreground">{zh ? '这里只显示前400字；完整内容见商品页预览。' : 'Only the first 400 characters are shown here; use the product-page preview for the full text.'}</p>}
    </details>
    {summary.independentEnglishUnchanged && <p data-testid="independent-english-notice" className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">{zh ? '中文说明已修改，独立英文说明仍保持原内容。视频在中英文商品页共用。' : 'The Chinese description changed while the independent English description is unchanged. Videos are shared by both language pages.'}</p>}
  </section>;
}
