/** Prepends https:// when the user omits a protocol (e.g. cosmetortas.com). */
export function normalizeWebsiteUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** Returns a normalized URL or null when invalid. */
export function parseWebsiteUrl(raw: string): string | null {
  const normalized = normalizeWebsiteUrl(raw);
  if (!normalized) return null;
  try {
    const url = new URL(normalized);
    if (!url.hostname.includes(".")) return null;
    return normalized;
  } catch {
    return null;
  }
}
