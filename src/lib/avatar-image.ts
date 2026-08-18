/** Pide un avatar más nítido (Google suele guardar =s96, borroso en retina). */
export function hiResAvatarUrl(
  url: string | null | undefined,
  size = 256
): string | null {
  if (!url) return null;
  if (/=s\d+/.test(url)) return url.replace(/=s\d+/, `=s${size}`);
  if (/\/s\d+(-c)?\//.test(url)) return url.replace(/\/s\d+(-c)?\//, `/s${size}$1/`);
  if (/([?&]sz=)\d+/.test(url)) return url.replace(/([?&]sz=)\d+/, `$1${size}`);
  if (/([?&]s=)\d+/.test(url)) return url.replace(/([?&]s=)\d+/, `$1${size}`);
  return url;
}
