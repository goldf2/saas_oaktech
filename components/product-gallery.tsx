"use client";
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';
import type { Locale } from '@/lib/store/types';

export function ProductGallery({ images, name, locale }: { images: string[]; name: string; locale: Locale }) {
  const rail = useRef<HTMLDivElement>(null), dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0), [open, setOpen] = useState(false), [edges, setEdges] = useState({ left: false, right: false });
  const zh = locale === 'zh';
  useEffect(() => {
    const node = rail.current; if (!node) return;
    const update = () => setEdges({ left: node.scrollLeft > 2, right: node.scrollLeft + node.clientWidth < node.scrollWidth - 2 });
    update(); const resize = new ResizeObserver(update); resize.observe(node); node.addEventListener('scroll', update);
    return () => { resize.disconnect(); node.removeEventListener('scroll', update); };
  }, [images]);
  function move(delta: number) { rail.current?.scrollBy({ left: delta * rail.current.clientWidth * .8, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }
  function show(i: number) { setIndex(i); setOpen(true); dialog.current?.showModal(); }
  function close() { dialog.current?.close(); setOpen(false); }
  if (!images.length) return null;
  return <section className="app-section" aria-label={zh ? '产品截图' : 'Screenshots'} data-testid="screenshot-gallery">
    <div className="app-section-heading"><h2>{zh ? '预览与截图' : 'Screenshots'}</h2><div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{images.length} {zh ? '张' : 'images'}</span><button type="button" className="app-icon-button" aria-label={zh ? '向前浏览截图' : 'Previous screenshots'} disabled={!edges.left} onClick={() => move(-1)}><ChevronLeft className="h-4 w-4" /></button><button type="button" className="app-icon-button" aria-label={zh ? '向后浏览截图' : 'Next screenshots'} disabled={!edges.right} onClick={() => move(1)}><ChevronRight className="h-4 w-4" /></button></div></div>
    <div ref={rail} className="app-screenshot-rail" data-testid="screenshot-rail" tabIndex={0}>
      {images.map((url, i) => <button type="button" className="app-screenshot-item group" data-screenshot={i} key={`${url}-${i}`} onClick={() => show(i)} aria-label={`${zh ? '放大截图' : 'Enlarge screenshot'} ${i + 1}`}><img src={url} alt={`${name} · ${i + 1}`} loading="lazy" onLoad={() => rail.current?.dispatchEvent(new Event('scroll'))} /><span className="absolute bottom-3 right-3 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"><Maximize2 className="h-4 w-4" /></span></button>)}
    </div>
    <dialog ref={dialog} className="app-image-dialog" data-testid="screenshot-lightbox" aria-label={zh ? '截图预览' : 'Screenshot preview'} onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onClick={e => { if (e.target === e.currentTarget) close(); }} onKeyDown={e => { if (e.key === 'ArrowRight') { e.preventDefault(); setIndex(i => (i + 1) % images.length); } if (e.key === 'ArrowLeft') { e.preventDefault(); setIndex(i => (i - 1 + images.length) % images.length); } }}>
      {open && <div className="app-lightbox-content"><div className="flex items-center justify-between gap-4 p-4"><span className="min-w-0 truncate text-sm">{name} · {index + 1} / {images.length}</span><button type="button" className="app-icon-button" autoFocus onClick={close} aria-label={zh ? '关闭截图' : 'Close screenshot'}><X className="h-5 w-5" /></button></div><img src={images[index]} alt={`${name} · ${index + 1}`} className="app-lightbox-image" /><div className="flex justify-center gap-4 p-4"><button type="button" className="app-icon-button" disabled={images.length < 2} onClick={() => setIndex(i => (i - 1 + images.length) % images.length)} aria-label={zh ? '上一张' : 'Previous image'}><ChevronLeft /></button><button type="button" className="app-icon-button" disabled={images.length < 2} onClick={() => setIndex(i => (i + 1) % images.length)} aria-label={zh ? '下一张' : 'Next image'}><ChevronRight /></button></div></div>}
    </dialog>
  </section>;
}
