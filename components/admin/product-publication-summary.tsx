"use client";

import { productPublicationSummary } from '@/lib/store/product-publication-summary';
import type { AdminStoreProductRow } from '@/lib/store/types';

export function ProductPublicationSummary({ product, live, dirty }: {
  product: AdminStoreProductRow; live: AdminStoreProductRow | null; dirty: boolean;
}) {
  const summary = productPublicationSummary(product, live);
  return <section data-testid="product-change-summary" className="rounded-lg border bg-muted/20 p-3 text-sm">
    <h3 className="font-semibold">本次将公开的商品资料</h3>
    <p className="mt-2">{summary.changedFields.length ? `变更：${summary.changedFields.map(x => x.label).join('、')}` : '资料与当前线上一致。'}</p>
    <p className="mt-1" data-testid="publication-video-count">视频介绍：线上 {summary.liveVideoCount} 段 → 本次 {summary.nextVideoCount} 段</p>
    {product.videos?.length ? <p className="mt-1 break-words">{product.videos.map((v, i) => `${i + 1}. ${v.title.trim() || '未填写标题'}`).join('；')}</p> : null}
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <div><p className="text-xs font-medium text-muted-foreground">当前线上中文说明</p><p className="mt-1 whitespace-pre-wrap break-words">{live?.description_zh.slice(0, 400) || '尚未发布商品介绍'}</p></div>
      <div><p className="text-xs font-medium text-muted-foreground">本次中文说明{dirty ? '（尚未保存）' : ''}</p><p className="mt-1 whitespace-pre-wrap break-words">{product.description_zh.slice(0, 400) || '尚未填写'}</p></div>
    </div>
    {(product.description_zh.length > 400 || (live?.description_zh.length ?? 0) > 400) && <p className="mt-2 text-xs text-muted-foreground">这里只显示前400字，完整效果见下方商品页预览。</p>}
    {summary.independentEnglishUnchanged && <p data-testid="independent-english-notice" className="mt-3 rounded border border-amber-300 p-2 text-xs">本次修改了中文说明，但英文说明仍是独立填写的旧内容。英文页不会自动翻译中文；请检查英文资料或在下方切换英文预览。视频是两种语言共用的。</p>}
    <p className="mt-2 text-xs text-muted-foreground">确认后在商品详情页展示以上图文和视频，不需要安装包，不会发布任何软件版本。</p>
  </section>;
}
