/**
 * Resolve a public asset for both Vercel and Capacitor.
 * Vercel builds use BASE_URL="/"; Android builds use BASE_URL="./".
 */
export function publicAssetUrl(path: string): string {
  const normalizedPath = path.replace(/^\/+/, "");
  const baseUrl = import.meta.env.BASE_URL || "/";
  return `${baseUrl}${normalizedPath}`;
}
