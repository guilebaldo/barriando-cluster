/** Web Share en móvil/PWA; en desktop siempre descarga directa. */

function isMobileOrStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  if (window.matchMedia("(max-width: 767px)").matches) return true;
  return false;
}

export function canShareFiles(): boolean {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }
  try {
    const probe = new File(["x"], "probe.txt", { type: "text/plain" });
    if (typeof navigator.canShare === "function") {
      return navigator.canShare({ files: [probe] });
    }
    return true;
  } catch {
    return false;
  }
}

/** UI y flujo: compartir solo en móvil/standalone si el navegador lo permite. */
export function shouldOfferNativeShare(): boolean {
  return isMobileOrStandalone() && canShareFiles();
}

export async function dataUrlToFile(
  dataUrl: string,
  filename: string,
  mimeType: string
): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: mimeType || blob.type || "application/octet-stream" });
}

function triggerAnchorDownload(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2_500);
}

export type ShareOrDownloadResult = "shared" | "downloaded" | "aborted";

/**
 * En móvil/PWA: hoja nativa de compartir.
 * En desktop (o si Share falla): descarga con blob + download.
 */
export async function shareOrDownloadFile(
  file: File,
  opts?: { title?: string; text?: string }
): Promise<ShareOrDownloadResult> {
  if (shouldOfferNativeShare()) {
    try {
      const payload: ShareData = {
        files: [file],
        title: opts?.title,
        text: opts?.text,
      };
      if (typeof navigator.canShare === "function" && !navigator.canShare(payload)) {
        triggerAnchorDownload(file);
        return "downloaded";
      }
      await navigator.share(payload);
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "aborted";
      }
      if (error instanceof Error && error.name === "AbortError") {
        return "aborted";
      }
      // Continuar a fallback
    }
  }

  triggerAnchorDownload(file);
  return "downloaded";
}
