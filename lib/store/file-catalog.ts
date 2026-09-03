import "server-only";

import { randomUUID } from "node:crypto";
import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { getReleaseStorageRoot } from "./storage";
import type { AdminProductReleaseRow, AdminStoreProductRow } from "./types";

export type StoreCatalog = {
  schemaVersion: 1;
  products: AdminStoreProductRow[];
  releases: AdminProductReleaseRow[];
  updatedAt: string;
};

const initialCatalog: StoreCatalog = {
  schemaVersion: 1,
  updatedAt: "2026-09-03T00:00:00.000Z",
  products: [
    {
      id: "bootstrap-x-tweet-extractor",
      slug: "x-tweet-extractor",
      category_slug: "browser-extensions",
      status: "beta",
      visibility: "published",
      name_en: "X Tweet Extractor",
      name_zh: "X 推文提取器",
      tagline_en: "Turn visible X profiles into structured, local exports.",
      tagline_zh: "把可见的 X 个人主页内容导出为本地结构化文件。",
      description_en: "A focused Chrome extension for exporting visible X profile content for personal backup and research.",
      description_zh: "一款用于个人备份与研究的 Chrome 扩展，可导出 X 个人主页中可见的内容。",
      icon_url: "/x-tweet-extractor/store-logo-128.png",
      hero_image_url: "/x-tweet-extractor/promo440x280.png",
      supported_platforms: ["Chrome", "macOS", "Windows", "Linux"],
      featured: true,
    },
    {
      id: "bootstrap-gitfinder-2",
      slug: "gitfinder-2",
      category_slug: "desktop-apps",
      status: "beta",
      visibility: "published",
      name_en: "GitFinder 2",
      name_zh: "GitFinder 2",
      tagline_en: "See local repositories, deployments, and access points in one spatial workspace.",
      tagline_zh: "在一个空间化工作区查看本地仓库、部署和访问入口。",
      description_en: "A local-first desktop workspace for organizing projects, repositories, and deployment relationships.",
      description_zh: "一款本地优先的桌面工作区，用于整理项目、仓库与部署关系。",
      icon_url: "/gitfinder-2/icon.png",
      hero_image_url: "/gitfinder-2/hero.svg",
      supported_platforms: ["macOS", "Windows"],
      featured: false,
    },
  ],
  releases: [
    {
      id: "bootstrap-gitfinder-2-alpha-85",
      product_slug: "gitfinder-2",
      version: "2.0.0-alpha.85",
      channel: "alpha",
      status: "draft",
      is_current: false,
      published_at: null,
      title_en: "Desktop packaging and relationship workspace iteration",
      title_zh: "桌面端打包与关系白板迭代",
      notes_en: "macOS arm64 and Windows x64 packaging, relationship workspace improvements, and local-first project workflows.",
      notes_zh: "包含 macOS arm64 与 Windows x64 打包、关系工作区改进和本地优先项目工作流。",
      release_artifacts: [],
    },
  ],
};

function catalogPath() {
  return path.join(getReleaseStorageRoot(), "catalog.json");
}

function auditPath() {
  return path.join(getReleaseStorageRoot(), "audit", "store-admin.jsonl");
}

export async function readStoreCatalog(): Promise<{ catalog: StoreCatalog; persisted: boolean }> {
  try {
    const raw = await readFile(catalogPath(), "utf8");
    const parsed = JSON.parse(raw) as StoreCatalog;
    if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.products) || !Array.isArray(parsed.releases)) {
      throw new Error("STORE_CATALOG_INVALID");
    }
    return { catalog: parsed, persisted: true };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT"
      && (error as Error).message !== "RELEASE_STORAGE_ROOT_REQUIRED") throw error;
    return { catalog: structuredClone(initialCatalog), persisted: false };
  }
}

let mutationQueue: Promise<unknown> = Promise.resolve();

export function mutateStoreCatalog<T>(mutation: (catalog: StoreCatalog) => Promise<T> | T): Promise<T> {
  const run = mutationQueue.then(async () => {
    const { catalog } = await readStoreCatalog();
    const result = await mutation(catalog);
    catalog.updatedAt = new Date().toISOString();
    const destination = catalogPath();
    await mkdir(path.dirname(destination), { recursive: true });
    const temporary = `${destination}.next-${randomUUID()}`;
    await writeFile(temporary, `${JSON.stringify(catalog, null, 2)}\n`, { encoding: "utf8", mode: 0o640, flag: "wx" });
    await rename(temporary, destination);
    return result;
  });
  mutationQueue = run.catch(() => undefined);
  return run;
}

export async function appendStoreAudit(input: {
  actorUserId: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  const destination = auditPath();
  await mkdir(path.dirname(destination), { recursive: true });
  await appendFile(destination, `${JSON.stringify({
    id: randomUUID(),
    actorUserId: input.actorUserId,
    actorEmail: input.actorEmail.toLowerCase(),
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId ?? null,
    metadata: input.metadata ?? {},
    createdAt: new Date().toISOString(),
  })}\n`, { encoding: "utf8", mode: 0o640 });
}

export function newCatalogId() {
  return randomUUID();
}
