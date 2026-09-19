"use client";
import { useState } from 'react';
import { X } from 'lucide-react';
import { PLATFORM_PRESETS, RUNTIME_PRESETS, platformKey, platformLabel, hasPlatform, togglePlatform } from '@/lib/store/presentation';

export function PlatformPicker({ value, defaultValue = [], onChange, disabled = false }: { value?: string[]; defaultValue?: string[]; onChange?: (next: string[]) => void; disabled?: boolean }) {
  const [internal, setInternal] = useState(defaultValue);
  const selected = value ?? internal;
  function change(next: string[]) { if (disabled) return; setInternal(next); onChange?.(next); }
  const known = new Set<string>([...PLATFORM_PRESETS.map(p => p.value), ...RUNTIME_PRESETS]);
  const legacy = selected.filter(v => !known.has(platformKey(v)));
  function option(platform: string) {
    const checked = hasPlatform(selected, platform);
    return <label key={platform} className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${checked ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted/60'} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}>
      <input type="checkbox" data-platform-option={platform} className="h-4 w-4 accent-primary" checked={checked} disabled={disabled} onChange={e => change(togglePlatform(selected, platform, e.target.checked))} />{platformLabel(platform)}
    </label>;
  }
  return <fieldset disabled={disabled} data-testid="platform-picker" className="min-w-0">
    <legend className="mb-2 text-sm font-medium">支持平台 <span className="font-normal text-muted-foreground">· 可多选</span></legend>
    <input type="hidden" name="supported_platforms" value={selected.join(',')} />
    <div className="flex flex-wrap gap-2">{PLATFORM_PRESETS.map(p => option(p.value))}</div>
    <details className="mt-3" open={RUNTIME_PRESETS.some(p => hasPlatform(selected, p)) || undefined}><summary className="cursor-pointer text-xs text-muted-foreground">浏览器与其他运行环境</summary><div className="mt-2 flex flex-wrap gap-2">{RUNTIME_PRESETS.map(option)}</div></details>
    {!!legacy.length && <div className="mt-3 text-xs text-muted-foreground"><p className="mb-2">已有平台（保留原值，按需移除）</p><div className="flex flex-wrap gap-2">{legacy.map((item, i) => <button key={`${item}-${i}`} type="button" disabled={disabled} data-legacy-platform={item} onClick={() => change(selected.filter(v => v !== item))} className="inline-flex items-center gap-1 rounded-md border px-2 py-1.5" aria-label={`移除平台 ${item}`}>{item}<X className="h-3 w-3" /></button>)}</div></div>}
    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">用于商品展示；可下载平台以实际发布的软件包为准。</p>
  </fieldset>;
}
