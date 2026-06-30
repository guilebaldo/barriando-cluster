export type PanelNoticeKey = "payment_confirmed" | "linkage_cta";

function storageKey(userId: string, notice: PanelNoticeKey): string {
  return `barriando.panel.notice.${userId}.${notice}`;
}

export function hasSeenPanelNotice(userId: string, notice: PanelNoticeKey): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(storageKey(userId, notice)) === "1";
  } catch {
    return false;
  }
}

export function markPanelNoticeSeen(userId: string, notice: PanelNoticeKey): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(userId, notice), "1");
  } catch {
    /* ignore quota / private mode */
  }
}
