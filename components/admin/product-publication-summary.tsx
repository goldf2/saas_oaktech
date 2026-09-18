"use client";

import { productPublicationSummary } from '@/lib/store/product-publication-summary';
import { productVideoTitle } from '@/lib/store/product-videos';
import type { AdminStoreProductRow } from '@/lib/store/types';

export function ProductPublicationSummary({ product, live, dirty }: {
  product: AdminStoreProductRow; live: AdminStoreProductRow | null; dirty: boolean;
}) {
  const summary = productPublicationSummary(product, live);
  return <section data-testid="product-change-summary" className="min-w-0 space-y-3 py-3 text-sm">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">本次更新</h3><span className="text-xs text-muted-foreground">{dirty ? '尚未保存' : '已保存的资料'}</span></div>
    <div className="flex flex-wrap gap-1.5">{summary.changedFields.length ? summary.changedFields.map(item => <span key={item.field} className="rounded-md bg-muted px-2 py-1 text-xs">{item.label}</span>) : <span className="text-muted-foreground">资料与当前线上一致。</span>}</div>
    <p data-testid="publication-video-count">视频介绍：线上 {summary.liveVideoCount} 段 → 本次 {summary.nextVideoCount} 段</p>
    {!!product.videos?.length && <p className="break-words text-muted-foreground">{product.videos.map((v, i) => `${i + 1}. ${productVideoTitle(v)}`).join('；')}</p>}
    <details className="border-y py-2.5" data-testid="publication-copy-comparison"><summary className="cursor-pointer text-sm font-medium">对比新旧文字说明</summary>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div><p className="text-xs font-medium text-muted-foreground">当前线上</p><p className="mt-1 whitespace-pre-wrap break-words">{live?.description_zh.slice(0, 400) || '尚未发布商品介绍'}</p></div>
        <div><p className="text-xs font-medium text-muted-foreground">本次中文说明{dirty ? '（尚未保存）' : ''}</p><p className="mt-1 whitespace-pre-wrap break-words">{product.description_zh.slice(0, 400) || '尚未填写'}</p></div>
      </div>
      {(product.description_zh.length > 400 || (live?.description_zh.length ?? 0) > 400) && <p className="mt-2 text-xs text-muted-foreground">这里只显示前400字；完整内容见商品页预览。</p>}
    </details>
    {summary.independentEnglishUnchanged && <p data-testid="independent-english-notice" className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">中文说明已修改，独立英文说明仍保持原内容。视频在中英文商品页共用。</p>}
  </section>;
}
