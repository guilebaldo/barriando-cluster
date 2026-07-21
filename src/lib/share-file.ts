/** Web Share API (archivos) con fallback a descarga local — útil en PWA / standalone iOS. */

export function canShareFiles(): boolean {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }
  try {
    const probe = new File(["x"], "probe.txt", { type: "text/plain" });
    if (typeof navigator.canShare === "function") {
      return navigator.canShare({ files: [probe] });
    }
    // Safari antiguo: share existe pero canShare puede faltar; intentar share con files
    return true;
  } catch {
    return false;
  }
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
 * Prefiere la hoja nativa de compartir (Guardar imagen / Archivos / AirDrop).
 * Si no hay soporte o falla, descarga con enlace blob + atributo download.
 */
export async function shareOrDownloadFile(
  file: File,
  opts?: { title?: string; text?: string }
): Promise<ShareOrDownloadResult> {
  if (canShareFiles()) {
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
