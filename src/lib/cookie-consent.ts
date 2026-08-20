/** Preferencia de consentimiento de cookies (solo UI; las esenciales siguen activas). */
export const COOKIE_CONSENT_STORAGE_KEY = "barriando.cookie-consent";
export const COOKIE_CONSENT_VERSION = "v1";

export type CookieConsentValue = typeof COOKIE_CONSENT_VERSION;

export function readCookieConsent(): CookieConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    return value === COOKIE_CONSENT_VERSION ? COOKIE_CONSENT_VERSION : null;
  } catch {
    return null;
  }
}

export function writeCookieConsent(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, COOKIE_CONSENT_VERSION);
  } catch {
    /* ignore quota / private mode */
  }
}
