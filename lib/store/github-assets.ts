// The website and GitHub feeds are separately signed; only the filename changes.
export function githubArtifactName(productSlug: string, sourceName: string): string | null {
  if (productSlug !== "open-play") return sourceName;
  if (sourceName === "appcast-website.xml") return "appcast.xml";
  if (sourceName === "windows-website.json") return "windows.json";
  if (sourceName === "appcast.xml" || sourceName === "windows.json") return null;
  return sourceName;
}
