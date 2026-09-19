// Migration boundaries: previously published legacy versions remain compatible.
export function requiresUnifiedManifest(product: string, version: string): boolean {
  const core = version.split("-")[0].split(".").map(Number);
  const atLeast = (minimum: number[]) => {
    for (let i = 0; i < Math.max(core.length, minimum.length); i++) {
      if (!Number.isFinite(core[i] ?? 0)) return false;
      if ((core[i] ?? 0) !== (minimum[i] ?? 0)) return (core[i] ?? 0) > (minimum[i] ?? 0);
    }
    return true;
  };
  if (product === "open-play") return atLeast([0, 6, 6, 16]);
  if (product === "video-prompt-workbench") return atLeast([0, 6, 6]);
  if (product === "gitfinder-2") {
    const alpha = /^2\.0\.0-alpha\.(\d+)$/.exec(version);
    return alpha ? Number(alpha[1]) >= 205 : atLeast([2, 0, 0]);
  }
  return false;
}
