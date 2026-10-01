"use client";

import { useEffect, useRef, useState } from 'react';
import { Copy } from 'lucide-react';
import type { Locale } from '@/lib/store/types';

export function DownloadAddress({ path, locale }: { path: string; locale: Locale }) {
  const zh = locale === 'zh';
  const [address, setAddress] = useState(path);
  const [message, setMessage] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { setAddress(new URL(path, window.location.origin).href); setMessage(''); }, [path]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setMessage(zh ? '地址已复制' : 'Address copied');
    } catch {
      input.current?.focus(); input.current?.select();
      setMessage(zh ? '地址已选中，请手动复制' : 'Address selected; copy it manually');
    }
  }
  return <div className="mt-3 min-w-0" data-testid="download-address">
    <label className="block text-xs text-muted-foreground">{zh ? '本站下载地址' : 'Store download URL'}
      <input ref={input} value={address} readOnly onFocus={e => e.target.select()} className="mt-1 w-full min-w-0 rounded-md border bg-background p-2 font-mono text-xs" />
    </label>
    <button type="button" onClick={() => void copy()} className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary"><Copy className="h-3.5 w-3.5" />{zh ? '复制下载地址' : 'Copy download URL'}</button>
    <p role="status" className="mt-1 text-xs text-muted-foreground">{message}</p>
  </div>;
}
