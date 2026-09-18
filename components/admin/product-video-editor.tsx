"use client";

import { Plus, Upload, Video, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_PRODUCT_VIDEOS, MAX_VIDEO_SOURCES, videoSourceInfo, videoMessages, parseVideoSource, type ProductVideo } from "@/lib/store/product-videos";

export function ProductVideoEditor({ videos, disabled, canUpload, onChange, onUploadPoster }: {
  videos: ProductVideo[];
  disabled: boolean;
  canUpload: boolean;
  onChange: (videos: ProductVideo[]) => void;
  onUploadPoster: (file: File, videoId: string) => void;
}) {
  const update = (id: string, changes: Partial<ProductVideo>) => onChange(videos.map(video => video.id === id ? { ...video, ...changes } : video));
  function moveVideo(index: number, delta: number) {
    const next = [...videos]; [next[index], next[index + delta]] = [next[index + delta], next[index]]; onChange(next);
  }
  function sourceError(url: string) {
    if (!url.trim()) return "粘贴视频链接，自动识别平台，不需要 HTML 嵌入代码。";
    try { parseVideoSource(url); return ""; } catch (error) { return videoMessages[(error as Error).message] || "视频链接暂无法识别。"; }
  }
  return <section className="mt-6 rounded-xl border p-4 sm:p-5" data-testid="product-video-editor">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="flex items-center gap-2 text-xl font-semibold"><Video className="h-5 w-5" aria-hidden="true" />视频介绍</h2>
        <p className="mt-2 text-sm text-muted-foreground">{videos.length}/{MAX_PRODUCT_VIDEOS} 段视频 · 支持 YouTube、B站页内播放；其他平台保留外链观看。第一条来源作为默认来源。</p></div>
      <Button type="button" data-testid="add-product-video" disabled={disabled || videos.length >= MAX_PRODUCT_VIDEOS}
        onClick={() => onChange([...videos, { id: crypto.randomUUID(), title: "", poster_url: "", sources: [{ id: crypto.randomUUID(), label: "", url: "" }] }])}>
        <Plus className="mr-2 h-4 w-4" />添加视频
      </Button>
    </div>
    {!videos.length && <p className="mt-4 rounded-lg bg-muted/30 p-5 text-sm text-muted-foreground">添加产品演示、安装教程或使用说明。同一段视频可以配置 B站、YouTube 等多个播放来源；视频文件仍由原平台托管。</p>}
    <fieldset disabled={disabled} className="mt-5 min-w-0 space-y-5">
      {videos.map((video, index) => <article key={video.id} data-edit-video={video.id} className="min-w-0 rounded-xl border bg-muted/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">视频 {index + 1}</h3><div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" disabled={disabled || index === 0} aria-label={`视频${index + 1}前移`} onClick={() => moveVideo(index, -1)}><ArrowUp className="h-4 w-4" /><span className="sr-only">前移</span></Button>
          <Button type="button" size="sm" variant="outline" disabled={disabled || index === videos.length - 1} aria-label={`视频${index + 1}后移`} onClick={() => moveVideo(index, 1)}><ArrowDown className="h-4 w-4" /><span className="sr-only">后移</span></Button>
          <Button type="button" size="sm" variant="outline" aria-label={`移除视频${index + 1}`} onClick={() => onChange(videos.filter(item => item.id !== video.id))}><Trash2 className="mr-1 h-4 w-4" />移除视频</Button>
        </div></div>
        <label className="mt-4 block text-sm font-medium">视频标题<Input data-video-title className="mt-2" value={video.title} maxLength={160} onChange={e => update(video.id, { title: e.target.value })} placeholder="例如：产品功能演示" /></label>
        <div className="mt-4 rounded-lg border p-3">
          {video.poster_url && <img data-video-poster-preview src={video.poster_url} alt="视频封面预览" className="mb-3 max-h-44 max-w-full rounded-lg object-contain" />}
          <label className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${disabled || !canUpload ? 'cursor-not-allowed opacity-50' : 'hover:opacity-90'}`}>
            <Upload className="h-4 w-4" aria-hidden="true" />{video.poster_url ? "替换视频封面" : "上传视频封面（可选）"}
            <input data-video-poster-upload className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" disabled={disabled || !canUpload}
              onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) onUploadPoster(file, video.id); }} />
          </label>
          {video.poster_url && <Button type="button" size="sm" variant="ghost" className="ml-2" onClick={() => update(video.id, { poster_url: "" })}>移除封面</Button>}
          <p className="mt-2 text-xs text-muted-foreground">PNG / JPEG / WebP，最多8 MiB。{!canUpload ? "先保存商品草稿即可上传。" : "不上传时使用统一的视频占位，不会自动访问第三方缩略图。"}</p>
        </div>
        <div className="mt-4 space-y-3">
          {video.sources.map((source, sourceIndex) => {
            const info = videoSourceInfo(source.url);
            const updateSource = (changes: Partial<typeof source>) => update(video.id, { sources: video.sources.map(item => item.id === source.id ? { ...item, ...changes } : item) });
            return <div key={source.id} data-edit-source={source.id} className="min-w-0 rounded-lg border bg-background p-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-medium">来源 {sourceIndex + 1}{sourceIndex === 0 ? " · 默认" : ""}</span><div className="flex gap-2">
                {sourceIndex > 0 && <Button type="button" size="sm" variant="outline" onClick={() => { const next = [...video.sources]; [next[sourceIndex - 1], next[sourceIndex]] = [next[sourceIndex], next[sourceIndex - 1]]; update(video.id, { sources: next }); }}>前移</Button>}
                <Button type="button" size="sm" variant="ghost" aria-label={`移除视频${index + 1}来源${sourceIndex + 1}`} onClick={() => update(video.id, { sources: video.sources.filter(item => item.id !== source.id) })}>移除来源</Button>
              </div></div>
              <label className="mt-3 block text-sm">视频链接<Input data-video-url className="mt-1" value={source.url} maxLength={2048} onChange={e => updateSource({ url: e.target.value })} placeholder="https://www.youtube.com/watch?v=… 或 https://www.bilibili.com/video/BV…" /></label>
              <p data-video-detection className={`mt-2 break-words text-xs ${source.url && !info ? 'text-destructive' : 'text-muted-foreground'}`}>{info ? `${info.label} · ${info.embedUrl ? "可在商品页内播放" : info.label === "B站短链接" ? "短链接暂用外链；粘贴完整BV视频页可内嵌播放" : "在原平台观看，不嵌入未知网页"}` : sourceError(source.url)}</p>
              <label className="mt-3 block text-sm">来源名称（可选）<Input data-video-label className="mt-1" value={source.label} maxLength={80} onChange={e => updateSource({ label: e.target.value })} placeholder={info?.label ?? "例如：B站、YouTube、备用来源"} /></label>
            </div>;
          })}
        </div>
        <Button type="button" variant="outline" className="mt-3" data-add-video-source disabled={disabled || video.sources.length >= MAX_VIDEO_SOURCES}
          onClick={() => update(video.id, { sources: [...video.sources, { id: crypto.randomUUID(), label: "", url: "" }] })}><Plus className="mr-2 h-4 w-4" />添加播放来源</Button>
      </article>)}
    </fieldset>
    <p className="mt-4 text-xs text-muted-foreground">先保存草稿，再到“预览发布”检查视频并确认公开。平台上的视频是否公开、是否允许嵌入，由原平台控制。</p>
  </section>;
}
