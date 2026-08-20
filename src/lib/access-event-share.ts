import { getAppOrigin } from "@/lib/benefit-credential";

/** Normaliza cover de pase a URL absoluta para Open Graph / WhatsApp. */
export function absoluteAccessCoverUrl(coverUrl: string | null | undefined): string | null {
  const raw = coverUrl?.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return `${getAppOrigin()}${path}`;
}

export function absoluteAccessEventUrl(eventId: string): string {
  return `${getAppOrigin()}/pases/${eventId}`;
}
