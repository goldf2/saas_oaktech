"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ArtifactUpload({ releaseId }: { releaseId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get("file");
    if (!(file instanceof File) || !file.size) return;
    setBusy(true);
    setMessage("Uploading and calculating SHA-512…");
    try {
      const uploadId = crypto.randomUUID();
      const chunkSize = 16 * 1024 * 1024;
      let result: { sizeBytes?: number; sha512?: string; error?: string } = {};
      for (let offset = 0; offset < file.size; offset += chunkSize) {
        const end = Math.min(offset + chunkSize, file.size);
        const query = new URLSearchParams({
          releaseId,
          platform: String(form.get("platform") ?? ""),
          architecture: String(form.get("architecture") ?? ""),
          packageKind: String(form.get("package_kind") ?? ""),
          uploadId,
          offset: String(offset),
          final: String(end === file.size),
        });
        setMessage(`Uploading ${Math.round((end / file.size) * 100)}%…`);
        const response = await fetch(`/api/admin/releases/upload?${query}`, {
          method: "POST",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
            "x-file-name": encodeURIComponent(file.name),
            "x-oaktech-admin-upload": "1",
          },
          body: file.slice(offset, end),
        });
        result = await response.json();
        if (!response.ok) throw new Error(result.error || "Upload failed");
      }
      setMessage(`Verified ${result.sizeBytes} bytes · SHA-512 ${String(result.sha512).slice(0, 16)}…`);
      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={upload} className="mt-5 grid gap-3 rounded-md border bg-muted/30 p-4 md:grid-cols-4">
      <Input name="platform" placeholder="macOS or Windows" required />
      <Input name="architecture" placeholder="arm64 or x64" required />
      <Input name="package_kind" placeholder="zip or nsis" required />
      <Input name="file" type="file" required />
      <div className="md:col-span-4 flex items-center gap-3">
        <Button type="submit" size="sm" disabled={busy}>{busy ? "Uploading…" : "Upload artifact"}</Button>
        <span className="text-xs text-muted-foreground">{message}</span>
      </div>
    </form>
  );
}
