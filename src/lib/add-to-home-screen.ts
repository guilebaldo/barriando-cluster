const STORAGE_PREFIX = "barriando.a2hs.dismissed.";

/** Ventana tras el alta: cubre login → pago → primera visita a /barrid. */
export const FIRST_LOGIN_WINDOW_MS = 72 * 60 * 60 * 1000;

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let listenerAttached = false;

export function isFirstLoginAccount(createdAt: Date | string | null | undefined): boolean {
  if (!createdAt) return false;
  const t = createdAt instanceof Date ? createdAt.getTime() : new Date(createdAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < FIRST_LOGIN_WINDOW_MS;
}

export function hasDismissedAddToHome(userId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${userId}`) === "1";
  } catch {
    return true;
  }
}

export function markAddToHomeDismissed(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, "1");
  } catch {
    /* private mode / quota */
  }
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;
  return window.matchMedia("(display-mode: standalone)").matches;
}

export function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

/** Captura el evento temprano (Chrome/Android lo dispara una sola vez). */
export function ensureInstallPromptListener(): void {
  if (typeof window === "undefined" || listenerAttached) return;
  listenerAttached = true;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
  });
}

export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

export function clearDeferredInstallPrompt(): void {
  deferredPrompt = null;
}
