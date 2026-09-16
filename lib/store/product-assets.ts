// Only repair the known legacy Chanxu asset. Administrator-provided artwork is preserved.
export function resolveProductIcon(slug: string, iconUrl: string) {
  return slug === "chanxu-tradingview" && iconUrl === "/chanxu-tradingview/icon.png"
    ? "/chanxu-tradingview/icon-chanxu-v2.png"
    : iconUrl;
}
