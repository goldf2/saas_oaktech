import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { NextRequest } from "next/server";
import { resolvePublicDownload } from "@/lib/store/downloads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function rangeFor(value: string | null, size: number) {
  if (!value) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match) return false;
  let start = match[1] ? Number(match[1]) : NaN;
  let end = match[2] ? Number(match[2]) : NaN;
  if (Number.isNaN(start) && Number.isNaN(end)) return false;
  if (Number.isNaN(start)) {
    start = Math.max(size - end, 0);
    end = size - 1;
  } else if (Number.isNaN(end)) {
    end = size - 1;
  }
  if (start < 0 || end < start || start >= size) return false;
  end = Math.min(end, size - 1);
  return { start, end };
}

function readableFile(filePath: string, start: number, end: number) {
  const source = createReadStream(filePath, { start, end });
  const iterator = source[Symbol.asyncIterator]();
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const chunk = await iterator.next();
        if (chunk.done) controller.close();
        else controller.enqueue(new Uint8Array(chunk.value));
      } catch (error) {
        try { controller.error(error); } catch { source.destroy(); }
      }
    },
    async cancel() {
      source.destroy();
      await iterator.return?.();
    },
  });
}

async function serve(request: NextRequest, parts: string[], headOnly: boolean) {
  if (parts.some((part) => !part || part === "." || part === ".." || part.includes("\\"))) {
    return new Response("Not found", { status: 404 });
  }
  const descriptor = await resolvePublicDownload(parts);
  if (!descriptor) return new Response("Not found", { status: 404 });

  const details = await stat(descriptor.absolutePath).catch(() => null);
  if (!details?.isFile()) return new Response("Not found", { status: 404 });
  const requestedRange = rangeFor(request.headers.get("range"), details.size);
  if (requestedRange === false) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${details.size}` } });
  }

  const start = requestedRange?.start ?? 0;
  const end = requestedRange?.end ?? details.size - 1;
  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Content-Type": descriptor.contentType,
    "Content-Length": String(end - start + 1),
    "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(descriptor.fileName)}`,
    "Cache-Control": descriptor.immutable ? "public, max-age=31536000, immutable, no-transform" : "no-store",
    "CDN-Cache-Control": "no-store",
  });
  if (requestedRange) headers.set("Content-Range", `bytes ${start}-${end}/${details.size}`);
  const body = headOnly ? null : readableFile(descriptor.absolutePath, start, end);
  return new Response(body, { status: requestedRange ? 206 : 200, headers });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return serve(request, (await context.params).path, false);
}

export async function HEAD(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return serve(request, (await context.params).path, true);
}
