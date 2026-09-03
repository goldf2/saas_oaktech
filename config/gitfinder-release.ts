import type { Locale, ProductRelease } from "@/lib/store/types";

export function getLegacyGitFinderRelease(locale: Locale): ProductRelease {
  const id = "legacy-gitfinder-2-alpha-85";
  return {
    id,
    productSlug: "gitfinder-2",
    version: "2.0.0-alpha.85",
    channel: "alpha",
    status: "published",
    isCurrent: false,
    publishedAt: "2026-09-03T00:00:00.000Z",
    title: locale === "zh" ? "桌面端打包与关系白板迭代" : "Desktop packaging and relationship workspace iteration",
    notes: locale === "zh"
      ? "迁移前只读快照：包含 macOS arm64 与 Windows x64 构建准备、关系白板和本地优先项目工作流。"
      : "Read-only pre-migration snapshot covering macOS arm64 and Windows x64 packaging, the relationship workspace, and local-first project workflows.",
    artifacts: [],
  };
}
