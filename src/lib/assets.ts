// Resolves an asset path stored in the DB or referenced in code against the
// app's base URL, so it works both at the GitHub Pages sub-path and at root.
export function assetUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (/^(https?:|data:|blob:|\/)/.test(path)) return path;
  const base = import.meta.env.BASE_URL ?? "/";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}
