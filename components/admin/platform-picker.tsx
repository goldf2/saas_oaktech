"use client";
import { useState } from 'react';
import { X } from 'lucide-react';
import { PLATFORM_PRESETS, RUNTIME_PRESETS, platformKey, platformLabel, hasPlatform, togglePlatform } from '@/lib/store/presentation';
import { useLocale } from '@/i18n/locale-provider';

export function PlatformPicker({ value, defaultValue = [], onChange, disabled = false }: { value?: string[]; defaultValue?: string[]; onChange?: (next: string[]) => void; disabled?: boolean }) {
  const { locale } = useLocale();
  const zh = locale === 'zh';
  const [internal, setInternal] = useState(defaultValue);
  const selected = value ?? internal;
  function change(next: string[]) { if (disabled) return; setInternal(next); onChange?.(next); }
  const known = new Set<string>([...PLATFORM_PRESETS.map(p => p.value), ...RUNTIME_PRESETS]);
  const legacy = selected.filter(v => !known.has(platformKey(v)));
  function option(platform: string) {
    const checked = hasPlatform(selected, platform);
    return <label key={platform} className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors ${checked ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted/60'} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}>
      <input type="checkbox" data-platform-option={platform} className="h-3.5 w-3.5 accent-primary" checked={checked} disabled={disabled} onChange={e => change(togglePlatform(selected, platform, e.target.checked))} />{platformLabel(platform, locale)}
    </label>;
  }
  return <fieldset disabled={disabled} data-testid="platform-picker" className="min-w-0">
    <legend className="mb-1.5 text-sm font-medium">{zh ? '支持平台' : 'Supported platforms'} <span className="font-normal text-muted-foreground">· {zh ? '可多选' : 'multiple allowed'}</span></legend>
    <input type="hidden" name="supported_platforms" value={selected.join(',')} />
    <div className="flex flex-wrap gap-1.5">{PLATFORM_PRESETS.map(p => option(p.value))}</div>
    <details className="mt-2" open={RUNTIME_PRESETS.some(p => hasPlatform(selected, p)) || undefined}><summary className="cursor-pointer text-[11px] text-muted-foreground">{zh ? '浏览器与其他运行环境' : 'Browsers and other runtimes'}</summary><div className="mt-1.5 flex flex-wrap gap-1.5">{RUNTIME_PRESETS.map(option)}</div></details>
    {!!legacy.length && <div className="mt-2 text-[11px] text-muted-foreground"><p className="mb-1.5">{zh ? '已有平台（保留原值，按需移除）' : 'Existing values (preserved; remove if no longer needed)'}</p><div className="flex flex-wrap gap-1.5">{legacy.map((item, i) => <button key={`${item}-${i}`} type="button" disabled={disabled} data-legacy-platform={item} onClick={() => change(selected.filter(v => v !== item))} className="inline-flex items-center gap-1 rounded-md border px-2 py-1" aria-label={zh ? `移除平台 ${item}` : `Remove platform ${item}`}>{item}<X className="h-3 w-3" /></button>)}</div></div>}
    <p className="mt-1.5 text-[11px] leading-4 text-muted-foreground">{zh ? '仅表示兼容范围；下载以实际发布的软件包为准。' : 'Compatibility only; downloads are determined by published software packages.'}</p>
  </fieldset>;
}
