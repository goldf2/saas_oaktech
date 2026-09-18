"use client";

import { useState } from "react";
import { ExternalLink, Video } from "lucide-react";
import { videoSourceInfo, productVideoTitle, type ProductVideo } from "@/lib/store/product-videos";
import type { Locale } from "@/lib/store/types";

function VideoPresentation({ video, locale }: { video: ProductVideo; locale: Locale }) {
  const [chosenId, setChosenId] = useState<string | null>(null);
  const sources = video.sources.map(source => ({ ...source, info: videoSourceInfo(source.url) })).filter(source => source.info !== null);
  const source = sources.find(source => source.id === chosenId) ?? sources[0];
  const zh = locale === "zh";
  const info = source?.info;
  const embed = info?.embedUrl;
  const title = productVideoTitle(video, locale);
  const sourceName = source?.label || info?.label || "";
  return <article className="min-w-0 overflow-hidden rounded-2xl border border-[hsl(var(--store-line))] bg-[hsl(var(--store-surface))]" data-video-id={video.id}>
    <div className="p-4 sm:p-5">
      <h3 className="break-words text-xl font-semibold">{title}</h3>
      {sources.length > 1 && <div role="group" aria-label={zh ? `${title}播放来源` : `${title} video sources`} className="mt-3 flex flex-wrap gap-2">
        {sources.map(item => <button key={item.id} type="button" data-video-source={item.id} aria-pressed={source?.id === item.id}
          onClick={() => setChosenId(item.id)}
          className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-[hsl(var(--store-surface-muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground">
          {item.label || item.info!.label}
        </button>)}
      </div>}
    </div>
    <div className="relative aspect-video min-h-[200px] w-full bg-muted/40">
      {embed ? <iframe key={`${source.id}:${embed}`} src={embed} title={`${title} — ${sourceName}`} data-video-player={info!.provider} data-video-autoload="true"
        loading="lazy" className="absolute inset-0 h-full w-full border-0" allow="encrypted-media; fullscreen; picture-in-picture"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
        : <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden p-5">
          {video.poster_url && <img src={video.poster_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
          <div className="relative flex max-w-full flex-col items-center gap-3 rounded-2xl bg-background/95 px-5 py-4 text-center shadow-sm">
            {info ? <>
              <Video className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
              <a href={info.watchUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground">
                {zh ? "前往原平台观看" : "Watch on the original platform"}<ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
              <p className="text-xs text-muted-foreground">{zh ? "此来源暂不支持页内播放。" : "Inline playback is not available for this source."}</p>
            </> : <p className="text-sm text-muted-foreground">{zh ? "填写有效视频链接后可在这里预览。" : "Add a valid video link to preview it here."}</p>}
          </div>
        </div>}
    </div>
    {info && <div className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs text-muted-foreground">
      <p>{zh ? "不能播放？可切换来源，或在原平台观看。" : "Playback unavailable? Switch sources or open the original platform."}</p>
      <a data-video-external={source.id} href={info.watchUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-4">
        {zh ? `在 ${sourceName} 打开` : `Open on ${sourceName}`}<ExternalLink className="h-3 w-3" aria-hidden="true" />
      </a>
    </div>}
  </article>;
}

export function ProductVideos({ videos = [], locale }: { videos?: ProductVideo[]; locale: Locale }) {
  if (!videos.length) return null;
  return <section className="store-shell pb-12" aria-label={locale === "zh" ? "视频介绍" : "Video introductions"} data-testid="product-video-introductions">
    <h2 className="mb-5 text-2xl font-semibold">{locale === "zh" ? "视频介绍" : "Video introductions"}</h2>
    <div className="mx-auto grid max-w-4xl gap-7">{videos.map(video => <VideoPresentation key={video.id} video={video} locale={locale} />)}</div>
  </section>;
}
