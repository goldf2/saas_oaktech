"use client";

import { Plus, Upload, Video, ArrowUp, ArrowDown, Trash2, Image as ImageIcon } from "lucide-react";
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
    if (index + delta < 0 || index + delta >= videos.length) return;
    const next = [...videos]; [next[index], next[index + delta]] = [next[index + delta], next[index]]; onChange(next);
  }
  function sourceError(url: string) {
    if (!url.trim()) return "粘贴完整视频链接，不需要 HTML 嵌入代码。";
    try { parseVideoSource(url); return ""; } catch (error) { return videoMessages[(error as Error).message] || "视频链接暂无法识别。"; }
  }
  return <section className="rounded-xl border bg-background p-4" data-testid="product-video-editor">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><h2 className="flex items-center gap-2 text-base font-semibold"><Video className="h-4 w-4" aria-hidden="true" />视频介绍 <span className="text-sm font-normal text-muted-foreground">{videos.length}/{MAX_PRODUCT_VIDEOS}</span></h2><p className="mt-1 text-xs text-muted-foreground">粘贴 YouTube 或B站链接即可添加；标题和封面可选。</p></div>
      <Button type="button" size="sm" data-testid="add-product-video" disabled={disabled || videos.length >= MAX_PRODUCT_VIDEOS} onClick={() => onChange([...videos, { id: crypto.randomUUID(), title: "", poster_url: "", sources: [{ id: crypto.randomUUID(), label: "", url: "" }] }])}><Plus className="mr-1 h-4 w-4" />添加视频</Button>
    </div>
    {!videos.length && <p className="mt-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">可添加产品演示、安装教程；同一视频支持多个平台来源。</p>}
    <fieldset disabled={disabled} className="mt-2.5 min-w-0 space-y-2.5">
      {videos.map((video, index) => {
        return <article key={video.id} data-edit-video={video.id} className="min-w-0 rounded-lg border bg-muted/10 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="min-w-0 break-words text-sm font-semibold">视频 {index + 1}{video.title ? ` · ${video.title}` : ""}</h3>
            <div className="flex shrink-0 items-center gap-1"><Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={disabled || index === 0} aria-label={`视频${index + 1}前移`} onClick={() => moveVideo(index, -1)}><ArrowUp className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={disabled || index === videos.length - 1} aria-label={`视频${index + 1}后移`} onClick={() => moveVideo(index, 1)}><ArrowDown className="h-4 w-4" /></Button><Button type="button" size="sm" variant="ghost" className="h-8" aria-label={`移除视频${index + 1}`} onClick={() => onChange(videos.filter(item => item.id !== video.id))}><Trash2 className="mr-1 h-3.5 w-3.5" />移除</Button></div>
          </div>
          <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_164px]">
            <div className="min-w-0 space-y-2.5">
              {video.sources.map((source, sourceIndex) => {
                const info = videoSourceInfo(source.url);
                const updateSource = (changes: Partial<typeof source>) => update(video.id, { sources: video.sources.map(item => item.id === source.id ? { ...item, ...changes } : item) });
                return <div key={source.id} data-edit-source={source.id} className={`min-w-0 ${sourceIndex ? "border-t pt-3" : ""}`}>
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2"><label htmlFor={`video-url-${source.id}`} className="text-sm font-medium">{sourceIndex === 0 ? "视频链接 · 默认来源" : `备用来源 ${sourceIndex}`}</label><div className="flex items-center gap-1">{sourceIndex > 0 && <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => { const next = [...video.sources]; [next[sourceIndex - 1], next[sourceIndex]] = [next[sourceIndex], next[sourceIndex - 1]]; update(video.id, { sources: next }); }}>前移</Button>}<Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground" aria-label={`移除视频${index + 1}来源${sourceIndex + 1}`} onClick={() => update(video.id, { sources: video.sources.filter(item => item.id !== source.id) })}>移除来源</Button></div></div>
                  <Input id={`video-url-${source.id}`} data-video-url className="h-9" value={source.url} maxLength={2048} aria-required="true" onChange={e => updateSource({ url: e.target.value })} placeholder="https://www.bilibili.com/video/BV… 或 YouTube 链接" />
                  <div className="mt-1.5 flex flex-wrap items-start justify-between gap-x-3 gap-y-1"><p data-video-detection className={`min-w-0 break-words text-xs ${source.url && !info ? "text-destructive" : "text-muted-foreground"}`}>{info ? `${info.label} · ${info.embedUrl ? "可在商品页内播放" : info.label === "B站短链接" ? "请换成完整BV链接以支持页内播放" : "仅提供外链观看"}（链接已识别，非发布状态）` : sourceError(source.url)}</p><details className="min-w-0 text-xs"><summary className="cursor-pointer text-muted-foreground">自定义来源名称</summary><Input data-video-label className="mt-1 h-8" value={source.label} maxLength={80} onChange={e => updateSource({ label: e.target.value })} placeholder={info?.label ?? "例如：备用来源"} /></details></div>
                </div>;
              })}
              {!video.sources.length && <p className="text-sm text-destructive">请添加至少一个播放来源。</p>}
              <label className="block text-sm font-medium">显示标题 <span className="font-normal text-muted-foreground">· 可选</span><Input data-video-title className="mt-1 h-9" aria-describedby={`video-title-help-${video.id}`} value={video.title} maxLength={160} onChange={e => update(video.id, { title: e.target.value })} placeholder="留空显示“视频介绍”" /></label>
              <p id={`video-title-help-${video.id}`} data-video-title-help className="text-xs text-muted-foreground">留空不影响发布。此处是自定义显示名称，不是平台自动获取的标题。</p>
              <Button type="button" variant="outline" size="sm" data-add-video-source disabled={disabled || video.sources.length >= MAX_VIDEO_SOURCES} onClick={() => update(video.id, { sources: [...video.sources, { id: crypto.randomUUID(), label: "", url: "" }] })}><Plus className="mr-1 h-3.5 w-3.5" />添加备用来源</Button>
            </div>
            <div className="min-w-0 border-t pt-3 md:border-l md:border-t-0 md:pl-4 md:pt-0">
              <p className="mb-2 text-xs font-medium">视频封面 <span className="font-normal text-muted-foreground">· 可选</span></p>
              <div className="mb-1.5 flex aspect-video max-h-24 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">{video.poster_url ? <img data-video-poster-preview src={video.poster_url} alt="视频封面预览" className="h-full w-full object-contain" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />}</div>
              <label className={`inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground focus-within:ring-2 focus-within:ring-ring ${disabled || !canUpload ? "pointer-events-none opacity-50" : "hover:opacity-90"}`}><Upload className="h-3.5 w-3.5" aria-hidden="true" />{video.poster_url ? "替换视频封面" : "上传视频封面"}<input data-video-poster-upload className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" disabled={disabled || !canUpload} onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) onUploadPoster(file, video.id); }} /></label>
              {video.poster_url && <Button type="button" size="sm" variant="ghost" className="mt-1 h-7 px-0 text-xs" onClick={() => update(video.id, { poster_url: "" })}>移除封面</Button>}
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{!canUpload ? "先保存商品草稿即可上传。" : "不上传则使用默认占位。"}支持 PNG/JPEG/WebP，最多 8 MiB。</p>
            </div>
          </div>
        </article>;
      })}
    </fieldset>
  </section>;
}
